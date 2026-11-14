-- The platform default privileges can grant more than SELECT on newly created views.
-- Explicitly restrict the public catalogue projection to read-only access.
revoke all on public.marketplace_public_products from public, anon, authenticated;
grant select on public.marketplace_public_products to anon, authenticated;
