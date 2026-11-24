-- Store optional seller-provided product photo links for marketplace cards.
alter table public.marketplace_products
  add column if not exists image_url text;

do $migration$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.marketplace_products'::regclass
      and conname = 'marketplace_products_image_url_https_check'
  ) then
    alter table public.marketplace_products
      add constraint marketplace_products_image_url_https_check
      check (
        image_url is null
        or (char_length(image_url) <= 2048 and image_url ~* '^https://')
      );
  end if;
end;
$migration$;

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
  p.created_at,
  p.image_url
from public.marketplace_products p
join public.marketplace_sellers s on s.id = p.seller_id
where p.status = 'ACTIVE'
  and s.status = 'ACTIVE';

comment on view public.marketplace_public_products is
  'Public BodhiMart catalogue projection. Includes optional product photos and excludes seller ownership and internal approval metadata.';

revoke all on public.marketplace_public_products from public;
grant select on public.marketplace_public_products to anon, authenticated;
grant insert (image_url) on public.marketplace_products to authenticated;
