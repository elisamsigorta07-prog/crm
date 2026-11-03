import test from 'node:test';
import assert from 'node:assert/strict';
import { isCrmStaff } from '../src/lib/crmAccess.ts';
import { readJson, jwtAssurance, sameOrigin, rateLimitKey } from '../src/lib/server/securityCore.ts';
import { crmCsp } from '../src/lib/securityHeaders.ts';

test('disabled accounts and cross-panel scopes never inherit staff access', () => {
  const meta = { crm_workspace: 'elisam', crm_staff: true, crm_role: 'staff', crm_scopes: ['insurance'] };
  assert.equal(isCrmStaff({ app_metadata: meta }), true);
  assert.equal(isCrmStaff({ app_metadata: meta }, 'rent'), false);
  assert.equal(isCrmStaff({ app_metadata: { ...meta, crm_disabled: true } }), false);
  assert.equal(isCrmStaff({ app_metadata: { ...meta, crm_scopes: ['rent'] } }), false);
  assert.equal(isCrmStaff({ app_metadata: { ...meta, crm_scopes: ['rent'] } }, 'rent'), true);
});
test('cross-site API requests are denied while same-origin and native clients work', () => {
  assert.equal(sameOrigin(new Request('https://example.test/api/crm/users', { headers: { origin: 'https://evil.test' } })), false);
  assert.equal(sameOrigin(new Request('https://example.test/api/crm/users', { headers: { 'sec-fetch-site': 'cross-site' } })), false);
  assert.equal(sameOrigin(new Request('https://example.test/api/crm/users', { headers: { origin: 'https://example.test' } })), true);
  assert.equal(sameOrigin(new Request('https://example.test/api/crm/users')), true);
});
test('streamed body limit applies without content-length, rejects arrays and counts UTF-8 bytes', async () => {
  const request = body => new Request('https://example.test/', { method: 'POST', body });
  assert.deepEqual(await readJson(request('{"ok":true}'), 20), { ok: true });
  await assert.rejects(readJson(request('{"text":"' + 'ş'.repeat(10) + '"}'), 20), RangeError);
  await assert.rejects(readJson(request('[]')), SyntaxError);
  await assert.rejects(readJson(request('null')), SyntaxError);
  await assert.rejects(readJson(request('{')), SyntaxError);
  let canceled = false;
  const stream = new ReadableStream({ pull(controller) { controller.enqueue(new Uint8Array(64)); }, cancel() { canceled = true; } });
  await assert.rejects(readJson(new Request('https://example.test/', { method: 'POST', body: stream, duplex: 'half' }), 100), RangeError);
  assert.equal(canceled, true);
});
test('rate identities are keyed hashes; assurance is parsed without accepting malformed tokens', () => {
  const key = rateLimitKey('telegram:123456789', 'secret');
  assert.match(key, /^[a-f0-9]{64}$/); assert.ok(!key.includes('123456789'));
  assert.notEqual(key, rateLimitKey('telegram:123456789', 'other'));
  assert.equal(jwtAssurance('bad'), null);
  assert.equal(jwtAssurance('header.' + Buffer.from('{"aal":"aal2"}').toString('base64url') + '.signature'), 'aal2');
});
test('production CSP limits scripts with a nonce, blocks framing and external data destinations', () => {
  const csp = crmCsp('random-nonce', 'https://example.supabase.co', false);
  assert.match(csp, /'nonce-random-nonce'/); assert.match(csp, /'strict-dynamic'/);
  assert.ok(!csp.includes("'unsafe-eval'")); assert.ok(!csp.includes("script-src 'unsafe-inline'"));
  assert.match(csp, /frame-ancestors 'none'/); assert.match(csp, /object-src 'none'/);
  assert.ok(!csp.includes('https:;')); assert.ok(csp.includes('https://example.supabase.co'));
});
