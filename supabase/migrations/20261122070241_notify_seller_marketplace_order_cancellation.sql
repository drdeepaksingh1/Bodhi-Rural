-- Tell each seller when a customer cancels the seller's unaccepted order.
create or replace function public.notify_marketplace_seller_order_cancelled()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
begin
  if old.status is distinct from 'PLACED' or new.status <> 'CANCELLED' then
    return new;
  end if;

  insert into public.marketplace_notifications (
    user_id,
    notification_type,
    title,
    message,
    order_id,
    seller_order_id
  )
  select
    s.user_id,
    'ORDER_CANCELLED',
    'Customer cancelled an order',
    'Order ' || new.seller_order_number || ' was cancelled before you accepted it.',
    new.order_id,
    new.id
  from public.marketplace_sellers s
  where s.id = new.seller_id
    and s.user_id is not null;

  return new;
end;
$function$;

revoke all on function public.notify_marketplace_seller_order_cancelled()
  from public, anon, authenticated;

drop trigger if exists trg_marketplace_seller_order_cancelled_notification
  on public.marketplace_seller_orders;

create trigger trg_marketplace_seller_order_cancelled_notification
  after update of status on public.marketplace_seller_orders
  for each row
  when (old.status is distinct from new.status and new.status = 'CANCELLED')
  execute function public.notify_marketplace_seller_order_cancelled();
