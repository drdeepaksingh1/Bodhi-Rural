create table public.farm_activity_records (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  record_type text not null check (record_type in ('INPUT', 'PRODUCTION', 'SALE', 'EXPENSE')),
  activity_date date not null,
  category text,
  item_name text not null check (char_length(btrim(item_name)) between 1 and 140),
  quantity numeric(14, 3) check (quantity is null or quantity >= 0),
  unit text,
  unit_rate numeric(14, 2) check (unit_rate is null or unit_rate >= 0),
  amount numeric(14, 2) not null default 0 check (amount >= 0),
  buyer_name text,
  notes text check (notes is null or char_length(notes) <= 500),
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now()
);

create index farm_activity_records_farm_date_idx
  on public.farm_activity_records (farm_id, activity_date desc, created_at desc);

alter table public.farm_activity_records enable row level security;

revoke all on public.farm_activity_records from anon, authenticated;
grant select, insert, delete on public.farm_activity_records to authenticated;

create policy "Farm activity records are visible in farm scope"
  on public.farm_activity_records for select to authenticated
  using (public.farm_in_user_scope(farm_id));

create policy "Farm activity records can be added in farm scope"
  on public.farm_activity_records for insert to authenticated
  with check (public.farm_in_user_scope(farm_id) and created_by = auth.uid());

create policy "Farm activity records can be deleted in farm scope"
  on public.farm_activity_records for delete to authenticated
  using (public.farm_in_user_scope(farm_id));
