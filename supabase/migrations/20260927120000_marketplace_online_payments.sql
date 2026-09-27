-- Commercial settings default to zero until the business selects approved rates.
create table if not exists public.marketplace_commercial_settings (
  id smallint primary key default 1 check (id = 1),
  delivery_fee numeric(12,2) not null default 0 check (delivery_fee >= 0),
  free_delivery_threshold numeric(12,2) check (free_delivery_threshold is null or free_delivery_threshold >= 0),
  seller_commission_percent numeric(5,2) not null default 0 check (seller_commission_percent between 0 and 100),
  updated_at timestamptz not null default now()
);
insert into public.marketplace_commercial_settings (id) values (1) on conflict (id) do nothing;
alter table public.marketplace_commercial_settings enable row level security;
revoke all on public.marketplace_commercial_settings from public, anon, authenticated;
grant all on public.marketplace_commercial_settings to service_role;

create or replace view public.marketplace_public_checkout_settings
with (security_barrier = true)
as
select delivery_fee, free_delivery_threshold
from public.marketplace_commercial_settings where id = 1;
revoke all on public.marketplace_public_checkout_settings from public;
grant select on public.marketplace_public_checkout_settings to anon, authenticated;

create table if not exists public.marketplace_payment_transactions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.marketplace_orders(id) on delete restrict,
  attempt_id uuid not null,
  provider text not null check (provider = 'RAZORPAY'),
  provider_order_id text not null unique,
  provider_payment_id text unique,
  amount_minor bigint not null check (amount_minor > 0),
  currency text not null default 'INR' check (currency = 'INR'),
  status text not null default 'CREATED' check (status in ('CREATED','AUTHORIZED','CAPTURED','FAILED','REFUNDED')),
  failure_code text,
  failure_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  captured_at timestamptz,
  unique (order_id, attempt_id)
);
alter table public.marketplace_payment_transactions enable row level security;
revoke all on public.marketplace_payment_transactions from public, anon, authenticated;
grant all on public.marketplace_payment_transactions to service_role;
create index if not exists marketplace_payment_transactions_order_idx
  on public.marketplace_payment_transactions (order_id, created_at desc);

create table if not exists public.marketplace_payment_webhook_events (
  provider_event_id text primary key,
  event_type text not null,
  processed_at timestamptz,
  received_at timestamptz not null default now()
);
alter table public.marketplace_payment_webhook_events enable row level security;
revoke all on public.marketplace_payment_webhook_events from public, anon, authenticated;
grant all on public.marketplace_payment_webhook_events to service_role;

create or replace function public.confirm_marketplace_payment(
  p_provider_order_id text,
  p_provider_payment_id text,
  p_amount_minor bigint,
  p_currency text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_transaction public.marketplace_payment_transactions%rowtype;
  v_order public.marketplace_orders%rowtype;
  v_expected_amount bigint;
begin
  if p_provider_payment_id is null or p_provider_payment_id = '' then
    raise exception 'Payment ID is required.';
  end if;

  select t.* into v_transaction
    from public.marketplace_payment_transactions t
    where t.provider_order_id = p_provider_order_id
    for update;
  if not found then raise exception 'Payment order was not found.'; end if;

  select o.* into v_order
    from public.marketplace_orders o
    where o.id = v_transaction.order_id
    for update;
  if not found then raise exception 'Marketplace order was not found.'; end if;

  v_expected_amount := round(v_order.total_amount * 100)::bigint;
  if p_amount_minor <> v_transaction.amount_minor or p_amount_minor <> v_expected_amount
     or p_currency <> v_transaction.currency or p_currency <> 'INR' then
    raise exception 'Payment amount or currency does not match the order.';
  end if;
  if v_order.order_status = 'CANCELLED' then
    raise exception 'This order was cancelled and cannot be paid.';
  end if;
  if v_order.payment_status = 'PAID' then
    update public.marketplace_payment_transactions
      set status = 'CAPTURED', provider_payment_id = coalesce(provider_payment_id, p_provider_payment_id),
          captured_at = coalesce(captured_at, now()), updated_at = now()
      where id = v_transaction.id;
    return;
  end if;
  if v_order.payment_status <> 'PENDING' then
    raise exception 'This order is not awaiting payment.';
  end if;

  update public.marketplace_payment_transactions
    set status = 'CAPTURED', provider_payment_id = p_provider_payment_id,
        captured_at = now(), updated_at = now()
    where id = v_transaction.id;
  update public.marketplace_orders set payment_status = 'PAID' where id = v_order.id;
end;
$function$;

revoke all on function public.confirm_marketplace_payment(text,text,bigint,text) from public, anon, authenticated;
grant execute on function public.confirm_marketplace_payment(text,text,bigint,text) to service_role;

create or replace function public.place_marketplace_order(
  p_checkout_request_id uuid,
  p_delivery_address_id uuid,
  p_delivery_method text,
  p_customer_notes text default null
)
returns table(order_id uuid, order_number text, total_amount numeric)
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_user_id uuid;
  v_cart_id uuid;
  v_expected_count integer;
  v_processed_count integer := 0;
  v_updated_count integer := 0;
  v_order_id uuid;
  v_order_number text;
  v_subtotal numeric := 0;
  v_discount numeric := 0;
  v_base_delivery_fee numeric := 0;
  v_free_delivery_threshold numeric;
  v_commission_percent numeric := 0;
  v_delivery_charge numeric := 0;
  v_tax numeric := 0;
  v_line_subtotal numeric;
  v_line_tax numeric;
  v_line_discount numeric;
  v_address public.marketplace_customer_addresses%rowtype;
  v_address_snapshot jsonb;
  v_item record;
begin
  v_user_id := auth.uid();
  if v_user_id is null then raise exception 'Authentication is required to place an order.'; end if;
  if p_checkout_request_id is null then raise exception 'A checkout request ID is required.'; end if;
  if p_delivery_method is null or p_delivery_method not in ('STANDARD', 'EXPRESS', 'PICKUP') then
    raise exception 'Select a valid delivery method.';
  end if;
  if p_delivery_method <> 'PICKUP' and p_delivery_address_id is null then
    raise exception 'A delivery address is required.';
  end if;
  if p_customer_notes is not null and length(trim(p_customer_notes)) > 500 then
    raise exception 'Seller notes must be 500 characters or fewer.';
  end if;

  select o.id, o.order_number, o.total_amount
    into order_id, order_number, total_amount
    from public.marketplace_orders o
    where o.customer_user_id = v_user_id and o.checkout_request_id = p_checkout_request_id;
  if found then return next; return; end if;

  select coalesce(s.delivery_fee, 0), s.free_delivery_threshold, coalesce(s.seller_commission_percent, 0)
    into v_base_delivery_fee, v_free_delivery_threshold, v_commission_percent
    from public.marketplace_commercial_settings s where s.id = 1;

  if p_delivery_address_id is not null then
    select a.* into v_address
    from public.marketplace_customer_addresses a
    where a.id = p_delivery_address_id and a.user_id = v_user_id
    for key share;
    if not found then raise exception 'The selected delivery address is not available.'; end if;

    v_address_snapshot := jsonb_build_object(
      'address_name', v_address.address_name, 'recipient_name', v_address.recipient_name,
      'mobile', v_address.mobile, 'address_line1', v_address.address_line1,
      'address_line2', v_address.address_line2, 'landmark', v_address.landmark,
      'pincode', v_address.pincode, 'state_id', v_address.state_id,
      'district_id', v_address.district_id, 'block_id', v_address.block_id,
      'panchayat_id', v_address.panchayat_id, 'village_id', v_address.village_id
    );
  end if;

  select c.id into v_cart_id
  from public.marketplace_carts c where c.user_id = v_user_id for update;
  if not found then raise exception 'Your cart is empty.'; end if;

  -- A retry waiting on the cart lock may observe the first request's commit.
  select o.id, o.order_number, o.total_amount
    into order_id, order_number, total_amount
    from public.marketplace_orders o
    where o.customer_user_id = v_user_id and o.checkout_request_id = p_checkout_request_id;
  if found then return next; return; end if;

  select count(*)::integer into v_expected_count
  from public.marketplace_cart_items ci where ci.cart_id = v_cart_id;
  if v_expected_count = 0 then raise exception 'Your cart is empty.'; end if;

  for v_item in
    select ci.product_id, ci.quantity, ci.price_snapshot,
           p.sku, p.name, p.unit, p.seller_id, p.mrp, p.selling_price,
           p.tax_percent, p.minimum_order_quantity, p.maximum_order_quantity,
           p.status as product_status, s.seller_id as seller_code,
           s.status as seller_status, i.stock_quantity, i.reserved_quantity
    from public.marketplace_cart_items ci
    join public.marketplace_products p on p.id = ci.product_id
    join public.marketplace_sellers s on s.id = p.seller_id
    join public.marketplace_inventory i on i.product_id = p.id
    where ci.cart_id = v_cart_id
    order by ci.product_id
    for update of ci, p, s, i
  loop
    v_processed_count := v_processed_count + 1;
    if v_item.product_status <> 'ACTIVE' or v_item.seller_status <> 'ACTIVE' then
      raise exception 'A product in your cart is no longer available.';
    end if;
    if v_item.price_snapshot is distinct from v_item.selling_price then
      raise exception 'A product price changed. Review the updated cart and try again.';
    end if;
    if v_item.selling_price < 0 or v_item.mrp < 0 or v_item.tax_percent < 0
       or v_item.tax_percent > 100 or v_item.minimum_order_quantity <= 0
       or (v_item.maximum_order_quantity is not null
           and v_item.maximum_order_quantity < v_item.minimum_order_quantity) then
      raise exception 'A product in your cart has invalid pricing or order limits.';
    end if;
    if v_item.quantity < v_item.minimum_order_quantity then
      raise exception 'A product in your cart is below its minimum order quantity.';
    end if;
    if v_item.maximum_order_quantity is not null
       and v_item.quantity > v_item.maximum_order_quantity then
      raise exception 'A product in your cart exceeds its maximum order quantity.';
    end if;
    if v_item.quantity > v_item.stock_quantity - v_item.reserved_quantity then
      raise exception 'A product in your cart no longer has enough available stock.';
    end if;

    v_line_subtotal := round(v_item.selling_price * v_item.quantity, 2);
    v_line_tax := round(v_item.selling_price * v_item.quantity * v_item.tax_percent / 100, 2);
    v_line_discount := greatest(round((v_item.mrp - v_item.selling_price) * v_item.quantity, 2), 0);
    v_subtotal := v_subtotal + v_line_subtotal;
    v_tax := v_tax + v_line_tax;
    v_discount := v_discount + v_line_discount;
  end loop;

  if v_processed_count <> v_expected_count then
    raise exception 'A product in your cart is no longer available.';
  end if;
  if p_delivery_method = 'PICKUP'
     or (v_free_delivery_threshold is not null and v_subtotal >= v_free_delivery_threshold) then
    v_delivery_charge := 0;
  else
    v_delivery_charge := v_base_delivery_fee;
  end if;

  v_order_number := public.generate_marketplace_order_number();
  if v_order_number is null then raise exception 'The marketplace order counter is not initialized.'; end if;

  insert into public.marketplace_orders (
    order_number, customer_user_id, delivery_address_id, delivery_address_snapshot,
    checkout_request_id, subtotal, discount_amount, delivery_charge, tax_amount,
    total_amount, payment_status, order_status, delivery_method, customer_notes
  ) values (
    v_order_number, v_user_id, p_delivery_address_id, v_address_snapshot,
    p_checkout_request_id, v_subtotal, v_discount, v_delivery_charge, v_tax, v_subtotal + v_tax + v_delivery_charge,
    'PENDING', 'PLACED', p_delivery_method, nullif(trim(coalesce(p_customer_notes, '')), '')
  ) returning id into v_order_id;

  insert into public.marketplace_order_items (
    order_id, product_id, seller_id, product_name_snapshot, sku_snapshot, unit,
    quantity, unit_price, tax_amount, discount_amount, line_total
  )
  select v_order_id, p.id, p.seller_id, p.name, p.sku, p.unit, ci.quantity,
         p.selling_price,
         round(p.selling_price * ci.quantity * p.tax_percent / 100, 2),
         greatest(round((p.mrp - p.selling_price) * ci.quantity, 2), 0),
         round(p.selling_price * ci.quantity, 2)
           + round(p.selling_price * ci.quantity * p.tax_percent / 100, 2)
  from public.marketplace_cart_items ci
  join public.marketplace_products p on p.id = ci.product_id
  where ci.cart_id = v_cart_id;

  -- No commission or delivery-fee rate is configured in this project; current schema defaults are zero.
  insert into public.marketplace_seller_orders (
    order_id, seller_id, seller_order_number, subtotal, commission_amount, seller_amount, status
  )
  select v_order_id, p.seller_id, v_order_number || '-' || s.seller_id,
         sum(round(p.selling_price * ci.quantity, 2)),
         round(sum(round(p.selling_price * ci.quantity, 2)) * v_commission_percent / 100, 2),
         sum(round(p.selling_price * ci.quantity, 2))
           - round(sum(round(p.selling_price * ci.quantity, 2)) * v_commission_percent / 100, 2), 'PLACED'
  from public.marketplace_cart_items ci
  join public.marketplace_products p on p.id = ci.product_id
  join public.marketplace_sellers s on s.id = p.seller_id
  where ci.cart_id = v_cart_id
  group by p.seller_id, s.seller_id;

  update public.marketplace_inventory i
    set stock_quantity = i.stock_quantity - ci.quantity, updated_at = now()
  from public.marketplace_cart_items ci
  where ci.cart_id = v_cart_id and ci.product_id = i.product_id;
  get diagnostics v_updated_count = row_count;
  if v_updated_count <> v_expected_count then
    raise exception 'Inventory changed while your order was being placed. Please retry.';
  end if;

  delete from public.marketplace_cart_items ci where ci.cart_id = v_cart_id;
  order_id := v_order_id;
  order_number := v_order_number;
  total_amount := v_subtotal + v_tax + v_delivery_charge;
  return next;
end;
$function$;
