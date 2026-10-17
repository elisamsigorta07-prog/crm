begin;

alter table public.cari_movements
  add column if not exists deleted_at timestamptz;

create index if not exists cari_movements_deleted_at_idx
  on public.cari_movements (deleted_at)
  where deleted_at is not null;

comment on column public.cari_movements.deleted_at is
  'Soft-delete timestamp. Deleted finance movements remain recoverable in the CRM trash.';

create or replace function public.soft_delete_cari_movement()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  update public.cari_movements
  set deleted_at = coalesce(old.deleted_at, statement_timestamp())
  where id = old.id;

  return null;
end;
$$;

revoke all on function public.soft_delete_cari_movement() from public;

drop trigger if exists cari_movements_prevent_hard_delete on public.cari_movements;
create trigger cari_movements_prevent_hard_delete
  before delete on public.cari_movements
  for each row
  execute function public.soft_delete_cari_movement();

commit;
