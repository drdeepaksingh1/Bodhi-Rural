-- Ensure every marketplace product has an inventory row.
-- New products start at zero stock and must be stocked explicitly by their seller.
create or replace function public.initialize_marketplace_product_inventory()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
begin
  insert into public.marketplace_inventory (product_id)
  values (new.id)
  on conflict (product_id) do nothing;

  return new;
end;
$function$;

revoke all on function public.initialize_marketplace_product_inventory() from public;
revoke all on function public.initialize_marketplace_product_inventory() from anon;
revoke all on function public.initialize_marketplace_product_inventory() from authenticated;

drop trigger if exists marketplace_products_create_inventory
  on public.marketplace_products;

create trigger marketplace_products_create_inventory
after insert on public.marketplace_products
for each row
execute function public.initialize_marketplace_product_inventory();

-- Backfill products created before the trigger was installed. Default quantity is zero.
insert into public.marketplace_inventory (product_id)
select p.id
from public.marketplace_products p
where not exists (
  select 1
  from public.marketplace_inventory i
  where i.product_id = p.id
)
on conflict (product_id) do nothing;
