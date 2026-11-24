-- Let sellers know when their marketplace listing status changes.
create or replace function public.notify_marketplace_seller_product_status()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_user_id uuid;
  v_notification_type text;
  v_title text;
  v_message text;
begin
  if old.status is not distinct from new.status then
    return new;
  end if;

  select s.user_id
    into v_user_id
  from public.marketplace_sellers s
  where s.id = new.seller_id;

  if v_user_id is null then
    return new;
  end if;

  if new.status = 'ACTIVE' then
    v_notification_type := 'PRODUCT_APPROVED';
    v_title := 'Product listing approved';
    v_message := 'Your product "' || new.name || '" was approved for the BodhiMart catalogue.';
  elsif new.status in ('PENDING', 'SUBMITTED') then
    v_notification_type := 'PRODUCT_IN_REVIEW';
    v_title := 'Product changes need review';
    v_message := 'Your product "' || new.name || '" is waiting for BodhiMart admin review and will not appear in the public catalogue until approved.';
  elsif new.status = 'INACTIVE' then
    v_notification_type := 'PRODUCT_INACTIVE';
    v_title := 'Product listing is inactive';
    v_message := 'Your product "' || new.name || '" is inactive and is not listed in the public catalogue.';
  else
    return new;
  end if;

  insert into public.marketplace_notifications (
    user_id,
    notification_type,
    title,
    message
  ) values (
    v_user_id,
    v_notification_type,
    v_title,
    v_message
  );

  return new;
end;
$function$;

revoke all on function public.notify_marketplace_seller_product_status()
  from public, anon, authenticated;

drop trigger if exists trg_marketplace_product_status_notification
  on public.marketplace_products;

create trigger trg_marketplace_product_status_notification
  after update of status on public.marketplace_products
  for each row
  when (old.status is distinct from new.status)
  execute function public.notify_marketplace_seller_product_status();

