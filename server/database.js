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
      }
    );
  }
});

module.exports = db;
