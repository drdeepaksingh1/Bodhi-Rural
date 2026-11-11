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
