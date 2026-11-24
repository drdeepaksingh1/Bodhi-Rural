-- Let customers cancel unpaid orders before any seller starts fulfilment.
-- Inventory restoration, order state changes, and the audit record are atomic.
create or replace function public.customer_cancel_marketplace_order(
  p_order_id uuid
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_user_id uuid := auth.uid();
  v_order_number text;
  v_order_status text;
  v_payment_status text;
  v_seller_order_count integer;
  v_product_count integer;
  v_restored_product_count integer;
begin
  if v_user_id is null then
    raise exception 'Authentication is required to cancel an order.';
  end if;

  if p_order_id is null then
    raise exception 'An order is required.';
  end if;

  select o.order_number, o.order_status, o.payment_status
    into v_order_number, v_order_status, v_payment_status
  from public.marketplace_orders o
  where o.id = p_order_id
    and o.customer_user_id = v_user_id
  for update;

  if not found then
    raise exception 'This order is not available to your account.';
  end if;

  if v_order_status <> 'PLACED' then
    raise exception 'An order can only be cancelled before fulfilment starts.';
  end if;

  if v_payment_status <> 'PENDING' then
    raise exception 'Only unpaid orders can be cancelled here. Contact BodhiMart support for payment assistance.';
  end if;

  -- Serialize against sellers accepting or preparing any portion of this order.
  perform so.id
  from public.marketplace_seller_orders so
  where so.order_id = p_order_id
  order by so.id
  for update of so;

  select count(*)::integer
    into v_seller_order_count
  from public.marketplace_seller_orders so
  where so.order_id = p_order_id;

  if v_seller_order_count = 0 then
    raise exception 'This order has no seller fulfilment record and cannot be cancelled automatically.';
  end if;

  if exists (
    select 1
    from public.marketplace_seller_orders so
    where so.order_id = p_order_id
      and so.status <> 'PLACED'
  ) then
    raise exception 'A seller has started this order. Contact BodhiMart support for help.';
  end if;

  select count(*)::integer
    into v_product_count
  from (
    select oi.product_id
    from public.marketplace_order_items oi
    where oi.order_id = p_order_id
    group by oi.product_id
  ) ordered_products;

  if v_product_count = 0 then
    raise exception 'This order has no items to return to stock.';
  end if;

  update public.marketplace_inventory i
  set stock_quantity = i.stock_quantity + ordered_products.quantity,
      updated_at = now()
  from (
    select oi.product_id, sum(oi.quantity) as quantity
    from public.marketplace_order_items oi
    where oi.order_id = p_order_id
    group by oi.product_id
  ) ordered_products
  where i.product_id = ordered_products.product_id;

  get diagnostics v_restored_product_count = row_count;
  if v_restored_product_count <> v_product_count then
    raise exception 'Inventory could not be restored for every item. The cancellation was not completed.';
  end if;

  update public.marketplace_seller_orders
  set status = 'CANCELLED'
  where order_id = p_order_id
    and status = 'PLACED';

  update public.marketplace_orders
  set order_status = 'CANCELLED', updated_at = now()
  where id = p_order_id
    and order_status = 'PLACED';

  if not found then
    raise exception 'The order status changed. Refresh and try again.';
  end if;

  insert into public.audit_logs (
    user_id, action, table_name, record_id, old_data, new_data
  ) values (
    v_user_id,
    'MARKETPLACE_ORDER_CANCELLED',
    'marketplace_orders',
    p_order_id,
    jsonb_build_object(
      'order_number', v_order_number,
      'order_status', v_order_status,
      'payment_status', v_payment_status
    ),
    jsonb_build_object(
      'order_number', v_order_number,
      'order_status', 'CANCELLED',
      'payment_status', v_payment_status,
      'inventory_restored', true,
      'items', (
        select jsonb_agg(
          jsonb_build_object(
            'product_id', item_summary.product_id,
            'product_name', item_summary.product_name_snapshot,
            'quantity', item_summary.quantity
          )
          order by item_summary.product_name_snapshot
        )
        from (
          select oi.product_id, oi.product_name_snapshot, sum(oi.quantity) as quantity
          from public.marketplace_order_items oi
          where oi.order_id = p_order_id
          group by oi.product_id, oi.product_name_snapshot
        ) item_summary
      )
    )
  );
end;
$function$;

revoke all on function public.customer_cancel_marketplace_order(uuid)
  from public, anon, authenticated;
grant execute on function public.customer_cancel_marketplace_order(uuid)
  to authenticated;

comment on function public.customer_cancel_marketplace_order(uuid) is
  'Cancels the authenticated customer’s unpaid order before seller fulfilment, restores its inventory, and records an audit entry.';
