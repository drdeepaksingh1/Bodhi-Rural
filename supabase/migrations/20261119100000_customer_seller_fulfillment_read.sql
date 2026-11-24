-- Let a customer see fulfillment status for seller packages in their own orders.
drop policy if exists "Customers view seller fulfillment for own orders"
  on public.marketplace_seller_orders;

create policy "Customers view seller fulfillment for own orders"
  on public.marketplace_seller_orders
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.marketplace_orders o
      where o.id = marketplace_seller_orders.order_id
        and o.customer_user_id = (select auth.uid())
    )
  );
