import { randomInt } from 'node:crypto';

type SlotStorage = { upload(path: string, body: string, options: { contentType: string; upsert: boolean; cacheControl: string }): Promise<{ error: unknown }> };

/** Fixed, immutable slots shared across server instances. No SQL migration is
 * needed; Storage's upsert=false is the atomic claim. Fail closed on errors. */
export async function claimStorageRateSlot(storage: SlotStorage, key: string, limit: number, seconds: number, now = Date.now()) {
  if (!/^[a-f0-9]{64}$/.test(key) || !Number.isInteger(limit) || limit < 1 || limit > 1000 || !Number.isInteger(seconds) || seconds < 1 || seconds > 3600) throw new Error('Invalid rate limit.');
  const window = Math.floor(now / (seconds * 1000));
  const prefix = `rate-limits/${key}/${seconds}-${String(window).padStart(12, '0')}`;
  const start = randomInt(limit);
  const body = JSON.stringify({ expiresAt: (window + 1) * seconds * 1000 });
  for (let offset = 0; offset < limit; offset++) {
    const result = await storage.upload(`${prefix}/${(start + offset) % limit}.json`, body, { contentType: 'application/json', upsert: false, cacheControl: '0' });
    if (!result.error) return true;
    const error = result.error;
    if (typeof error !== 'object' || error === null || !('statusCode' in error) || Number(error.statusCode) !== 409) throw new Error('Rate limit storage unavailable.');
  }
  return false;
}
