-- Add an in-app alert for each newly placed seller order.
create or replace function public.notify_marketplace_seller_new_order()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
begin
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
    'NEW_ORDER',
    'New customer order',
    'Order ' || new.seller_order_number || ' is waiting for your review.',
    new.order_id,
    new.id
  from public.marketplace_sellers s
  where s.id = new.seller_id
    and s.user_id is not null;

  return new;
end;
$function$;

revoke all on function public.notify_marketplace_seller_new_order()
  from public, anon, authenticated;

drop trigger if exists trg_marketplace_seller_new_order_notification
  on public.marketplace_seller_orders;

create trigger trg_marketplace_seller_new_order_notification
  after insert on public.marketplace_seller_orders
  for each row
  execute function public.notify_marketplace_seller_new_order();
