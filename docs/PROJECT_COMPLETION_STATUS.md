# Bodhi Rural project completion status

**Project:** Existing Bodhi Rural repository and Supabase project  
**Repository:** `drdeepaksingh1/Bodhi-Rural`  
**Supabase project:** `ddsvokqqwkkjlzcuoimi`  
**Status checked:** 15 November 2026  
**Working PR:** [#72 — Farmer application review and KYC security](https://github.com/drdeepaksingh1/Bodhi-Rural/pull/72)

This document records verified work and remaining gates. A successful TypeScript check or production build is not an end-to-end production acceptance test.

## Phase tracker

| Phase | Scope | Current status | Evidence / remaining work |
|---|---|---|---|
| 1. Security | RLS, roles, permissions, RPCs, storage and data protection | In progress | Farmer-application review is routed through a scoped RPC; KYC buckets are private and restricted. Removed a legacy broad farmer visibility policy and anonymous table privileges from core farm tables in migration `20261115090000_scope_legacy_farmer_management_policy`. Restricted seller-application reads to corporate management in migration `20261115091000_scope_marketplace_seller_application_reads`. Two public marketplace views still trigger SECURITY DEFINER findings; review 43 authenticated SECURITY DEFINER functions individually. |
| 2. Backend | Schema, migrations, functions, workflows and integrity | In progress | Live migration registry currently has 27 entries. Repository history is not fully reconciled; do not replay or fabricate historical migrations. Continue validating finance, procurement, inventory and marketplace RPC invariants. |
| 3. Frontend | Farmer registration, dashboards, admin, supervisor and management panels | Build verified; functional testing pending | Current application passes TypeScript and Next.js production build in GitHub Actions. Role-by-role route and workflow testing requires signed-in test accounts. |
| 4. Business modules | Farmer management, livestock, feed, inventory, orders and marketplace | In progress | Existing modules and workflows are present. Verify complete CRUD, authorization, stock movements, financial calculations, order state transitions and edge cases using non-production test accounts/data. |
| 5. User experience | Hindi/English, mobile responsiveness, navigation and validation | In progress | Root document currently declares English. Verify translation coverage and mobile layouts across every role/module; no full bilingual acceptance test is recorded. |
| 6. Testing | TypeScript, CI, database checks, security review and deployment checks | Partial | TypeScript and production build passed on commit `147dcee...`; later commits include database hardening, documentation and read-only release assertions. The latest CI run is tracked in GitHub Actions. Supabase health advisor returned no findings. SQL configuration checks passed for the farmer security change. Signed-in end-to-end tests remain outstanding. |
| 7. Deployment | GitHub integration, Vercel and production verification | Partial | Vercel reported the PR preview deployment Ready. This does not establish that the production domain is running the approved release. Production environment variables and production smoke tests remain to be checked. |
| 8. Final launch | Final checklist, unresolved issues and handover | Not ready | Keep PR #72 in draft until the outstanding release gates pass. Merge and production release require owner review and account-level access. |

## Verified production database changes

### Farmer application and KYC protection

- Reviewer scope is enforced by `can_review_farmer_application(uuid)`.
- Approve/reject actions use `review_farmer_application(uuid,text,text)`.
- Authenticated direct UPDATE on `farmer_applications` is revoked.
- KYC buckets `farmer-photos`, `farmer-aadhaar`, and `farmer-bank-documents` are private.
- Photo upload limit is 5 MB; KYC document limit is 10 MB. Allowed MIME types are restricted to JPEG, PNG, WebP and PDF for KYC.
- Review document access uses short-lived signed URLs and a scope-aware storage policy.
- No test farmer records or business transactions were created.

### Additional farmer-table scope fix

A legacy permissive SELECT policy on `public.farmers` allowed all active state, district, block and cluster managers to read farmer records without applying geographic scope. Because permissive RLS policies are combined with OR, this undermined the newer scoped policy.

Migration `20261115090000_scope_legacy_farmer_management_policy`:
- drops the legacy `Management can view farmer records` policy;
- retains `RBAC management can view farmers`, which calls `farmer_in_user_scope(id)`;
- revokes all table privileges from `anon` on `farmers`, `farms`, `bird_batches`, `egg_production`, `feed_records`, and `veterinary_records`.

Post-migration verification:
- the legacy broad policy is absent;
- the remaining management SELECT policy calls `farmer_in_user_scope(id)`;
- no anonymous table grants remain on those six tables.

### Seller application privacy fix

A broad seller-application SELECT policy allowed all state, district, block and cluster managers to read seller application records, while the approval/rejection RPCs and UI authorize only corporate management.

Migration `20261115091000_scope_marketplace_seller_application_reads`:
- replaces the broad management SELECT policy with `is_bodhi_corporate_management()`;
- preserves applicants' own-row SELECT and authenticated INSERT policies;
- revokes anonymous table privileges.

### Seller application privacy fix

A broad seller-application SELECT policy allowed all state, district, block and cluster managers to read seller application records, while the approval/rejection RPCs and UI authorize only corporate management.

Migration `20261115091000_scope_marketplace_seller_application_reads`:
- replaces the broad management SELECT policy with `is_bodhi_corporate_management()`;
- preserves applicants' own-row SELECT and authenticated INSERT policies;
- revokes anonymous table privileges.

### Security release assertions

Added `supabase/tests/security_release_assertions.sql`. It checks farmer review grants, scoped farmer and seller-application policies, anonymous grants on protected operational tables, KYC bucket privacy/size limits and the reviewer storage policy. The assertion block was executed against the connected production database and returned PASS; it makes no application-data changes.

## Current Supabase advisor findings

- Health advisor: no findings.
- Security advisor: 2 SECURITY DEFINER views remain (`marketplace_public_inventory`, `marketplace_public_products`).
- Security advisor: 8 anonymous-executable SECURITY DEFINER location lookup functions remain. They support public registration location selectors; retain only after confirming their bodies return public geography data and have pinned search paths.
- Security advisor: 43 authenticated-executable SECURITY DEFINER functions remain. Review each function's authorization checks; do not revoke them in bulk.
- 14 RLS-enabled tables have no policies. These include internal counters, audit, inventory and internal staff/warehouse tables. Confirm their API grants remain revoked rather than adding permissive policies.
- Performance advisor reports 89 unindexed foreign keys, 37 multiple-permissive-policy notices and 2 duplicate-index pairs. Prioritize high-traffic tables and confirm duplicates before dropping indexes.

## Migration history

The live Supabase registry currently reports 27 migration entries. The repository's default branch migration directory previously contained 9 SQL files, while this PR adds farmer security migrations. Historical migration reconciliation remains separate from applying new migrations. Recover original SQL or establish a verified baseline; never fabricate empty migrations or replay unknown historical changes.

## Required owner/manual release gates

1. Review PR #72 and the added migration. Keep the PR draft until acceptance testing is complete.
2. Use non-production test accounts for SUPER_ADMIN, CEO, STATE_MANAGER, DISTRICT_MANAGER, BLOCK_MANAGER, CLUSTER_SUPERVISOR, FARMER_LEADER, FARMER, FINANCE, HR, MARKETPLACE_ADMIN, SHOPKEEPER and CUSTOMER. Active production profiles currently exist only for CEO, SUPER_ADMIN and HR; geography-scoped roles need safe test accounts and assignments.
3. Test farmer registration, valid/invalid uploads, own-document access, cross-user denial, scoped review, approval and rejection with a reason.
4. Test farm/batch/egg/feed/veterinary, procurement, expenses, payments and finance summaries.
5. Test seller onboarding, product listing and approval, stock reservation, customer checkout, seller fulfilment and order status transitions.
6. Reconcile migration history and run all migrations against a non-production environment before production rollout.
7. Resolve marketplace public-view SECURITY DEFINER findings without breaking anonymous catalogue browsing; test the view as anon and authenticated users.
8. Enable leaked-password protection where supported by the Supabase plan and dashboard.
9. Confirm Vercel production environment variables, production deployment, custom domain, auth redirects and live smoke tests.
10. Merge and release only after all required checks are green and a project owner approves.

## Safety note

No production business data was fabricated, bulk edited or deleted. No unverified migration history was replayed. Production DDL changes recorded above are narrowly scoped security hardening changes and were verified after application.
