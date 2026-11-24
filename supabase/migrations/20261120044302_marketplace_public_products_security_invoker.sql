-- Keep the shopper catalogue readable while applying marketplace row-level security.
-- The private helper already checks that both the listing and its seller are active.
grant select (image_url, image_gallery)
on public.marketplace_products
to anon;

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
  p.created_at,
  p.image_url,
  p.image_gallery
from public.marketplace_products as p
where p.status = 'ACTIVE'
  and private.is_public_marketplace_product(p.id);

comment on view public.marketplace_public_products is
  'Shopper-safe marketplace product fields for active products from active sellers.';

revoke all on public.marketplace_public_products from public, anon, authenticated;
grant select on public.marketplace_public_products to anon, authenticated;
