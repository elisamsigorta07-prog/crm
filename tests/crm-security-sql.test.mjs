import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

test('PostgreSQL security allows password-only staff, denies anonymous/wrong-scope access and enforces atomic limits', async () => {
  const db = new PGlite();
  const owner = '11111111-1111-4111-8111-111111111111';
  const staff = '22222222-2222-4222-8222-222222222222';
  const stranger = '33333333-3333-4333-8333-333333333333';
  try {
    await db.exec(`
      create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth; create schema storage;
      grant usage on schema public, auth, storage to anon, authenticated, service_role;
      create table auth.users(id uuid primary key, raw_app_meta_data jsonb, raw_user_meta_data jsonb);
      create table auth.mfa_factors(id uuid default gen_random_uuid(), user_id uuid, status text);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.uid', true), '')::uuid $$;
      create function auth.role() returns text language sql stable as $$ select nullif(current_setting('request.role', true), '') $$;
      create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt', true), ''), '{}')::jsonb $$;
      create table public.app_users(id text primary key, username text, password text not null);
      insert into public.app_users values ('legacy', 'example@example.test', 'SYNTHETIC-OLD-PASSWORD');
      create table storage.buckets(id text primary key, public boolean);
      insert into storage.buckets values ('policy-documents', true), ('telegram-bot-state', false), ('unrelated', false);
      create table storage.objects(id text primary key, bucket_id text);
      insert into storage.objects values ('pdf', 'policy-documents'), ('other', 'unrelated');
      alter table storage.objects enable row level security;
      create policy old_broad_storage on storage.objects for all to anon, authenticated using (true) with check (true);
      grant all on storage.objects to anon, authenticated, service_role;
      create function public.legacy_dangerous_rpc() returns integer language sql security definer as $$ select 42 $$;
    `);
    for (const table of ['customers', 'policies', 'cari_movements', 'financial_transactions', 'rent_vehicles', 'rent_customers', 'rent_bookings', 'rent_cari_movements', 'rentals']) {
      await db.exec(`create table public.${table}(id text primary key, value text); insert into public.${table} values ('original', 'SYNTHETIC-DATA'); alter table public.${table} enable row level security; create policy old_open_access on public.${table} for all using (true) with check (true); grant all on public.${table} to anon, authenticated, service_role;`);
    }
    await db.exec('grant all on public.app_users to anon, authenticated, service_role');
    await db.query('insert into auth.users values ($1, $2, $3), ($4, $5, $3), ($6, $7, $8)', [owner, { crm_workspace: 'elisam', crm_staff: true, crm_role: 'admin' }, {}, staff, { crm_workspace: 'elisam', crm_staff: true, crm_role: 'staff', crm_scopes: ['insurance'] }, stranger, {}, { crm_workspace: 'elisam', crm_staff: true, crm_role: 'admin' }]);
    await db.query("insert into auth.mfa_factors(user_id,status) values ($1,'verified'),($2,'verified'),($3,'verified')", [owner, staff, stranger]);
    const sql = await readFile(new URL('../supabase/migrations/20261102000100_crm_security.sql', import.meta.url), 'utf8');
    await db.exec(sql);
    // Upgrade an already installed mandatory-MFA helper without touching data
    // or replacing the policies that call it.
    await db.exec("create or replace function crm_private.has_access(p_scope text) returns boolean language sql stable security definer set search_path = '' as $$ select false $$");
    const optional = await readFile(new URL('../supabase/migrations/20261103000100_optional_crm_mfa.sql', import.meta.url), 'utf8');
    await db.exec(optional);
    await db.exec(optional);
    await db.query("select set_config('request.uid',$1,false), set_config('request.jwt','{\"aal\":\"aal1\"}',false)", [owner]);
    assert.equal((await db.query("select crm_private.has_access('insurance') as allowed")).rows[0].allowed, true, 'small follow-up migration enables password-only access for existing policies');
    // Applying twice must not reopen access or break audit triggers.
    await db.exec(sql);
    async function identity(role, user = '', aal = 'aal1') {
      await db.exec('reset role');
      await db.query("select set_config('request.uid',$1,false), set_config('request.role',$2,false), set_config('request.jwt',$3,false)", [user, role, JSON.stringify({ aal })]);
      await db.exec('set role ' + role);
    }
    await identity('anon');
    for (const table of ['app_users', 'customers', 'policies', 'cari_movements', 'financial_transactions', 'rent_customers', 'rent_vehicles', 'rent_bookings', 'rent_cari_movements', 'rentals']) {
      await assert.rejects(db.query(`select * from public.${table}`), /permission denied/);
      await assert.rejects(db.query(`insert into public.${table}(id) values ('intruder')`), /permission denied/);
    }
    await assert.rejects(db.query('select public.legacy_dangerous_rpc()'), /permission denied/);
    assert.deepEqual((await db.query('select id from storage.objects')).rows, [{ id: 'other' }]);
    await identity('authenticated', owner, 'aal1');
    assert.equal((await db.query('select * from policies')).rows.length, 1, 'password-only administrator can read policies');
    await identity('authenticated', stranger, 'aal2');
    assert.equal((await db.query('select * from policies')).rows.length, 0, 'user_metadata must not grant access');
    await assert.rejects(db.query("insert into policies values ('unauthorized','bad')"), /row-level security/);
    await identity('authenticated', staff, 'aal1');
    assert.equal((await db.query('select * from policies')).rows.length, 1);
    assert.equal((await db.query('select * from rent_customers')).rows.length, 0, 'insurance staff must not access rent data');
    await db.query("insert into policies values ('staff-record','allowed')");
    await assert.rejects(db.query('select password from app_users'), /permission denied/);
    await assert.rejects(db.query('select * from crm_private.audit_events'), /permission denied/);
    await assert.rejects(db.query("select public.crm_consume_rate_limit(repeat('a',64),3,60)"), /permission denied/);
    // Revocation reads auth.users, even if the caller still has an old aal2 JWT.
    await db.exec('reset role');
    await db.query("update auth.users set raw_app_meta_data = raw_app_meta_data || '{\"crm_disabled\":true}' where id=$1", [staff]);
    await identity('authenticated', staff, 'aal2');
    assert.equal((await db.query('select * from policies')).rows.length, 0);
    await identity('authenticated', owner, 'aal2');
    assert.equal((await db.query('select * from rent_customers')).rows.length, 1);
    await db.query("update policies set value='UPDATED' where id='original'");
    await db.query("delete from policies where id='staff-record'");
    await db.exec('reset role');
    const events = await db.query('select actor,operation from crm_private.audit_events order by id');
    assert.deepEqual(events.rows.map(e => e.operation), ['INSERT', 'UPDATE', 'DELETE']);
    assert.equal(events.rows[0].actor, staff);
    assert.equal(events.rows[1].actor, owner);
    assert.match((await db.query('select password from app_users')).rows[0].password, /^retired:/);
    assert.equal((await db.query("select public from storage.buckets where id='policy-documents'")).rows[0].public, false);
    await db.query('delete from auth.mfa_factors where user_id=$1', [owner]);
    await identity('authenticated', owner, 'aal2');
    assert.equal((await db.query('select * from policies')).rows.length, 1, 'MFA enrollment is optional for authorized users');
    await identity('service_role');
    const responses = await Promise.all(Array.from({ length: 10 }, () => db.query("select public.crm_consume_rate_limit(repeat('a',64),3,60) as allowed")));
    assert.equal(responses.filter(r => r.rows[0].allowed).length, 3, 'concurrent requests must obey the atomic limit');
    assert.ok((await db.query('select * from policies')).rows.length > 0, 'server bot access must remain available');
  } finally { await db.close(); }
});
