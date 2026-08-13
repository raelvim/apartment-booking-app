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
    bookingStatus TEXT, -- <-- Simplificado. El valor se lo daremos al insertar.
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
    // Configuración de impuestos (faltaba esta tabla; el panel admin la necesita)
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
  }
});

module.exports = db;
