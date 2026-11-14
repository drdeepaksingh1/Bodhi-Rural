# Bodhi Rural Digital Platform

Web platform for Bodhi Rural Livelihood & Agri Private Limited, built with Next.js, React and Supabase.

## Current application areas

- Public corporate website
- BodhiFarm farmer and operations workflows
- BodhiMart product catalogue, checkout and seller workflows
- Authentication and role-aware dashboards
- Finance and egg-procurement workflows backed by Supabase RPCs
- Responsive web interface

The repository is an actively integrated application, not the original static prototype. Features and access are enforced through a combination of application checks, Supabase Row Level Security (RLS), database grants and authorized database functions. Do not treat client-side route checks as a substitute for database authorization.

## Technology

- Next.js 14
- React 18
- Supabase Auth and PostgreSQL
- Vercel deployment

## Local development

### Requirements

- Node.js 18.17 or later (use a currently supported LTS release where possible)
- npm
- Access to the configured Supabase project

### Configure environment

Copy `.env.example` to `.env.local` and provide the Supabase project URL and publishable/anon key:

```bash
cp .env.example .env.local
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Set these values in `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon/publishable key for the project

These are browser-visible configuration values. Never put a Supabase service-role key, database password, or other privileged secret in a `NEXT_PUBLIC_*` variable or commit secrets to Git.

### Install and run

```bash
npm install
npm run dev
```

Open http://localhost:3000.

### Production build

```bash
npm run build
npm start
```

## Supabase and database changes

The application is already connected to Supabase. Database migrations are stored in `supabase/migrations/`, but the repository migration history and the live Supabase migration registry have a documented discrepancy. Review [Database Migration Reconciliation](docs/database-migration-reconciliation.md) before applying, replaying, renaming or reconstructing historical migrations.

For a database change:

1. Review the current live schema, policies, grants, triggers and function definitions.
2. Create a new forward-only migration for the intended change.
3. Test it against a non-production environment where available.
4. Review RLS and function authorization as part of the change.
5. Apply only the intended migration and verify the resulting database state.

Do not replay historical SQL or fabricate migration files to make the registry appear aligned.

## Vercel deployment

The production project is deployed through Vercel from this GitHub repository. Configure the two Supabase environment variables above in the Vercel project settings for each required environment (Production, Preview and Development). Redeploy after changing environment variables.

Never commit `.env.local` or production credentials.

## Security notes

- Keep privileged database operations inside authorized server-side/database functions.
- Preserve RLS and least-privilege grants on application tables.
- Validate inputs on both the client and server/database boundary.
- Do not log access tokens, credentials, personal data or unnecessary user identifiers.
- Verify authenticated workflows with appropriately scoped test accounts before release.

## Project status

This repository is under active development. A successful build or deployment does not by itself prove that every role-specific workflow has passed end-to-end testing. Validate farmer, finance, seller and management journeys before production release.
