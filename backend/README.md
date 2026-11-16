# Bodhi Rural Python API

This is the initial FastAPI service foundation. It intentionally starts without a database connection so it can be run and tested before SQL Server is installed or configured.

## Requirements

- Python 3.12
- Microsoft SQL Server Developer Edition for local development only
- Microsoft ODBC Driver 18 for SQL Server
- Visual Studio Code

## Run locally (PowerShell)

From the repository root:

```powershell
cd backend
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Open the health endpoint at http://127.0.0.1:8000/api/health and API docs at http://127.0.0.1:8000/docs.

The health endpoint checks only that the API process is responding. It does not check SQL Server.

## SQL Server integration status

SQLAlchemy, pyodbc, and Alembic are listed as dependencies, but no connection string, database session, schema, or migration has been activated yet. Configure credentials locally using a private .env file only after SQL Server installation and connectivity checks. Never commit credentials or production connection strings.

## Migration approach

- Keep existing Next.js and Supabase functionality operational.
- Build and test SQL Server schema and API module by module.
- Do not dual-write production data without an explicit consistency and rollback design.
- Reconcile PostgreSQL-specific functions, RLS policies, triggers, UUID/JSON types, Supabase Auth, Storage, and Realtime before migrating each dependent module.
- Use reviewed, forward-only Alembic migrations and verified backups.
