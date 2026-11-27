create function public.bodhimart_require_delivery_pin()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  if new.delivery_method in ('STANDARD', 'EXPRESS')
    and coalesce(btrim(new.delivery_address_snapshot ->> 'pincode'), '') !~ '^[1-9][0-9]{5}$'
  then
    raise exception 'A valid six-digit delivery PIN code is required.' using errcode = '22023';
  end if;
  return new;
end;
$$;

revoke all on function public.bodhimart_require_delivery_pin() from public, anon, authenticated;

create trigger bodhimart_require_delivery_pin
before insert on public.marketplace_orders
for each row execute function public.bodhimart_require_delivery_pin();
