# Migration plan: legacy SQL Server → Postgres/Next.js

## Source

`hsht-schema-tables-export.csv` — an `information_schema.columns` dump of the
legacy Microsoft SQL Server database (schema `dbo`), uploaded 2026-07-11.
No FK constraints, indexes, or row counts were included — relationships below
are inferred from column naming and need confirmation against the live DB
(or a full DDL script — see "Still needed" below).

## Domain (confirmed from the export)

Students are enrolled at a **School**, which belongs to a **District**. Students
participate in **Activities** (school-sponsored programs/events), tracked via
**StudentActivity**. Activities have **ActivityItems**/**ActivityDetails**
(line-item structure) that feed **Invoices** / **InvoiceItems** and a parallel
per-student **StudentInvoiceItems**, priced via **BillingCodes**. Each student
also accumulates **StudentNotes**, **StudentHistory**, **StudentOutcome**
(post-graduation outcomes), **StudentEquipment** (assistive tech issued), and
**StudentProgramCode** entries. **Coordinators** and **UserList** are two
separate legacy login/auth systems (see "Auth" below). **EnrollmentForm** /
**StudentEnrollmentForm** capture the intake paperwork, including disability
accommodation flags (autism, deaf, mobility, speech, etc.) and a signature
capture (currently just a text field — not a real e-signature).

`prisma/schema.prisma` in this repo now models this directly: every model has
a `legacyId Int @unique` and `@@map`/`@map` back to the original table/column
name, so the ETL script below is a close-to-mechanical rename + type
conversion, not a redesign.

## Tables excluded from the schema (and why)

- **`*_BAK`, `*_Backup`, `*_YEP`, `TEMP_*`** — ad hoc backup copies and
  transitional tables (`YEP` = a past "Year End Process" duplicate set).
  Not modeled. If any of these hold data no longer present in the live
  table, flag that before cutover — otherwise they're dead weight.
- **`Report-District-School-Activity-Student`, `Report-Race-Sex`,
  `Report_Activity_District`, `Report_Custom_Activity_1..4`,
  `View_Activity_District`** — these look like saved reporting queries
  (report builders / canned SQL views), not primary entities. Recreate the
  underlying reports as app queries against the modeled tables rather than
  migrating them as tables.
- **`Audit`** — stores `UserName`, `Password`, `IPAddress` per login event
  (i.e. **plaintext passwords logged on every login**). This must not be
  migrated as-is. The new app's auth layer should log login *events*
  (timestamp, user, IP, success/failure) without ever persisting a password.
- **`All_Schools`** — column-for-column identical to `Schools`. Likely either
  (a) a full statewide/regional school directory vs. `Schools` being only the
  subset this program actively serves, or (b) a stale duplicate. **Needs a
  answer from the client** before cutover — if (a), it should be modeled as
  a separate `SchoolDirectory` reference table.
- **`Total_SchoolID`** — two columns (`TotalSchoolID`, `SchoolID`), purpose
  unclear from structure alone (possibly a materialized count/rollup). Ask
  the client; likely fine to drop and recompute via a query if it's a rollup.
- **`InvoiceItems`, `StudentInvoiceItems`** — invoicing was scaffolded but
  never actually used in production (confirmed by the client); these rows
  are broken test/setup data, not real history. See "Confirmed against real
  data" below for the full finding.

## Confirmed against real data (first sync test, 2026-07-12)

Running `scripts/sync-legacy.ts` against the real legacy database (dry-run,
then a real test on `Districts`/`Schools`) surfaced two incorrect assumptions
in the original schema, both now fixed:

- **`Schools.DID` references `Districts.ID` (the numeric surrogate key), not
  `Districts.DistrictID` (the short text code).** Verified directly: all 293
  schools' `DID` values match a `Districts.ID`, zero match `DistrictID`.
  `DistrictID` codes are **not unique** — e.g. `BART` is shared by both
  "Bartow County School District" and "Cartersville City Schools" (17 codes
  are shared across 2-3 districts each, out of 156 total). The codes were
  evidently derived from the county name, not from district identity, so a
  county with both a county-wide and a city school district collide. Fixed:
  `District.code` (renamed from `districtId`) is a plain indexed string, no
  longer `@unique`; `School.districtId` is now an `Int` referencing
  `District.legacyId`.
- **`Schools.SchoolCode` is only unique *within* a district, and even
  `(DID, SchoolCode)` together isn't fully unique** — 3 pairs of genuinely
  different, active schools share both (e.g. `162-005` is both "Mt. Zion High
  School" and "Riverdale High School"). So `School.legacyId` (the surrogate
  `ID`) is the *only* reliable unique key on this table — no composite
  natural key exists in the real data. `schoolCode` is a plain string,
  intentionally with no uniqueness constraint.
- **`StudentActivity` has 10 orphaned rows** (of 82,215) whose `StudentID`
  doesn't exist in `Students` — 7 of those 10 at least exist in
  `StudentArchive` (consistent with a student being archived/removed from
  the live table while their historical activity record stayed put); 3 are
  untraceable even there. Small enough (0.01%) not to block anything, but
  real. This is why `sync-legacy.ts` now **skips and counts** rows that
  violate a foreign key or uniqueness constraint (Prisma error codes P2003/
  P2002) instead of aborting the whole sync — expect small skip counts like
  this scattered across other tables too as the full sync gets exercised
  further; each one should get the same treatment as above (a quick
  read-only diagnostic against the real DB) rather than being assumed away.

- **Invoicing was scaffolded but never actually used in production**
  (confirmed by the client). `InvoiceItems` had 13,812 rows where 100% failed
  on `ActivityDetailsID` (didn't match `ActivityDetails.ID` at all — not
  found in the excluded `_BAK`/`_YEP` tables either, ruling out an
  "archived" explanation) and 99.8% failed on `InvoiceID`; `StudentInvoiceItems`
  (138,573 rows) showed the identical pattern. The 19 rows in `Invoices`
  itself are setup artifacts, not real invoices — note `StartDate`/`EndDate`
  values sitting at the classic never-populated placeholder `1900-01-01`.
  **Decision**: `InvoiceItem` and `StudentInvoiceItem` are not modeled at all
  (removed from `prisma/schema.prisma`) and not synced — there is no real
  history to migrate here. A real invoicing feature should be designed fresh
  against actual future data, not built on this. `Invoice` itself is kept
  (harmless, tiny) in case it's ever useful for reference; `BillingCode` and
  `Vendor` are kept for the same reason, though they're part of the same
  unused feature and are of similarly low value.

Row counts from the same dry-run (resolves open question #7 below — no
`pgloader`/staged-ETL question, this is small enough for `sync-legacy.ts` to
handle in one pass, a few seconds total): Districts 156, Schools 293,
Students 20,276, StudentActivity 82,215, StudentArchive 37,032 (the largest
*migrated* table), StudentProgramCode 32,048. Also notable:
**`EnrollmentForms` (combined `EnrollmentForm` + `StudentEnrollmentForm`) is
only 8 rows total** against 20,276 students — sharpens open question #6
below; this looks like a rarely-used online form, not the primary intake path.

**Lesson for the rest of this migration**: don't assume a legacy text/code
column is a unique key just because it looks like one — verify against row
counts before modeling a `@unique` constraint or a relation on it. The
column-only schema export (no FK/index metadata) means every relationship
inferred from naming should get this same verification treatment before
the final migration, not just Districts/Schools.

### First full sync, end to end (2026-07-12)

With the above fixed, a complete `npm run sync:legacy` run (all tables,
against the real legacy DB) finished cleanly in ~9 minutes: 141 total rows
skipped out of ~300K synced (0.04%) — all small, expected gaps of the kind
already documented above (`StudentActivity` 21, `StudentHistory` 72,
`StudentProgramCode` 38, `StudentOutcome` 1, `StudentNotes` 1), plus one not
yet dug into: **`EnrollmentFormHistory` skipped 100% (all 8 rows)** — given
`EnrollmentForms` itself is already flagged (open question #6) as a
rarely-used feature with only 8 real submissions against 20,276 students,
this is likely the same kind of orphaned-reference gap and not worth
separate investigation unless the client ends up caring about this feature's
history specifically.

## Open questions for the client

1. **`All_Schools` vs `Schools`** — see above.
2. ~~**`Coordinators` vs `UserList`**~~ — **RESOLVED.** Consolidate into one
   `User` table with a role field (see "Auth" below); every migrated account
   starts as `VIEWER`, and an admin promotes specific people to `STAFF`/
   `ADMIN` afterward. `scripts/seed-users.ts` does the consolidation.
3. **Acronyms** in `Schools`/`All_Schools`: all confirmed and labeled on the
   new School detail page. `VR` = Vocational Rehab Counselor, `LN` = HSHT
   Liaison, `SSL` = System Site Liaison. `SS1`-`SS4` are the "Site Sponsor"
   flags: `SS1`=1 means "School System", `SS2`=1 means "HSHT"; `SS3`/`SS4`
   are confirmed unused.
4. **`Activity.PREETS`** and **`ActivityDetails.HSHTCoordinator`** (stored as
   text there, vs. an int FK-shaped column of the same name on `Activity`) —
   confirm meaning/usage.
5. **`StudentActivity.Status`** (int) — what are the valid status codes and
   what do they mean? Needed to model as a proper enum instead of a bare int.
6. **`EnrollmentForm` vs `StudentEnrollmentForm`** — identical column
   structure. Confirm whether one is the "new submission" queue and the
   other "submission of record" for an existing student, or whether one is
   simply stale.
7. **Row counts** for the largest tables (`Students`, `StudentActivity`,
   `StudentInvoiceItems`, `StudentArchive` are likely the biggest) — determines
   whether a straight `pgloader` pass is enough or a staged/batched ETL is
   needed.
8. **Legacy application layer** — what currently sits in front of this
   database (classic ASP/ASP.NET/other)? Any business logic living in stored
   procedures or triggers not visible in this columns-only export needs to be
   found and ported into the new app.
9. **Live integrations** — anything else reading/writing this SQL Server
   database directly (state reporting exports, other internal tools) that
   needs to be repointed or given an equivalent export after cutover.
10. ~~**`Students.EIP`**~~ — **RESOLVED.** Confirmed against the live legacy
    app: it displays "Do you have an IEP?" for this column, so despite the
    column name, it tracks IEP status in practice. The Student Information
    tab now labels it "Do you have an IEP?" accordingly.
11. ~~**`Students.Gender`/`Race`/`EthnicHeritage`/`Grade` are coded as raw
    integers with no lookup table anywhere in the schema.**~~ — **RESOLVED.**
    No `Genders`/`Races`/etc. table exists in the source database — the
    mapping only ever lived in the old app's front-end (ColdFusion
    templates and client confirmation). All four implemented in
    `src/lib/legacy-codes.ts`:
    - **Race** 1-5 = American Indian and Alaska Native / Asian / Black/
      African American / Native Hawaiian and Other Pacific Islander /
      White, 6 = Other (with the free-text `RaceOther` value appended) —
      recovered from `cfif race EQ "..."` in the legacy templates.
    - **Grade** 1-6 = 8th / 9th (Freshman) / 10th (Sophomore) / 11th
      (Junior) / 12th (Senior) / Other (Out of School) — recovered from
      `cfif grade EQ "..."`.
    - **Gender**: `1 = Male`, `0 = Female` — confirmed by the client.
    - **Ethnic Heritage**: `1 = Hispanic or Latino`, `0 = Not Hispanic or
      Latino` — confirmed by the client.
    All four verified against real/seeded data including edge cases
    (padded values, Race=6 + RaceOther, an unmapped grade code falling
    back to its raw value).

## Data migration approach: re-runnable sync, not a one-shot

Decided approach: the legacy SQL Server stays live and authoritative through
development. `scripts/sync-legacy.ts` (`npm run sync:legacy`) is a **re-runnable,
one-directional** sync — SQL Server → Postgres, upserting on `legacyId` — so it
can be run repeatedly during development/testing to refresh Postgres with
current legacy data, and the *same script* is the final sync at cutover.
This is not continuous replication: Postgres is only as fresh as the last run,
and once the new app is live for real writes, the sync must not run again (it
would overwrite those writes). The client should be told explicitly that data
in the new system is for testing/preview only until the final sync + cutover.

**Automated nightly, for this phase only**: a cron job runs the full sync
at 4am Eastern every night (see DEPLOYMENT.md "Scheduled legacy sync"),
since legacy is still authoritative and staff know this app's data is
comparison/testing only right now. This must be turned off once the app
takes over real workflows — a full sync at that point would silently
revert any edit made here to a legacy-sourced row (Activity, ActivityDetail,
and StudentActivity's update payloads all include fields like `closed` /
`deleted` that a nightly run would happily reset back to the legacy value).

It is implemented, typechecked, and its schema/migration have been verified
end-to-end against a real Postgres instance (all 25 tables migrate cleanly via
`prisma migrate dev`). It has **not** yet been run against the real legacy SQL
Server (no network path to it from where this was built) — the first run against
production data is where the open questions below (in particular the Y/N vs 1/0
boolean encoding assumption in `toBool()`) get confirmed or corrected.

**Running it:**
```bash
cp .env.example .env   # if not already done
# set LEGACY_MSSQL_HOST / _USER / _PASSWORD / _DATABASE in .env
npm install
npm run sync:legacy -- --dry-run              # fetch + transform, no writes — check counts first
npm run sync:legacy -- --only=Districts,Schools   # test one/a few tables at a time
npm run sync:legacy                            # full sync
```
It only ever logs row **counts**, never field values — safe to paste its
output anywhere, including back to Claude, since this data includes student
PII (names, birthdates, disability status, race).

**What it does NOT do** (still needs the open questions above resolved):
- Does not touch `All_Schools`, `Total_SchoolID`, or `Audit` (excluded, see above).
- Does not copy `Coordinators.Password` / `UserList.Password` — those accounts
  sync with no password set; real auth + forced reset is separate work (below).
- Assumes Y/N-or-1/0 for legacy boolean-ish columns (`toBool()` in the script)
  — verify against the first real dry-run and adjust if the actual encoding
  differs.
- Treats `EnrollmentForm` and `StudentEnrollmentForm` as two `source`-tagged
  rows in one table (see the open question above) — revisit if the client
  clarifies they mean something more specific.

**Final sync at cutover:** freeze writes on the legacy app (maintenance
window), run `npm run sync:legacy` one last time, validate row counts, then
that Postgres database is what the live app points at from then on — the
sync script should not be run again afterward once real users are writing
to it, since a later run would overwrite their data with stale legacy state.

## Auth

Neither legacy user table is a fit to migrate as-is (plaintext passwords).
**Decided approach**: no passwords are migrated at all — the new app uses
Auth.js (NextAuth v5) with a magic-link **Email** provider (`src/auth.ts`).
Signing in sends a one-time link to the user's email; there is no password
to hash, reset, or leak.

- **Delivery**: SMTP2GO, matching the pattern already used elsewhere for
  this client — the VPS's public IP is whitelisted in SMTP2GO, so port 25
  requires no username/password (`EMAIL_SERVER_HOST=mail.smtp2go.com`,
  `EMAIL_SERVER_PORT=25`, no auth block). This only works from a host
  SMTP2GO has actually whitelisted; it will fail to connect from an
  arbitrary dev machine (confirmed — see "Still needs verification" below).
- **User model**: `prisma/schema.prisma`'s `User` table (plus the
  Auth.js-required `Account`/`Session`/`VerificationToken` tables) is
  separate from the legacy-mirroring `Coordinator`/`StaffUser` staging
  tables. `Coordinator`/`StaffUser` keep getting refreshed by the
  re-runnable `sync:legacy` job; `User` is real app state and must never be
  overwritten by that job.
- **Consolidation**: `npm run seed:users` (`scripts/seed-users.ts`) is a
  one-time-ish, idempotent step that reads `Coordinator` + `StaffUser` (so
  run `sync:legacy` first) and creates a `User` row per unique email,
  defaulting every new account to `VIEWER`. It never touches a `User` row
  that already exists — safe to re-run, will not downgrade a role an admin
  has since set or resurrect a deactivated account. An email present in
  both legacy tables collapses to one `User` row; the script logs which
  emails collided (these are staff/coordinator work addresses, not student
  PII, so — unlike `sync-legacy.ts` — it's fine to log the actual values).
- **Role gating**: `UserRole` is `VIEWER | STAFF | ADMIN`. Route-level
  gating currently just requires *any* authenticated, active user (see
  `src/app/(dashboard)/layout.tsx`) — none of the current pages need
  finer-grained role checks yet (`utility`/`exports`/`reports` are still
  "coming soon" stubs). Add per-role checks when those pages get real
  (likely mutating) functionality.
- **Deactivation**: the `signIn` callback in `src/auth.ts` rejects sign-in
  for any `User` with `active = false`, so deactivating someone blocks a
  still-valid magic link, not just future ones.

**Verified against production (2026-08-10)**, after two real bugs only a
live run could surface (no network path to SMTP2GO from where this was
built, so these couldn't be caught before deploying):

- **Auth.js's Nodemailer provider deep-merges your `server` config over its
  own default, which sets `auth: { user: "", pass: "" }`.** That object is
  still truthy even with blank strings, so nodemailer tried to authenticate
  against SMTP2GO's no-auth relay and failed with `Missing credentials for
  "PLAIN"`. Fix: explicitly pass `auth: false` in the `server` config — only
  an explicit falsy value survives the merge as an override; omitting the
  key just inherits the truthy default.
- **The magic-link URL embedded in the email pointed at the container's
  internal bind address (`0.0.0.0:3000`) instead of the real domain.**
  Self-hosted behind a reverse proxy (Caddy, not Vercel), Auth.js's
  `signIn()` server action builds its callback URL from `AUTH_URL`/
  `NEXTAUTH_URL` if set, otherwise from request headers — and something in
  that header-detection path resolved to the container's own address rather
  than `app.gacomm-enroll.org`. Fix: set `AUTH_URL` explicitly (same value
  as `NEXT_PUBLIC_APP_URL`) so Auth.js never falls back to header
  detection at all. See `DEPLOYMENT.md`.

SMTP2GO delivery itself is confirmed working end-to-end (the email
arrived); the `AUTH_URL` fix for the link itself still needs to be
deployed and re-tested.
