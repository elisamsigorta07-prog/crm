// Read-only cloud verification. Never prints customer rows, passwords or keys.
import { createClient } from '@supabase/supabase-js';
process.loadEnvFile('.env.local');
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, options);
const anon = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, options);
const protectedTables = ['app_users', 'customers', 'policies', 'cari_movements', 'financial_transactions', 'rent_vehicles', 'rent_customers', 'rent_bookings', 'rent_cari_movements', 'rentals'];
let unsafe = false;
for (const table of protectedTables) {
  const result = await anon.from(table).select('id', { head: true, count: 'exact' });
  if (result.error && !['42501', 'PGRST301', 'PGRST302'].includes(result.error.code)) throw new Error('Cloud verification failed; no data was printed.');
  const deniedByPrivileges = !!result.error;
  // RLS may legitimately return zero rows, but only denying grants proves that
  // even table existence and aggregate metadata are closed to anonymous clients.
  const visible = !result.error && (result.count ?? 0) > 0;
  console.log(JSON.stringify({ table, anonymousReadDenied: deniedByPrivileges, anonymousRowsVisible: visible }));
  if (visible || table === 'app_users' && !deniedByPrivileges) unsafe = true;
}
const buckets = await admin.storage.listBuckets();
if (buckets.error) throw new Error('Bucket verification failed.');
for (const name of ['policy-documents', 'telegram-bot-state']) {
  const bucket = buckets.data.find(b => b.id === name);
  console.log(JSON.stringify({ bucket: name, private: !!bucket && bucket.public === false }));
  if (!bucket || bucket.public) unsafe = true;
}
const rpc = await anon.rpc('crm_consume_rate_limit', { p_key: 'a'.repeat(64), p_limit: 1, p_seconds: 60 });
console.log(JSON.stringify({ rateLimiterRpcNotCallableAnonymously: !!rpc.error, securityMigrationPresent: rpc.error?.code !== 'PGRST202' }));
if (rpc.error?.code === 'PGRST202' || !rpc.error) unsafe = true;
const accounts = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
if (accounts.error) throw new Error('Account verification failed.');
const staff = accounts.data.users.filter(u => u.app_metadata.crm_workspace === 'elisam' && u.app_metadata.crm_staff === true && u.app_metadata.crm_disabled !== true);
console.log(JSON.stringify({ activeCrmAccounts: staff.length, accountsWithVerifiedMfa: staff.filter(u => u.factors?.some(f => f.status === 'verified')).length }));
if (!staff.length) unsafe = true;
const schema = await fetch(url + '/rest/v1/', { headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY, Authorization: 'Bearer ' + process.env.SUPABASE_SERVICE_ROLE_KEY, Accept: 'application/openapi+json' } });
if (!schema.ok) throw new Error('Schema inventory failed.');
const document = await schema.json();
console.log(JSON.stringify({ exposedRestResources: Object.keys(document.paths || {}).filter(p => p !== '/').sort() }));
if (unsafe) { console.log('ACTION REQUIRED: live security migration and/or account setup is still incomplete. This is not a passing security audit.'); process.exitCode = 1; }
else console.log('PASS: no anonymous business rows visible, legacy credentials closed, buckets private and privileged rate limiter closed to anonymous callers. MFA is optional.');
