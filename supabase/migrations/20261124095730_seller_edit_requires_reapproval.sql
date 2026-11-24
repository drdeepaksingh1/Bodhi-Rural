-- Send changed seller listing content back through the admin approval flow.
-- The public catalogue only includes ACTIVE products, so these edits are hidden
-- until an administrator reviews and approves the updated content.
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
    new.created_by := auth.uid();
    new.approved_by := null;
    new.approved_at := null;
    return new;
  end if;

  if new.id is distinct from old.id
     or new.product_id is distinct from old.product_id
     or new.seller_id is distinct from old.seller_id
     or new.created_by is distinct from old.created_by
     or new.created_at is distinct from old.created_at then
    raise exception 'Sellers cannot change product identity, ownership, or creation metadata.';
  end if;

  if new.status is distinct from old.status
     or new.approved_by is distinct from old.approved_by
     or new.approved_at is distinct from old.approved_at then
    raise exception 'Only an active SUPER_ADMIN can change product listing status or approval metadata.';
  end if;

  if row(
       new.sku,
       new.category_id,
       new.name,
       new.slug,
       new.image_url,
       new.image_gallery,
       new.description,
       new.brand,
       new.unit,
       new.weight,
       new.mrp,
       new.selling_price,
       new.tax_percent,
       new.minimum_order_quantity,
       new.maximum_order_quantity,
       new.delivery_available
     ) is distinct from row(
       old.sku,
       old.category_id,
       old.name,
       old.slug,
       old.image_url,
       old.image_gallery,
       old.description,
       old.brand,
       old.unit,
       old.weight,
       old.mrp,
       old.selling_price,
       old.tax_percent,
       old.minimum_order_quantity,
       old.maximum_order_quantity,
       old.delivery_available
     ) then
    new.status := 'PENDING';
    new.approved_by := null;
    new.approved_at := null;
  end if;

  return new;
end;
$function$;

revoke all on function public.enforce_marketplace_product_admin_status() from public;
revoke all on function public.enforce_marketplace_product_admin_status() from anon;
revoke all on function public.enforce_marketplace_product_admin_status() from authenticated;
