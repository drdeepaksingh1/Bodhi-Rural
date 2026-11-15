-- Make the public catalogue views execute with caller privileges and RLS.
-- A private boolean helper preserves the active-seller check without granting
-- anonymous access to seller identity or compliance fields.
create schema if not exists private;

create or replace function private.is_public_marketplace_product(p_product_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $function$
  select exists (
    select 1
    from public.marketplace_products p
    join public.marketplace_sellers s on s.id = p.seller_id
    where p.id = p_product_id
      and p.status = 'ACTIVE'
      and s.status = 'ACTIVE'
  );
$function$;

revoke all on function private.is_public_marketplace_product(uuid) from public;
revoke all on function private.is_public_marketplace_product(uuid) from anon;
revoke all on function private.is_public_marketplace_product(uuid) from authenticated;
grant usage on schema private to anon, authenticated;
grant execute on function private.is_public_marketplace_product(uuid) to anon, authenticated;

-- Expose only the calculated available quantity, not raw stock/reserved fields.
alter table public.marketplace_inventory
  add column available_quantity numeric
  generated always as (greatest(stock_quantity - reserved_quantity, 0::numeric)) stored;

drop policy if exists "marketplace active products readable"
  on public.marketplace_products;

create policy "Public can read active marketplace products"
  on public.marketplace_products
  for select
  to anon, authenticated
  using (
    status = 'ACTIVE'
    and private.is_public_marketplace_product(id)
  );

drop policy if exists "Public can read available inventory for active products"
  on public.marketplace_inventory;

create policy "Public can read available inventory for active products"
  on public.marketplace_inventory
  for select
  to anon, authenticated
  using (private.is_public_marketplace_product(product_id));

-- Column-level grants keep seller_id, approval metadata and raw stock fields
-- unavailable to anonymous clients while allowing the invoker views to work.
grant select (
  id, product_id, sku, category_id, name, slug, description, brand, unit,
  weight, mrp, selling_price, tax_percent, minimum_order_quantity,
  maximum_order_quantity, delivery_available, status, created_at
) on public.marketplace_products to anon;

grant select (product_id, available_quantity)
  on public.marketplace_inventory to anon;

create or replace view public.marketplace_public_products
with (security_barrier = true, security_invoker = true)
as
select
  p.id,
  p.product_id,
  p.sku,
  p.category_id,
  p.name,
  p.slug,
  p.description,
  p.brand,
  p.unit,
  p.weight,
  p.mrp,
  p.selling_price,
  p.tax_percent,
  p.minimum_order_quantity,
  p.maximum_order_quantity,
  p.delivery_available,
  p.status,
  p.created_at
from public.marketplace_products p
where p.status = 'ACTIVE';

create or replace view public.marketplace_public_inventory
with (security_barrier = true, security_invoker = true)
as
select
  i.product_id,
  i.available_quantity
from public.marketplace_inventory i;

grant select on public.marketplace_public_products to anon, authenticated;
grant select on public.marketplace_public_inventory to anon, authenticated;
