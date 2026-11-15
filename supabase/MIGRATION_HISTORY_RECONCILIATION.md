# Supabase Migration History Reconciliation

**Review date:** 2026-11-13  
**Supabase project:** `ddsvokqqwkkjlzcuoimi`  
**Repository branch reviewed:** `main` at `e8af616784aa5d3e7a5d0baf78506f0521198dac`

## Purpose

This note records a verified difference between the production Supabase migration registry and the SQL migration files currently committed in this repository. It is documentation only. It does not modify the database or attempt to replay historical migrations.

## Verified snapshot

- Supabase `list_migrations` returned **13** migration registry entries.
- The `supabase/migrations/` directory on `main` contained **9** SQL files.
- One entry matches exactly by timestamp and name: `20261113164201_secure_egg_procurement_workflow`.
- One registry entry has a matching migration name but a different timestamp:
  - Registry: `20261112153704_marketplace_product_admin_controls`
  - Repository file: `20261111090000_marketplace_product_admin_controls.sql`
- The other **11** registry entries do not have an exact timestamp/name file path in the current repository snapshot.
- The other **8** repository SQL files are not represented by an exact timestamp/name entry in the returned live registry.

These counts describe filename/registry alignment only. They do **not** prove that a particular migration's SQL was never applied, that a repository file is safe to replay, or that the live schema is missing an object. Older SQL may have been applied before migration tracking was initialized, and historical migrations may have been renamed or applied manually.

## Live registry entries observed

```text
20261112153704_marketplace_product_admin_controls
20261112154608_secure_farmer_finance_summary_view
20261112154750_restrict_super_admin_helper_anon_execution
20261112155021_harden_internal_tables_and_definer_functions
20261112155042_tighten_definer_function_execute_grants
20261112155302_lock_down_farmer_id_counter_table
20261112205355_revoke_nonessential_location_import_privileges
20261113160245_pin_search_path_on_remaining_trigger_functions
20261113161926_restrict_public_inventory_view_privileges
20261113162104_restrict_marketplace_public_inventory_to_read_only
20261113162231_revoke_api_access_from_rls_tables_without_policies
20261113162519_restrict_marketplace_direct_table_mutation
20261113164201_secure_egg_procurement_workflow
```

## Repository files observed on `main`

```text
20260927090000_marketplace_checkout.sql
20260927150000_seller_order_acceptance.sql
20260927170000_seller_order_processing.sql
20260927180000_seller_order_packing.sql
20260927190000_seller_order_ready.sql
20260927210000_seller_pickup_completed.sql
20260927230000_marketplace_product_inventory_defaults.sql
20261111090000_marketplace_product_admin_controls.sql
20261113164201_secure_egg_procurement_workflow.sql
```

## Safe reconciliation procedure

1. Keep the production database unchanged while reconciling this history.
2. Recover original SQL migration files from trusted source control, deployment artifacts, or reviewed backups. Do not create empty placeholder migrations and do not reconstruct a historical migration from its name alone.
3. For each recovered file, compare its DDL and data effects with the current live schema and migration registry. Review any timestamp/name mismatch explicitly.
4. Do not replay a migration against production merely to make the registry appear aligned. If a migration is already reflected in production, use the Supabase-supported migration repair/baselining procedure only after its exact effects have been verified and approved.
5. Before applying any new migration, commit its complete SQL file to source control, review it, apply it once, and verify both the resulting schema and registry entry.
6. Add a CI/deployment check that flags migrations applied to the target database but absent from the repository, and repository migrations not accounted for in the target database. Treat historical baseline exceptions explicitly rather than silently ignoring them.

## Current disposition

**Status: reconciliation required; no historical migration replay performed.**

The production schema and migration registry remain the source of truth for the deployed environment. This document is an audit trail of the observed mismatch, not a declaration that the database is broken or that all listed repository files should be run again.
