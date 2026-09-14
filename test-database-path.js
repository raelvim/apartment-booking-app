const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");
const {
  DEFAULT_DB_PATH,
  resolveDatabasePath,
  ensureDatabaseDirectory,
} = require("./server/database-path");

function runNode(script, env) {
  return execFileSync(process.execPath, ["-e", script], {
    cwd: __dirname,
    env,
    encoding: "utf8",
  }).trim();
}

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "booking-db-path-"));
const configuredPath = path.join(tempRoot, "nested", "reservations.db");
const legacyPath = path.join(tempRoot, "legacy", "reservations.db");

try {
  assert.strictEqual(
    resolveDatabasePath({}),
    DEFAULT_DB_PATH,
    "local fallback must remain server/reservations.db",
  );

  assert.strictEqual(
    resolveDatabasePath({ RESERVATIONS_DB_PATH: configuredPath }),
    path.resolve(configuredPath),
    "RESERVATIONS_DB_PATH must control the SQLite location",
  );

  assert.strictEqual(
    resolveDatabasePath({ DATABASE_PATH: legacyPath }),
    path.resolve(legacyPath),
    "DATABASE_PATH remains a compatibility alias",
  );

  ensureDatabaseDirectory(configuredPath);
  assert.ok(
    fs.existsSync(path.dirname(configuredPath)),
    "configured database directory must be created",
  );

  const env = {
    ...process.env,
    RESERVATIONS_DB_PATH: configuredPath,
  };
  delete env.DATABASE_PATH;

  const resolver = JSON.stringify(
    path.join(__dirname, "server", "database-path.js"),
  );

  runNode(
    `
      const sqlite3 = require("sqlite3").verbose();
      const { resolveDatabasePath, ensureDatabaseDirectory } = require(${resolver});
      const dbPath = ensureDatabaseDirectory(resolveDatabasePath());
      const db = new sqlite3.Database(dbPath);
      db.serialize(() => {
        db.run("CREATE TABLE IF NOT EXISTS persistence_probe (value TEXT NOT NULL)");
        db.run("DELETE FROM persistence_probe");
        db.run("INSERT INTO persistence_probe(value) VALUES (?)", ["survives-restart"]);
      });
      db.close((err) => {
        if (err) { console.error(err); process.exit(1); }
      });
    `,
    env,
  );

  const persistedValue = runNode(
    `
      const sqlite3 = require("sqlite3").verbose();
      const { resolveDatabasePath } = require(${resolver});
      const db = new sqlite3.Database(resolveDatabasePath(), sqlite3.OPEN_READONLY);
      db.get("SELECT value FROM persistence_probe LIMIT 1", (err, row) => {
        if (err) { console.error(err); process.exit(1); }
        process.stdout.write(row ? row.value : "");
        db.close();
      });
    `,
    env,
  );

  assert.strictEqual(
    persistedValue,
    "survives-restart",
    "configured SQLite file must retain data across separate Node processes",
  );

  console.log("PASS: default DB path remains local");
  console.log("PASS: configured DB path is honored");
  console.log("PASS: configured DB directory is created");
  console.log("PASS: data survives a process restart on the configured SQLite file");
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
