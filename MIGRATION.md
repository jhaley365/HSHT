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

## Data migration approach

1. Get a full DDL export (not just columns) — ideally a `.bak` restorable to
   a scratch SQL Server instance, or SSMS "Generate Scripts" output — so real
   FK constraints, defaults, and any computed columns/triggers surface.
2. Resolve the open questions above; update `prisma/schema.prisma` accordingly
   (in particular: whether `All_Schools`/`Total_SchoolID` need modeling, and
   whether `Coordinators`/`UserList` merge).
3. Run `prisma migrate dev` to create the Postgres schema from the finalized
   Prisma models.
4. Migrate data with a custom ETL script (Node/TypeScript, `mssql` package to
   read + `@prisma/client` to write) rather than a blind `pgloader` pass,
   because:
   - Legacy `Active`/flag columns are `varchar(1)`/`int` and need conversion
     to `Boolean`.
   - `Coordinators.Password` / `UserList.Password` are plaintext and must be
     rehashed (e.g. bcrypt/argon2) during migration, never copied verbatim —
     users will need a forced password reset since the plaintext values
     can't ethically inform new hashes in a way that's actually secure
     (reusing the same plaintext to seed a hash still means anyone with prior
     access to the plaintext dump knows it).
   - Several `varchar` columns that should be dates (`Students.EnterDate`) need
     parsing/validation rather than a straight copy.
5. Migrate in dependency order: `SchoolYear`, `Districts` → `Schools` →
   `Coordinators`/`StaffUser` → `Students` → `Activity`/`ActivityItems` →
   `ActivityDetails` → `StudentActivity` → `BillingCodes`/`Vendors` →
   `Invoices`/`InvoiceItems`/`StudentInvoiceItems` → the remaining
   student-detail tables (`StudentNotes`, `StudentHistory`, `StudentOutcome`,
   `StudentEquipment`, `StudentProgramCode`) → `EnrollmentForm`/
   `EnrollmentFormHistory` → `StudentArchive` (historical, can run last/in
   the background) → `AuditLog`.
6. Validate: row counts per table match, spot-check a sample of records
   (especially money fields on invoices — Decimal precision defaults to
   `(10,2)` in the new schema; confirm that matches real billing amounts),
   and re-run the a11y/disability flag conversion (`char(1)` Y/N → Boolean)
   against a manual sample.
7. Cutover: freeze writes on the legacy system (maintenance window) or run a
   delta sync if near-zero downtime is required, do the final sync, repoint
   `DATABASE_URL`, deploy (see DEPLOYMENT.md), keep the legacy DB read-only as
   a fallback for a period after cutover.

## Auth

Neither legacy user table is a fit to migrate as-is (plaintext passwords).
The new app should introduce real auth (e.g. Auth.js/NextAuth with a
credentials provider backed by hashed passwords, or SSO if the client has
an identity provider) and force a password reset for all migrated accounts
rather than attempting to preserve/rehash the legacy plaintext values.
