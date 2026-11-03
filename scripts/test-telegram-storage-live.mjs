// Real Supabase queries/state with a mocked Telegram transport: never messages a person.
import { createClient } from '@supabase/supabase-js';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import ts from 'typescript';
import { randomUUID } from 'node:crypto';
import { makeGrant, handleBotUpdate, formatPolicy, expiryRange } from '../src/lib/server/telegramCore.ts';
import { policyFolder, versionName } from '../src/lib/server/policyStorageCore.ts';
process.loadEnvFile('.env.local');
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
function check(condition, message) { if (!condition) throw new Error(message); }
async function loadServer(relative, substitutions = {}) {
  const absolute = path.resolve(relative);
  let source = (await readFile(absolute, 'utf8')).replace(/import 'server-only';/g, '');
  source = source.replace(/from '([^']+)'/g, (full, specifier) => {
    if (substitutions[specifier]) return `from '${substitutions[specifier]}'`;
    if (specifier.startsWith('@/')) return `from '${pathToFileURL(path.resolve('src', specifier.slice(2) + '.ts')).href}'`;
    if (!specifier.startsWith('.')) return full;
    const target = path.resolve(path.dirname(absolute), specifier + (specifier.endsWith('.ts') ? '' : '.ts'));
    return `from '${pathToFileURL(target).href}'`;
  });
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  // Resolve the package from this workspace when the parent becomes a data URL.
  const pkg = import.meta.resolve('@supabase/supabase-js');
  const resolved = compiled.replace("from '@supabase/supabase-js'", `from '${pkg}'`);
  return 'data:text/javascript;base64,' + Buffer.from(resolved).toString('base64');
}
const adminModule = await loadServer('src/lib/server/supabaseAdmin.ts');
const botModule = await loadServer('src/lib/server/telegramBot.ts', { './supabaseAdmin': adminModule });
const { telegramState, botDependencies } = await import(botModule);
const coreUrl = pathToFileURL(path.resolve('src/lib/server/telegramCore.ts')).href;
const webhookModule = await loadServer('src/app/api/telegram/webhook/route.ts', { '@/lib/server/supabaseAdmin': adminModule, '@/lib/server/telegramCore': coreUrl, '@/lib/server/telegramBot': botModule });
const managementModule = await loadServer('src/app/api/crm/telegram/route.ts', { '@/lib/server/supabaseAdmin': adminModule, '@/lib/server/telegramCore': coreUrl, '@/lib/server/telegramBot': botModule, '@/lib/crmAccess': pathToFileURL(path.resolve('src/lib/crmAccess.ts')).href });
const webhook = await import(webhookModule);
const management = await import(managementModule);
const state = telegramState(admin);
const id = String(80000000000000 + Math.floor(Math.random() * 1000000000));
const { grant, code } = makeGrant(id, 'Disposable bot integration test', 'integration-test');
const owned = [`members/${id}/config.json`, `members/${id}/sessions/${grant.generation}.json`, `members/${id}/sessions/${grant.generation}.logout.json`];
const actionsBefore = new Set();
const sent = [];
const ownedPdfPaths = [];
const originalFetch = globalThis.fetch;
const oldToken = process.env.TELEGRAM_BOT_TOKEN;
const fakeToken = 'INTEGRATION-TEST-NOT-A-REAL-BOT';
process.env.TELEGRAM_BOT_TOKEN = fakeToken;
globalThis.fetch = async (input, init) => {
  if (String(input).startsWith(`https://api.telegram.org/bot${fakeToken}/`)) {
    sent.push({ method: String(input).split('/').at(-1), body: init?.body instanceof FormData ? init.body : JSON.parse(init?.body || '{}') });
    return Response.json({ ok: true, result: { message_id: 1 } });
  }
  return originalFetch(input, init);
};
try {
  check((await webhook.POST(new Request('https://example.invalid/api/telegram/webhook', { method: 'POST', body: '{}' }))).status === 401, 'Webhook accepted a missing secret.');
  check((await webhook.POST(new Request('https://example.invalid/api/telegram/webhook', { method: 'POST', headers: { 'x-telegram-bot-api-secret-token': 'wrong' }, body: '{}' }))).status === 401, 'Webhook accepted a wrong secret.');
  const hookHeaders = { 'x-telegram-bot-api-secret-token': process.env.TELEGRAM_WEBHOOK_SECRET };
  check((await webhook.POST(new Request('https://example.invalid/api/telegram/webhook', { method: 'POST', headers: hookHeaders, body: '{' }))).status === 400, 'Webhook accepted malformed JSON.');
  check((await webhook.POST(new Request('https://example.invalid/api/telegram/webhook', { method: 'POST', headers: hookHeaders, body: JSON.stringify({ update_id: 1, message: { text: 'Poliçe sorgula', from: { id: 1, is_bot: false }, chat: { id: -123, type: 'group' } } }) }))).status === 200, 'Webhook did not safely ignore a group.');
  check(sent.length === 0, 'Ignored webhook sent a message.');
  check((await management.GET(new Request('https://example.invalid/api/crm/telegram'))).status === 401, 'Management accepted an unauthenticated read.');
  check((await management.POST(new Request('https://example.invalid/api/crm/telegram', { method: 'POST', body: JSON.stringify({ action: 'invite', telegramId: id, label: 'Forbidden' }) }))).status === 401, 'Management accepted an unauthenticated invitation.');
  const existing = await state.grant(id); check(!existing, 'Disposable identity unexpectedly exists.');
  const allActions = await admin.storage.from('telegram-bot-state').list('actions', { limit: 1000 });
  if (!allActions.error) for (const item of allActions.data) actionsBefore.add(item.name);
  await state.write(`members/${id}/config.json`, grant);
  const deps = botDependencies(admin);
  const update = text => ({ update_id: 7, message: { text, from: { id: Number(id), is_bot: false }, chat: { id: Number(id), type: 'private' } } });
  await handleBotUpdate(update('/ara TEST-NO-MATCH'), deps);
  check(sent.at(-1).body.text.includes('Erişim yetkin yok'), 'Unpaired account was not rejected.');
  await handleBotUpdate(update('/eslestir ' + code), deps);
  check(!!await state.session(id, grant.generation), 'Real pairing session was not persisted.');
  const downloaded = await anon.storage.from('telegram-bot-state').download(`members/${id}/config.json`);
  check(!!downloaded.error, 'Anonymous access to bot state was possible.');
  const sample = await admin.from('policies').select('id,policy_no,customer_id,customer_tc').limit(1).maybeSingle();
  check(!sample.error, 'Policy schema query failed.');
  if (sample.data?.policy_no && /^[\p{L}\p{N} './-]{3,60}$/u.test(sample.data.policy_no)) {
    const rows = await deps.search(sample.data.policy_no, 0);
    check(rows.length > 0, 'Exact policy lookup found no registered data.');
    check(rows.some(p => String(p.id) === String(sample.data.id) || p.customer_id === sample.data.customer_id), 'Lookup did not return the expected customer.');
    const text = formatPolicy(rows[0]).join('');
    check(text.includes('Poliçe no:'), 'Registered detail formatting failed.');
    if (rows[0].customer_tc && /^\d{11}$/.test(rows[0].customer_tc)) check((await deps.search(rows[0].customer_tc, 0)).length > 0, 'TC lookup failed.');
    await deps.results(id, rows.slice(0, 1), { kind: 'search', term: sample.data.policy_no, offset: 0 }, grant.generation);
    const delivered = sent.find(item => item.body?.reply_markup?.inline_keyboard);
    check(!!delivered, 'PDF action button was not generated for registered data.');
    const callback = delivered.body.reply_markup.inline_keyboard[0][0].callback_data;
    const action = await deps.action(callback.slice(4));
    check(action.telegramId === id && action.generation === grant.generation, 'PDF callback not scoped to the paired user.');
  }
  const expiring = await deps.expiring(0); const range = expiryRange();
  check(expiring.every(row => row.end_date >= range.first && row.end_date <= range.last), 'Expiry rows outside calendar window.');
  await deps.pdf(id, 'NONEXISTENT-TELEGRAM-INTEGRATION-TEST', grant.generation);
  check(sent.at(-1).body.text.includes('artık bulunmuyor'), 'Missing policy PDF did not produce useful feedback.');
  // A synthetic policy identity with a stubbed existence check keeps every real
  // business record and attachment untouched while testing actual Storage bytes.
  const sentinel = 'telegram-test-' + randomUUID();
  const pdfAdmin = { storage: admin.storage, from(table) {
    check(table === 'policies', 'Unexpected PDF lookup table.');
    return { select() { return { eq(column, value) { check(column === 'id' && value === sentinel, 'Unexpected synthetic PDF identity.'); return { maybeSingle: async () => ({ data: { id: sentinel }, error: null }) }; } }; } };
  } };
  const pdfDeps = botDependencies(pdfAdmin);
  await pdfDeps.pdf(id, sentinel, grant.generation);
  check(sent.at(-1).body.text.includes('kayıtlı bulut PDF’si yok'), 'A record without PDF did not produce the expected response.');
  const bytes = Buffer.from('%PDF-1.4\n% Synthetic integration bytes only\n%%EOF\n');
  const name = 'Örnek test poliçesi.pdf';
  const pdfPath = policyFolder(sentinel) + '/' + versionName(name, randomUUID());
  ownedPdfPaths.push(pdfPath);
  const uploaded = await admin.storage.from('policy-documents').upload(pdfPath, bytes, { contentType: 'application/pdf', upsert: false });
  check(!uploaded.error, 'Synthetic private PDF upload failed.');
  await pdfDeps.pdf(id, sentinel, grant.generation);
  const fileMessage = sent.at(-1);
  check(fileMessage.method === 'sendDocument', 'PDF was not sent through the document API.');
  check(fileMessage.body.get('chat_id') === id, 'PDF recipient mismatch.');
  check(fileMessage.body.get('document').name === name, 'Unicode PDF filename was changed.');
  check(Buffer.from(await fileMessage.body.get('document').arrayBuffer()).equals(bytes), 'PDF byte contents changed in transport.');
  const marker = policyFolder(sentinel) + '/' + String(Date.now() + 100).padStart(13, '0') + '-' + randomUUID() + '.deleted.json';
  ownedPdfPaths.push(marker);
  const marked = await admin.storage.from('policy-documents').upload(marker, JSON.stringify({ test: true }), { contentType: 'application/json', upsert: false });
  check(!marked.error, 'Synthetic unlink marker creation failed.');
  await pdfDeps.pdf(id, sentinel, grant.generation);
  check(sent.at(-1).method === 'sendMessage' && sent.at(-1).body.text.includes('kayıtlı bulut PDF’si yok'), 'Unlinked PDF was incorrectly sent.');
  await state.revoke(id, 'integration-test');
  const count = sent.length;
  await deps.results(id, [{ id: 'fake', policy_no: 'TEST' }], { kind: 'search', term: 'TEST', offset: 0 }, grant.generation);
  check(sent.length === count, 'Revoked user received policy results.');
  console.log('PASS: real private bot state, pairing, anonymous denial, registered policy/TC queries, PDF button scoping, three-month query and revocation.');
  console.log('PASS: absent PDF feedback, exact PDF bytes and Turkish filename, removed PDF suppression. Telegram transport was mocked; no real messages sent.');
  console.log('PASS: webhook secret checks, malformed JSON rejection, group suppression and unauthenticated management rejection.');
} finally {
  globalThis.fetch = originalFetch;
  if (oldToken === undefined) delete process.env.TELEGRAM_BOT_TOKEN; else process.env.TELEGRAM_BOT_TOKEN = oldToken;
  const listed = await admin.storage.from('telegram-bot-state').list('actions', { limit: 1000 });
  if (!listed.error) for (const item of listed.data) {
    if (actionsBefore.has(item.name)) continue;
    const action = await state.read(`actions/${item.name}`);
    if (action?.telegramId === id && action?.generation === grant.generation) owned.push(`actions/${item.name}`);
  }
  const removed = await admin.storage.from('telegram-bot-state').remove(owned);
  check(!removed.error, 'Disposable bot state cleanup failed.');
  if (ownedPdfPaths.length) {
    const pdfRemoved = await admin.storage.from('policy-documents').remove(ownedPdfPaths);
    check(!pdfRemoved.error, 'Synthetic PDF cleanup failed.');
  }
  console.log('Disposable bot access records cleaned up. No policy/customer records or PDFs were modified.');
}
