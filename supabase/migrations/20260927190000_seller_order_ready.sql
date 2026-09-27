-- Keep pickup readiness distinct from dispatch in the seller order status.
alter table public.marketplace_seller_orders
  drop constraint if exists marketplace_seller_orders_status_check;

alter table public.marketplace_seller_orders
  add constraint marketplace_seller_orders_status_check
  check (status = any (array[
    'PLACED'::text,
    'ACCEPTED'::text,
    'PROCESSING'::text,
    'PACKED'::text,
    'READY'::text,
    'READY_FOR_DISPATCH'::text,
    'DISPATCHED'::text,
    'DELIVERED'::text,
    'CANCELLED'::text,
    'RETURNED'::text
  ]));

-- Only the owning active seller can mark a packed order ready.
-- Pickup orders use READY; delivery orders use READY_FOR_DISPATCH.
create or replace function public.seller_mark_marketplace_order_ready(
  p_seller_order_id uuid
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_status text;
  v_delivery_method text;
  v_next_status text;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required to update an order.';
  end if;

  select so.status, o.delivery_method
    into v_status, v_delivery_method
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

  if v_status <> 'PACKED' then
    raise exception 'Only packed orders can be marked ready.';
  end if;

  v_next_status := case
    when v_delivery_method = 'PICKUP' then 'READY'
    else 'READY_FOR_DISPATCH'
  end;

  update public.marketplace_seller_orders
     set status = v_next_status
   where id = p_seller_order_id
     and status = 'PACKED';

  if not found then
    raise exception 'The order status changed. Refresh and try again.';
  end if;
end;
$function$;

revoke all on function public.seller_mark_marketplace_order_ready(uuid) from public;
revoke all on function public.seller_mark_marketplace_order_ready(uuid) from anon;
grant execute on function public.seller_mark_marketplace_order_ready(uuid) to authenticated;
