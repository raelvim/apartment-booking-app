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
const bootstrapPath = path.join(tempRoot, "bootstrap", "reservations.db");

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

  const bootstrapEnv = {
    ...process.env,
    RESERVATIONS_DB_PATH: bootstrapPath,
    TAX_MECKLENBURG_SALES: "7.125",
    TAX_MECKLENBURG_OCCUPANCY: "3.5",
  };
  delete bootstrapEnv.DATABASE_PATH;

  const databaseModule = JSON.stringify(
    path.join(__dirname, "server", "database.js"),
  );

  runNode(
    `
      const db = require(${databaseModule});
      const requiredColumns = [
        "id",
        "checkIn",
        "checkOut",
        "bookingStatus",
        "stripePaymentId",
        "rental_type",
        "guests",
      ];

      db.all("PRAGMA table_info(bookings)", (err, rows) => {
        if (err) {
          console.error(err);
          process.exit(1);
        }

        const columns = new Set(rows.map((row) => row.name));
        for (const column of requiredColumns) {
          if (!columns.has(column)) {
            console.error("Missing bookings column: " + column);
            process.exit(1);
          }
        }

        db.get(
          "SELECT name FROM sqlite_master WHERE type = 'index' AND name = 'idx_bookings_stripe_payment_id'",
          (indexErr, indexRow) => {
            if (indexErr) {
              console.error(indexErr);
              process.exit(1);
            }
            if (!indexRow) {
              console.error("Missing idx_bookings_stripe_payment_id");
              process.exit(1);
            }

            db.get(
              "SELECT mecklenburg_sales, mecklenburg_occupancy FROM tax_settings ORDER BY updated_at DESC, id DESC LIMIT 1",
              (taxErr, taxRow) => {
                if (taxErr) {
                  console.error(taxErr);
                  process.exit(1);
                }
                if (
                  !taxRow ||
                  taxRow.mecklenburg_sales !== 7.125 ||
                  taxRow.mecklenburg_occupancy !== 3.5
                ) {
                  console.error("Fresh tax_settings seed ignored configured tax rates");
                  process.exit(1);
                }

                db.run(
                  "UPDATE tax_settings SET monthly_rate = ? WHERE id = (SELECT id FROM tax_settings ORDER BY updated_at DESC LIMIT 1)",
                  [1900],
                  function (rateErr) {
                    if (rateErr) {
                      console.error(rateErr);
                      process.exit(1);
                    }
                    if (this.changes !== 1) {
                      console.error("Fresh tax_settings row was not seeded");
                      process.exit(1);
                    }

                    db.get(
                      "SELECT monthly_rate FROM tax_settings ORDER BY updated_at DESC LIMIT 1",
                      (readRateErr, rateRow) => {
                        if (readRateErr) {
                          console.error(readRateErr);
                          process.exit(1);
                        }
                        if (!rateRow || rateRow.monthly_rate !== 1900) {
                          console.error("Monthly rate did not persist on a fresh database");
                          process.exit(1);
                        }

                        db.run(
                          "INSERT INTO bookings (checkIn, checkOut, bookingStatus, stripePaymentId, rental_type, guests) VALUES (?, ?, ?, ?, ?, ?)",
                          [
                            "2030-01-01",
                            "2030-01-02",
                            "confirmed",
                            "pi_bootstrap_test",
                            "short_stay",
                            2,
                          ],
                          (insertErr) => {
                            if (insertErr) {
                              console.error(insertErr);
                              process.exit(1);
                            }
                            db.close((closeErr) => {
                              if (closeErr) {
                                console.error(closeErr);
                                process.exit(1);
                              }
                            });
                          },
                        );
                      },
                    );
                  },
                );
              },
            );
          },
        );
      });
    `,
    bootstrapEnv,
  );

  console.log("PASS: default DB path remains local");
  console.log("PASS: configured DB path is honored");
  console.log("PASS: configured DB directory is created");
  console.log("PASS: data survives a process restart on the configured SQLite file");
  console.log("PASS: fresh database bootstrap creates the current bookings schema");
  console.log("PASS: fresh database bootstrap honors configured tax rates");
  console.log("PASS: fresh database bootstrap seeds writable tax settings");
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
