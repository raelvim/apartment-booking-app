// server/index.js - Backend funcional sin dependencias problemáticas
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const http = require("http");
const WebSocket = require("ws");
const ical = require("node-ical");

const db = require("./database.js");

// Stripe se inicializa solo si hay clave real; en modo mock no se necesita.
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
}

const app = express();
const PORT = process.env.PORT || 3001;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const JWT_SECRET = process.env.JWT_SECRET;
const NODE_ENV = process.env.NODE_ENV || "development";
const DOMAIN = process.env.DOMAIN;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const AIRBNB_ICAL_URL = process.env.AIRBNB_ICAL_URL;

// Modo de prueba sin Stripe real: nunca se activa en producción, aunque la variable quede puesta por error.
const MOCK_PAYMENTS =
  NODE_ENV !== "production" && process.env.MOCK_PAYMENTS === "true";
const mockSessions = new Map(); // sesiones falsas en memoria, solo para MOCK_PAYMENTS

// Servir archivos estáticos desde public/
app.use(express.static(path.join(__dirname, "..", "public")));

// No arrancar sin secretos configurados: evita contraseñas/JWT por defecto inseguros
if (!ADMIN_PASSWORD || !JWT_SECRET) {
  console.error(
    "❌ Faltan ADMIN_PASSWORD y/o JWT_SECRET en server/.env. El servidor no puede iniciar de forma segura.",
  );
  process.exit(1);
}

if (MOCK_PAYMENTS) {
  console.warn(
    "⚠️  MOCK_PAYMENTS activo: los pagos son SIMULADOS, no se llama a Stripe. Solo para pruebas locales, nunca en producción.",
  );
}

app.set("trust proxy", 1);
// El sitio usa scripts inline y varios CDNs (Font Awesome, Google Fonts, Swiper),
// así que se desactiva la CSP por defecto de helmet para no romper la página;
// las demás cabeceras de seguridad (X-Frame-Options, etc.) se mantienen.
app.use(helmet({ contentSecurityPolicy: false }));

// Restringe qué orígenes pueden llamar a la API (evita que otros sitios usen tokens robados)
const allowedOrigins = (process.env.ALLOWED_ORIGINS || DOMAIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
  }),
);

// El webhook de Stripe necesita el cuerpo sin parsear para verificar la firma,
// por eso se registra ANTES de express.json().
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  handleStripeWebhook,
);

app.use(express.json({ limit: "10kb" }));
app.use(express.static(path.join(__dirname, "../public")));

// Limita solicitudes generales a la API para mitigar abuso/DoS
app.use(
  "/api/",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 200,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

// Límite estricto para el login de admin (protege contra fuerza bruta)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Please try again later." },
});

// ============ AUTENTICACIÓN ============
const checkAdminAuth = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// ============ FUNCIONES AUXILIARES ============

/**
 * Obtiene la configuración de impuestos Mecklenburg.
 * Ventas: 8.25% + Ocupación: 8.00% = 16.25% sobre alojamiento + limpieza.
 * Airbnb cobra y remite automáticamente estos impuestos.
 */
function getTaxConfig() {
  return {
    mecklenburg_sales: parseFloat(process.env.TAX_MECKLENBURG_SALES) || 8.25,
    mecklenburg_occupancy: parseFloat(process.env.TAX_MECKLENBURG_OCCUPANCY) || 8.0,
  };
}

/**
 * Calcula el precio total con impuestos Mecklenburg.
 * Total: 16.25% (Ventas 8.25% + Ocupación 8.00%) sobre alojamiento + limpieza.
 */
function calculateTotalPrice(nights, pricePerNight, taxRates = null) {
  if (!taxRates) taxRates = getTaxConfig();

  const subtotal = nights * pricePerNight;

  // Impuestos Mecklenburg sobre el subtotal
  const salesTax = (subtotal * taxRates.mecklenburg_sales) / 100;
  const occupancyTax = (subtotal * taxRates.mecklenburg_occupancy) / 100;

  const totalTax = salesTax + occupancyTax;
  const total = subtotal + totalTax;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    mecklenburg_sales_tax: Math.round(salesTax * 100) / 100,
    mecklenburg_occupancy_tax: Math.round(occupancyTax * 100) / 100,
    total_tax: Math.round(totalTax * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

/**
 * Carga la configuración de impuestos Mecklenburg desde la base de datos.
 * Intenta usar las nuevas columnas mecklenburg_sales/mecklenburg_occupancy;
 * si no existen (base de datos antigua), cae a los defaults.
 */
function loadTaxSettingsFromDB(callback) {
  const sql = `
    SELECT mecklenburg_sales, mecklenburg_occupancy,
           nc_state, mecklenburg_local, occupancy
    FROM tax_settings 
    ORDER BY updated_at DESC 
    LIMIT 1
  `;

  db.get(sql, [], (err, row) => {
    if (err) {
      console.error("Error loading tax settings:", err);
      callback(getTaxConfig());
      return;
    }

    if (row) {
      // Preferir columnas nuevas; si son null (DB vieja), usar defaults
      callback({
        mecklenburg_sales: row.mecklenburg_sales != null ? row.mecklenburg_sales : 8.25,
        mecklenburg_occupancy: row.mecklenburg_occupancy != null ? row.mecklenburg_occupancy : 8.0,
      });
    } else {
      callback(getTaxConfig());
    }
  });
}

/**
 * Comprueba si un rango de fechas está libre, combinando reservas confirmadas
 * y bloqueos importados de calendarios externos (ej. Airbnb).
 */
function checkAvailability(checkIn, checkOut) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT checkIn, checkOut FROM bookings WHERE bookingStatus = 'confirmed'
      UNION ALL
      SELECT checkIn, checkOut FROM external_blocks
    `;
    db.all(sql, [], (err, rows) => {
      if (err) return reject(err);
      const hasOverlap = rows.some(
        (r) => checkIn < r.checkOut && checkOut > r.checkIn,
      );
      resolve(!hasOverlap);
    });
  });
}

// ============ API ENDPOINTS ============

// Endpoint público para obtener fechas reservadas (propias + Airbnb)
app.get("/api/bookings", (req, res) => {
  const sql = `
    SELECT checkIn, checkOut FROM bookings WHERE bookingStatus = 'confirmed'
    UNION ALL
    SELECT checkIn, checkOut FROM external_blocks
  `;
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error("Error fetching bookings:", err);
      return res.status(500).json({ error: err.message });
    }
    const disabledRanges = rows.map((row) => ({
      from: row.checkIn,
      to: row.checkOut,
    }));
    res.json(disabledRanges);
  });
});

// Endpoint para obtener tasas de impuestos actuales
app.get("/api/tax-rates", (req, res) => {
  loadTaxSettingsFromDB((rates) => {
    res.json(rates);
  });
});

// Endpoint para calcular precio total (con impuestos)
app.post("/api/calculate-price", (req, res) => {
  const { nights, pricePerNight } = req.body;

  if (!nights || !pricePerNight) {
    return res.status(400).json({ error: "Missing nights or pricePerNight" });
  }

  loadTaxSettingsFromDB((taxRates) => {
    const pricing = calculateTotalPrice(nights, pricePerNight, taxRates);
    res.json(pricing);
  });
});

// Endpoint para crear sesión de pago Stripe
app.post("/api/create-checkout-session", async (req, res) => {
  const { nights, pricePerNight, checkIn, checkOut } = req.body;

  if (!nights || !pricePerNight || !checkIn || !checkOut) {
    return res.status(400).json({ error: "Missing payment information" });
  }

  try {
    // Validar disponibilidad en el servidor (nunca confiar solo en el cliente)
    const isAvailable = await checkAvailability(checkIn, checkOut);
    if (!isAvailable) {
      return res
        .status(409)
        .json({ error: "Selected dates are no longer available" });
    }

    // Calcular precio total con impuestos
    const pricing = calculateTotalPrice(nights, pricePerNight);

    // Modo simulado: no llama a Stripe, genera una "sesión" falsa para probar el flujo completo
    if (MOCK_PAYMENTS) {
      const mockId = `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      mockSessions.set(mockId, {
        payment_status: "paid",
        metadata: { checkIn, checkOut, nights: String(nights) },
      });
      return res.json({
        id: mockId,
        url: `${DOMAIN}/success.html?session_id=${mockId}`,
        pricing,
      });
    }

    // Crear sesión en Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Lakeside Serenity - Apartment Stay",
              description: `${nights} night(s): ${checkIn} to ${checkOut}`,
            },
            unit_amount: Math.round(pricing.total * 100), // Total con impuestos en centavos
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.DOMAIN}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.DOMAIN}/cancel.html`,
      metadata: {
        checkIn,
        checkOut,
        nights,
      },
    });

    res.json({
      id: session.id,
      url: session.url,
      pricing: pricing,
    });
  } catch (error) {
    console.error("Stripe error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para confirmar pago y crear reserva (respaldo por si el webhook no ha llegado aún)
app.post("/api/bookings", async (req, res) => {
  const { checkIn, checkOut, sessionId } = req.body;

  if (!checkIn || !checkOut || !sessionId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Verificar sesión: en modo simulado se lee de memoria, si no, se consulta a Stripe
    let session;
    if (MOCK_PAYMENTS && sessionId.startsWith("mock_")) {
      session = mockSessions.get(sessionId);
      if (!session) {
        return res.status(400).json({ error: "Mock session not found" });
      }
    } else {
      session = await stripe.checkout.sessions.retrieve(sessionId);
    }

    if (session.payment_status !== "paid") {
      return res.status(400).json({ error: "Payment not confirmed" });
    }

    // INSERT OR IGNORE: si el webhook ya guardó esta reserva (mismo stripePaymentId), no se duplica
    const sql = `INSERT OR IGNORE INTO bookings (checkIn, checkOut, bookingStatus, stripePaymentId) VALUES (?, ?, ?, ?)`;
    const params = [checkIn, checkOut, "confirmed", session.id];

    db.run(sql, params, function (err) {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: err.message });
      }

      if (this.changes > 0) {
        broadcastAdminUpdate();
      }
      res.status(201).json({
        message: "Booking created successfully",
        bookingId: this.lastID,
        checkIn,
        checkOut,
      });
    });
  } catch (error) {
    console.error("Booking creation error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Maneja los eventos de Stripe verificando la firma del webhook.
 * Esta es la vía confiable para confirmar reservas (no depende del navegador del cliente).
 */
function handleStripeWebhook(req, res) {
  if (!STRIPE_WEBHOOK_SECRET) {
    console.error(
      "STRIPE_WEBHOOK_SECRET no configurado; el webhook no puede verificarse.",
    );
    return res.status(500).send("Webhook not configured");
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers["stripe-signature"],
      STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error("Firma de webhook de Stripe inválida:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const { checkIn, checkOut, charge_id } = session.metadata || {};

    // Cobro manual
    if (charge_id && session.payment_status === "paid") {
      db.run(
        `UPDATE manual_charges SET status = 'paid', paid_at = datetime('now') WHERE id = ?`,
        [charge_id],
        function (err) {
          if (err) {
            console.error("Error marking manual charge as paid:", err.message);
            return;
          }
          if (this.changes > 0) {
            console.log(`✅ Cobro manual #${charge_id} confirmado vía webhook`);
            broadcastAdminUpdate();
          }
        },
      );
    }

    // Reserva de alojamiento
    if (checkIn && checkOut && session.payment_status === "paid") {
      const sql = `INSERT OR IGNORE INTO bookings (checkIn, checkOut, bookingStatus, stripePaymentId) VALUES (?, ?, 'confirmed', ?)`;
      db.run(sql, [checkIn, checkOut, session.id], function (err) {
        if (err) {
          console.error(
            "Error guardando reserva desde el webhook:",
            err.message,
          );
          return;
        }
        if (this.changes > 0) {
          console.log(
            `✅ Reserva confirmada vía webhook: ${checkIn} → ${checkOut}`,
          );
          broadcastAdminUpdate();
        }
      });
    }
  }

  res.json({ received: true });
}

// ============ ADMIN ENDPOINTS ============

// Login de admin
app.post("/api/admin/login", loginLimiter, (req, res) => {
  const { password } = req.body;

  if (password === ADMIN_PASSWORD) {
    const user = { name: "admin", role: "admin" };
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: "24h" });
    res.json({ token, user });
  } else {
    res.status(401).json({ error: "Invalid password" });
  }
});

// Obtener todas las reservas (requiere autenticación)
app.get("/api/admin/bookings", checkAdminAuth, (req, res) => {
  const sql = "SELECT * FROM bookings ORDER BY checkIn DESC";
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const nowStr = new Date().toISOString().split("T")[0];
    const bookings = {
      active: rows.filter(
        (r) => r.bookingStatus === "confirmed" && r.checkOut > nowStr,
      ),
      completed: rows.filter(
        (r) => r.bookingStatus === "confirmed" && r.checkOut <= nowStr,
      ),
      cancelled: rows.filter((r) => r.bookingStatus === "cancelled"),
    };

    res.json(bookings);
  });
});

// Cancelar una reserva
app.post("/api/admin/bookings/:id/cancel", checkAdminAuth, (req, res) => {
  const sql = `UPDATE bookings SET bookingStatus = 'cancelled' WHERE id = ?`;
  db.run(sql, [req.params.id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    broadcastAdminUpdate();
    res.json({ message: "Booking cancelled", changes: this.changes });
  });
});

// Eliminar una reserva permanentemente
app.delete("/api/admin/bookings/:id", checkAdminAuth, (req, res) => {
  const sql = `DELETE FROM bookings WHERE id = ?`;
  db.run(sql, [req.params.id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    broadcastAdminUpdate();
    res.json({ message: "Booking deleted", changes: this.changes });
  });
});

// ============ TAX SETTINGS ENDPOINTS ============

// Obtener configuración de impuestos Mecklenburg
app.get("/api/admin/tax-settings", checkAdminAuth, (req, res) => {
  const sql = `
    SELECT id, mecklenburg_sales, mecklenburg_occupancy,
           nc_state, mecklenburg_local, occupancy, updated_at
    FROM tax_settings
    ORDER BY updated_at DESC
    LIMIT 1
  `;

  db.get(sql, [], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (row) {
      res.json({
        id: row.id,
        mecklenburg_sales: row.mecklenburg_sales != null ? row.mecklenburg_sales : 8.25,
        mecklenburg_occupancy: row.mecklenburg_occupancy != null ? row.mecklenburg_occupancy : 8.0,
        updated_at: row.updated_at,
      });
    } else {
      res.json(getTaxConfig());
    }
  });
});

// Actualizar configuración de impuestos Mecklenburg
app.post("/api/admin/tax-settings", checkAdminAuth, (req, res) => {
  const { mecklenburg_sales, mecklenburg_occupancy } = req.body;

  if (mecklenburg_sales === undefined || mecklenburg_occupancy === undefined) {
    return res.status(400).json({ error: "Missing tax rates" });
  }

  // Mantener columnas antiguas con valores por defecto para compatibilidad
  const sql = `
    INSERT INTO tax_settings (nc_state, mecklenburg_local, occupancy, mecklenburg_sales, mecklenburg_occupancy, updated_at)
    VALUES (0, 0, 0, ?, ?, datetime('now'))
  `;

  db.run(sql, [mecklenburg_sales, mecklenburg_occupancy], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    broadcastAdminUpdate();
    res.json({
      message: "Tax settings updated",
      id: this.lastID,
      mecklenburg_sales,
      mecklenburg_occupancy,
    });
  });
});

// ============ MANUAL BILLING ENDPOINTS ============

// Crear un cobro manual (envía enlace de pago al cliente)
app.post("/api/admin/charges", checkAdminAuth, async (req, res) => {
  const { guest_name, guest_email, description, amount } = req.body;

  if (!guest_name || !guest_email || !description || !amount) {
    return res.status(400).json({ error: "Missing required fields: guest_name, guest_email, description, amount" });
  }

  if (amount <= 0) {
    return res.status(400).json({ error: "Amount must be greater than 0" });
  }

  const sql = `
    INSERT INTO manual_charges (guest_name, guest_email, description, amount)
    VALUES (?, ?, ?, ?)
  `;

  db.run(sql, [guest_name, guest_email, description, amount], async function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const chargeId = this.lastID;

    // Crear sesión de pago en Stripe (o mock)
    let sessionId = null;
    let sessionUrl = null;

    if (MOCK_PAYMENTS) {
      sessionId = `mock_charge_${Date.now()}`;
      sessionUrl = `${DOMAIN}/success.html?charge_id=${chargeId}`;
      db.run(`UPDATE manual_charges SET stripe_session_id = ? WHERE id = ?`, [sessionId, chargeId]);
    } else if (stripe) {
      try {
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          customer_email: guest_email,
          line_items: [
            {
              price_data: {
                currency: "usd",
                product_data: {
                  name: description,
                  description: `Manual charge for ${guest_name}`,
                },
                unit_amount: Math.round(amount * 100),
              },
              quantity: 1,
            },
          ],
          mode: "payment",
          success_url: `${DOMAIN}/success.html?charge_id=${chargeId}`,
          cancel_url: `${DOMAIN}/cancel.html`,
          metadata: {
            charge_id: String(chargeId),
            guest_name,
            guest_email,
          },
        });
        sessionId = session.id;
        sessionUrl = session.url;
        db.run(`UPDATE manual_charges SET stripe_session_id = ? WHERE id = ?`, [sessionId, chargeId]);
      } catch (stripeErr) {
        console.error("Stripe error creating manual charge:", stripeErr);
        // El cobro se guarda de todas formas; el admin puede reintentar después
      }
    }

    broadcastAdminUpdate();
    res.status(201).json({
      message: "Charge created",
      id: chargeId,
      stripe_session_id: sessionId,
      url: sessionUrl,
    });
  });
});

// Listar cobros manuales
app.get("/api/admin/charges", checkAdminAuth, (req, res) => {
  const sql = `SELECT * FROM manual_charges ORDER BY created_at DESC`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Actualizar estado de un cobro (marcar como pagado)
app.post("/api/admin/charges/:id/pay", checkAdminAuth, (req, res) => {
  const sql = `UPDATE manual_charges SET status = 'paid', paid_at = datetime('now') WHERE id = ?`;
  db.run(sql, [req.params.id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    broadcastAdminUpdate();
    res.json({ message: "Charge marked as paid", changes: this.changes });
  });
});

// Eliminar un cobro manual
app.delete("/api/admin/charges/:id", checkAdminAuth, (req, res) => {
  const sql = `DELETE FROM manual_charges WHERE id = ?`;
  db.run(sql, [req.params.id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    broadcastAdminUpdate();
    res.json({ message: "Charge deleted", changes: this.changes });
  });
});

// ============ AIRBNB CALENDAR SYNC ============

// Obtener calendario en formato iCal
app.get("/api/calendar.ics", (req, res) => {
  const sql =
    "SELECT id, checkIn, checkOut FROM bookings WHERE bookingStatus = 'confirmed' ORDER BY checkIn";

  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    let icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Lakeside Serenity//Booking Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Lakeside Serenity - Bookings
X-WR-TIMEZONE:America/Chicago
X-WR-CALDESC:Unavailable dates for Lakeside Serenity apartment
`;

    if (rows && rows.length > 0) {
      rows.forEach((booking) => {
        const checkInDate = new Date(booking.checkIn);
        const checkOutDate = new Date(booking.checkOut);

        const formatDate = (date) => {
          return date.toISOString().split("T")[0].replace(/-/g, "");
        };

        icsContent += `BEGIN:VEVENT
UID:booking-${booking.id}@lakeside-serenity
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z
DTSTART;VALUE=DATE:${formatDate(checkInDate)}
DTEND;VALUE=DATE:${formatDate(checkOutDate)}
SUMMARY:UNAVAILABLE - Booking #${booking.id}
DESCRIPTION:Booking ID: ${booking.id}
STATUS:CONFIRMED
END:VEVENT
`;
      });
    }

    icsContent += `END:VCALENDAR`;

    res.set("Content-Type", "text/calendar; charset=utf-8");
    res.set("Content-Disposition", "attachment; filename=calendar.ics");
    res.send(icsContent);
  });
});

// ============ HEALTH CHECK ============
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ============ AIRBNB ICAL IMPORT ============

/**
 * Descarga el calendario iCal exportado por Airbnb y bloquea esas fechas
 * en la web, para evitar reservas dobles entre plataformas.
 */
async function syncAirbnbCalendar() {
  if (!AIRBNB_ICAL_URL) return;

  try {
    const events = await ical.async.fromURL(AIRBNB_ICAL_URL);
    const parsedEvents = Object.values(events).filter(
      (e) => e.type === "VEVENT" && e.start && e.end && e.uid,
    );

    for (const event of parsedEvents) {
      const checkIn = event.start.toISOString().split("T")[0];
      const checkOut = event.end.toISOString().split("T")[0];

      db.run(
        `INSERT INTO external_blocks (source, uid, checkIn, checkOut) VALUES ('airbnb', ?, ?, ?)
         ON CONFLICT(source, uid) DO UPDATE SET checkIn = excluded.checkIn, checkOut = excluded.checkOut`,
        [event.uid, checkIn, checkOut],
        (err) => {
          if (err)
            console.error("Error guardando bloqueo de Airbnb:", err.message);
        },
      );
    }

    // Quita bloqueos de reservas de Airbnb que ya no están en el feed (canceladas)
    const currentUids = parsedEvents.map((e) => e.uid);
    if (currentUids.length > 0) {
      const placeholders = currentUids.map(() => "?").join(",");
      db.run(
        `DELETE FROM external_blocks WHERE source = 'airbnb' AND uid NOT IN (${placeholders})`,
        currentUids,
        (err) => {
          if (err)
            console.error("Error limpiando bloqueos de Airbnb:", err.message);
        },
      );
    } else {
      db.run(`DELETE FROM external_blocks WHERE source = 'airbnb'`);
    }

    console.log(
      `📅 Airbnb sync: ${parsedEvents.length} fecha(s) bloqueada(s) importada(s).`,
    );
    broadcastAdminUpdate();
  } catch (err) {
    console.error("Error sincronizando calendario de Airbnb:", err.message);
  }
}

// ============ SERVER ============
const server = http.createServer(app);

// WebSocket para notificar al panel admin en tiempo real (nuevas reservas, cancelaciones, sync)
const wss = new WebSocket.Server({ server });

function broadcastAdminUpdate() {
  const payload = JSON.stringify({ type: "bookings_updated" });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

server.listen(PORT, () => {
  console.log(`\n${"=".repeat(50)}`);
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${NODE_ENV}`);
  console.log(`🌐 Domain: ${DOMAIN}`);
  console.log(`📅 Calendar URL: ${DOMAIN}/api/calendar.ics`);
  console.log(`${"=".repeat(50)}\n`);

  if (AIRBNB_ICAL_URL) {
    syncAirbnbCalendar();
    setInterval(syncAirbnbCalendar, 15 * 60 * 1000); // cada hora
  } else {
    console.log(
      "ℹ️ AIRBNB_ICAL_URL no configurado: sincronización con Airbnb desactivada.",
    );
  }
});

module.exports = { app };
