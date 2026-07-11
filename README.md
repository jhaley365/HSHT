# HSHT

Modernized client application for tracking students, schools, districts, and
activities — a rebuild of a legacy Microsoft SQL Server–backed system.

- **Frontend/backend**: Next.js (App Router, TypeScript, Tailwind CSS)
- **Database**: Postgres via Prisma
- **Deployment**: Docker Compose on a self-hosted VPS, TLS via Caddy

## Status

Early scaffold. `prisma/schema.prisma` is modeled from the real legacy SQL
Server schema export (`hsht-schema-tables-export.csv`) — see `MIGRATION.md`
for the full table inventory, exclusions, and open questions that need
answers before the schema is finalized. The enrollment dashboard UI package
(`Legacy interface upgrade.zip` → `design_handoff_enrollment_dashboard/`) has
been uploaded but not yet implemented in the app.

## Getting started (local dev)

```bash
docker compose -f docker-compose.dev.yml up -d   # Postgres on localhost:5432
cp .env.example .env
npm install
npm run db:migrate                                # apply schema, generate client
npm run dev                                        # http://localhost:3000
```

## Scripts

| Command                     | Purpose                                   |
|------------------------------|--------------------------------------------|
| `npm run dev`                | Start the Next.js dev server               |
| `npm run build`               | Prisma generate + production build         |
| `npm run start`               | Run the production build                   |
| `npm run lint`                | ESLint                                     |
| `npm run typecheck`           | `tsc --noEmit`                             |
| `npm run db:migrate`          | Create/apply a migration in dev            |
| `npm run db:migrate:deploy`   | Apply pending migrations (used in Docker)  |
| `npm run db:studio`           | Prisma Studio (browse the database)        |

## Project docs

- [`DEPLOYMENT.md`](./DEPLOYMENT.md) — VPS/Docker deployment and operations runbook.
- [`MIGRATION.md`](./MIGRATION.md) — plan for migrating off the legacy SQL Server database.

## Repo layout

```
src/app/              Next.js App Router routes
prisma/schema.prisma  Data model (provisional, pending real schema)
Dockerfile            Multi-stage build → standalone Next.js server
docker-compose.yml    Production stack: db, migrate, app, caddy
docker-compose.dev.yml  Postgres only, for local development
Caddyfile             Reverse proxy + automatic HTTPS config
```
