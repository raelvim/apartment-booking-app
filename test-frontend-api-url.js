// Verifica que los archivos frontend activos apunten al backend de producción correcto
// Uso: node test-frontend-api-url.js
const fs = require("fs");
const path = require("path");

const EXPECTED_PROD = "https://escapelakenorman-api-l2da.onrender.com";

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

  const prodMatch = content.match(/const\s+PROD_API_URL\s*=\s*"([^"]+)"/);
  const currentProdUrl = prodMatch ? prodMatch[1] : null;
  const renderUrls = [...content.matchAll(/https:\/\/[a-z0-9-]+\.onrender\.com/g)].map(
    (m) => m[0],
  );
  const hasExpected = currentProdUrl === EXPECTED_PROD;
  const hasUnexpectedRenderUrl = renderUrls.some((url) => url !== EXPECTED_PROD);
  const keepsLocalhost =
    /localhost/.test(content) &&
    /127\.0\.0\.1/.test(content) &&
    /window\.location\.hostname/.test(content) &&
    /`http:\/\/\$\{window\.location\.hostname\}:3001`/.test(content) &&
    /:\s*PROD_API_URL/.test(content);

  if (!hasExpected || hasUnexpectedRenderUrl || !keepsLocalhost) {
    failed += 1;
    console.log(`❌ ${rel}`);
    if (!hasExpected) console.log(`   - Missing expected URL: ${EXPECTED_PROD}`);
    if (hasUnexpectedRenderUrl)
      console.log(
        `   - Unexpected Render URL(s): ${renderUrls.filter((url) => url !== EXPECTED_PROD).join(", ")}`,
      );
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
