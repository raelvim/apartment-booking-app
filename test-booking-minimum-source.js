"use strict";

const assert = require("assert");
const fs = require("fs");

const booking = fs.readFileSync("public/booking.js", "utf8");

assert(
  !booking.includes("const MIN_NIGHTS"),
  "the browser must not define a competing minimum-night constant",
);
assert(
  !booking.includes("nights < MIN_NIGHTS"),
  "the browser must defer the configurable minimum to the server",
);
assert(
  booking.includes('error.error || "Failed to calculate price"'),
  "the browser must display the server's effective minimum-night error",
);
assert(
  booking.includes("minCheckout.getDate() + 1"),
  "the date picker should only reject an empty stay locally",
);

console.log("booking minimum-night source-of-truth check passed");
