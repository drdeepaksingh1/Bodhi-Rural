-- Seller application records contain business and identity information.
-- Match the read scope to the corporate-management authorization already
-- enforced by approve_marketplace_seller/reject_marketplace_seller and the UI.
drop policy if exists "Marketplace seller applications management select"
  on public.marketplace_seller_applications;

create policy "Corporate management can view seller applications"
  on public.marketplace_seller_applications
  for select
  to authenticated
  using (public.is_bodhi_corporate_management());

-- Seller onboarding requires an authenticated account; applicants retain
-- their own-row SELECT and authenticated INSERT policies.
revoke all privileges on table public.marketplace_seller_applications from anon;
