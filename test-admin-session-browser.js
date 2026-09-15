const assert = require("assert");
const fs = require("fs");

const login = fs.readFileSync("public/login.html", "utf8");
const admin = fs.readFileSync("public/admin.html", "utf8");
const taxSettings = fs.readFileSync("public/tax-settings.html", "utf8");
const netlify = fs.readFileSync("netlify.toml", "utf8");

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
}

assert(admin.includes('id="btn-logout"'), "admin must expose logout control");
assert(
  admin.includes("/api/admin/logout"),
  "logout control must clear the server cookie",
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

console.log("admin browser session and CSP regression check passed");
