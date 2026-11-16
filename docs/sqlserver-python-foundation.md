# Bodhi Rural — SQL Server and Python Foundation

## Approved direction

- Database: new Microsoft SQL Server database
- Backend: Python + FastAPI
- ORM and connectivity: SQLAlchemy 2 + pyodbc (Microsoft ODBC Driver 18)
- Schema migrations: Alembic
- IDE: Visual Studio Code
- Existing frontend: Next.js 14 / React 18
- Existing data platform: Supabase/PostgreSQL retained during gradual migration

## Target architecture

Next.js frontend → Python FastAPI service → SQL Server

The current Next.js/Supabase paths remain active until each replacement module passes data reconciliation, authorization tests, user acceptance testing, and rollback checks.

## Local database recommendation

Use SQL Server Developer Edition for local development and testing only. Select an appropriately licensed production edition or Azure SQL deployment after capacity, availability, backup, and compliance requirements are confirmed. Do not use Developer Edition in production.

## Audit gates before production migration

1. Inventory tables, relationships, constraints, indexes, triggers, views, functions, and scheduled jobs.
2. Map Supabase Auth identities, roles, sessions, and user lifecycle.
3. Translate PostgreSQL RLS into SQL Server row-level security or API authorization policies.
4. Map PostgreSQL UUID, JSONB, enums, arrays, timestamps, and PL/pgSQL behavior.
5. Plan Supabase Storage and Realtime replacements where used.
6. Reconcile repository migration files with the live Supabase migration registry.
7. Establish backup, restore, reconciliation, observability, and rollback procedures.

## First milestone

- Verify local Python, VS Code, SQL Server, and ODBC Driver installation.
- Start the FastAPI health endpoint.
- Confirm the local API responds before adding a database connection.
- Create the development database only after the local SQL Server instance is verified.

## Safety

No production schema, data, Supabase migration history, or Vercel deployment is changed by this foundation branch. Do not commit .env files or secrets. Use least-privilege SQL logins and encrypted connections.
