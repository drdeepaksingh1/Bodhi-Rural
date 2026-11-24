-- Support the admin account's authenticated seller listing flow. The product
-- trigger overwrites this value with auth.uid() for non-admin sellers.
grant insert (created_by) on public.marketplace_products to authenticated;