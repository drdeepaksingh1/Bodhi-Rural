create or replace function public.seller_mark_marketplace_order_dispatched(p_seller_order_id uuid)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_order_id uuid;
  v_status text;
  v_delivery_method text;
begin
  if auth.uid() is null then raise exception 'Authentication is required to update an order.'; end if;
  if p_seller_order_id is null then raise exception 'A seller order is required.'; end if;
  select so.order_id into v_order_id
  from public.marketplace_seller_orders so
  join public.marketplace_sellers s on s.id = so.seller_id
  where so.id = p_seller_order_id and s.user_id = auth.uid() and s.status = 'ACTIVE';
  if not found then raise exception 'This order is not available to your active seller account.'; end if;
  perform 1 from public.marketplace_orders o where o.id = v_order_id for update;
  if not found then raise exception 'This order is no longer available.'; end if;
  select so.status, o.delivery_method into v_status, v_delivery_method
  from public.marketplace_seller_orders so
  join public.marketplace_sellers s on s.id = so.seller_id
  join public.marketplace_orders o on o.id = so.order_id
  where so.id = p_seller_order_id and s.user_id = auth.uid() and s.status = 'ACTIVE'
  for update of so;
  if not found then raise exception 'This order is not available to your active seller account.'; end if;
  if v_delivery_method is null or v_delivery_method = 'PICKUP' then raise exception 'Only delivery orders can be marked dispatched.'; end if;
  if v_status <> 'READY_FOR_DISPATCH' then raise exception 'Only ready-for-dispatch orders can be marked dispatched.'; end if;
  update public.marketplace_seller_orders set status = 'DISPATCHED', updated_at = now()
  where id = p_seller_order_id and status = 'READY_FOR_DISPATCH';
  if not found then raise exception 'The order status changed. Refresh and try again.'; end if;
  if not exists (select 1 from public.marketplace_seller_orders so where so.order_id = v_order_id and so.status not in ('DISPATCHED', 'DELIVERED', 'CANCELLED', 'RETURNED')) then
    update public.marketplace_orders set order_status = 'DISPATCHED', updated_at = now()
    where id = v_order_id and order_status not in ('CANCELLED', 'RETURNED', 'REFUNDED', 'DELIVERED');
  end if;
end;
$function$;
revoke all on function public.seller_mark_marketplace_order_dispatched(uuid) from public;
revoke all on function public.seller_mark_marketplace_order_dispatched(uuid) from anon;
grant execute on function public.seller_mark_marketplace_order_dispatched(uuid) to authenticated;