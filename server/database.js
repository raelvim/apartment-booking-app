// server/database.js

const sqlite3 = require("sqlite3").verbose();
const {
  resolveDatabasePath,
  ensureDatabaseDirectory,
} = require("./database-path");

const dbPath = ensureDatabaseDirectory(resolveDatabasePath());
const defaultMecklenburgSales =
  parseFloat(process.env.TAX_MECKLENBURG_SALES) || 8.25;
const defaultMecklenburgOccupancy =
  parseFloat(process.env.TAX_MECKLENBURG_OCCUPANCY) || 8.0;

// Open the configured database and keep all statements serialized. Scheduling the
// schema bootstrap immediately (rather than from the async open callback) ensures
// every consumer of this module runs only after the bootstrap statements queued
// below, including when the runtime database file does not exist yet.
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error al abrir la base de datos", err.message);
  } else {
    console.log(`Conectado a la base de datos SQLite: ${dbPath}`);
  }
});

db.serialize();

// Current bookings schema for a brand-new database. The ALTER statements below
// remain as compatibility migrations for databases created by older versions.
db.run(
  `CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    checkIn TEXT NOT NULL,
    checkOut TEXT NOT NULL,
    bookingStatus TEXT,
    stripePaymentId TEXT,
    rental_type TEXT DEFAULT 'short_stay',
    guests INTEGER DEFAULT 2
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

// Current tax schema for a brand-new database. Compatibility ALTER migrations
// below preserve existing databases created before these columns existed.
db.run(
  `CREATE TABLE IF NOT EXISTS tax_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nc_state REAL NOT NULL,
    mecklenburg_local REAL NOT NULL,
    occupancy REAL NOT NULL,
    updated_at TEXT NOT NULL,
    mecklenburg_sales REAL DEFAULT 8.25,
    mecklenburg_occupancy REAL DEFAULT 8.00,
    monthly_rate REAL DEFAULT 1800,
    nightly_rate REAL DEFAULT 150
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

// Migración: número de huéspedes por reserva
db.run(
  `ALTER TABLE bookings ADD COLUMN guests INTEGER DEFAULT 2`,
  () => {}, // ignora error si la columna ya existe
);

// A fresh or otherwise empty database needs one settings row because the admin
// monthly-rate endpoint updates the latest row. SQLite considers an UPDATE that
// matches zero rows successful, so without this seed the first save could report
// success without persisting anything. Existing settings rows are never changed.
// Keep the seeded tax values aligned with the same environment-backed defaults
// used by the runtime pricing fallback rather than hard-coding a conflicting row.
db.run(
  `INSERT INTO tax_settings (
    nc_state,
    mecklenburg_local,
    occupancy,
    updated_at,
    mecklenburg_sales,
    mecklenburg_occupancy,
    monthly_rate,
    nightly_rate
  )
  SELECT 0, 0, 0, datetime('now'), ?, ?, 1800, 150
  WHERE NOT EXISTS (SELECT 1 FROM tax_settings)`,
  [defaultMecklenburgSales, defaultMecklenburgOccupancy],
  (err) => {
    if (err) {
      console.error("Error al inicializar tax_settings", err.message);
    }
  },
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

// Expose the resolved path for diagnostics/tests without changing DB semantics.
db.databasePath = dbPath;

module.exports = db;
