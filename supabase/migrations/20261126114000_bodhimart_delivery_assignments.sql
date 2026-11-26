create table public.bodhimart_delivery_assignments (
  order_id uuid primary key references public.marketplace_orders(id) on delete cascade,
  partner_id uuid not null references public.profiles(id),
  assigned_by uuid not null references public.profiles(id),
  assigned_at timestamptz not null default now()
);

create index bodhimart_delivery_assignments_partner_idx
  on public.bodhimart_delivery_assignments (partner_id, assigned_at desc);

alter table public.bodhimart_delivery_assignments enable row level security;
revoke all on public.bodhimart_delivery_assignments from public, anon, authenticated;

create function public.bodhimart_assign_delivery(p_order_id uuid, p_partner_id uuid)
returns void
language plpgsql security definer
set search_path = pg_catalog, public
as $$
begin
  if auth.uid() is null or not public.is_bodhi_super_admin() then
    raise exception 'Only an active super administrator can assign deliveries.' using errcode = '42501';
  end if;

  perform 1 from public.profiles p
  join public.roles r on r.id = p.role_id
  where p.id = p_partner_id and p.is_active and r.code = 'DELIVERY';
  if not found then
    raise exception 'Choose an active delivery partner.' using errcode = '22023';
  end if;

  perform 1 from public.marketplace_orders o
  where o.id = p_order_id and o.delivery_method in ('STANDARD', 'EXPRESS')
    and o.order_status in ('CONFIRMED', 'PROCESSING', 'PACKED', 'READY_FOR_DISPATCH')
  for update;
  if not found then
    raise exception 'Choose an active delivery order that has not been dispatched.' using errcode = '22023';
  end if;

  insert into public.bodhimart_delivery_assignments (order_id, partner_id, assigned_by)
  values (p_order_id, p_partner_id, auth.uid())
  on conflict (order_id) do update
    set partner_id = excluded.partner_id, assigned_by = excluded.assigned_by, assigned_at = now();
end;
$$;

create function public.bodhimart_my_deliveries()
returns table (order_number text, order_status text, assigned_at timestamptz)
language plpgsql stable security definer
set search_path = pg_catalog, public
as $$
begin
  if not exists (
    select 1 from public.profiles p
    join public.roles r on r.id = p.role_id
    where p.id = auth.uid() and p.is_active and r.code = 'DELIVERY'
  ) then
    raise exception 'An active delivery partner account is required.' using errcode = '42501';
  end if;

  return query
    select o.order_number::text, o.order_status::text, a.assigned_at
    from public.bodhimart_delivery_assignments a
    join public.marketplace_orders o on o.id = a.order_id
    where a.partner_id = auth.uid() and o.order_status not in ('CANCELLED', 'RETURNED', 'REFUNDED')
    order by a.assigned_at desc
    limit 100;
end;
$$;

revoke all on function public.bodhimart_assign_delivery(uuid, uuid) from public, anon, authenticated;
revoke all on function public.bodhimart_my_deliveries() from public, anon, authenticated;
grant execute on function public.bodhimart_assign_delivery(uuid, uuid) to authenticated;
grant execute on function public.bodhimart_my_deliveries() to authenticated;
