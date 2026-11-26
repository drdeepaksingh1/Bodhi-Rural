-- Browser roles use row-level operations and do not need table-wide maintenance privileges.
revoke truncate, references, trigger on table
  public.marketplace_cart_items,
  public.marketplace_carts,
  public.marketplace_categories,
  public.marketplace_customer_addresses,
  public.marketplace_product_images
from anon, authenticated;
