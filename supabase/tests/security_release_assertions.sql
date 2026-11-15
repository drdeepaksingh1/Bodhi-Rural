-- Read-only release assertions for the current production security baseline.
-- Run against a staging database first. This script raises an exception on a
-- failed assertion and does not modify application data or schema.

do $$
declare
  v_bucket_count integer;
  v_policy_count integer;
begin
  if not (select c.relrowsecurity
          from pg_class c
          join pg_namespace n on n.oid = c.relnamespace
          where n.nspname = 'public'
            and c.relname = 'farmer_applications') then
    raise exception 'RLS is not enabled on farmer_applications';
  end if;

  if has_table_privilege('authenticated', 'public.farmer_applications', 'UPDATE') then
    raise exception 'Authenticated users still have direct UPDATE on farmer_applications';
  end if;

  if has_function_privilege('anon', 'public.review_farmer_application(uuid,text,text)', 'EXECUTE') then
    raise exception 'anon can execute review_farmer_application';
  end if;

  if not has_function_privilege('authenticated', 'public.review_farmer_application(uuid,text,text)', 'EXECUTE') then
    raise exception 'authenticated cannot execute review_farmer_application';
  end if;

  if exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'farmers'
      and policyname = 'Management can view farmer records'
  ) then
    raise exception 'Legacy broad farmer SELECT policy still exists';
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'farmers'
      and policyname = 'RBAC management can view farmers'
      and coalesce(qual, '') like '%farmer_in_user_scope%'
  ) then
    raise exception 'Scoped farmer SELECT policy is missing';
  end if;

  if exists (
    select 1
    from information_schema.role_table_grants
    where table_schema = 'public'
      and grantee = 'anon'
      and table_name in (
        'farmers', 'farms', 'bird_batches', 'egg_production',
        'feed_records', 'veterinary_records',
        'marketplace_seller_applications'
      )
  ) then
    raise exception 'Anonymous table privileges remain on a protected operational table';
  end if;

  if exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'marketplace_seller_applications'
      and policyname = 'Marketplace seller applications management select'
  ) then
    raise exception 'Legacy broad seller application SELECT policy still exists';
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'marketplace_seller_applications'
      and policyname = 'Corporate management can view seller applications'
      and coalesce(qual, '') like '%is_bodhi_corporate_management%'
  ) then
    raise exception 'Corporate-management seller application policy is missing';
  end if;

  select count(*) into v_bucket_count
  from storage.buckets
  where id in ('farmer-photos', 'farmer-aadhaar', 'farmer-bank-documents')
    and public = false
    and (
      (id = 'farmer-photos' and file_size_limit = 5242880)
      or
      (id in ('farmer-aadhaar', 'farmer-bank-documents') and file_size_limit = 10485760)
    );

  if v_bucket_count <> 3 then
    raise exception 'Farmer document buckets are not all private with expected size limits';
  end if;

  select count(*) into v_policy_count
  from pg_policies
  where schemaname = 'storage'
    and tablename = 'objects'
    and policyname = 'Farmer application reviewers can view documents'
    and cmd = 'SELECT';

  if v_policy_count <> 1 then
    raise exception 'Scope-aware farmer document read policy is missing';
  end if;

  select count(*) into v_policy_count
  from pg_policies
  where schemaname = 'storage'
    and tablename = 'objects'
    and policyname = 'Applicants can delete unlinked farmer documents'
    and cmd = 'DELETE';

  if v_policy_count <> 1 then
    raise exception 'Safe cleanup policy for unlinked applicant documents is missing';
  end if;
end;
$;

select 'PASS: Bodhi Rural security release assertions' as result;
