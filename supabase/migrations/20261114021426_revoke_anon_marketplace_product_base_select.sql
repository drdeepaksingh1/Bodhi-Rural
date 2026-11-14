-- Public shoppers now read the restricted marketplace_public_products view.
-- Remove anonymous access to the underlying table and its internal metadata.
revoke all on public.marketplace_products from anon;
