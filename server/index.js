// server/index.js - VERSIÓN CORREGIDA Y FINAL

const express = require("express");
const path = require("path");
const http = require("http");
const WebSocket = require("ws");
const db = require("./database.js");
const stripe = require("stripe")(
  "sk_test_51SAEbmGtWaCmr4GY7yV1UI0D5UCHBLjLT9auYQkhOw1M4v4hs6jFOQEtlLklq35aLWdATsD3bksbm41rHzIGadUg00DFwc3MXN"
);
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_SECRET = "sebas25";
const JWT_SECRET = "sebas25"; // Considera cambiar esto a algo más seguro y diferente

app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

const server = http.createServer(app);
const wss = new WebSocket.Server({ noServer: true });

const adminClients = new Set();

server.on("upgrade", (request, socket, head) => {
  // Manejamos la "actualización" de la conexión de HTTP a WebSocket
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request);
  });
});

wss.on("connection", (ws) => {
  console.log("Client connected to WebSocket");
  adminClients.add(ws); // Añadimos el nuevo cliente a nuestro set

  ws.on("close", () => {
    console.log("Client disconnected");
    adminClients.delete(ws); // Lo eliminamos cuando se desconecta
  });
});

function broadcastAdminUpdate() {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send("bookings_updated"); // Enviamos un mensaje simple
    }
  });
}

// --- GUARDIÁN DE AUTENTICACIÓN POR TOKEN ---
const checkAdminAuth = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// --- API ENDPOINTS PÚBLICOS ---
app.get("/api/bookings", (req, res) => {
  const sql =
    "SELECT checkIn, checkOut FROM bookings WHERE bookingStatus = 'confirmed'";
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const disabledRanges = rows.map((row) => ({
      from: row.checkIn,
      to: row.checkOut,
    }));
    res.json(disabledRanges);
  });
});

app.post("/api/bookings", (req, res) => {
  const { checkIn, checkOut, stripePaymentId } = req.body;
  if (!checkIn || !checkOut)
    return res.status(400).json({ error: "Missing date information." });

  const sql = `INSERT INTO bookings (checkIn, checkOut, bookingStatus, stripePaymentId) VALUES (?, ?, ?, ?)`;
  const params = [checkIn, checkOut, "confirmed", stripePaymentId];
  db.run(sql, params, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    broadcastAdminUpdate();
    res.status(201).json({
      message: "Booking created successfully",
      bookingId: this.lastID,
    });
  });
});

app.post("/api/create-checkout-session", async (req, res) => {
  const { nights, pricePerNight, checkIn, checkOut } = req.body;
  if (!nights || !pricePerNight || !checkIn || !checkOut) {
    return res.status(400).json({ error: "Missing payment information." });
  }
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Stay at Lakeside Serenity`,
              description: `${nights} nights: from ${checkIn} to ${checkOut}`,
            },
            unit_amount: pricePerNight * 100,
          },
          quantity: nights,
        },
      ],
      mode: "payment",
      success_url: `${req.protocol}://${req.get(
        "host"
      )}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.protocol}://${req.get("host")}/cancel.html`,
    });
    res.json({ id: session.id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- API ENDPOINTS DE ADMIN ---
app.post("/api/admin/login", (req, res) => {
  if (req.body.secret === ADMIN_SECRET) {
    const user = { name: "admin" };
    const accessToken = jwt.sign(user, JWT_SECRET, { expiresIn: "1d" });
    res.json({ accessToken: accessToken });
  } else {
    res.status(401).json({ message: "Incorrect password" });
  }
});

app.get("/api/admin/bookings", checkAdminAuth, (req, res) => {
  // CORRECCIÓN: Se eliminó la doble verificación de seguridad. Ahora solo usa el token.
  const sql = "SELECT * FROM bookings ORDER BY checkIn DESC";
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const nowStr = new Date().toISOString().split("T")[0];
    const bookings = {
      active: rows.filter(
        (r) => r.bookingStatus === "confirmed" && r.checkOut >= nowStr
      ),
      completed: rows.filter(
        (r) => r.bookingStatus === "confirmed" && r.checkOut < nowStr
      ),
      cancelled: rows.filter((r) => r.bookingStatus === "cancelled"),
    };
    res.json(bookings);
  });
});

app.post("/api/admin/bookings/:id/cancel", checkAdminAuth, (req, res) => {
  const sql = `UPDATE bookings SET bookingStatus = 'cancelled' WHERE id = ?`;
  db.run(sql, [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({
      message: "Booking cancelled successfully",
      changes: this.changes,
    });
  });
});

app.delete("/api/admin/bookings/:id", checkAdminAuth, (req, res) => {
  const sql = `DELETE FROM bookings WHERE id = ?`;
  db.run(sql, [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    broadcastAdminUpdate();
    res.json({ message: "Booking deleted permanently", changes: this.changes });
  });
});

server.listen(PORT, () => {
  console.log(`Servidor y WebSocket corriendo en el puerto ${PORT}`);
});
