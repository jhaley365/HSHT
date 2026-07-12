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

Row counts from the same dry-run (resolves open question #7 below — no
`pgloader`/staged-ETL question, this is small enough for `sync-legacy.ts` to
handle in one pass, a few seconds total): Districts 156, Schools 293,
Students 20,276, StudentActivity 82,215, StudentInvoiceItems 138,573 (the
largest table), StudentArchive 37,032, StudentProgramCode 32,048. Also
notable: **`EnrollmentForms` (combined `EnrollmentForm` + `StudentEnrollmentForm`)
is only 8 rows total** against 20,276 students — sharpens open question #6
below; this looks like a rarely-used online form, not the primary intake path.

**Lesson for the rest of this migration**: don't assume a legacy text/code
column is a unique key just because it looks like one — verify against row
counts before modeling a `@unique` constraint or a relation on it. The
column-only schema export (no FK/index metadata) means every relationship
inferred from naming should get this same verification treatment before
the final migration, not just Districts/Schools.

## Open questions for the client

1. **`All_Schools` vs `Schools`** — see above.
2. **`Coordinators` vs `UserList`** — two separate login tables (`Coordinators`
   has Email/Password/Active; `UserList` has Email/Password/Active/AccessLevel).
   Are these genuinely two different user populations (e.g. field coordinators
   vs. internal admin staff), or should they consolidate into one `users` table
   with a role field in the new app?
3. **Unconfirmed acronyms** in `Schools`/`All_Schools`: `VR` (Vocational
   Rehab?), `LN`, `SSL`, and `SS1`-`SS4` columns — need plain-English
   definitions to label them properly in the new UI (carried over verbatim
   in the schema for now).
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
The new app should introduce real auth (e.g. Auth.js/NextAuth with a
credentials provider backed by hashed passwords, or SSO if the client has
an identity provider) and force a password reset for all migrated accounts
rather than attempting to preserve/rehash the legacy plaintext values.
