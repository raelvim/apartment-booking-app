const fs = require('fs');
const assert = require('assert');

const source = fs.readFileSync('public/admin.html', 'utf8');

// Regression for issue #3: Check-In must render booking.checkIn, not checkOutDate.
assert(
  /<td>\$\{new Date\(booking\.checkIn\)\.toLocaleDateString\(/.test(source) ||
    /const checkInDate = new Date\(booking\.checkIn\)/.test(source),
  'Admin booking rows must render booking.checkIn in the Check-In column',
);

console.log('admin booking date rendering regression check passed');
