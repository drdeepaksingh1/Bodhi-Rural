-- Sellers must not create or initialize inventory rows directly.
-- New product inventory is created by the SECURITY DEFINER product-insert trigger.
-- Stock changes remain available through the ownership-checked adjustment RPC.
revoke insert on public.marketplace_inventory from authenticated;

drop policy if exists "Marketplace inventory seller insert"
  on public.marketplace_inventory;
