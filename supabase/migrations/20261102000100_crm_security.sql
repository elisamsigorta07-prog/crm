-- Apply as the Supabase project database owner, in one transaction.
-- This closes anonymous access immediately. The old deployed CRM will need the
-- updated Auth client and MFA flow before it can access business records again.
begin;

create schema if not exists crm_private;
revoke all on schema crm_private from public, anon, authenticated;
grant usage on schema crm_private to authenticated, service_role;

-- Consult live server-controlled membership, rather than stale JWT roles or
-- user-editable user_metadata. Password-authenticated staff can use the CRM;
-- MFA enrollment is optional and is not required by the data policies.
create or replace function crm_private.has_access(p_scope text)
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select
    u.raw_app_meta_data ->> 'crm_workspace' = 'elisam'
    and u.raw_app_meta_data ->> 'crm_staff' = 'true'
    and coalesce(u.raw_app_meta_data ->> 'crm_disabled', 'false') <> 'true'
    and (u.raw_app_meta_data ->> 'crm_role' = 'admin'
      or coalesce(u.raw_app_meta_data -> 'crm_scopes', '["insurance"]'::jsonb) ? p_scope)
    from auth.users u where u.id = (select auth.uid())), false);
$$;
revoke all on function crm_private.has_access(text) from public, anon, authenticated;
grant execute on function crm_private.has_access(text) to authenticated, service_role;

-- Do not copy customer records to a log. Only record actor, table, row identity,
-- action and timestamp. The log itself is not exposed through the Data API.
create table if not exists crm_private.audit_events (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null default statement_timestamp(),
  actor uuid,
  source_role text,
  table_name text not null,
  operation text not null,
  row_id text
);
revoke all on crm_private.audit_events from public, anon, authenticated;
grant select on crm_private.audit_events to service_role;
create or replace function crm_private.audit_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare entry jsonb;
begin
  if tg_op = 'DELETE' then entry := to_jsonb(old); else entry := to_jsonb(new); end if;
  insert into crm_private.audit_events(actor, source_role, table_name, operation, row_id)
  values (auth.uid(), auth.role(), tg_table_name, tg_op, entry ->> 'id');
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
revoke all on function crm_private.audit_change() from public, anon, authenticated;

-- Include legacy/unused tables and views in the deny-by-default baseline.
revoke all on all tables in schema public from public, anon, authenticated;

do $$
declare item record; old_policy record;
begin
  for item in select * from (values
    ('customers', 'insurance'), ('policies', 'insurance'), ('cari_movements', 'insurance'), ('financial_transactions', 'insurance'),
    ('rent_vehicles', 'rent'), ('rent_customers', 'rent'), ('rent_bookings', 'rent'), ('rent_cari_movements', 'rent'), ('rentals', 'rent')
  ) as required(table_name, scope_name)
  loop
    if to_regclass('public.' || item.table_name) is null then
      raise exception 'Required CRM table missing: %', item.table_name;
    end if;
    execute format('alter table public.%I enable row level security', item.table_name);
    execute format('alter table public.%I force row level security', item.table_name);
    -- Permissive legacy policies would otherwise OR with the restrictive rules.
    for old_policy in select policyname from pg_policies where schemaname = 'public' and tablename = item.table_name loop
      execute format('drop policy %I on public.%I', old_policy.policyname, item.table_name);
    end loop;
    execute format('revoke all on public.%I from public, anon, authenticated', item.table_name);
    execute format('grant select, insert, update, delete on public.%I to authenticated', item.table_name);
    execute format('grant all on public.%I to service_role', item.table_name);
    execute format('create policy crm_staff_access on public.%I for all to authenticated using ((select crm_private.has_access(%L))) with check ((select crm_private.has_access(%L)))', item.table_name, item.scope_name, item.scope_name);
    execute format('drop trigger if exists crm_security_audit on public.%I', item.table_name);
    execute format('create trigger crm_security_audit after insert or update or delete on public.%I for each row execute function crm_private.audit_change()', item.table_name);
  end loop;
end $$;

-- Retire the legacy credential table. Browser clients (including administrators)
-- have no rights to this table. Auth stores the actual password hashes.
alter table public.app_users enable row level security;
alter table public.app_users force row level security;
do $$ declare item record; begin
  for item in select policyname from pg_policies where schemaname = 'public' and tablename = 'app_users' loop
    execute format('drop policy %I on public.app_users', item.policyname);
  end loop;
end $$;
revoke all on public.app_users from public, anon, authenticated;
grant all on public.app_users to service_role;
-- Old passwords are not retained or moved into a second plaintext archive.
update public.app_users set password = 'retired:' || gen_random_uuid()::text
where password not like 'retired:%';

-- A restrictive rule also neutralizes any unrelated permissive storage policy
-- for these two private buckets. Signed service-issued transfers still work.
update storage.buckets set public = false where id in ('policy-documents', 'telegram-bot-state');
drop policy if exists crm_private_buckets_server_only on storage.objects;
create policy crm_private_buckets_server_only on storage.objects as restrictive
for all to anon, authenticated
using (bucket_id not in ('policy-documents', 'telegram-bot-state'))
with check (bucket_id not in ('policy-documents', 'telegram-bot-state'));

-- Prevent old security-definer RPCs from becoming a route around the new RLS.
-- The app currently uses no browser RPC. Trigger functions continue to work.
do $$ declare item record; begin
  for item in select p.oid::regprocedure as signature from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.prokind = 'f'
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', item.signature);
    execute format('grant execute on function %s to service_role', item.signature);
  end loop;
end $$;

create table if not exists crm_private.rate_limits (
  key_hash text not null,
  window_start bigint not null,
  hits integer not null,
  touched_at timestamptz not null default statement_timestamp(),
  primary key (key_hash, window_start)
);
revoke all on crm_private.rate_limits from public, anon, authenticated;
create index if not exists crm_rate_limits_touched_idx on crm_private.rate_limits(touched_at);
create or replace function public.crm_consume_rate_limit(p_key text, p_limit integer, p_seconds integer)
returns boolean language plpgsql security definer set search_path = '' as $$
declare bucket bigint; current_hits integer;
begin
  if auth.role() is distinct from 'service_role' then raise exception 'Not authorized'; end if;
  if p_key !~ '^[0-9a-f]{64}$' or p_limit < 1 or p_limit > 1000 or p_seconds < 1 or p_seconds > 3600 then raise exception 'Invalid limit'; end if;
  bucket := floor(extract(epoch from statement_timestamp()) / p_seconds)::bigint * p_seconds;
  insert into crm_private.rate_limits(key_hash, window_start, hits) values (p_key, bucket, 1)
  on conflict (key_hash, window_start) do update set hits = crm_private.rate_limits.hits + 1, touched_at = statement_timestamp()
  where crm_private.rate_limits.hits < p_limit + 1
  returning hits into current_hits;
  delete from crm_private.rate_limits where touched_at < statement_timestamp() - interval '2 days';
  return coalesce(current_hits <= p_limit, false);
end;
$$;
revoke all on function public.crm_consume_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.crm_consume_rate_limit(text, integer, integer) to service_role;

-- Keep future objects closed by default. New app tables need an explicit grant
-- and RLS policy migration rather than inheriting anonymous access.
alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public revoke execute on functions from public, anon, authenticated;
notify pgrst, 'reload schema';
commit;
