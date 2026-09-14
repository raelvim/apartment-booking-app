const fs = require('fs');
const assert = require('assert');

const source = fs.readFileSync('public/admin.html', 'utf8');
const escapeIndex = source.indexOf('function escapeHtml(value)');
const createRowIndex = source.indexOf('function createRow(booking)');
const chargesIndex = source.indexOf('async function fetchAndRenderCharges()');

assert(escapeIndex !== -1, 'escapeHtml helper must exist');
assert(createRowIndex !== -1 && chargesIndex !== -1, 'admin render functions must exist');
assert(
  escapeIndex < createRowIndex,
  'escapeHtml must be declared in shared scope before createRow so charge rendering can use it',
);

for (const field of ['guest_name', 'guest_email', 'description']) {
  assert(
    source.includes(`escapeHtml(charge.${field})`),
    `manual charge ${field} must continue to be HTML-escaped`,
  );
}

for (const replacement of ['&amp;', '&lt;', '&gt;', '&quot;', '&#39;']) {
  assert(
    source.includes(replacement),
    `escapeHtml must preserve the ${replacement} escaping replacement`,
  );
}

console.log('admin escaping scope regression check passed');
