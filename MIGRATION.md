# Migration plan: legacy SQL Server → Postgres/Next.js

This file will be filled in with specifics once the real schema and a sample
data export are available. It captures the plan and the questions that need
answers before the cutover.

## Current state
- **Legacy backend**: unknown application layer, Microsoft SQL Server database.
- **Domain**: tracks students, schools, school districts, and activities
  (participation/enrollment in some form).
- **New app**: `prisma/schema.prisma` in this repo has a *provisional* schema
  (District → School → Student, Activity, StudentActivity join table) inferred
  from that description only — not from the real tables. Treat it as a
  placeholder to be replaced.

## Steps once the schema/export is available

1. **Get the real schema.**
   - Ideal: a `.bak` or a script-generated DDL dump (SSMS: right-click DB →
     Tasks → Generate Scripts).
   - Also useful: a row-count per table, and which tables are actually still
     written to vs. dead/legacy-only.

2. **Reconcile schema differences.**
   - SQL Server types → Postgres equivalents (e.g. `NVARCHAR` → `text`,
     `DATETIME`/`DATETIME2` → `timestamptz`, `BIT` → `boolean`, `UNIQUEIDENTIFIER`
     → `uuid`, `MONEY` → `numeric`, identity columns → `serial`/`identity`).
   - Decide on naming convention (legacy is likely `PascalCase`/`snake_case`
     mixed) vs. the Prisma convention used here (`camelCase` in the schema,
     `snake_case` via `@map` in the actual tables — see existing models for
     the pattern already applied).
   - Identify any stored procedures / triggers / computed columns that encode
     business logic — that logic needs to move into the app layer.

3. **Update `prisma/schema.prisma`** to match the real tables (fields,
   relations, constraints), replacing the provisional models.

4. **Data migration.**
   Two viable approaches, pick based on data volume and downtime tolerance:
   - **`pgloader`** — can migrate directly from SQL Server to Postgres in one
     pass for straightforward schemas (fastest to set up).
   - **Custom ETL script** (Node/TypeScript, using `mssql` to read + Prisma to
     write) — more control when field mappings, dedup, or data cleanup are
     needed, which is common in legacy systems that have accumulated cruft.
   Either way: run against a copy first, diff row counts and spot-check
   records, then do a final delta sync at cutover time.

5. **Cutover plan.**
   - Freeze writes to the legacy system (maintenance window) or run a
     dual-write/backfill period if downtime must be near-zero.
   - Run the final data sync.
   - Point the new app's `DATABASE_URL` at the migrated Postgres instance and
     deploy (see DEPLOYMENT.md).
   - Keep the legacy database and app available read-only for a period after
     cutover as a safety net.

## Open questions (need answers before this plan is finalized)
- What application layer currently sits in front of SQL Server (ASP.NET,
  classic ASP, a reporting tool directly on the DB, etc.)? This affects
  whether there's business logic in the app layer we also need to port.
- Approximate data volume (row counts for the largest tables) — determines
  whether `pgloader` alone is sufficient or a staged ETL is needed.
- Any integrations that read/write this database directly (reporting tools,
  state reporting exports, other internal systems) that also need to be
  repointed at the new database or given an equivalent export.
- Current authentication/authorization model — who logs in today and how
  (this repo's provisional `User` model has a `role` enum but no wired-up
  auth yet; NextAuth/Auth.js is the likely fit for the Next.js app).
