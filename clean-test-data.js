// Limpia la base de datos de DESARROLLO de las reservas y bloqueos generados
// por las pruebas automatizadas, conservando los bloqueos de Airbnb.
// Uso: node clean-test-data.js
const sqlite3 = require("sqlite3").verbose();
const { resolveReservationsDbPath } = require("./server/database-path");
const db = new sqlite3.Database(
  resolveReservationsDbPath(),
);

db.serialize(() => {
  db.get("SELECT COUNT(*) AS n FROM bookings", (e, r) =>
    console.log("bookings antes:", r.n),
  );
  db.get("SELECT COUNT(*) AS n FROM booking_holds", (e, r) =>
    console.log("holds antes:", r.n),
  );
  db.get("SELECT COUNT(*) AS n FROM external_blocks", (e, r) =>
    console.log("external_blocks (Airbnb, se conservan):", r.n),
  );

  db.run("DELETE FROM bookings");
  db.run("DELETE FROM booking_holds");

  db.get("SELECT COUNT(*) AS n FROM bookings", (e, r) =>
    console.log("bookings después:", r.n),
  );
  db.get("SELECT COUNT(*) AS n FROM booking_holds", (e, r) => {
    console.log("holds después:", r.n);
    db.close();
  });
});
