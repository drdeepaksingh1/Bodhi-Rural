create table public.bodhimart_delivery_offers (
  order_id uuid not null references public.marketplace_orders(id) on delete cascade,
  partner_id uuid not null references public.profiles(id),
  offered_by uuid not null references public.profiles(id),
  expires_at timestamptz not null,
  primary key (order_id, partner_id)
);

alter table public.bodhimart_delivery_offers enable row level security;
revoke all on public.bodhimart_delivery_offers from public, anon, authenticated;
create index bodhimart_delivery_offers_partner_idx
  on public.bodhimart_delivery_offers (partner_id, expires_at);

create function public.bodhimart_offer_delivery(p_order_id uuid, p_partner_ids uuid[])
returns integer
language plpgsql security definer
set search_path = pg_catalog, public
as $$
declare
  v_count integer;
begin
  if auth.uid() is null or not public.is_bodhi_super_admin() then
    raise exception 'An active super administrator is required.' using errcode = '42501';
  end if;
  if coalesce(cardinality(p_partner_ids), 0) not between 1 and 100 then
    raise exception 'Choose between 1 and 100 partners.' using errcode = '22023';
  end if;

  perform 1 from public.marketplace_orders o
  where o.id = p_order_id and o.delivery_method in ('STANDARD', 'EXPRESS')
    and o.order_status in ('CONFIRMED', 'PROCESSING', 'PACKED', 'READY_FOR_DISPATCH')
  for update;
  if not found or exists (
    select 1 from public.bodhimart_delivery_assignments a where a.order_id = p_order_id
  ) then
    raise exception 'The order is unavailable for offers.' using errcode = '22023';
  end if;

  insert into public.bodhimart_delivery_offers (order_id, partner_id, offered_by, expires_at)
  select p_order_id, p.id, auth.uid(), clock_timestamp() + interval '2 minutes'
  from public.profiles p join public.roles r on r.id = p.role_id
  where p.id = any(p_partner_ids) and p.is_active and r.code = 'DELIVERY'
  on conflict (order_id, partner_id) do update
    set offered_by = excluded.offered_by, expires_at = excluded.expires_at
    where bodhimart_delivery_offers.expires_at <= clock_timestamp();
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

create function public.bodhimart_my_delivery_offers()
returns table (order_id uuid, order_number text, expires_at timestamptz)
language sql stable security definer
set search_path = pg_catalog, public
as $$
  select o.id, o.order_number::text, f.expires_at
  from public.bodhimart_delivery_offers f
  join public.marketplace_orders o on o.id = f.order_id
  join public.profiles p on p.id = f.partner_id
  join public.roles r on r.id = p.role_id
  where f.partner_id = auth.uid() and p.is_active and r.code = 'DELIVERY'
    and f.expires_at > statement_timestamp()
    and o.delivery_method in ('STANDARD', 'EXPRESS')
    and o.order_status in ('CONFIRMED', 'PROCESSING', 'PACKED', 'READY_FOR_DISPATCH')
    and not exists (select 1 from public.bodhimart_delivery_assignments a where a.order_id = o.id)
  order by f.expires_at, o.id
  limit 100;
$$;

create function public.bodhimart_accept_delivery_offer(p_order_id uuid)
returns boolean
language plpgsql security definer
set search_path = pg_catalog, public
as $$
begin
  if not exists (
    select 1 from public.profiles p join public.roles r on r.id = p.role_id
    where p.id = auth.uid() and p.is_active and r.code = 'DELIVERY'
  ) then
    raise exception 'An active delivery partner account is required.' using errcode = '42501';
  end if;

  -- Share the order lock with manual dispatch and offer publication.
  perform 1 from public.marketplace_orders o
  where o.id = p_order_id and o.delivery_method in ('STANDARD', 'EXPRESS')
    and o.order_status in ('CONFIRMED', 'PROCESSING', 'PACKED', 'READY_FOR_DISPATCH')
  for update;
  if not found then return false; end if;

  if exists (
    select 1 from public.bodhimart_delivery_assignments a
    where a.order_id = p_order_id and a.partner_id = auth.uid()
  ) then return true; end if;

  insert into public.bodhimart_delivery_assignments (order_id, partner_id, assigned_by)
  select f.order_id, f.partner_id, f.offered_by
  from public.bodhimart_delivery_offers f
  where f.order_id = p_order_id and f.partner_id = auth.uid()
    and f.expires_at > clock_timestamp()
  on conflict (order_id) do nothing;
  return found;
end;
$$;

revoke all on function public.bodhimart_offer_delivery(uuid, uuid[]) from public, anon, authenticated;
revoke all on function public.bodhimart_my_delivery_offers() from public, anon, authenticated;
revoke all on function public.bodhimart_accept_delivery_offer(uuid) from public, anon, authenticated;
grant execute on function public.bodhimart_offer_delivery(uuid, uuid[]) to authenticated;
grant execute on function public.bodhimart_my_delivery_offers() to authenticated;
grant execute on function public.bodhimart_accept_delivery_offer(uuid) to authenticated;
