// test-db-path.js - Verificacion enfocada de la seleccion de ruta de la DB (issue #23)
// Uso: node test-db-path.js
// No toca la base de datos real: usa archivos temporales y los borra al salir.
const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");

function loadDbPath(envValue) {
  // Replica exacta de la logica de server/database.js sin abrir la DB:
  // process.env.DATABASE_PATH ? resolve(env) : resolve(__dirname de server/, "reservations.db")
  const serverDir = path.join(__dirname, "server");
  return envValue
    ? path.resolve(envValue)
    : path.resolve(serverDir, "reservations.db");
}

// 1) Sin DATABASE_PATH: debe caer en server/reservations.db (comportamiento local actual)
const localPath = loadDbPath(undefined);
assert.strictEqual(
  localPath,
  path.resolve(__dirname, "server", "reservations.db"),
  "Sin DATABASE_PATH debe usar server/reservations.db",
);
console.log("1. OK - Sin DATABASE_PATH usa la ruta local de siempre:", localPath);

// 2) Con DATABASE_PATH absoluta (como en Render): debe usarla tal cual
const prodPath = loadDbPath("/var/data/reservations.db");
assert.strictEqual(
  prodPath,
  path.resolve("/var/data/reservations.db"),
  "Con DATABASE_PATH debe usar la ruta del disco persistente",
);
console.log("2. OK - Con DATABASE_PATH=/var/data/reservations.db usa:", prodPath);

// 3) Prueba real de persistencia: abrir una DB sqlite en un directorio temporal,
//    escribir una fila, "reiniciar" (reabrir el modulo) y verificar que el dato sigue.
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "dbpath-test-"));
const tmpDb = path.join(tmpDir, "reservations.db");
process.env.DATABASE_PATH = tmpDb;

// Cargamos dos veces el modulo (simula arranque + reinicio del servidor)
delete require.cache[require.resolve("./server/database.js")];
const db1 = require("./server/database.js");

db1.serialize(() => {
  db1.run(
    "CREATE TABLE IF NOT EXISTS persist_check (id INTEGER PRIMARY KEY, value TEXT)",
  );
  db1.run("INSERT INTO persist_check (value) VALUES ('sobrevive-reinicio')", () => {
    db1.close(() => {
      // "Reinicio": recargar el modulo apuntando al MISMO archivo
      delete require.cache[require.resolve("./server/database.js")];
      const db2 = require("./server/database.js");
      db2.get(
        "SELECT value FROM persist_check WHERE id = 1",
        (err, row) => {
          db2.close(() => {
            fs.rmSync(tmpDir, { recursive: true, force: true });
            delete process.env.DATABASE_PATH;
            assert.ifError(err);
            assert.strictEqual(
              row && row.value,
              "sobrevive-reinicio",
              "El dato debe sobrevivir un reinicio del proceso",
            );
            console.log(
              "3. OK - Dato escrito antes del 'reinicio' sigue presente despues",
            );
            console.log("\nTodas las verificaciones de ruta/persistencia pasaron.");
          });
        },
      );
    });
  });
});
