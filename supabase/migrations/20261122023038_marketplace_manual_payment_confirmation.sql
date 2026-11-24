alter table public.marketplace_orders
  add column payment_method text generated always as (
    case
      when upper(coalesce(delivery_method, '')) = 'PICKUP' then 'PAY_AT_PICKUP'
      else 'PAY_ON_DELIVERY'
    end
  ) stored;

comment on column public.marketplace_orders.payment_method is
  'Manual collection method derived from the selected delivery method. Payment remains pending until an authorized administrator confirms receipt.';

create or replace function public.admin_mark_marketplace_order_paid(
  p_order_id uuid,
  p_payment_reference text default null
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_user_id uuid := auth.uid();
  v_old_status text;
  v_order_number text;
  v_total_amount numeric;
  v_payment_method text;
  v_payment_reference text := nullif(trim(coalesce(p_payment_reference, '')), '');
begin
  if v_user_id is null then
    raise exception 'Authentication is required.';
  end if;

  if not exists (
    select 1
    from public.profiles p
    join public.roles r on r.id = p.role_id
    where p.id = v_user_id
      and p.is_active = true
      and r.code = 'SUPER_ADMIN'
  ) then
    raise exception 'Only an active Bodhi super administrator can confirm marketplace payments.';
  end if;

  if p_order_id is null then
    raise exception 'An order is required.';
  end if;

  if length(coalesce(v_payment_reference, '')) > 120 then
    raise exception 'Payment reference must be 120 characters or fewer.';
  end if;

  select o.payment_status, o.order_number, o.total_amount, o.payment_method
    into v_old_status, v_order_number, v_total_amount, v_payment_method
  from public.marketplace_orders o
  where o.id = p_order_id
  for update;

  if not found then
    raise exception 'Marketplace order was not found.';
  end if;

  if v_old_status <> 'PENDING' then
    raise exception 'Only pending marketplace payments can be confirmed.';
  end if;

  if exists (
    select 1 from public.marketplace_orders o
    where o.id = p_order_id and o.order_status = 'CANCELLED'
  ) then
    raise exception 'Payment cannot be confirmed for a cancelled order.';
  end if;

  update public.marketplace_orders
  set payment_status = 'PAID', updated_at = now()
  where id = p_order_id;

  insert into public.audit_logs (
    user_id, action, table_name, record_id, old_data, new_data
  ) values (
    v_user_id,
    'MARKETPLACE_PAYMENT_CONFIRMED',
    'marketplace_orders',
    p_order_id,
    jsonb_build_object(
      'order_number', v_order_number,
      'total_amount', v_total_amount,
      'payment_status', v_old_status,
      'payment_method', v_payment_method
    ),
    jsonb_build_object(
      'order_number', v_order_number,
      'total_amount', v_total_amount,
      'payment_status', 'PAID',
      'payment_method', v_payment_method,
      'payment_reference', v_payment_reference
    )
  );
end;
$function$;

revoke all on function public.admin_mark_marketplace_order_paid(uuid, text)
  from public, anon, authenticated;
grant execute on function public.admin_mark_marketplace_order_paid(uuid, text)
  to authenticated;
