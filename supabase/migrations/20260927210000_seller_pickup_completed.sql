-- Record customer pickup for a ready pickup order.
-- Payment status is intentionally left unchanged; fulfillment and payment are separate.
create or replace function public.seller_mark_marketplace_order_picked_up(
  p_seller_order_id uuid
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_status text;
  v_order_id uuid;
  v_delivery_method text;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required to update an order.';
  end if;

  select so.status, so.order_id, o.delivery_method
    into v_status, v_order_id, v_delivery_method
    from public.marketplace_seller_orders so
    join public.marketplace_sellers s on s.id = so.seller_id
    join public.marketplace_orders o on o.id = so.order_id
   where so.id = p_seller_order_id
     and s.user_id = auth.uid()
     and s.status = 'ACTIVE'
   for update of so;

  if not found then
    raise exception 'This order is not available to your active seller account.';
  end if;

  if v_status <> 'READY' or v_delivery_method <> 'PICKUP' then
    raise exception 'Only pickup orders marked ready can be recorded as picked up.';
  end if;

  -- Serialize completion checks for seller portions of the same customer order.
  perform 1
    from public.marketplace_orders
   where id = v_order_id
   for update;

  update public.marketplace_seller_orders
     set status = 'DELIVERED'
   where id = p_seller_order_id
     and status = 'READY';

  if not found then
    raise exception 'The order status changed. Refresh and try again.';
  end if;

  -- A customer order is delivered only when all seller portions are complete.
  if not exists (
    select 1
      from public.marketplace_seller_orders so
     where so.order_id = v_order_id
       and so.status not in ('DELIVERED', 'CANCELLED', 'RETURNED')
  ) then
    update public.marketplace_orders
       set order_status = 'DELIVERED'
     where id = v_order_id
       and order_status not in ('CANCELLED', 'RETURNED', 'REFUNDED');
  end if;
end;
$function$;

revoke all on function public.seller_mark_marketplace_order_picked_up(uuid) from public;
revoke all on function public.seller_mark_marketplace_order_picked_up(uuid) from anon;
grant execute on function public.seller_mark_marketplace_order_picked_up(uuid) to authenticated;
