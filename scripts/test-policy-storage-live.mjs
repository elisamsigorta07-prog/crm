// Uses only generated PDF bytes and disposable Auth accounts. It never uploads
// a customer's PDF, edits a policy, or deletes an existing customer attachment.
import assert from 'node:assert/strict';
import { randomBytes, randomUUID, createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { originalFilename } from '../src/lib/server/policyStorageCore.ts';
process.loadEnvFile('.env.local');
const base = process.env.CRM_TEST_ORIGIN || 'http://localhost:3000';
const config = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, config);
const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, config);
const accounts = [];
const ownPaths = new Set();
const ownNames = new Set();
let folder;
let bucket;
try {
  const suffix = randomUUID();
  async function account(staff) {
    const email = `storage-smoke-${staff ? 'staff' : 'unprivileged'}-${suffix}@example.invalid`;
    const password = randomBytes(40).toString('base64url');
    const created = await admin.auth.admin.createUser({ email, password, email_confirm: true, app_metadata: staff ? { crm_workspace: 'elisam', crm_staff: true, crm_role: 'staff' } : {} });
    assert.ifError(created.error); accounts.push({ id: created.data.user.id, email });
    const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, config);
    const login = await client.auth.signInWithPassword({ email, password });
    assert.ifError(login.error);
    return { client, token: login.data.session.access_token };
  }
  const staff = await account(true);
  const outsider = await account(false);
  const policies = await admin.from('policies').select('id').limit(10);
  assert.ifError(policies.error); assert.ok(policies.data.length, 'An existing policy is needed; none will be created.');
  bucket = admin.storage.from('policy-documents');
  let policyId;
  for (const policy of policies.data) {
    const candidate = 'policies/' + createHash('sha256').update(policy.id).digest('hex');
    const listed = await bucket.list(candidate);
    assert.ifError(listed.error);
    if (!listed.data.length) { policyId = policy.id; folder = candidate; break; }
  }
  assert.ok(policyId, 'No attachment-free policy found; live test aborted without changing existing attachments.');
  async function call(method, body, token = staff.token, query = '') {
    const response = await fetch(base + '/api/crm/policy-documents' + query, { method, headers: { ...(token ? { Authorization: 'Bearer ' + token } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(30000) });
    const data = await response.json();
    return { status: response.status, data };
  }
  const query = '?policyId=' + encodeURIComponent(policyId);
  assert.equal((await call('GET', undefined, '', query)).status, 401);
  assert.equal((await call('GET', undefined, outsider.token, query)).status, 403);
  assert.equal((await call('GET', undefined, staff.token, query)).status, 200, 'Password-authenticated staff must be allowed without MFA.');
  const pdf = Buffer.from('%PDF-1.4\n% Synthetic CRM storage connectivity test; no customer data.\n%%EOF\n');
  async function upload(name) {
    ownNames.add(name);
    const prepared = await call('POST', { policyId, filename: name, size: pdf.length });
    assert.equal(prepared.status, 200, JSON.stringify(prepared.data));
    ownPaths.add(prepared.data.path);
    const uploaded = await staff.client.storage.from('policy-documents').uploadToSignedUrl(prepared.data.path, prepared.data.token, pdf, { contentType: 'application/pdf' });
    assert.ifError(uploaded.error);
    const finalized = await call('PUT', { ticket: prepared.data.ticket });
    assert.equal(finalized.status, 200, JSON.stringify(finalized.data));
    ownPaths.add(finalized.data.document.path);
    return finalized.data.document;
  }
  const firstName = `Örnek bağlantı testi-${suffix}.pdf`;
  const first = await upload(firstName);
  assert.equal(first.name, firstName);
  assert.equal((await call('POST', { policyId, filename: 'script.html', size: 100 })).status, 400);
  assert.equal((await call('GET', undefined, staff.token, '?policyId=')).status, 400);
  const bad = Buffer.from('Not a PDF. Synthetic validation test only.');
  const invalid = await call('POST', { policyId, filename: 'Invalid-content-test.pdf', size: bad.length });
  assert.equal(invalid.status, 200); ownPaths.add(invalid.data.path);
  assert.ifError((await staff.client.storage.from('policy-documents').uploadToSignedUrl(invalid.data.path, invalid.data.token, bad, { contentType: 'application/pdf' })).error);
  assert.equal((await call('PUT', { ticket: invalid.data.ticket })).status, 400);
  assert.equal((await call('GET', undefined, staff.token, query)).data.document.path, first.path);
  const signed = await call('GET', undefined, staff.token, query + '&action=download');
  assert.equal(signed.status, 200);
  assert.deepEqual(Buffer.from(await (await fetch(signed.data.url)).arrayBuffer()), pdf);
  const secondDevice = await call('GET', undefined, staff.token, query);
  assert.equal(secondDevice.data.document.path, first.path);
  const unauthorizedDownload = await anon.storage.from('policy-documents').download(first.path);
  assert.ok(unauthorizedDownload.error, 'Anonymous download must be denied.');
  const unprivilegedDownload = await outsider.client.storage.from('policy-documents').download(first.path);
  assert.ok(unprivilegedDownload.error, 'Auth alone must not grant raw bucket access.');
  const second = await upload(`İkinci bağlantı testi-${suffix}.pdf`);
  const stillRetained = await bucket.download(first.path);
  assert.ifError(stillRetained.error);
  assert.deepEqual(Buffer.from(await stillRetained.data.arrayBuffer()), pdf);
  assert.equal((await call('DELETE', { policyId, revision: first.revision })).status, 409);
  const removed = await call('DELETE', { policyId, revision: second.revision });
  assert.equal(removed.status, 200);
  ownPaths.add(folder + '/' + removed.data.revision);
  assert.equal((await call('GET', undefined, staff.token, query)).data.document, null);
  console.log('PASS: signed upload, verified finalize, exact-byte download, independent metadata request, retained old version, stale-update rejection and reversible unlink.');
  console.log('PASS: anonymous and unprivileged accounts cannot read the private PDFs.');
  console.log('PASS: invalid filenames and non-PDF contents are rejected without changing the saved attachment.');
} finally {
  // The selected folder was asserted empty before this test. Only its generated
  // test objects and exact incoming paths are eligible for cleanup.
  if (folder && bucket) {
    const listed = await bucket.list(folder);
    if (listed.data) for (const entry of listed.data) if (ownNames.has(originalFilename(entry.name))) ownPaths.add(folder + '/' + entry.name);
  }
  if (ownPaths.size) {
    const result = await admin.storage.from('policy-documents').remove([...ownPaths]);
    assert.ifError(result.error);
  }
  for (const account of accounts) {
    const current = await admin.auth.admin.getUserById(account.id);
    if (current.data.user?.email === account.email && account.email.startsWith('storage-smoke-')) {
      const result = await admin.auth.admin.deleteUser(account.id); assert.ifError(result.error);
    }
  }
  console.log('Disposable test files and Auth accounts cleaned up; no business records were edited.');
}
