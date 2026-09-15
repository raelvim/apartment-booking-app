// server/database.js

const sqlite3 = require("sqlite3").verbose();
const {
  resolveDatabasePath,
  ensureDatabaseDirectory,
} = require("./database-path");

const dbPath = ensureDatabaseDirectory(resolveDatabasePath());

// Creamos o abrimos la base de datos
let resolvePricingReady;
let rejectPricingReady;
const pricingReady = new Promise((resolve, reject) => {
  resolvePricingReady = resolve;
  rejectPricingReady = reject;
});

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error al abrir la base de datos", err.message);
    rejectPricingReady(err);
  } else {
    console.log(`Conectado a la base de datos SQLite: ${dbPath}`);
    // Creamos la tabla de reservas si no existe
    db.run(
      `CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    checkIn TEXT NOT NULL,
    checkOut TEXT NOT NULL,
    bookingStatus TEXT,
    stripePaymentId TEXT
)`,
      (err) => {
        if (err) {
          console.error("Error al crear la tabla", err.message);
        }
      },
    );

    // Evita reservas duplicadas si el webhook y el navegador confirman el mismo pago
    db.run(
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_stripe_payment_id
       ON bookings(stripePaymentId) WHERE stripePaymentId IS NOT NULL`,
      (err) => {
        if (err) {
          console.error("Error al crear el índice único", err.message);
        }
      },
    );

    // Fechas bloqueadas importadas desde calendarios externos (ej. Airbnb)
    db.run(
      `CREATE TABLE IF NOT EXISTS external_blocks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL,
    uid TEXT NOT NULL,
    checkIn TEXT NOT NULL,
    checkOut TEXT NOT NULL,
    UNIQUE(source, uid)
)`,
      (err) => {
        if (err) {
          console.error("Error al crear la tabla external_blocks", err.message);
        }
      },
    );

    // Configuración de impuestos
    db.run(
      `CREATE TABLE IF NOT EXISTS tax_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nc_state REAL NOT NULL,
    mecklenburg_local REAL NOT NULL,
    occupancy REAL NOT NULL,
    mecklenburg_sales REAL DEFAULT 8.25,
    mecklenburg_occupancy REAL DEFAULT 8.00,
    nightly_rate REAL DEFAULT 150,
    monthly_rate REAL DEFAULT 1800,
    cleaning_fee REAL DEFAULT 0,
    minimum_nights INTEGER DEFAULT 10,
    updated_at TEXT NOT NULL
)`,
      (err) => {
        if (err) {
          console.error("Error al crear la tabla tax_settings", err.message);
        }
      },
    );

    // Migración: agregar columnas de impuestos Mecklenburg actualizados
    // Ventas: 8.25%, Ocupación: 8.00%
    db.run(
      `ALTER TABLE tax_settings ADD COLUMN mecklenburg_sales REAL DEFAULT 8.25`,
      () => {}, // ignora error si la columna ya existe
    );
    db.run(
      `ALTER TABLE tax_settings ADD COLUMN mecklenburg_occupancy REAL DEFAULT 8.00`,
      () => {}, // ignora error si la columna ya existe
    );

    // Migración: agregar columna de tipo de reserva (short_stay / monthly)
    db.run(
      `ALTER TABLE bookings ADD COLUMN rental_type TEXT DEFAULT 'short_stay'`,
      () => {}, // ignora error si la columna ya existe
    );

    // Migración: agregar columna de tarifa mensual en tax_settings
    db.run(
      `ALTER TABLE tax_settings ADD COLUMN monthly_rate REAL DEFAULT 1800`,
      () => {}, // ignora error si la columna ya existe
    );

    // Migración: agregar columna de tarifa por noche en tax_settings
    db.run(
      `ALTER TABLE tax_settings ADD COLUMN nightly_rate REAL DEFAULT 150`,
      () => {}, // ignora error si la columna ya existe
    );

    // Migración: completar la configuración tarifaria centralizada.
    db.run(
      `ALTER TABLE tax_settings ADD COLUMN cleaning_fee REAL DEFAULT 0`,
      () => {}, // ignora error si la columna ya existe
    );
    db.run(
      `ALTER TABLE tax_settings ADD COLUMN minimum_nights INTEGER DEFAULT 10`,
      () => {}, // ignora error si la columna ya existe
    );

    // Migración: número de huéspedes por reserva
    db.run(
      `ALTER TABLE bookings ADD COLUMN guests INTEGER DEFAULT 2`,
      () => {}, // ignora error si la columna ya existe
    );

    // Bloqueos temporales de fechas mientras el pago está en curso.
    // Evitan reservas dobles simultáneas: si el pago se completa, el webhook
    // convierte el bloqueo en reserva; si expira o falla, se libera.
    db.run(
      `CREATE TABLE IF NOT EXISTS booking_holds (
    id TEXT PRIMARY KEY,
    checkIn TEXT NOT NULL,
    checkOut TEXT NOT NULL,
    rental_type TEXT DEFAULT 'short_stay',
    stripe_session_id TEXT,
    status TEXT DEFAULT 'active',
    expires_at TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
)`,
      (err) => {
        if (err) {
          console.error("Error al crear la tabla booking_holds", err.message);
        }
      },
    );

    // Cobros manuales (facturas enviadas a clientes)
    db.run(
      `CREATE TABLE IF NOT EXISTS manual_charges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guest_name TEXT NOT NULL,
    guest_email TEXT NOT NULL,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    status TEXT DEFAULT 'pending',
    stripe_session_id TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    paid_at TEXT
)`,
      (err) => {
        if (err) {
          console.error("Error al crear la tabla manual_charges", err.message);
        }
      },
    );

    // This check is queued after the serialized migrations. Pricing endpoints
    // wait for it so no request can observe a partially migrated schema.
    db.all(`PRAGMA table_info(tax_settings)`, (schemaErr, rows) => {
      if (schemaErr) {
        rejectPricingReady(schemaErr);
        return;
      }
      const columns = new Set(rows.map((row) => row.name));
      const required = [
        "nightly_rate",
        "monthly_rate",
        "cleaning_fee",
        "minimum_nights",
        "mecklenburg_sales",
        "mecklenburg_occupancy",
      ];
      const missing = required.filter((column) => !columns.has(column));
      if (missing.length > 0) {
        rejectPricingReady(
          new Error(`Pricing migration incomplete: ${missing.join(", ")}`),
        );
        return;
      }
      resolvePricingReady();
    });
  }
});

// Preserve statement order during schema bootstrap and runtime transactions.
db.serialize();

// Expose the resolved path for diagnostics/tests without changing DB semantics.
db.databasePath = dbPath;
db.pricingReady = pricingReady;

module.exports = db;
