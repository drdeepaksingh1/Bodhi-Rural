create table public.bodhimart_handover_codes (
  order_id uuid primary key references public.marketplace_orders(id) on delete cascade,
  code text not null check (code ~ '^[0-9]{6}$'),
  expires_at timestamptz not null,
  attempts integer not null default 0 check (attempts between 0 and 5)
);

alter table public.bodhimart_handover_codes enable row level security;
revoke all on public.bodhimart_handover_codes from public, anon, authenticated;

create function public.bodhimart_show_handover_code(p_order_id uuid)
returns table (delivery_code text, expires_at timestamptz)
language plpgsql security definer
set search_path = pg_catalog, public
as $$
begin
  perform 1 from public.marketplace_orders o
  join public.bodhimart_delivery_assignments a on a.order_id = o.id
  where o.id = p_order_id and o.customer_user_id = auth.uid()
    and o.delivery_method in ('STANDARD', 'EXPRESS')
    and o.order_status = 'DISPATCHED'
  for update of o;
  if not found then return; end if;

  insert into public.bodhimart_handover_codes as c (order_id, code, expires_at)
  values (p_order_id,
    lpad((((('x' || left(gen_random_uuid()::text, 8))::bit(32))::bigint) % 1000000)::text, 6, '0'),
    now() + interval '10 minutes')
  on conflict (order_id) do update
    set code = excluded.code, expires_at = excluded.expires_at, attempts = 0
    where c.expires_at <= now();

  return query select c.code, c.expires_at
    from public.bodhimart_handover_codes c
    where c.order_id = p_order_id and c.attempts < 5;
end;
$$;

create function public.bodhimart_verify_handover(p_order_number text, p_code text)
returns boolean
language plpgsql security definer
set search_path = pg_catalog, public
as $$
declare
  v_order_id uuid;
  v_code text;
begin
  if p_code is null or p_code !~ '^[0-9]{6}$' then return false; end if;

  select o.id into v_order_id from public.marketplace_orders o
  join public.bodhimart_delivery_assignments a on a.order_id = o.id
  join public.profiles p on p.id = a.partner_id
  join public.roles r on r.id = p.role_id
  where o.order_number = p_order_number and a.partner_id = auth.uid()
    and p.is_active and r.code = 'DELIVERY'
    and o.delivery_method in ('STANDARD', 'EXPRESS')
    and o.order_status = 'DISPATCHED'
  for update of o;
  if not found then return false; end if;

  update public.bodhimart_handover_codes
    set attempts = attempts + 1
    where order_id = v_order_id and expires_at > now() and attempts < 5
    returning code into v_code;
  if not found or v_code <> p_code then return false; end if;

  update public.marketplace_seller_orders
    set status = 'DELIVERED', updated_at = now()
    where order_id = v_order_id and status = 'DISPATCHED';

  update public.marketplace_orders
    set order_status = 'DELIVERED', updated_at = now()
    where id = v_order_id;

  delete from public.bodhimart_handover_codes where order_id = v_order_id;
  return true;
end;
$$;

-- For orders assigned to a delivery partner, require the partner handover flow.
alter function public.seller_mark_marketplace_order_delivered(uuid)
  rename to bodhimart_unassigned_seller_delivery;

revoke all on function public.bodhimart_unassigned_seller_delivery(uuid) from public, anon, authenticated;

create function public.seller_mark_marketplace_order_delivered(p_seller_order_id uuid)
returns void
language plpgsql security definer
set search_path = pg_catalog, public
as $$
declare
  v_order_id uuid;
begin
  select o.id into v_order_id from public.marketplace_orders o
  join public.marketplace_seller_orders so on so.order_id = o.id
  join public.marketplace_sellers s on s.id = so.seller_id
  where so.id = p_seller_order_id and s.user_id = auth.uid() and s.status = 'ACTIVE'
  for update of o;
  if not found then raise exception 'This order is unavailable to your seller account.'; end if;

  if exists (select 1 from public.bodhimart_delivery_assignments where order_id = v_order_id) then
    raise exception 'The assigned delivery partner must verify the buyer’s handover code.';
  end if;

  perform public.bodhimart_unassigned_seller_delivery(p_seller_order_id);
end;
$$;

revoke all on function public.bodhimart_show_handover_code(uuid),
  public.bodhimart_verify_handover(text, text),
  public.seller_mark_marketplace_order_delivered(uuid) from public, anon, authenticated;
grant execute on function public.bodhimart_show_handover_code(uuid),
  public.bodhimart_verify_handover(text, text),
  public.seller_mark_marketplace_order_delivered(uuid) to authenticated;
