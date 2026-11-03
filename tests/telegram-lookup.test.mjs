import test from 'node:test';
import assert from 'node:assert/strict';
import { expiringLookup, foldLookup, lookupDate, searchLookup } from '../src/lib/server/telegramLookupCore.ts';
import { formatPolicy } from '../src/lib/server/telegramCore.ts';
const customers = [
  { id: 'C1', name: 'IŞIL İNAN', identity_no: '11111111110' },
  { id: 2, name: 'ÖZGÜR ŞAHİN', identity_no: '22222222220' },
  { id: 'C3', name: 'ÖRNEK ŞİRKET', identity_no: '123 456 7890' },
  { id: 'C4', name: 'YALNIZ MÜŞTERİ', identity_no: '99999999990' },
  { id: 'C5', name: 'IŞIL İNAN', identity_no: '66666666660' },
];
const policies = [
  { id: 'P1', policy_no: 'POL-2026/001', customer_id: 'C1', customer_name: 'IŞIL İNAN', customer_tc: '', end_date: '05.12.2026' },
  { id: 'P2', policy_no: 'POL-2026/002', customer_id: 'C1', customer_name: 'Eski yazım', customer_tc: '11111111110', end_date: '03.02.2027' },
  { id: 'P3', policy_no: 'TRF123', customer_id: '2', customer_name: 'ÖZGÜR ŞAHİN', customer_tc: '22222222220', end_date: '2026-11-03' },
  { id: 'P4', policy_no: 'AB 12-34', customer_id: 'C3', customer_name: 'ÖRNEK ŞİRKET', customer_tc: '1234567890', end_date: '14/01/2027' },
  { id: 'P5', policy_no: 'OTHER', customer_id: 'C5', customer_name: 'IŞIL İNAN', customer_tc: '66666666660', end_date: '05.11.2026' },
  { id: 'P6', policy_no: 'OLD456', customer_id: 'missing', customer_name: 'Özgür', customer_tc: '22222222220', end_date: '31.02.2026' },
];
const ids = rows => rows.map(r => r.id);
test('Turkish case, omitted accents and reversed name tokens preserve matches', () => {
  assert.equal(foldLookup('IŞIL İNAN'), 'isil inan');
  for (const query of ['IŞIL İNAN', 'ışıl inan', 'isil inan', 'İNAN IŞIL']) assert.deepEqual(ids(searchLookup(policies, customers, query)), ['P5', 'P1', 'P2']);
  assert.deepEqual(ids(searchLookup(policies, customers, 'ozgur sahin')), ['P3', 'P6']);
});
test('TC resolves via the customer card even when a policy TC is blank', () => {
  assert.deepEqual(ids(searchLookup(policies, customers, '11111111110')), ['P1', 'P2']);
  assert.deepEqual(ids(searchLookup(policies, customers, '111 111 111 10')), ['P1', 'P2']);
  assert.ok(!ids(searchLookup(policies, customers, '11111111110')).includes('P5'), 'same names with different identities must not merge');
});
test('10 digit tax identifiers and formatted values are supported', () => {
  for (const query of ['1234567890', '123 456 7890', '123-456-7890']) assert.deepEqual(ids(searchLookup(policies, customers, query)), ['P4']);
});
test('policy number separators can be omitted and all linked policies are returned', () => {
  assert.deepEqual(ids(searchLookup(policies, customers, 'POL2026001')), ['P1', 'P2']);
  assert.deepEqual(ids(searchLookup(policies, customers, 'AB1234')), ['P4']);
});
test('a customer without a policy still returns its card for name and identity', () => {
  for (const query of ['Yalnız Müşteri', 'yalniz musteri', '99999999990']) assert.deepEqual(searchLookup(policies, customers, query), [{ kind: 'customer', id: 'C4', customerId: 'C4' }]);
  assert.deepEqual(searchLookup(policies, customers, 'no such customer'), []);
  const chunks = formatPolicy({ id: 'customer:C4', record_kind: 'customer', policy_no: null, customer_name: 'Yalnız Müşteri', type: null, company: null, end_date: null, customer: { name: 'Yalnız Müşteri', identity_no: '99999999990', phone: 'SYNTHETIC' } });
  assert.match(chunks.join(''), /Müşteri kartı/); assert.ok(!chunks.join('').includes('record_kind'));
});
test('numeric customer IDs and missing links can be enriched by a unique exact identity', () => {
  const result = searchLookup(policies, customers, '22222222220');
  assert.deepEqual(result.map(r => r.customerId), ['2', '2']);
});
test('dotted, slash and ISO dates compare chronologically with inclusive boundaries', () => {
  assert.equal(lookupDate('5.12.2026'), '2026-12-05');
  assert.equal(lookupDate('03/02/2027'), '2027-02-03');
  assert.equal(lookupDate('2026-11-03T00:00:00Z'), '2026-11-03');
  assert.equal(lookupDate('31.02.2026'), null);
  assert.equal(lookupDate('2026-13-01'), null);
  assert.deepEqual(ids(expiringLookup(policies, customers, '2026-11-03', '2027-02-03')), ['P3', 'P5', 'P1', 'P4', 'P2']);
  assert.deepEqual(ids(expiringLookup(policies, customers, '2026-12-05', '2026-12-05')), ['P1']);
});
test('all matched results remain available for subsequent pagination', () => {
  const many = Array.from({ length: 22 }, (_, i) => ({ id: 'P' + i, policy_no: 'N' + i, customer_id: 'C1', customer_name: 'IŞIL İNAN', end_date: '01.01.2027' }));
  assert.equal(searchLookup(many, customers, '11111111110').filter(r => r.kind === 'policy').length, 22);
});
