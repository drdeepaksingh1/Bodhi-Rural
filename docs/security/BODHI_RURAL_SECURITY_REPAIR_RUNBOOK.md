# Bodhi Rural — Security Repair Runbook (Manual Execution)

**Branch:** `security/manual-repair-runbook`  
**Base:** `main` at `50b80421cd76fd65af17a03f6547f3b631b6b70e`  
**Scope:** GitHub issues #61–#67  
**Status:** Preparation only. This document is not an applied migration and is not evidence of a completed repair.

## Safety rules

1. Do not run DDL or permission changes against production first. Create/restore a staging Supabase project and apply there.
2. Take a database backup and record the current migration history before any change.
3. Keep Razorpay online payments disabled until the payment tests in section 7 pass.
4. Do not broaden grants to make a screen work. Prefer narrow RPCs, explicit role/scope checks, and least-privilege grants.
5. Do not put Supabase service-role keys, Razorpay secrets, Aadhaar numbers, bank details, or signed document URLs in GitHub issues or this file.
6. Apply changes as ordered, reviewed migrations. Stop on any unexpected schema difference or failed test.

## Verified production findings from read-only inspection

- `farmer_finance_summary` is a `security_invoker` view and currently has broad authenticated DML grants as well as SELECT.
- `farmer_credit_recoveries` has no authenticated SELECT grant and no RLS policy in the inspected policy listing.
- `farmer_credit` has a farmer-own SELECT policy only.
- Finance role helper `can_access_bodhi_finance()` recognizes SUPER_ADMIN, CEO, CORPORATE_ADMIN and FINANCE.
- The `farmers` management SELECT policy does not include FINANCE.
- `farmer_applications` has broad table privileges for anon and authenticated. Its reviewer SELECT/UPDATE policies authorize by role but do not enforce assigned geographic scope.
- `staff_applications` and `staff_application_approvals` have broad anon/authenticated table privileges. Applicant self-update policy is based on `user_id = auth.uid()` and does not constrain changed columns or review state.
- Admin user management currently attempts browser-side updates to `profiles.role_id`, `location_id` and `is_active`, while authenticated column grants allow only `full_name`, `phone` and `avatar_url`.
- Payment kill-switch issue #67 concerns the payment-order and checkout-config APIs. Do not infer it is fixed until the current PR/source is rechecked and tests pass.

## Preflight — run in staging

Record results before modifying anything:

```sql
select current_database(), current_user, now();

select table_name, column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name in (
    'farmer_finance_summary','farmer_credit_recoveries','farmer_credit',
    'farmer_ledger_entries','farmers','farmer_applications',
    'staff_applications','staff_application_approvals','profiles','roles'
  )
order by table_name, ordinal_position;

select table_name, grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in (
    'farmer_finance_summary','farmer_credit_recoveries','farmer_credit',
    'farmers','farmer_applications','staff_applications',
    'staff_application_approvals','marketplace_carts',
    'marketplace_cart_items','marketplace_customer_addresses'
  )
  and grantee in ('anon','authenticated')
order by table_name, grantee, privilege_type;

select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in (
    'farmer_credit_recoveries','farmer_credit','farmers',
    'farmer_applications','staff_applications','staff_application_approvals'
  )
order by tablename, policyname;

select c.relname as view_name, c.reloptions
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname='public' and c.relname='farmer_finance_summary';
```

Also inspect the exact current definitions of `can_access_bodhi_finance()`, `farmer_in_user_scope(uuid)`, `can_review_staff_applications()`, all relevant triggers, storage policies, and the full view definition. Confirm the signatures and types before writing policies.

## #61 — Finance dashboard permissions

### Required changes

- Keep `farmer_finance_summary` read-only for `authenticated`; revoke INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES and TRIGGER. Retain SELECT only if the view is intended for authenticated callers.
- Enable RLS on `farmer_credit_recoveries` if not already enabled. Add a SELECT policy for active finance roles or a farmer's authorized scope, using the verified helper signatures and the table's actual `farmer_id` type.
- Add the equivalent narrowly scoped finance SELECT policy to `farmer_credit`, retaining farmer-own access.
- Decide whether FINANCE users should see farmer master records. If approved, add a SELECT-only policy for active FINANCE users; do not grant mutation rights.
- Confirm every underlying relation used by the security-invoker view has the required SELECT grant and RLS policy. Do not make the view SECURITY DEFINER merely to bypass the mismatch.

### Candidate least-privilege grant statement (staging only, after review)

```sql
revoke insert, update, delete, truncate, references, trigger
on table public.farmer_finance_summary from authenticated;
grant select on table public.farmer_finance_summary to authenticated;
```

Do not apply until confirming the view is not relied on by any legitimate write path (it should not be).

## #62 — Remove unnecessary anonymous grants

After confirming no guest/anonymous workflow needs these tables, revoke all anon table privileges on:
- `farmer_applications`
- `farmers`
- `marketplace_carts`
- `marketplace_cart_items`
- `marketplace_customer_addresses`
- `staff_applications`
- `staff_application_approvals`

Candidate staging statements:

```sql
revoke all privileges on table public.farmer_applications from anon;
revoke all privileges on table public.farmers from anon;
revoke all privileges on table public.marketplace_carts from anon;
revoke all privileges on table public.marketplace_cart_items from anon;
revoke all privileges on table public.marketplace_customer_addresses from anon;
revoke all privileges on table public.staff_applications from anon;
revoke all privileges on table public.staff_application_approvals from anon;
```

Do not revoke authenticated permissions indiscriminately; preserve legitimate farmer submission and owner-read paths.

## #63 — Secure admin role management

- Replace browser-side direct profile role/location/active updates with a server action or SECURITY DEFINER RPC.
- Verify caller via server-side `auth.getUser()`, active profile, and allowed role code.
- Enforce role-assignment hierarchy and location type consistency (state/district/block/cluster).
- Prevent self-elevation, self-deactivation, and assignment of SUPER_ADMIN/CEO/CORPORATE_ADMIN/FINANCE except by an explicitly authorized higher authority.
- Write immutable audit history with actor, target, previous values, new values and timestamp.
- Keep current self-service profile grants limited to full_name, phone and avatar_url.

## #64 and #65 — Farmer application review and updates

- Implement one shared geographic-scope predicate for list, view, approve and reject. Check active profile, role, and application location against assigned location hierarchy.
- Enforce scope in the database mutation boundary/RPC, not only the UI.
- Use an approval/rejection RPC with row lock, PENDING-only transition, required rejection reason, and server-managed approved_by/approved_at/farmer_id.
- Applicants must not edit ownership, status, approval metadata, Aadhaar/bank data or document paths after submission. If draft editing is required, expose only an allow-list of applicant-editable columns before submission.
- Mask Aadhaar and bank account numbers in list responses.
- Keep document buckets private. Generate short-lived signed URLs only after the same reviewer-scope check; do not expose permanent/public URLs.
- Set per-bucket MIME allow-lists and file-size limits after choosing approved formats and limits. Validate content server-side; browser accept attributes alone are insufficient.

## #66 — Staff application hardening

- Replace applicant broad self-update with an allow-listed draft-edit path, disabled after submission/review begins.
- Keep status, current_stage, approved_at, approved_by, staff_id, application_number and user_id server-managed.
- Revoke unnecessary anon grants.
- Revoke direct applicant writes to approval history; only the secured workflow function may append approval events.
- Require nonblank rejection remarks inside the database function, not only in the UI.
- Confirm the workflow function's role/stage authorization and audit trail before changing grants.

## #67 — Online payment kill switch

Recheck the current payment PR branch and source before coding. The expected files include:
- `src/app/api/bodhimart/payments/order/route.ts`
- `src/app/api/bodhimart/checkout-config/route.ts`
- payment verification and webhook routes
- the migration defining `marketplace_commercial_settings.online_payments_enabled`

Required behavior:
1. Checkout config reports `onlinePaymentsReady=false` if the kill switch is off, even if credentials exist.
2. Payment-order creation/reuse rejects when disabled.
3. Verification/webhook behavior for gateway orders created before disable is explicit, documented and consistent. Do not silently mark captured gateway payments as unpaid or ignore valid signed webhooks.
4. New marketplace orders remain blocked by the existing database guard.
5. The expiry scheduler is operational. Current Vercel Hobby plan rejected a 10-minute cron; use a supported external scheduler or upgrade, and protect the endpoint with a strong CRON_SECRET.
6. Keep credentials in Vercel environment settings only; never commit them.

## Acceptance test matrix — staging only

Use dedicated synthetic users and records. Never use real farmer Aadhaar/bank data.

| Actor | Positive test | Negative test |
|---|---|---|
| FARMER | Read own application/credit and submit allowed application | Read another farmer, access finance summary, alter status/approval/bank/Aadhaar/owner |
| FINANCE | Read permitted finance summary, credit/recovery and approved farmer identity fields | Mutate ledger/credit/recovery, read outside approved policy, administer roles |
| BLOCK_MANAGER | Review/approve/reject applications in assigned block | Read or mutate another block; change protected identity/financial fields |
| SUPER_ADMIN | Authorized role administration and global review | Self-elevate or bypass audit/workflow protections |

Additional tests:
- anon cannot read or mutate private farmer/staff/marketplace tables.
- applicant cannot update after submission or change workflow/ownership fields.
- staff applicant cannot self-approve or write approval history.
- rejection with blank remarks fails at database level.
- signed document URL is denied for out-of-scope reviewer and expires as configured.
- online payments disabled: checkout not ready; order API rejects new/reused gateway orders; no new order can be placed.
- online payments enabled: test successful capture, failed payment retry, invalid signature, wrong amount/currency, webhook replay, duplicate/concurrent webhook, concurrent checkout/stock reservation, unpaid expiry and reservation release.
- seller fulfilment cannot advance before captured payment.
- run `npx tsc --noEmit`, lint, unit/integration tests and production build.

## Manual rollout checklist

- [ ] Back up production database and verify restore procedure.
- [ ] Apply reviewed migrations to staging.
- [ ] Run all tests above and record outputs.
- [ ] Review SQL diff and application code with a second reviewer.
- [ ] Deploy preview and test authenticated flows.
- [ ] Confirm Razorpay credentials/webhook/scheduler configuration without sharing secrets.
- [ ] Schedule production migration window.
- [ ] Apply migrations in order, verify grants/RLS, then deploy application.
- [ ] Re-run smoke tests and monitor Supabase/Postgres and Vercel logs.
- [ ] Keep payment kill switch OFF until payment-specific acceptance tests pass.
- [ ] Close each GitHub issue only when its acceptance criteria are demonstrably met.

**Rollback:** prepare a tested rollback migration and application deployment before production rollout. Do not blindly restore broad grants; restore the previous known-good migration state only after assessing data and policy dependencies.
