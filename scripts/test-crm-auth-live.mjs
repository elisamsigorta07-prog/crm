import { createClient } from '@supabase/supabase-js';
import { randomBytes, randomUUID } from 'node:crypto';
import { testMfaSession } from './lib/test-mfa.mjs';
import { jwtAssurance } from '../src/lib/server/securityCore.ts';
process.loadEnvFile('.env.local');
const opts = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, opts);
const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, opts);
const email = 'mfa-security-test-' + randomUUID() + '@example.invalid';
const password = randomBytes(40).toString('base64url');
let ownId;
function check(ok, text) { if (!ok) throw new Error(text); }
try {
  // No CRM metadata is granted. This disposable identity cannot become staff.
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  check(!created.error && created.data.user, 'Disposable Auth account creation failed.');
  ownId = created.data.user.id;
  const login = await client.auth.signInWithPassword({ email, password });
  check(!login.error && login.data.session, 'Disposable sign-in failed.');
  check(jwtAssurance(login.data.session.access_token) === 'aal1', 'Password session did not use aal1.');
  const token = await testMfaSession(client);
  check(jwtAssurance(token) === 'aal2', 'TOTP session did not use aal2.');
  const verified = await admin.auth.getUser(token);
  check(!verified.error && verified.data.user.id === ownId, 'Server-side session verification failed.');
  const factors = await admin.auth.admin.mfa.listFactors({ userId: ownId });
  check(!factors.error && factors.data.factors.some(f => f.status === 'verified'), 'Verified factor not visible to server.');
  check(verified.data.user.app_metadata.crm_staff !== true, 'MFA unexpectedly granted CRM staff permissions.');
  console.log('PASS: real Supabase password login is aal1; disposable TOTP enrollment and verification produce aal2; server verifies the factor and MFA alone does not grant CRM privileges.');
} finally {
  if (ownId) {
    const target = await admin.auth.admin.getUserById(ownId);
    check(target.data.user?.email === email && email.startsWith('mfa-security-test-'), 'Disposable cleanup ownership check failed.');
    const removed = await admin.auth.admin.deleteUser(ownId);
    check(!removed.error, 'Disposable Auth cleanup failed.');
  }
  console.log('Disposable identity and MFA factor removed. Real users, passwords and business records were not changed.');
}
