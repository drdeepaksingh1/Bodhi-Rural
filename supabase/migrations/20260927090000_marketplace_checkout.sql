-- Expose available stock only; shopper access must not reveal reserved or total inventory.
create or replace view public.marketplace_public_inventory
with (security_barrier = true)
as
select i.product_id,
       greatest(i.stock_quantity - i.reserved_quantity, 0)::numeric as available_quantity
from public.marketplace_inventory i
join public.marketplace_products p on p.id = i.product_id
join public.marketplace_sellers s on s.id = p.seller_id
where p.status = 'ACTIVE' and s.status = 'ACTIVE';

revoke all on public.marketplace_public_inventory from public;
grant select on public.marketplace_public_inventory to anon, authenticated;

alter table public.marketplace_orders
  add column if not exists checkout_request_id uuid,
  add column if not exists delivery_address_snapshot jsonb;

create unique index if not exists marketplace_orders_customer_checkout_request_id_key
  on public.marketplace_orders (customer_user_id, checkout_request_id)
  where checkout_request_id is not null;

comment on column public.marketplace_orders.delivery_address_snapshot is
  'Delivery details captured when the order is placed.';
comment on column public.marketplace_orders.checkout_request_id is
  'Per-customer idempotency key for safe checkout retries.';

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
  v_order_number := public.generate_marketplace_order_number();
  if v_order_number is null then raise exception 'The marketplace order counter is not initialized.'; end if;

  insert into public.marketplace_orders (
    order_number, customer_user_id, delivery_address_id, delivery_address_snapshot,
    checkout_request_id, subtotal, discount_amount, delivery_charge, tax_amount,
    total_amount, payment_status, order_status, delivery_method, customer_notes
  ) values (
    v_order_number, v_user_id, p_delivery_address_id, v_address_snapshot,
    p_checkout_request_id, v_subtotal, v_discount, 0, v_tax, v_subtotal + v_tax,
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
         sum(round(p.selling_price * ci.quantity, 2)), 0,
         sum(round(p.selling_price * ci.quantity, 2)), 'PLACED'
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
  total_amount := v_subtotal + v_tax;
  return next;
end;
$function$;

revoke all on function public.place_marketplace_order(uuid, uuid, text, text) from public;
revoke all on function public.place_marketplace_order(uuid, uuid, text, text) from anon;
grant execute on function public.place_marketplace_order(uuid, uuid, text, text) to authenticated;
