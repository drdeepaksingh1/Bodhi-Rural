create table if not exists public.staff_payroll_records (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff(id) on delete restrict,
  pay_period date not null check (extract(day from pay_period) = 1),
  base_pay numeric(12,2) not null check (base_pay >= 0),
  allowances numeric(12,2) not null default 0 check (allowances >= 0),
  deductions numeric(12,2) not null default 0 check (deductions >= 0),
  net_pay numeric(12,2) generated always as (base_pay + allowances - deductions) stored,
  status text not null default 'PENDING' check (status in ('PENDING','PAID')),
  payment_method text,
  transaction_reference text,
  created_by uuid not null default auth.uid() references auth.users(id),
  paid_by uuid references auth.users(id),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (staff_id, pay_period),
  check (deductions <= base_pay + allowances),
  check (status <> 'PAID' or paid_at is not null)
);

alter table public.staff_payroll_records enable row level security;
revoke all on public.staff_payroll_records from anon, authenticated;
grant select, insert, update on public.staff_payroll_records to authenticated;

drop policy if exists "Finance can view staff payroll" on public.staff_payroll_records;
create policy "Finance can view staff payroll" on public.staff_payroll_records
for select to authenticated using (public.can_access_bodhi_finance());

drop policy if exists "Finance can create pending staff payroll" on public.staff_payroll_records;
create policy "Finance can create pending staff payroll" on public.staff_payroll_records
for insert to authenticated with check (public.can_access_bodhi_finance() and status = 'PENDING' and created_by = auth.uid());

drop policy if exists "Finance can update pending staff payroll" on public.staff_payroll_records;
create policy "Finance can update pending staff payroll" on public.staff_payroll_records
for update to authenticated using (public.can_access_bodhi_finance() and status = 'PENDING')
with check (public.can_access_bodhi_finance() and status = 'PENDING');

create or replace function public.finance_staff_identifiers()
returns table (id uuid, staff_code text, full_name text, designation text, department text, employment_status text)
language plpgsql stable security definer set search_path = pg_catalog, public
as $function$
begin
  if not public.can_access_bodhi_finance() then raise exception 'Finance access required' using errcode = '42501'; end if;
  return query select s.id, s.staff_id, s.full_name, s.designation, s.department, s.employment_status
  from public.staff s where s.employment_status = 'ACTIVE' order by s.full_name;
end;
$function$;

create or replace function public.finance_staff_payroll_list()
returns table (id uuid, staff_id uuid, staff_code text, full_name text, designation text, department text, pay_period date, base_pay numeric, allowances numeric, deductions numeric, net_pay numeric, status text, payment_method text, transaction_reference text, paid_at timestamptz)
language plpgsql stable security definer set search_path = pg_catalog, public
as $function$
begin
  if not public.can_access_bodhi_finance() then raise exception 'Finance access required' using errcode = '42501'; end if;
  return query select p.id, p.staff_id, s.staff_id, s.full_name, s.designation, s.department, p.pay_period, p.base_pay, p.allowances, p.deductions, p.net_pay, p.status, p.payment_method, p.transaction_reference, p.paid_at
  from public.staff_payroll_records p join public.staff s on s.id = p.staff_id order by p.pay_period desc, s.full_name;
end;
$function$;

create or replace function public.finance_create_staff_payroll(p_staff_id uuid, p_pay_period date, p_base_pay numeric, p_allowances numeric default 0, p_deductions numeric default 0)
returns uuid
language plpgsql security definer set search_path = pg_catalog, public
as $function$
declare v_id uuid;
begin
  if not public.can_access_bodhi_finance() then raise exception 'Finance access required' using errcode = '42501'; end if;
  if p_staff_id is null or p_pay_period is null or extract(day from p_pay_period) <> 1 then raise exception 'Select a staff member and the first day of the pay month.' using errcode = '22023'; end if;
  if p_base_pay < 0 or coalesce(p_allowances,0) < 0 or coalesce(p_deductions,0) < 0 or coalesce(p_deductions,0) > coalesce(p_base_pay,0)+coalesce(p_allowances,0) then raise exception 'Invalid payroll amounts.' using errcode = '22023'; end if;
  if not exists (select 1 from public.staff s where s.id = p_staff_id and s.employment_status = 'ACTIVE') then raise exception 'Active staff record not found.' using errcode = '22023'; end if;
  insert into public.staff_payroll_records(staff_id,pay_period,base_pay,allowances,deductions,created_by)
  values (p_staff_id,p_pay_period,p_base_pay,coalesce(p_allowances,0),coalesce(p_deductions,0),auth.uid())
  returning id into v_id;
  return v_id;
end;
$function$;

create or replace function public.finance_mark_staff_payroll_paid(p_payroll_id uuid, p_payment_method text, p_transaction_reference text default null)
returns void
language plpgsql security definer set search_path = pg_catalog, public
as $function$
declare v_method text := upper(trim(coalesce(p_payment_method,'')));
begin
  if not public.can_access_bodhi_finance() then raise exception 'Finance access required' using errcode = '42501'; end if;
  if v_method not in ('NEFT','RTGS','IMPS','UPI','CHEQUE','CASH','OTHER') then raise exception 'Select a valid payment method.' using errcode = '22023'; end if;
  if v_method <> 'CASH' and nullif(trim(coalesce(p_transaction_reference,'')),'') is null then raise exception 'Enter the verified bank or payment reference.' using errcode = '22023'; end if;
  update public.staff_payroll_records
  set status='PAID', payment_method=v_method, transaction_reference=nullif(trim(coalesce(p_transaction_reference,'')),''), paid_by=auth.uid(), paid_at=now(), updated_at=now()
  where id=p_payroll_id and status='PENDING';
  if not found then raise exception 'Pending payroll record not found or already paid.' using errcode = 'P0002'; end if;
end;
$function$;

revoke execute on function public.finance_staff_identifiers() from public, anon;
revoke execute on function public.finance_staff_payroll_list() from public, anon;
revoke execute on function public.finance_create_staff_payroll(uuid,date,numeric,numeric,numeric) from public, anon;
revoke execute on function public.finance_mark_staff_payroll_paid(uuid,text,text) from public, anon;
grant execute on function public.finance_staff_identifiers() to authenticated;
grant execute on function public.finance_staff_payroll_list() to authenticated;
grant execute on function public.finance_create_staff_payroll(uuid,date,numeric,numeric,numeric) to authenticated;
grant execute on function public.finance_mark_staff_payroll_paid(uuid,text,text) to authenticated;
