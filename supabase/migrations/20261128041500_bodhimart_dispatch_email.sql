create function public.bodhimart_enqueue_dispatch_email()
returns trigger language plpgsql security definer set search_path = pg_catalog, public
as $$
begin
  insert into public.bodhimart_order_alert_outbox
    (order_id, user_id, audience, channel, reference)
  values (new.id, new.customer_user_id, 'buyer', 'email',
    'out-for-delivery:' || new.order_number)
  on conflict do nothing;
  return new;
end;
$$;

revoke all on function public.bodhimart_enqueue_dispatch_email() from public, anon, authenticated;

create trigger bodhimart_enqueue_dispatch_email
after update of order_status on public.marketplace_orders
for each row
when (old.order_status is distinct from new.order_status
  and new.order_status = 'OUT_FOR_DELIVERY'
  and new.customer_user_id is not null)
execute function public.bodhimart_enqueue_dispatch_email();
