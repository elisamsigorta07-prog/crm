import test from 'node:test';
import assert from 'node:assert/strict';
import { claimStorageRateSlot } from '../src/lib/server/storageRateLimitCore.ts';
const key = 'a'.repeat(64);
function store() {
  const files = new Map();
  return { files, async upload(path, data, options) {
    assert.equal(options.upsert, false);
    await Promise.resolve();
    if (files.has(path)) return { error: { statusCode: '409' } };
    files.set(path, data); return { error: null };
  } };
}
test('SQL-free slots enforce the limit under concurrent requests and reset by window', async () => {
  const storage = store();
  const responses = await Promise.all(Array.from({ length: 30 }, () => claimStorageRateSlot(storage, key, 5, 60, 60000)));
  assert.equal(responses.filter(Boolean).length, 5); assert.equal(storage.files.size, 5);
  assert.equal(await claimStorageRateSlot(storage, key, 5, 60, 120000), true);
  assert.equal(await claimStorageRateSlot(storage, 'b'.repeat(64), 5, 60, 60000), true);
});
test('storage failures and malformed paths never produce an unlimited fallback', async () => {
  await assert.rejects(claimStorageRateSlot({ upload: async () => ({ error: { statusCode: '403' } }) }, key, 5, 60));
  await assert.rejects(claimStorageRateSlot(store(), '../bad', 5, 60));
  await assert.rejects(claimStorageRateSlot(store(), key, 0, 60));
});
