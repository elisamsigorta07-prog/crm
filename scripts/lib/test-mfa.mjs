// Only for disposable integration-test accounts, never a real user's factor.
import { createHmac } from 'node:crypto';
function decodeBase32(value) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; let bits = '';
  for (const char of value.toUpperCase().replace(/=+$/, '')) {
    const index = alphabet.indexOf(char); if (index < 0) throw new Error('Invalid test TOTP secret.');
    bits += index.toString(2).padStart(5, '0');
  }
  return Buffer.from(bits.match(/.{8}/g).map(byte => parseInt(byte, 2)));
}
export async function testMfaSession(client) {
  const enrolled = await client.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Disposable security integration test' });
  if (enrolled.error) throw new Error('Disposable test MFA enrollment failed.');
  const counter = Buffer.alloc(8); counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)));
  const digest = createHmac('sha1', decodeBase32(enrolled.data.totp.secret)).update(counter).digest();
  const offset = digest[digest.length - 1] & 15;
  const code = String((digest.readUInt32BE(offset) & 0x7fffffff) % 1000000).padStart(6, '0');
  const verified = await client.auth.mfa.challengeAndVerify({ factorId: enrolled.data.id, code });
  if (verified.error) throw new Error('Disposable test TOTP verification failed.');
  const session = await client.auth.getSession();
  if (!session.data.session) throw new Error('Disposable MFA session missing.');
  return session.data.session.access_token;
}
