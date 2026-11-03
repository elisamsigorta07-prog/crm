import test from 'node:test';
import assert from 'node:assert/strict';
import { makeGrant, validPairing, isPaired, telegramId, privateMessage, safeEqual, searchTerm, expiryRange, formatPolicy, handleBotUpdate } from '../src/lib/server/telegramCore.ts';

const id = '123456789';
const other = '987654321';
function update(text, user = id) { return { update_id: 1, message: { text, from: { id: Number(user), is_bot: false }, chat: { id: Number(user), type: 'private' } } }; }
function callback(key, user = id) { return { update_id: 2, callback_query: { id: 'callback_1', data: `act:${key}`, from: { id: Number(user), is_bot: false }, message: { chat: { id: Number(user), type: 'private' } } } }; }
function fixture(active = true) {
  const invitation = makeGrant(id, 'Personel', 'crm-admin');
  let grant = invitation.grant;
  let session = active ? { generation: grant.generation, pairedAt: new Date().toISOString() } : null;
  let storedAction = null;
  const calls = { searches: [], expiries: [], sent: [], results: [], pdfs: [], acks: [], pairs: 0 };
  const rows = [{ id: 'policy1', policy_no: 'POL123', customer_name: 'Örnek Kişi', type: 'Trafik', company: 'Şirket', end_date: '2027-01-31' }];
  const deps = {
    grant: async user => user === id ? grant : null,
    session: async user => user === id ? session : null,
    pair: async () => { calls.pairs++; session = { generation: grant.generation, pairedAt: new Date().toISOString() }; },
    logout: async () => { session.revoked = true; },
    search: async (term, offset) => { calls.searches.push({ term, offset }); return rows; },
    expiring: async offset => { calls.expiries.push(offset); return rows; },
    send: async (user, text) => calls.sent.push({ user, text }),
    results: async (...args) => calls.results.push(args),
    action: async () => storedAction,
    pdf: async (...args) => calls.pdfs.push(args),
    ack: async key => calls.acks.push(key),
  };
  return { invitation, calls, deps, rows, revoke() { grant = { ...grant, enabled: false, generation: 'revoked' }; }, rotate() { grant = makeGrant(id, 'Personel', 'crm-admin').grant; }, setAction(action) { storedAction = action; }, get grant() { return grant; }, get session() { return session; } };
}

test('numeric identity and constant-time secret comparison reject malformed inputs', () => {
  for (const value of ['@admin', '-100123', '01', '1/2', 1.5, Number.MAX_SAFE_INTEGER + 1, null]) assert.throws(() => telegramId(value));
  assert.equal(telegramId(123456789), id);
  assert.equal(safeEqual('secret', 'secret'), true);
  assert.equal(safeEqual('secret', 'Secret'), false);
  assert.equal(safeEqual('', 'secret'), false);
});
test('personal code belongs only to the intended identity, expires and is stored as a hash', () => {
  const { grant, code } = makeGrant(id, 'Personel', 'admin', 1000);
  assert.equal(code.length, 32);
  assert.ok(!JSON.stringify(grant).includes(code));
  assert.equal(validPairing(grant, id, code, 1001), true);
  assert.equal(validPairing(grant, other, code, 1001), false);
  assert.equal(validPairing(grant, id, code, grant.expiresAt), false);
  assert.equal(validPairing({ ...grant, enabled: false }, id, code, 1001), false);
  assert.equal(validPairing(grant, id, code.slice(1), 1001), false);
});
test('groups, forged sender/chat identities, forwarded messages and bot senders are ignored', () => {
  for (const mutate of [u => u.message.chat.type = 'group', u => u.message.chat.id = Number(other), u => u.message.from.is_bot = true, u => u.message.forward_origin = { type: 'user' }, u => u.message.via_bot = { id: 1 }, u => u.update_id = -1]) {
    const u = update('Poliçe sorgula'); mutate(u); assert.equal(privateMessage(u), null);
  }
  const u = callback('A'.repeat(32)); u.callback_query.message.chat.type = 'supergroup';
  assert.equal(privateMessage(u), null);
});
test('unpaired or different accounts never query policies or PDF data', async () => {
  for (const u of [update('/ara TEST', other), update('11111111110'), update('Bitişi yaklaşan poliçeler')]) {
    const f = fixture(false); await handleBotUpdate(u, f.deps);
    assert.equal(f.calls.searches.length + f.calls.expiries.length + f.calls.pdfs.length, 0);
    assert.match(f.calls.sent[0].text, /Erişim yetkin yok/);
  }
});
test('identity discovery needs no grant and contains no CRM information', async () => {
  const f = fixture(false); await handleBotUpdate(update('/kimlik', other), f.deps);
  assert.match(f.calls.sent[0].text, new RegExp(other)); assert.equal(f.calls.searches.length, 0);
});
test('code pairs once, rotation and logout invalidate the previous generation', async () => {
  const f = fixture(false);
  await handleBotUpdate(update('/eslestir ' + f.invitation.code), f.deps);
  assert.equal(f.calls.pairs, 1); assert.equal(isPaired(f.grant, f.session), true);
  await handleBotUpdate(update('/eslestir ' + f.invitation.code), f.deps);
  assert.equal(f.calls.pairs, 1);
  await handleBotUpdate(update('Erişimi kapat'), f.deps);
  assert.equal(isPaired(f.grant, f.session), false);
  await handleBotUpdate(update('/eslestir ' + f.invitation.code), f.deps);
  assert.equal(f.calls.pairs, 1);
  f.rotate(); assert.equal(isPaired(f.grant, f.session), false);
});
test('query button prompts; TC, Turkish name and policy number work without PDF', async () => {
  const f = fixture(); await handleBotUpdate(update('Poliçe sorgula'), f.deps);
  assert.equal(f.calls.searches.length, 0);
  for (const term of ['11111111110', 'Özgür Şahin', 'POL-123/456']) await handleBotUpdate(update(term), f.deps);
  assert.deepEqual(f.calls.searches.map(s => s.term), ['11111111110', 'Özgür Şahin', 'POL-123/456']);
  assert.equal(f.calls.results.length, 3); assert.equal(f.calls.pdfs.length, 0);
});
test('unsafe filter input is rejected while apostrophes and Turkish letters are allowed', () => {
  assert.equal(searchTerm("O'NEIL ŞAHİN"), "O'NEIL ŞAHİN");
  for (const term of ['ab', '%,id.gt.0', 'name(foo)', 'test"', '_%', 'a\nb']) assert.throws(() => searchTerm(term));
});
test('expiry button always scans the next three calendar months in Istanbul time', async () => {
  const f = fixture(); await handleBotUpdate(update('Bitişi yaklaşan poliçeler'), f.deps);
  assert.deepEqual(f.calls.expiries, [0]);
  assert.deepEqual(expiryRange(new Date('2026-11-02T12:00:00Z')), { first: '2026-11-02', last: '2027-02-02' });
  assert.deepEqual(expiryRange(new Date('2026-01-30T22:00:00Z')), { first: '2026-01-31', last: '2026-04-30' });
  assert.deepEqual(expiryRange(new Date('2027-11-30T12:00:00Z')), { first: '2027-11-30', last: '2028-02-29' });
});
test('PDF callback is bound to the paired user, generation and expiry', async () => {
  const key = 'A'.repeat(32); const f = fixture();
  const good = { kind: 'pdf', policyId: 'POL/0001', telegramId: id, generation: f.grant.generation, expiresAt: Date.now() + 50000 };
  for (const action of [{ ...good, telegramId: other }, { ...good, generation: 'old' }, { ...good, expiresAt: 1 }]) {
    f.setAction(action); await handleBotUpdate(callback(key), f.deps); assert.equal(f.calls.pdfs.length, 0);
  }
  f.setAction(good); await handleBotUpdate(callback(key), f.deps);
  assert.deepEqual(f.calls.pdfs[0], [id, 'POL/0001', good.generation]);
  f.revoke(); await handleBotUpdate(callback(key), f.deps); assert.equal(f.calls.pdfs.length, 1);
});
test('pagination preserves original query and offset, including expiry pages', async () => {
  const f = fixture(); const key = 'A'.repeat(32);
  for (const query of [{ kind: 'search', term: 'Özgür Şahin', offset: 5 }, { kind: 'expiring', term: '', offset: 10 }]) {
    f.setAction({ kind: 'page', telegramId: id, generation: f.grant.generation, expiresAt: Date.now() + 50000, query });
    await handleBotUpdate(callback(key), f.deps);
  }
  assert.deepEqual(f.calls.searches[0], { term: 'Özgür Şahin', offset: 5 });
  assert.deepEqual(f.calls.expiries, [10]);
});
test('revocation while query runs prevents result delivery', async () => {
  const f = fixture(); f.deps.search = async () => { f.revoke(); return f.rows; };
  await handleBotUpdate(update('Özgür Şahin'), f.deps); assert.equal(f.calls.results.length, 0);
});
test('details preserve full registered data and split long text without breaking Unicode', () => {
  const row = { id: 'internal-id', policy_no: 'POL123', customer_name: 'Özgür Şahin', type: 'Trafik', company: 'Şirket', end_date: '2027-01-31', customer_tc: '11111111110', premium: 1234, remaining_amount: 0, notes: '🛡️'.repeat(3000), customer: { id: 'private-id', name: 'Özgür Şahin', phone: '05000000000', address: 'Kayıtlı adres', email: 'test@example.com' } };
  const chunks = formatPolicy(row); const text = chunks.join('');
  assert.ok(chunks.length > 1); assert.ok(chunks.every(c => c.length <= 3400));
  assert.match(text, /Kalan: 0/); assert.match(text, /TC \/ VKN: 11111111110/); assert.match(text, /Kayıtlı adres/); assert.match(text, /test@example.com/);
  assert.ok(text.includes(row.notes)); assert.ok(!text.includes('internal-id')); assert.ok(!text.includes('private-id'));
  for (const chunk of chunks) assert.ok(!/[\ud800-\udbff]$/.test(chunk));
});
