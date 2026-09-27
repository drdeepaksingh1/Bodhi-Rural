-- Allow an authenticated active seller to start preparation for their accepted order.
create or replace function public.seller_start_marketplace_order_processing(
  p_seller_order_id uuid
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_status text;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required to update an order.';
  end if;

  select so.status
    into v_status
    from public.marketplace_seller_orders so
    join public.marketplace_sellers s on s.id = so.seller_id
   where so.id = p_seller_order_id
     and s.user_id = auth.uid()
     and s.status = 'ACTIVE'
   for update of so;

  if not found then
    raise exception 'This order is not available to your active seller account.';
  end if;

  if v_status <> 'ACCEPTED' then
    raise exception 'Only accepted orders can be moved to processing.';
  end if;

  update public.marketplace_seller_orders
     set status = 'PROCESSING'
   where id = p_seller_order_id
     and status = 'ACCEPTED';

  if not found then
    raise exception 'The order status changed. Refresh and try again.';
  end if;
end;
$function$;

revoke all on function public.seller_start_marketplace_order_processing(uuid) from public;
revoke all on function public.seller_start_marketplace_order_processing(uuid) from anon;
grant execute on function public.seller_start_marketplace_order_processing(uuid) to authenticated;
