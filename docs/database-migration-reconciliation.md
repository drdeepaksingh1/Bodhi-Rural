# Database migration reconciliation

**Repository:** drdeepaksingh1/Bodhi-Rural  
**Database:** Supabase project ddsvokqqwkkjlzcuoimi  
**Checked:** 14 November 2026  
**Scope:** Read-only comparison of the repository migration directory and the live Supabase migration registry. No database objects or migration records were changed during this review.

## Executive finding

The repository and live Supabase migration registry are not currently aligned.

- The live Supabase registry reports **13 migration entries**.
- The supabase/migrations/ directory on main contains **9 SQL files**.
- Only one file has an exact version-and-name match in the live registry: 20261113164201_secure_egg_procurement_workflow.sql.
- One additional migration has a matching name but a different version: the repository file is 20261111090000_marketplace_product_admin_controls.sql, while the live registry records 20261112153704_marketplace_product_admin_controls.
- The other 11 live registry entries have no exact corresponding file path in the current repository tree.
- Seven repository SQL files dated 27 September 2026 have no exact version/name entry in the live registry.

This is a reconciliation issue, not proof that any particular schema change is missing. The live database may contain changes whose original SQL files were never committed, and the repository may contain historical SQL whose application is not represented by the current registry.

## Live Supabase migration registry

The following entries were returned by the Supabase migration registry on 14 November 2026:

| Version | Name |
|---|---|
| 20261112153704 | marketplace_product_admin_controls |
| 20261112154608 | secure_farmer_finance_summary_view |
| 20261112154750 | restrict_super_admin_helper_anon_execution |
| 20261112155021 | harden_internal_tables_and_definer_functions |
| 20261112155042 | tighten_definer_function_execute_grants |
| 20261112155302 | lock_down_farmer_id_counter_table |
| 20261112205355 | revoke_nonessential_location_import_privileges |
| 20261113160245 | pin_search_path_on_remaining_trigger_functions |
| 20261113161926 | restrict_public_inventory_view_privileges |
| 20261113162104 | restrict_marketplace_public_inventory_to_read_only |
| 20261113162231 | revoke_api_access_from_rls_tables_without_policies |
| 20261113162519 | restrict_marketplace_direct_table_mutation |
| 20261113164201 | secure_egg_procurement_workflow |

## SQL files present on main

| File | Registry correspondence |
|---|---|
| 20260927090000_marketplace_checkout.sql | No exact registry entry |
| 20260927150000_seller_order_acceptance.sql | No exact registry entry |
| 20260927170000_seller_order_processing.sql | No exact registry entry |
| 20260927180000_seller_order_packing.sql | No exact registry entry |
| 20260927190000_seller_order_ready.sql | No exact registry entry |
| 20260927210000_seller_pickup_completed.sql | No exact registry entry |
| 20260927230000_marketplace_product_inventory_defaults.sql | No exact registry entry |
| 20261111090000_marketplace_product_admin_controls.sql | Same name exists in registry under version 20261112153704; version differs |
| 20261113164201_secure_egg_procurement_workflow.sql | Exact version/name match |

## Required reconciliation procedure

1. Preserve the live database as the source of truth for its current state. Do not reset it or replay migrations merely to make the registry look aligned.
2. Recover original SQL scripts from trusted Git history, deployment records, backups, or approved change records where possible.
3. For each recovered script, compare its intended DDL and data changes with the live schema and data before deciding whether it belongs in the migration history.
4. Do not create empty or guessed SQL files to represent unknown historical changes.
5. Do not rename or re-version an already-applied migration as a cosmetic fix. Resolve the marketplace_product_admin_controls version mismatch only after verifying the original script and the exact live change.
6. If a historical script cannot be recovered, document the verified live state as a baseline/reconciliation artifact. Any baseline procedure must be reviewed and tested before it is used by deployment automation.
7. For every new change, commit the migration file first, review it, then apply it once to the intended environment. Record the resulting version and verify the live schema afterward.
8. Add a CI check that flags migration files absent from the registry and registry entries without corresponding source files, while allowing explicitly documented legacy/baseline exceptions.

## Safety status

- This report is documentation only.
- No migration was applied, rolled back, renamed, fabricated, or replayed.
- No live database schema, data, or migration registry was modified.
- Reconciliation remains open until the historical SQL or an independently verified baseline is available.
