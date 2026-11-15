-- Issue #62: remove unnecessary anonymous privileges from private application,
-- farmer, operational, and marketplace tables.
--
-- RLS policies remain the row-level authorization boundary for authenticated
-- users. This migration does not widen authenticated access.
--
-- Public catalog tables retain SELECT only; their existing RLS policies limit
-- rows to active/public catalog data. Public marketplace views are unchanged.

REVOKE ALL PRIVILEGES ON TABLE
  public.bird_batches,
  public.egg_production,
  public.farmer_applications,
  public.farmers,
  public.farms,
  public.feed_records,
  public.locations,
  public.marketplace_cart_items,
  public.marketplace_carts,
  public.marketplace_customer_addresses,
  public.marketplace_seller_applications,
  public.notifications,
  public.orders,
  public.roles,
  public.staff_application_approvals,
  public.staff_application_documents,
  public.staff_applications,
  public.vaccinations,
  public.veterinary_records
FROM anon;

-- These tables intentionally support anonymous storefront browsing. Remove
-- the excessive write/reference privileges and restore SELECT only.
REVOKE ALL PRIVILEGES ON TABLE
  public.marketplace_categories,
  public.marketplace_product_images,
  public.product_categories,
  public.products
FROM anon;

GRANT SELECT ON TABLE
  public.marketplace_categories,
  public.marketplace_product_images,
  public.product_categories,
  public.products
TO anon;

-- Prevent future tables created by either application migration owner from
-- inheriting broad anonymous table privileges by default. Any future public
-- endpoint must grant only the specific privileges it requires.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON TABLES FROM anon;

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public
  REVOKE ALL ON TABLES FROM anon;
