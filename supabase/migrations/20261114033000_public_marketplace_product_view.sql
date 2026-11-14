-- Expose only shopper-facing fields to public catalogue clients.
-- Internal approval and creator metadata remain available only through the base table's RLS.
create or replace view public.marketplace_public_products
with (security_barrier = true)
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
join public.marketplace_sellers s on s.id = p.seller_id
where p.status = 'ACTIVE'
  and s.status = 'ACTIVE';

comment on view public.marketplace_public_products is
  'Public BodhiMart catalogue projection. Excludes seller ownership and internal approval metadata.';

revoke all on public.marketplace_public_products from public;
grant select on public.marketplace_public_products to anon, authenticated;

-- Anonymous shoppers must use the limited public view, not the underlying table.
revoke all on public.marketplace_products from anon;
revoke select (
  id,
  product_id,
  sku,
  seller_id,
  category_id,
  name,
  slug,
  description,
  brand,
  unit,
  weight,
  mrp,
  selling_price,
  tax_percent,
  minimum_order_quantity,
  maximum_order_quantity,
  delivery_available,
  status,
  created_by,
  approved_by,
  approved_at,
  created_at,
  updated_at
) on public.marketplace_products from anon;
