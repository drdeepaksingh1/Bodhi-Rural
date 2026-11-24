-- Let authenticated sellers create listings through the seller workflow.
-- Row-level security restricts seller_id to the signed-in user's active seller profile.
-- Approval state and audit metadata are assigned by the database trigger.
grant insert (
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
  delivery_available
) on public.marketplace_products to authenticated;