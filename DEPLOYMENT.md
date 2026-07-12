# Deployment (self-hosted VPS + Docker)

## Prerequisites on the VPS
- Docker Engine + the Compose plugin (`docker compose version` works).
- A DNS record pointing your domain at the VPS's public IP (needed for Caddy to issue a TLS cert automatically).
- Ports 80 and 443 open/forwarded to the VPS.

## First-time setup
1. Clone the repo onto the VPS:
   ```bash
   git clone https://github.com/jhaley365/hsht.git
   cd hsht
   ```
2. Create a `.env` file (not committed) with real secrets:
   ```bash
   cp .env.example .env
   ```
   Then set, at minimum:
   - `POSTGRES_PASSWORD` — strong password for the database.
   - `AUTH_SECRET` — generate with `openssl rand -base64 32`.
   - `NEXT_PUBLIC_APP_URL` — e.g. `https://hsht.haley365.com`.
   - `HSHT_DOMAIN` — the domain Caddy should request a cert for, e.g. `hsht.haley365.com`.
3. Build and start everything:
   ```bash
   docker compose up -d --build
   ```
   This runs, in order: `db` (Postgres, with a healthcheck), `migrate` (applies Prisma migrations once and exits), then `app`, then `caddy` (reverse proxy + automatic HTTPS via Let's Encrypt).
4. Check status:
   ```bash
   docker compose ps
   docker compose logs -f app
   ```

## Deploying an update
```bash
git pull
docker compose up -d --build
```
`migrate` re-runs `prisma migrate deploy` on every `up`, applying any new migrations before `app` restarts (compose waits for `migrate` to exit successfully first).

## Database backups
Postgres data lives in the `db_data` named volume. At minimum, schedule a nightly dump via cron on the host:
```bash
docker compose exec -T db pg_dump -U hsht hsht | gzip > /backups/hsht-$(date +%F).sql.gz
```
Keep backups off the VPS itself (e.g. rsync/rclone to off-site storage).

## Local development (no Docker required for the app)
```bash
docker compose -f docker-compose.dev.yml up -d   # Postgres only, exposed on localhost:5432
cp .env.example .env                              # DATABASE_URL already matches the dev compose file
npm install
npm run db:migrate                                # creates the schema locally
npm run dev
```

## Rollback
Compose keeps the previous image only if you tag releases (recommended once this is past initial setup — e.g. build with `docker compose build` then `docker tag hsht-app:latest hsht-app:<git-sha>` before deploying, so you can `docker compose up -d` a known-good tag if a deploy misbehaves).

## Troubleshooting notes from the first deploy

These bit us setting up the first VPS (Ubuntu 24.04, AWS EC2) — fixed in the
repo, but worth knowing if you ever stand this up fresh elsewhere:

- **Disk space.** A Next.js + Prisma Docker build needs more than a default
  small root volume (we hit "no space left on device" on a 7GB disk — 20GB+
  is a safer minimum). If you resize an EBS root volume, the block device
  grows immediately but the partition and filesystem don't — you still need
  `sudo growpart /dev/xvda 1 && sudo resize2fs /dev/xvda1` (adjust device
  name per `lsblk`) after resizing in the AWS console.
- **`migrate` service must build from the `builder` Docker stage, not the
  final `runner` stage.** `runner` is a minimal Next.js standalone bundle
  with no Prisma CLI and no `prisma.config.ts` — `docker-compose.yml`'s
  `migrate` service sets `build.target: builder` for this reason. If you
  ever see `npx` fetching a fresh `prisma` package inside a container that
  should already have it installed, this is why.
- **Compose's `.env` substitution doesn't reach files bind-mounted into a
  container.** The `Caddyfile`'s `{$HSHT_DOMAIN:localhost}` reads *Caddy's
  own process environment* — it only gets a real value because
  `docker-compose.yml` explicitly passes `HSHT_DOMAIN` through under the
  `caddy` service's `environment:` block. Without that, Caddy silently
  issues a cert for `localhost` and never matches your real domain.

## Open items to decide before production
- **Domain**: `app.gacomm-enroll.org` (confirmed working, real Let's Encrypt cert issued).
- **Backups**: where should off-site backups land (S3-compatible bucket, another server)?
- **Auth**: who can log in and how (see MIGRATION.md's note on the legacy auth model) — this scaffold ships a `User` table with a role enum but no auth flow wired up yet.
- **Monitoring**: at minimum, uptime checks against the public URL and disk-space alerts on the VPS (Postgres volume growth).
