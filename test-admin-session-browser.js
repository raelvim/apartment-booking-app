const assert = require("assert");
const fs = require("fs");

const login = fs.readFileSync("public/login.html", "utf8");
const admin = fs.readFileSync("public/admin.html", "utf8");
const taxSettings = fs.readFileSync("public/tax-settings.html", "utf8");
const netlify = fs.readFileSync("netlify.toml", "utf8");

const renderOrigin = "https://escapelakenorman-api-l2da.onrender.com";
const firstPartyApiPattern =
  /const API_URL = [\s\S]*?\?\s*`http:\/\/\$\{window\.location\.hostname\}:3001`\s*:\s*"";/;

for (const [name, source] of Object.entries({ login, admin, taxSettings })) {
  assert(!source.includes("admin_token"), `${name} must not access admin_token`);
  assert(
    !source.includes("Authorization: `Bearer"),
    `${name} must not expose a bearer token`,
  );
  assert(
    source.includes('credentials: "include"'),
    `${name} must include the HttpOnly session cookie`,
  );
  assert(
    firstPartyApiPattern.test(source),
    `${name} must use same-origin /api requests in production`,
  );
  assert(
    !source.includes(`${renderOrigin}/api/`),
    `${name} must not call the Render HTTP API directly in production`,
  );
}

assert(admin.includes('id="btn-logout"'), "admin must expose logout control");
assert(
  admin.includes("/api/admin/logout"),
  "logout control must clear the server cookie",
);
assert(
  admin.includes(`const PROD_WS_URL = "${renderOrigin}";`),
  "admin must keep the direct Render origin only for WebSocket transport",
);
assert(
  admin.includes("const WS_API_URL = IS_LOCAL ? API_URL : PROD_WS_URL;"),
  "admin must route WebSocket transport independently from first-party HTTP",
);
assert(
  netlify.includes('from = "/api/*"') &&
    netlify.includes(`to = "${renderOrigin}/api/:splat"`) &&
    netlify.includes("status = 200"),
  "Netlify must proxy first-party /api requests to the authoritative backend",
);
assert(
  netlify.includes("Content-Security-Policy"),
  "Netlify must publish an explicit CSP",
);
assert(
  !/script-src[^;]*\*/.test(netlify),
  "CSP must not allow arbitrary script origins",
);
assert(
  netlify.includes("script-src") && netlify.includes("https://elfsightcdn.com"),
  "CSP must permit the configured Elfsight script",
);

console.log("admin browser session, first-party API, and CSP regression check passed");
