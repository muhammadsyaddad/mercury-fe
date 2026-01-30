# Database package

This package contains the Drizzle schema and migrations for the Vision Dashboard.

## Environment

Set a PostgreSQL connection string in `DATABASE_URL` (Cloud SQL on GCP).

## Commands

- `bun run migrate` (from `dashboard/`) runs Drizzle migrations
- `bun --cwd packages/db generate` generates migrations from schema changes
