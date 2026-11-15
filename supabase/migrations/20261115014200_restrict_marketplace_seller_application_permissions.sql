REVOKE ALL PRIVILEGES ON TABLE public.marketplace_seller_applications FROM authenticated;
GRANT SELECT ON TABLE public.marketplace_seller_applications TO authenticated;
GRANT INSERT (
  user_id, shop_name, owner_name, mobile, email, address,
  pan_number, gstin, upi_id, business_type, shop_photo_url
) ON TABLE public.marketplace_seller_applications TO authenticated;
