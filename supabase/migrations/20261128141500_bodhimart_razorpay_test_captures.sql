create table public.bodhimart_razorpay_test_captures (
  payment_id text primary key,
  razorpay_order_id text not null,
  order_id uuid not null references public.marketplace_orders(id),
  amount_paise bigint not null check (amount_paise >= 100),
  recorded_at timestamptz not null default now()
);

alter table public.bodhimart_razorpay_test_captures enable row level security;
revoke all on public.bodhimart_razorpay_test_captures from public, anon, authenticated;
grant select, insert on public.bodhimart_razorpay_test_captures to service_role;
