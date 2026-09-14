const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const sqlite3 = require("sqlite3").verbose();

const repoRoot = __dirname;
const helperPath = path.join(repoRoot, "server", "database-path.js");
const defaultDbPath = path.join(repoRoot, "server", "reservations.db");

function runNode(env, code) {
  const result = spawnSync(process.execPath, ["-e", code], {
    cwd: repoRoot,
    env: { ...process.env, ...env },
    encoding: "utf8",
  });

  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || "Node child process failed");
  }

  return result.stdout.trim();
}

function queryDb(dbPath, sql) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);
    db.get(sql, (error, row) => {
      db.close();
      if (error) {
        reject(error);
        return;
      }
      resolve(row);
    });
  });
}

(async () => {
  const helperCode = `
    const { resolveReservationsDbPath } = require(${JSON.stringify(helperPath)});
    process.stdout.write(resolveReservationsDbPath());
  `;
  const resolvedDefaultPath = runNode({ RESERVATIONS_DB_PATH: "" }, helperCode);
  assert.strictEqual(
    resolvedDefaultPath,
    defaultDbPath,
    "default DB path should stay in server/reservations.db for local development",
  );

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "reservations-db-"));
  const configuredDbPath = path.join(tempDir, "nested", "reservations.db");
  const createDbCode = `
    process.env.RESERVATIONS_DB_PATH = ${JSON.stringify(configuredDbPath)};
    const db = require("./server/database.js");
    db.get("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'bookings'", (error, row) => {
      if (error) {
        console.error(error);
        process.exit(1);
      }
      if (!row) {
        console.error("bookings table missing");
        process.exit(1);
      }
      db.close(() => process.exit(0));
    });
  `;
  runNode({ RESERVATIONS_DB_PATH: configuredDbPath }, createDbCode);

  assert.ok(
    fs.existsSync(configuredDbPath),
    "custom RESERVATIONS_DB_PATH should create the SQLite file on the configured path",
  );

  const tableRow = await queryDb(
    configuredDbPath,
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'booking_holds'",
  );
  assert.strictEqual(
    tableRow && tableRow.name,
    "booking_holds",
    "schema should be initialized in the configured SQLite file",
  );

  console.log("✅ database path configuration verified");
})().catch((error) => {
  console.error("❌ database path configuration failed");
  console.error(error);
  process.exit(1);
});
