alter table public.marketplace_seller_applications
  add column shop_latitude double precision,
  add column shop_longitude double precision;

-- Existing applications can still be reviewed without a historical GPS record.
create function public.require_bodhimart_shop_gps()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  if new.shop_latitude is null or new.shop_longitude is null
     or not (new.shop_latitude between -90 and 90)
     or not (new.shop_longitude between -180 and 180) then
    raise exception 'Valid shop GPS coordinates are required.' using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke all on function public.require_bodhimart_shop_gps() from public;

create trigger bodhimart_require_shop_gps
before insert or update of shop_latitude, shop_longitude
on public.marketplace_seller_applications
for each row execute function public.require_bodhimart_shop_gps();
