// Limpia la base de datos de DESARROLLO de las reservas y bloqueos generados
// por las pruebas automatizadas, conservando los bloqueos de Airbnb.
// Uso: node clean-test-data.js
const sqlite3 = require("sqlite3").verbose();
const { resolveDatabasePath } = require("./server/database-path");

const dbPath = resolveDatabasePath();
if (process.env.NODE_ENV === "production" || dbPath.startsWith("/var/data/")) {
  throw new Error(
    "Refusing to clean a production/persistent database. Use an isolated test DB.",
  );
}

const db = new sqlite3.Database(dbPath);

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
