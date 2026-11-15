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
        'feed_records', 'veterinary_records', 'locations', 'roles',
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

  if not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'farmer_in_user_scope'
      and pg_get_functiondef(p.oid) like '%v_location_type%'
      and pg_get_functiondef(p.oid) like '%PANCHAYAT%'
      and pg_get_functiondef(p.oid) like '%BLOCK%'
  ) then
    raise exception 'Cluster supervisor farm scope does not match PANCHAYAT/BLOCK location assignments';
  end if;

  if (
    select count(*)
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname in ('marketplace_public_products', 'marketplace_public_inventory')
      and coalesce(c.reloptions, array[]::text[]) @> array['security_invoker=true']
  ) <> 2 then
    raise exception 'Both public marketplace views must use security_invoker';
  end if;

  if has_column_privilege('anon', 'public.marketplace_products', 'seller_id', 'SELECT')
     or has_column_privilege('anon', 'public.marketplace_products', 'approved_by', 'SELECT')
     or has_column_privilege('anon', 'public.marketplace_inventory', 'stock_quantity', 'SELECT')
     or has_column_privilege('anon', 'public.marketplace_inventory', 'reserved_quantity', 'SELECT') then
    raise exception 'Anonymous users have access to protected seller metadata or raw stock fields';
  end if;

  if not has_column_privilege('anon', 'public.marketplace_inventory', 'available_quantity', 'SELECT') then
    raise exception 'Anonymous users cannot read public available stock';
  end if;

  -- All SECURITY DEFINER functions in the exposed public schema must pin
  -- search_path. The remaining anonymous-executable functions are an explicit
  -- allowlist of stable, read-only public geography lookups only.
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prosecdef
      and not exists (
        select 1
        from unnest(coalesce(p.proconfig, array[]::text[])) setting
        where setting like 'search_path=%'
      )
  ) then
    raise exception 'A public SECURITY DEFINER function does not pin search_path';
  end if;

  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prosecdef
      and has_function_privilege('anon', p.oid, 'EXECUTE')
      and p.proname not in (
        'get_blocks', 'get_districts', 'get_location_names',
        'get_panchayats', 'get_staff_panchayats',
        'get_staff_villages', 'get_states', 'get_villages'
      )
  ) then
    raise exception 'An unexpected SECURITY DEFINER function is executable by anon';
  end if;

  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prosecdef
      and has_function_privilege('anon', p.oid, 'EXECUTE')
      and (
        p.provolatile <> 's'
        or pg_get_functiondef(p.oid) not like '%FROM public.locations%'
      )
  ) then
    raise exception 'An anonymous geography lookup is not stable/read-only over public locations';
  end if;

  -- Staff application processing must reject unknown decisions and require
  -- an explicit reason for rejection. Keep the workflow behind authenticated RPC access.
  if not has_function_privilege('authenticated', 'public.process_staff_application(uuid,text,text)', 'EXECUTE')
     or has_function_privilege('anon', 'public.process_staff_application(uuid,text,text)', 'EXECUTE') then
    raise exception 'Staff application processing RPC grants are incorrect';
  end if;

  if position(
       'Decision must be APPROVED or REJECTED'
       in pg_get_functiondef('public.process_staff_application(uuid,text,text)'::regprocedure)
     ) = 0
     or position(
       'A rejection reason is required'
       in pg_get_functiondef('public.process_staff_application(uuid,text,text)'::regprocedure)
     ) = 0 then
    raise exception 'Staff application decision validation or rejection reason requirement is missing';
  end if;

  if exists (
    select 1
    from information_schema.role_table_grants
    where table_schema = 'public'
      and grantee = 'anon'
      and table_name in (
        'locations', 'roles', 'marketplace_cart_items', 'marketplace_carts',
        'marketplace_customer_addresses', 'notifications', 'orders',
        'staff_application_approvals', 'staff_application_documents',
        'staff_applications', 'vaccinations'
      )
  ) then
    raise exception 'Anonymous grants remain on private operational tables';
  end if;

  -- Critical finance and stock RPCs must be authenticated-only.
  if has_function_privilege('anon', 'public.approve_farmer_payment(uuid)', 'EXECUTE')
     or has_function_privilege('anon', 'public.mark_farmer_payment_paid(uuid)', 'EXECUTE')
     or has_function_privilege('anon', 'public.submit_farmer_payment(uuid,date,numeric,text,text,text,text)', 'EXECUTE')
     or has_function_privilege('anon', 'public.submit_egg_procurement(uuid,uuid,date,integer,numeric,numeric,numeric,text)', 'EXECUTE')
     or has_function_privilege('anon', 'public.bodhi_adjust_seller_listing_stock(uuid,numeric,text,text,text)', 'EXECUTE')
     or has_function_privilege('anon', 'public.bodhi_approve_product_lot(uuid,text)', 'EXECUTE')
     or has_function_privilege('anon', 'public.bodhi_issue_lot_stock(uuid,uuid,uuid,numeric,text)', 'EXECUTE')
     or has_function_privilege('anon', 'public.bodhi_transfer_lot_stock(uuid,uuid,uuid,uuid,numeric,text)', 'EXECUTE') then
    raise exception 'An anonymous user can execute a protected finance or stock RPC';
  end if;

  if not has_function_privilege('authenticated', 'public.approve_farmer_payment(uuid)', 'EXECUTE')
     or not has_function_privilege('authenticated', 'public.mark_farmer_payment_paid(uuid)', 'EXECUTE')
     or not has_function_privilege('authenticated', 'public.submit_farmer_payment(uuid,date,numeric,text,text,text,text)', 'EXECUTE')
     or not has_function_privilege('authenticated', 'public.submit_egg_procurement(uuid,uuid,date,integer,numeric,numeric,numeric,text)', 'EXECUTE')
     or not has_function_privilege('authenticated', 'public.bodhi_adjust_seller_listing_stock(uuid,numeric,text,text,text)', 'EXECUTE')
     or not has_function_privilege('authenticated', 'public.bodhi_approve_product_lot(uuid,text)', 'EXECUTE')
     or not has_function_privilege('authenticated', 'public.bodhi_issue_lot_stock(uuid,uuid,uuid,numeric,text)', 'EXECUTE')
     or not has_function_privilege('authenticated', 'public.bodhi_transfer_lot_stock(uuid,uuid,uuid,uuid,numeric,text)', 'EXECUTE') then
    raise exception 'An authenticated user is missing a required finance or stock RPC grant';
  end if;

  -- Internal counters, audit and operational tables intentionally have RLS
  -- enabled with no client policies and no client-facing table grants.
  if exists (
    select 1
    from information_schema.role_table_grants
    where table_schema = 'public'
      and grantee in ('anon', 'authenticated', 'PUBLIC')
      and table_name in (
        'audit_logs', 'farmer_credit_recoveries', 'farmer_id_counters',
        'inventory', 'marketplace_order_counters', 'marketplace_price_history',
        'marketplace_product_counters', 'marketplace_seller_application_counters',
        'marketplace_seller_counters', 'order_items', 'staff',
        'staff_application_counters', 'staff_id_counters', 'warehouses'
      )
  ) then
    raise exception 'An internal no-policy table has a client-facing table grant';
  end if;

  if has_table_privilege('anon', 'public.marketplace_categories', 'INSERT')
     or has_table_privilege('anon', 'public.marketplace_categories', 'UPDATE')
     or has_table_privilege('anon', 'public.marketplace_categories', 'DELETE')
     or has_table_privilege('anon', 'public.marketplace_product_images', 'INSERT')
     or has_table_privilege('anon', 'public.marketplace_product_images', 'UPDATE')
     or has_table_privilege('anon', 'public.marketplace_product_images', 'DELETE')
     or has_table_privilege('anon', 'public.product_categories', 'INSERT')
     or has_table_privilege('anon', 'public.product_categories', 'UPDATE')
     or has_table_privilege('anon', 'public.product_categories', 'DELETE')
     or has_table_privilege('anon', 'public.products', 'INSERT')
     or has_table_privilege('anon', 'public.products', 'UPDATE')
     or has_table_privilege('anon', 'public.products', 'DELETE') then
    raise exception 'Anonymous DML privileges remain on public catalogue tables';
  end if;

  if exists (
    select 1
    from information_schema.role_table_grants
    where table_schema = 'public'
      and grantee = 'anon'
      and table_name not in (
        'marketplace_categories', 'marketplace_product_images',
        'marketplace_public_inventory', 'marketplace_public_products',
        'product_categories', 'products'
      )
  ) then
    raise exception 'Unexpected anonymous public-table grant exists';
  end if;
end;
$$;

select 'PASS: Bodhi Rural security release assertions' as result;
