-- Only needed separately if the earlier security migration was already applied.
-- Keep live staff/scope checks; remove only the mandatory MFA condition.
begin;
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
notify pgrst, 'reload schema';
commit;
