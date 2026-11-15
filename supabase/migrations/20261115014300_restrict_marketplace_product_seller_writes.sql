REVOKE ALL PRIVILEGES ON TABLE public.marketplace_products FROM authenticated;
GRANT SELECT ON TABLE public.marketplace_products TO authenticated;
GRANT INSERT (
  seller_id, category_id, sku, name, slug, description, brand, unit,
  weight, mrp, selling_price, tax_percent, minimum_order_quantity,
  maximum_order_quantity, delivery_available
) ON TABLE public.marketplace_products TO authenticated;
GRANT UPDATE (
  category_id, sku, name, slug, description, brand, unit, weight,
  mrp, selling_price, tax_percent, minimum_order_quantity,
  maximum_order_quantity, delivery_available, updated_at
) ON TABLE public.marketplace_products TO authenticated;
