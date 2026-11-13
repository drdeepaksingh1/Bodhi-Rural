-- Restrict marketplace product visibility changes to the Bodhi super administrator.
-- Product and inventory ownership remain unchanged; this function only toggles listing status.
create or replace function public.admin_set_marketplace_product_status(
  p_product_id uuid,
  p_status text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_updated_count integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required.';
  end if;

  if not exists (
    select 1
    from public.profiles p
    join public.roles r on r.id = p.role_id
    where p.id = auth.uid()
      and p.is_active = true
      and r.code = 'SUPER_ADMIN'
  ) then
    raise exception 'Only an active Bodhi super administrator can change marketplace product visibility.';
  end if;

  if p_status is null or p_status not in ('ACTIVE', 'INACTIVE') then
    raise exception 'Only ACTIVE or INACTIVE status is permitted.';
  end if;

  update public.marketplace_products
  set status = p_status,
      approved_by = case
        when p_status = 'ACTIVE' then auth.uid()
        else approved_by
      end,
      approved_at = case
        when p_status = 'ACTIVE' then coalesce(approved_at, now())
        else approved_at
      end,
      updated_at = now()
  where id = p_product_id;

  get diagnostics v_updated_count = row_count;
  if v_updated_count = 0 then
    raise exception 'Marketplace product was not found.';
  end if;
end;
$function$;

revoke all on function public.admin_set_marketplace_product_status(uuid, text) from public;
revoke all on function public.admin_set_marketplace_product_status(uuid, text) from anon;
grant execute on function public.admin_set_marketplace_product_status(uuid, text) to authenticated;

-- Enforce listing approval at the database boundary as well as in the seller UI.
-- Authenticated sellers cannot create ACTIVE listings or change listing status.
-- The admin RPC above runs with the active SUPER_ADMIN user's auth.uid().
create or replace function public.enforce_marketplace_product_admin_status()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_is_super_admin boolean := false;
begin
  if auth.uid() is null then
    return new;
  end if;

  select exists (
    select 1
    from public.profiles p
    join public.roles r on r.id = p.role_id
    where p.id = auth.uid()
      and p.is_active = true
      and r.code = 'SUPER_ADMIN'
  ) into v_is_super_admin;

  if v_is_super_admin then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.status := 'PENDING';
    new.approved_by := null;
    new.approved_at := null;
    return new;
  end if;

  if new.status is distinct from old.status
     or new.approved_by is distinct from old.approved_by
     or new.approved_at is distinct from old.approved_at then
    raise exception 'Only an active SUPER_ADMIN can change product listing status or approval metadata.';
  end if;

  return new;
end;
$function$;

revoke all on function public.enforce_marketplace_product_admin_status() from public;
revoke all on function public.enforce_marketplace_product_admin_status() from anon;
revoke all on function public.enforce_marketplace_product_admin_status() from authenticated;

drop trigger if exists marketplace_products_enforce_admin_status
  on public.marketplace_products;

create trigger marketplace_products_enforce_admin_status
before insert or update on public.marketplace_products
for each row
execute function public.enforce_marketplace_product_admin_status();
