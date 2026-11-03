import assert from 'node:assert/strict';
const base = process.env.CRM_TEST_ORIGIN || 'http://localhost:3027';
const first = await fetch(base + '/crm/sigorta/login'); const html = await first.text();
const second = await fetch(base + '/crm/rent-a-car/login');
for (const response of [first, second]) {
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('x-frame-options'), 'DENY');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
  assert.match(response.headers.get('cache-control'), /no-store/);
  assert.match(response.headers.get('x-robots-tag'), /noindex/);
  assert.match(response.headers.get('content-security-policy'), /strict-dynamic/);
  assert.ok(!response.headers.has('x-powered-by'));
}
const nonce = first.headers.get('content-security-policy').match(/'nonce-([^']+)'/)[1];
assert.ok(html.includes('nonce="' + nonce + '"'), 'SSR scripts must use the CSP nonce');
assert.notEqual(first.headers.get('content-security-policy'), second.headers.get('content-security-policy'), 'Every request needs a new nonce');
for (const route of ['/api/crm/users', '/api/crm/telegram', '/api/crm/policy-documents?policyId=test']) assert.equal((await fetch(base + route)).status, 401);
assert.equal((await fetch(base + '/api/crm/users', { headers: { Origin: 'https://untrusted.example' } })).status, 403);
for (const route of ['/.env.local', '/auto_created_movements_backup.json', '/scripts/setup-policy-storage.mjs']) assert.equal((await fetch(base + route)).status, 404);
console.log('PASS: production HTTP security headers, per-request SSR script nonce, unauthorized API rejection, cross-site rejection and private-file isolation.');
