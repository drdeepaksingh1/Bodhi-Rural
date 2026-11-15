-- Remove authenticated DML grants that have no matching RLS policy.
-- These tables remain managed through authorized server-side workflows or service roles.
REVOKE INSERT, UPDATE, DELETE ON TABLE
  public.locations,
  public.marketplace_categories,
  public.marketplace_product_images,
  public.notifications,
  public.orders,
  public.product_categories,
  public.products,
  public.roles,
  public.vaccinations
FROM authenticated;

-- Keep applicant document creation, but prevent direct mutation/removal.
REVOKE UPDATE, DELETE ON TABLE public.staff_application_documents FROM authenticated;

-- Application deletion must remain controlled by retention/admin workflows.
REVOKE DELETE ON TABLE public.staff_applications FROM authenticated;

-- Production records have no authenticated DELETE policies.
REVOKE DELETE ON TABLE
  public.egg_production,
  public.feed_records,
  public.veterinary_records
FROM authenticated;
