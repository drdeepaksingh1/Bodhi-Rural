-- Remove the legacy broad management read policy that bypasses geographic RLS scope.
-- The RBAC policy below remains the single management path and delegates to
-- farmer_in_user_scope(id), which enforces company, state, district, block,
-- cluster, farmer-leader, and farmer ownership rules.
drop policy if exists "Management can view farmer records"
  on public.farmers;

-- Anonymous users do not participate in farmer/farm operations. Registration
-- and operational access require an authenticated account; approved farmer
-- creation is handled by the existing trusted approval workflow.
revoke all privileges on table public.farmers from anon;
revoke all privileges on table public.farms from anon;
revoke all privileges on table public.bird_batches from anon;
revoke all privileges on table public.egg_production from anon;
revoke all privileges on table public.feed_records from anon;
revoke all privileges on table public.veterinary_records from anon;

