-- Allow active sellers to change the optional photo on their own listings.
grant update (image_url) on public.marketplace_products to authenticated;
