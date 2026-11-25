drop policy if exists "Finance can view farm activity records" on public.farm_activity_records;
create policy "Finance can view farm activity records"
on public.farm_activity_records
for select
to authenticated
using (public.can_access_bodhi_finance());

create or replace function public.finance_marketplace_overview()
returns table (
  order_count bigint,
  gross_order_value numeric,
  paid_order_count bigint,
  paid_order_value numeric,
  pending_order_count bigint,
  pending_order_value numeric,
  buyer_count bigint,
  seller_count bigint
)
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $function$
begin
  if not public.can_access_bodhi_finance() then
    raise exception 'Finance access required' using errcode = '42501';
  end if;

  return query
  select
    count(o.id)::bigint,
    coalesce(sum(o.total_amount), 0)::numeric,
    count(o.id) filter (where upper(o.payment_status) = 'PAID')::bigint,
    coalesce(sum(o.total_amount) filter (where upper(o.payment_status) = 'PAID'), 0)::numeric,
    count(o.id) filter (where upper(o.payment_status) <> 'PAID')::bigint,
    coalesce(sum(o.total_amount) filter (where upper(o.payment_status) <> 'PAID'), 0)::numeric,
    count(distinct o.customer_user_id)::bigint,
    (select count(distinct so.seller_id)::bigint from public.marketplace_seller_orders so)
  from public.marketplace_orders o;
end;
$function$;

create or replace function public.finance_marketplace_seller_totals()
returns table (
  seller_id uuid,
  seller_name text,
  seller_order_count bigint,
  seller_order_value numeric,
  paid_order_value numeric,
  unpaid_order_value numeric
)
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $function$
begin
  if not public.can_access_bodhi_finance() then
    raise exception 'Finance access required' using errcode = '42501';
  end if;

  return query
  select
    s.id,
    s.shop_name,
    count(so.id)::bigint,
    coalesce(sum(so.seller_amount), 0)::numeric,
    coalesce(sum(so.seller_amount) filter (where upper(o.payment_status) = 'PAID'), 0)::numeric,
    coalesce(sum(so.seller_amount) filter (where upper(o.payment_status) <> 'PAID'), 0)::numeric
  from public.marketplace_sellers s
  join public.marketplace_seller_orders so on so.seller_id = s.id
  join public.marketplace_orders o on o.id = so.order_id
  group by s.id, s.shop_name
  order by coalesce(sum(so.seller_amount), 0) desc;
end;
$function$;

create or replace function public.finance_farmer_identifiers()
returns table (
  id uuid,
  farmer_code text,
  full_name text
)
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $function$
begin
  if not public.can_access_bodhi_finance() then
    raise exception 'Finance access required' using errcode = '42501';
  end if;

  return query
  select f.id, f.farmer_id, f.full_name
  from public.farmers f
  order by f.farmer_id;
end;
$function$;

revoke execute on function public.finance_marketplace_overview() from public, anon;
revoke execute on function public.finance_marketplace_seller_totals() from public, anon;
revoke execute on function public.finance_farmer_identifiers() from public, anon;
grant execute on function public.finance_marketplace_overview() to authenticated;
grant execute on function public.finance_marketplace_seller_totals() to authenticated;
grant execute on function public.finance_farmer_identifiers() to authenticated;
