-- Remove unnecessary anonymous DML/table privileges from operational data.
-- RLS already denies anonymous access to these tables; revoking grants makes
-- the API boundary explicit and prevents accidental exposure if policies drift.
revoke all privileges on table
  public.locations,
  public.roles,
  public.marketplace_cart_items,
  public.marketplace_carts,
  public.marketplace_customer_addresses,
  public.notifications,
  public.orders,
  public.staff_application_approvals,
  public.staff_application_documents,
  public.staff_applications,
  public.vaccinations
from anon;

-- These four tables have explicit public SELECT policies for active catalogue
-- data. Preserve only SELECT and remove anonymous INSERT/UPDATE/DELETE and
-- administrative privileges.
revoke all privileges on table
  public.marketplace_categories,
  public.marketplace_product_images,
  public.product_categories,
  public.products
from anon;

grant select on table
  public.marketplace_categories,
  public.marketplace_product_images,
  public.product_categories,
  public.products
to anon;
