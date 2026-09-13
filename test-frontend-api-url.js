// Verifica que los archivos frontend activos apunten al backend de producción correcto
// Uso: node test-frontend-api-url.js
const fs = require("fs");
const path = require("path");

const EXPECTED_PROD = "https://escapelakenorman-api-l2da.onrender.com";
const OLD_PROD = "https://escapelakenorman-api.onrender.com";

const files = [
  "public/booking.js",
  "public/login.html",
  "public/admin.html",
  "public/success.html",
  "public/tax-settings.html",
];

let failed = 0;

for (const rel of files) {
  const abs = path.join(__dirname, rel);
  const content = fs.readFileSync(abs, "utf8");

  const hasExpected = content.includes(EXPECTED_PROD);
  const hasOld = content.includes(OLD_PROD);
  const keepsLocalhost =
    content.includes('"localhost", "127.0.0.1"') &&
    content.includes(":3001");

  if (!hasExpected || hasOld || !keepsLocalhost) {
    failed += 1;
    console.log(`❌ ${rel}`);
    if (!hasExpected) console.log(`   - Missing expected URL: ${EXPECTED_PROD}`);
    if (hasOld) console.log(`   - Still contains old URL: ${OLD_PROD}`);
    if (!keepsLocalhost)
      console.log("   - Localhost/development fallback check failed");
  } else {
    console.log(`✅ ${rel}`);
  }
}

if (failed > 0) {
  console.log(`\nFAILED: ${failed} file(s) did not pass URL verification.`);
  process.exit(1);
}

console.log("\nAll active frontend API URL checks passed.");
