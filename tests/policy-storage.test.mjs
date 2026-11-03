import test from 'node:test';
import assert from 'node:assert/strict';
import { isCrmStaff, isCrmAdmin } from '../src/lib/crmAccess.ts';
import { originalFilename, policyFolder, signUploadTicket, validatePolicyId, validateUploadInfo, verifyUploadTicket, versionName } from '../src/lib/server/policyStorageCore.ts';

const userId = '11111111-1111-4111-8111-111111111111';
const now = 1700000000000;
const ticket = { purpose: 'policy-upload-v1', userId, policyId: 'POL/00001', filename: 'Örnek poliçe.pdf', size: 100, temporaryPath: `incoming/${userId}/22222222-2222-4222-8222-222222222222.pdf`, revision: null, expires: now + 60_000 };

test('only server-controlled staff metadata grants file access', () => {
  assert.equal(isCrmStaff(null), false);
  assert.equal(isCrmStaff({ app_metadata: { crm_workspace: 'other', crm_staff: true } }), false);
  assert.equal(isCrmStaff({ app_metadata: {}, user_metadata: { crm_workspace: 'elisam', crm_staff: true } }), false);
  assert.equal(isCrmStaff({ app_metadata: { crm_workspace: 'elisam', crm_staff: true } }), true);
  assert.equal(isCrmAdmin({ app_metadata: { crm_workspace: 'elisam', crm_staff: true, crm_role: 'staff' } }), false);
});

test('signed upload permits only the same account and untampered contents', () => {
  const token = signUploadTicket(ticket, 'private-test-key');
  assert.deepEqual(verifyUploadTicket(token, userId, 'private-test-key', now), ticket);
  assert.throws(() => verifyUploadTicket(token, 'other-user', 'private-test-key', now));
  assert.throws(() => verifyUploadTicket(token, userId, 'wrong-key', now));
  assert.throws(() => verifyUploadTicket(token, userId, 'private-test-key', now + 61_000));
  assert.throws(() => verifyUploadTicket(token + '.extra', userId, 'private-test-key', now));
});

test('even signed payloads cannot point to another folder', () => {
  const token = signUploadTicket({ ...ticket, temporaryPath: 'policies/somewhere/private.pdf' }, 'private-test-key');
  assert.throws(() => verifyUploadTicket(token, userId, 'private-test-key', now));
});

test('Unicode filenames survive private versioned storage and IDs never become raw paths', () => {
  const name = versionName('Örnek poliçe (1).PDF', userId, now);
  assert.equal(originalFilename(name), 'Örnek poliçe (1).PDF');
  assert.equal(originalFilename('arbitrary.pdf'), null);
  assert.equal(policyFolder('../özel/müşteri').includes('..'), false);
  assert.equal(policyFolder('POL/00001'), policyFolder('POL/00001'));
  assert.notEqual(policyFolder('POL/00001'), policyFolder('POL/00002'));
});

test('file and policy inputs reject scripts, traversal and oversized bodies', () => {
  assert.throws(() => validateUploadInfo('script.html', 100));
  assert.throws(() => validateUploadInfo('../secret.pdf', 100));
  assert.throws(() => validateUploadInfo('policy.pdf', 21 * 1024 * 1024));
  assert.throws(() => validateUploadInfo('policy.pdf', 0));
  assert.throws(() => validatePolicyId(''));
  assert.throws(() => validatePolicyId('id\nheader'));
});
