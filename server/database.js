// server/database.js

const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// La ruta a nuestro archivo de base de datos.
// Se creará un archivo llamado 'reservations.db' en la carpeta 'server'.
const dbPath = path.resolve(__dirname, "reservations.db");

// Creamos o abrimos la base de datos
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error al abrir la base de datos", err.message);
  } else {
    console.log("Conectado a la base de datos SQLite.");
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
  }
});

module.exports = db;
