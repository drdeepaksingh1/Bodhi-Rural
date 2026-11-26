create table public.bodhimart_delivery_partner_applications (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(trim(full_name)) between 2 and 100),
  phone text not null check (phone ~ '^[0-9]{10}$'),
  service_area text not null check (char_length(trim(service_area)) between 2 and 160),
  submitted_at timestamptz not null default now()
);
alter table public.bodhimart_delivery_partner_applications enable row level security;
revoke all on public.bodhimart_delivery_partner_applications from public, anon, authenticated;
grant select on public.bodhimart_delivery_partner_applications to authenticated;
grant insert (user_id, full_name, phone, service_area) on public.bodhimart_delivery_partner_applications to authenticated;
create policy "Delivery applicants and administrators read applications"
on public.bodhimart_delivery_partner_applications for select to authenticated
using (user_id = (select auth.uid()) or (select public.is_bodhi_super_admin()));
create policy "Users submit their own delivery application"
on public.bodhimart_delivery_partner_applications for insert to authenticated
with check (user_id = (select auth.uid()));
