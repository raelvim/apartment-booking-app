const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const repoRoot = __dirname;
const runtimeDbPath = "server/reservations.db";
const gitignorePath = path.join(repoRoot, ".gitignore");

const gitignore = fs.readFileSync(gitignorePath, "utf8");
const ignoreLines = gitignore
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith("#"));

assert.ok(
  ignoreLines.includes(runtimeDbPath),
  `${runtimeDbPath} must remain explicitly ignored`,
);

const gitCheck = spawnSync(
  "git",
  ["ls-files", "--error-unmatch", runtimeDbPath],
  { cwd: repoRoot, encoding: "utf8" },
);

if (gitCheck.error && gitCheck.error.code === "ENOENT") {
  throw new Error("git is required to verify repository data hygiene");
}

assert.notStrictEqual(
  gitCheck.status,
  0,
  `${runtimeDbPath} is still tracked by Git`,
);

console.log(`PASS: ${runtimeDbPath} is ignored and not tracked by Git`);
