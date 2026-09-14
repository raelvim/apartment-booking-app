const fs = require("fs");
const path = require("path");

const DEFAULT_RESERVATIONS_DB_PATH = path.resolve(__dirname, "reservations.db");

function resolveReservationsDbPath() {
  const configuredPath = process.env.RESERVATIONS_DB_PATH?.trim();

  if (!configuredPath) {
    return DEFAULT_RESERVATIONS_DB_PATH;
  }

  return path.resolve(configuredPath);
}

function ensureReservationsDbDirectory(dbPath = resolveReservationsDbPath()) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  return dbPath;
}

module.exports = {
  DEFAULT_RESERVATIONS_DB_PATH,
  ensureReservationsDbDirectory,
  resolveReservationsDbPath,
};
