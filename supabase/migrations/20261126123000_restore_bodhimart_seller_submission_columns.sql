-- The form supplies these fields. The insert policy limits status to SUBMITTED
-- and checks that the signed-in user owns the application.
grant insert (status, shop_latitude, shop_longitude)
on public.marketplace_seller_applications to authenticated;
