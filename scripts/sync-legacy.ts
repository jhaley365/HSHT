// Re-runnable sync from the legacy SQL Server database into the new Postgres
// database. Safe to run repeatedly during development/testing (upserts keyed
// on legacyId) and as the final sync at cutover. See MIGRATION.md.
//
// SAFETY: this script logs row COUNTS only — it never prints field values,
// since this data includes student PII (names, birthdates, disability
// status, race). Do not add logging that prints individual records.
//
// Real legacy data has scattered small referential-integrity gaps (see
// MIGRATION.md — e.g. a handful of StudentActivity rows whose StudentID no
// longer exists in Students). Rather than aborting the whole sync on each
// one, safeUpsert() skips a row that violates a foreign key or uniqueness
// constraint and counts it; every job reports how many it skipped.
//
// Usage:
//   npm run sync:legacy                         # sync everything
//   npm run sync:legacy -- --only=Students,Schools
//   npm run sync:legacy -- --dry-run            # fetch + transform, no writes
//
// Required env vars (see .env.example):
//   LEGACY_MSSQL_HOST, LEGACY_MSSQL_PORT, LEGACY_MSSQL_USER,
//   LEGACY_MSSQL_PASSWORD, LEGACY_MSSQL_DATABASE

import "dotenv/config";
import sql from "mssql";
import { prisma } from "../src/lib/prisma";

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const ONLY = args.find((a) => a.startsWith("--only="))?.slice("--only=".length).split(",");

function shouldRun(name: string) {
  return !ONLY || ONLY.includes(name);
}

type JobResult = { total: number; skipped: number };

// --- transform helpers -------------------------------------------------

// Legacy boolean-ish columns show up as int (0/1) or varchar(1)/char(1)
// ('Y'/'N' by convention in most SQL Server apps). Permissive on purpose —
// confirm the real encoding against the first dry-run before trusting this
// for the disability/accommodation flags.
function toBool(v: unknown): boolean {
  if (v === null || v === undefined) return false;
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  const s = String(v).trim().toUpperCase();
  return s === "Y" || s === "1" || s === "T" || s === "TRUE";
}

function toDecimal(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

// P2003 = foreign key constraint failed, P2002 = unique constraint failed.
// Both indicate a row referencing/duplicating something that doesn't hold up
// in the real data (see MIGRATION.md) — skip it rather than abort the sync.
function isSkippableConstraintError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    typeof (err as { code?: unknown }).code === "string" &&
    ["P2003", "P2002"].includes((err as { code: string }).code)
  );
}

async function safeUpsert(fn: () => Promise<unknown>): Promise<boolean> {
  try {
    await fn();
    return true;
  } catch (err) {
    if (isSkippableConstraintError(err)) return false;
    throw err;
  }
}

// --- connection ----------------------------------------------------------

async function getLegacyPool() {
  const host = process.env.LEGACY_MSSQL_HOST;
  const user = process.env.LEGACY_MSSQL_USER;
  const password = process.env.LEGACY_MSSQL_PASSWORD;
  const database = process.env.LEGACY_MSSQL_DATABASE;
  if (!host || !user || !password || !database) {
    throw new Error(
      "Missing LEGACY_MSSQL_HOST / LEGACY_MSSQL_USER / LEGACY_MSSQL_PASSWORD / LEGACY_MSSQL_DATABASE env vars"
    );
  }
  return sql.connect({
    server: host,
    port: Number(process.env.LEGACY_MSSQL_PORT ?? 1433),
    user,
    password,
    database,
    options: {
      encrypt: (process.env.LEGACY_MSSQL_ENCRYPT ?? "true") === "true",
      trustServerCertificate: (process.env.LEGACY_MSSQL_TRUST_SERVER_CERTIFICATE ?? "true") === "true",
    },
  });
}

// --- sync jobs, in dependency order --------------------------------------
// Each job fetches every row from its legacy table and upserts into Postgres
// keyed on legacyId. Excluded tables (backups, TEMP_*, Report_*/View_*,
// Audit, All_Schools, Total_SchoolID) are intentionally not here — see
// MIGRATION.md.

async function syncSchoolYear(pool: sql.ConnectionPool): Promise<JobResult> {
  const { recordset } = await pool.request().query("SELECT * FROM dbo.SchoolYear");
  if (DRY_RUN) return { total: recordset.length, skipped: 0 };
  let skipped = 0;
  for (const row of recordset) {
    const data = { label: row.SchoolYear, beginDate: row.BeginDate, endDate: row.EndDate };
    const ok = await safeUpsert(() =>
      prisma.schoolYear.upsert({
        where: { legacyId: row.ID },
        create: { legacyId: row.ID, ...data },
        update: data,
      })
    );
    if (!ok) skipped++;
  }
  return { total: recordset.length, skipped };
}

async function syncDistricts(pool: sql.ConnectionPool): Promise<JobResult> {
  const { recordset } = await pool.request().query("SELECT * FROM dbo.Districts");
  if (DRY_RUN) return { total: recordset.length, skipped: 0 };
  let skipped = 0;
  for (const row of recordset) {
    const data = {
      code: row.DistrictID,
      name: row.DistrictName,
      county: row.County,
      active: toBool(row.Active),
      notes: row.Notes,
      coordinator: row.HSHTCoordinator,
      vrQuadrant: row.VRQuadrant,
      serviceArea: row.HSHTServiceArea,
    };
    const ok = await safeUpsert(() =>
      prisma.district.upsert({
        where: { legacyId: row.ID },
        create: { legacyId: row.ID, ...data },
        update: data,
      })
    );
    if (!ok) skipped++;
  }
  return { total: recordset.length, skipped };
}

async function syncSchools(pool: sql.ConnectionPool): Promise<JobResult> {
  const { recordset } = await pool.request().query("SELECT * FROM dbo.Schools");
  if (DRY_RUN) return { total: recordset.length, skipped: 0 };
  let skipped = 0;
  for (const row of recordset) {
    const data = {
      districtId: parseInt(row.DID, 10),
      schoolCode: row.SchoolCode,
      name: row.Name,
      streetAddress: row.StreetAddress,
      city: row.City,
      state: row.State,
      zip: row.Zip,
      schoolType: row.SchoolType,
      active: toBool(row.Active),
      notes: row.Notes,
      mailingAddress: row.MailingAddress,
      mailingCity: row.MailingCity,
      mailingState: row.MailingState,
      mailingZip: row.MailingZip,
      vrFirstName: row.VRFirstName,
      vrLastName: row.VRLastName,
      vrOffice: row.VROffice,
      vrEmail: row.VREmail,
      lnFirstName: row.LNFIrstName,
      lnLastName: row.LNLastName,
      lnOfficePhone: row.LNOfficePhone,
      lnOfficePhoneExt: row.LNOfficePhoneExt,
      lnMobilePhone: row.LNMobilePhone,
      lnEmail: row.LNEmail,
      sslFirstName: row.SSLFirstName,
      sslLastName: row.SSLLastName,
      sslOfficePhone: row.SSLOfficePhone,
      sslOfficePhoneExt: row.SSLOfficePhoneExt,
      sslMobilePhone: row.SSLMobilePhone,
      sslEmail: row.SSLEmail,
      ss1: row.SS1 ?? 0,
      ss2: row.SS2 ?? 0,
      ss3: row.SS3 ?? 0,
      ss4: row.SS4 ?? 0,
    };
    const ok = await safeUpsert(() =>
      prisma.school.upsert({
        where: { legacyId: row.ID },
        create: { legacyId: row.ID, ...data },
        update: data,
      })
    );
    if (!ok) skipped++;
  }
  return { total: recordset.length, skipped };
}

async function syncCoordinators(pool: sql.ConnectionPool): Promise<JobResult> {
  const { recordset } = await pool.request().query("SELECT * FROM dbo.Coordinators");
  if (DRY_RUN) return { total: recordset.length, skipped: 0 };
  let skipped = 0;
  for (const row of recordset) {
    // Deliberately NOT copying row.Password — see MIGRATION.md "Auth".
    const data = {
      firstName: row.FirstName,
      lastName: row.LastName,
      email: row.Email,
      active: toBool(row.Active),
    };
    const ok = await safeUpsert(() =>
      prisma.coordinator.upsert({
        where: { legacyId: row.ID },
        create: { legacyId: row.ID, ...data },
        update: data,
      })
    );
    if (!ok) skipped++;
  }
  return { total: recordset.length, skipped };
}

async function syncStaffUsers(pool: sql.ConnectionPool): Promise<JobResult> {
  const { recordset } = await pool.request().query("SELECT * FROM dbo.UserList");
  if (DRY_RUN) return { total: recordset.length, skipped: 0 };
  let skipped = 0;
  for (const row of recordset) {
    // Deliberately NOT copying row.Password — see MIGRATION.md "Auth".
    const data = {
      firstName: row.FirstName,
      lastName: row.LastName,
      email: row.Email,
      userName: row.UserName,
      accessLevel: row.AccessLevel,
      active: toBool(row.Active),
    };
    const ok = await safeUpsert(() =>
      prisma.staffUser.upsert({
        where: { legacyId: row.ID },
        create: { legacyId: row.ID, ...data },
        update: data,
      })
    );
    if (!ok) skipped++;
  }
  return { total: recordset.length, skipped };
}

async function syncVendors(pool: sql.ConnectionPool): Promise<JobResult> {
  const { recordset } = await pool.request().query("SELECT * FROM dbo.Vendors");
  if (DRY_RUN) return { total: recordset.length, skipped: 0 };
  let skipped = 0;
  for (const row of recordset) {
    const data = {
      name: row.Name,
      vendorCode: row.VendorCode,
      address: row.Address,
      city: row.City,
      state: row.State,
      zip: row.Zip,
      email: row.Email,
      contact: row.Contact,
      phone: row.Phone,
      notes: row.Notes,
    };
    const ok = await safeUpsert(() =>
      prisma.vendor.upsert({
        where: { legacyId: row.ID },
        create: { legacyId: row.ID, ...data },
        update: data,
      })
    );
    if (!ok) skipped++;
  }
  return { total: recordset.length, skipped };
}

async function syncBillingCodes(pool: sql.ConnectionPool): Promise<JobResult> {
  const { recordset } = await pool.request().query("SELECT * FROM dbo.BillingCodes");
  if (DRY_RUN) return { total: recordset.length, skipped: 0 };
  let skipped = 0;
  for (const row of recordset) {
    const data = {
      billingCode: row.BillingCode,
      fee: toDecimal(row.Fee),
      active: toBool(row.Active),
    };
    const ok = await safeUpsert(() =>
      prisma.billingCode.upsert({
        where: { legacyId: row.ID },
        create: { legacyId: row.ID, ...data },
        update: data,
      })
    );
    if (!ok) skipped++;
  }
  return { total: recordset.length, skipped };
}

async function syncActivities(pool: sql.ConnectionPool): Promise<JobResult> {
  const { recordset } = await pool.request().query("SELECT * FROM dbo.Activity");
  if (DRY_RUN) return { total: recordset.length, skipped: 0 };
  let skipped = 0;
  for (const row of recordset) {
    const data = {
      name: row.Name,
      description: row.Description,
      activityDate: row.ActivityDate,
      startDate: row.StartDate,
      endDate: row.EndDate,
      schoolId: row.SchoolID,
      closed: toBool(row.Closed),
      billed: toBool(row.Billed),
      deleted: toBool(row.Deleted),
      createDate: row.CreateDate,
      preets: row.PREETS,
      coordinatorId: row.HSHTCoordinator ?? null,
    };
    const ok = await safeUpsert(() =>
      prisma.activity.upsert({
        where: { legacyId: row.ID },
        create: { legacyId: row.ID, ...data },
        update: data,
      })
    );
    if (!ok) skipped++;
  }
  return { total: recordset.length, skipped };
}

async function syncActivityItems(pool: sql.ConnectionPool): Promise<JobResult> {
  const { recordset } = await pool.request().query("SELECT * FROM dbo.ActivityItems");
  if (DRY_RUN) return { total: recordset.length, skipped: 0 };
  let skipped = 0;
  for (const row of recordset) {
    const data = {
      activityItemId: row.ActivityItemID,
      group: row.Group,
      description: row.Description,
      billingCode: row.BillingCode,
      enabled: toBool(row.Enabled),
    };
    const ok = await safeUpsert(() =>
      prisma.activityItem.upsert({
        where: { legacyId: row.ID },
        create: { legacyId: row.ID, ...data },
        update: data,
      })
    );
    if (!ok) skipped++;
  }
  return { total: recordset.length, skipped };
}

async function syncActivityDetails(pool: sql.ConnectionPool): Promise<JobResult> {
  const { recordset } = await pool.request().query("SELECT * FROM dbo.ActivityDetails");
  if (DRY_RUN) return { total: recordset.length, skipped: 0 };
  let skipped = 0;
  for (const row of recordset) {
    const data = {
      activityId: row.ActivityID,
      activityItemId: row.ActivityItemID,
      description: row.Description,
      hsht: toBool(row.HSHT),
      hshtCoordinator: row.HSHTCoordinator,
      other: toBool(row.Other),
      otherDetail: row.OtherDetail,
    };
    const ok = await safeUpsert(() =>
      prisma.activityDetail.upsert({
        where: { legacyId: row.ID },
        create: { legacyId: row.ID, ...data },
        update: data,
      })
    );
    if (!ok) skipped++;
  }
  return { total: recordset.length, skipped };
}

async function syncStudents(pool: sql.ConnectionPool): Promise<JobResult> {
  const { recordset } = await pool.request().query("SELECT * FROM dbo.Students");
  if (DRY_RUN) return { total: recordset.length, skipped: 0 };
  let skipped = 0;
  for (const row of recordset) {
    const data = {
      schoolId: row.SchoolID,
      firstName: row.FirstName,
      middleName: row.MiddleName,
      lastName: row.LastName,
      birthDate: row.BirthDate,
      phone: row.Phone,
      emailAddress: row.EmailAddress,
      streetAddress: row.StreetAddress,
      city: row.City,
      state: row.State,
      zip: row.Zip,
      county: row.County,
      active: toBool(row.Active),
      gender: row.Gender,
      race: row.Race,
      raceOther: row.RaceOther,
      ethnicHeritage: row.EthnicHeritage,
      autism: toBool(row.Autism),
      aspergers: toBool(row.Aspergers),
      deaf: toBool(row.Deaf),
      ebd: toBool(row.EBD),
      mobility: toBool(row.Mobility),
      ohi: toBool(row.OHI),
      orthopedic: toBool(row.Orthepedic),
      speech: toBool(row.Speech),
      sld: toBool(row.SLD),
      spinal: toBool(row.Spinal),
      tbi: toBool(row.TBI),
      visual: toBool(row.Visual),
      otherDisability: toBool(row.OtherDisability),
      otherInfo: row.OtherInfo,
      section504: toBool(row["504"]),
      grade: row.Grade,
      enterDate: row.EnterDate,
      graduated: toBool(row.Graduated),
      graduateDate: row.GraduateDate,
      employmentDate: row.EmploymentDate,
      employment: row.Employment,
      eip: toBool(row.EIP),
      vrc: row.VRC,
      hshtCoordinator: row.HSHTCoordinator,
      reportableStudent: toBool(row.ReportableStudent),
      receivedForm: toBool(row.ReceivedForm),
      vocationalRehab: toBool(row.VocationalRehab),
      reportableCheck: toBool(row.ReportableCheck),
      vrCaseloadCheck: toBool(row.VRCaseloadCheck),
      enrollDate: row.EnrollDate,
      createDate: row.CreateDate,
    };
    const ok = await safeUpsert(() =>
      prisma.student.upsert({
        where: { legacyId: row.ID },
        create: { legacyId: row.ID, ...data },
        update: data,
      })
    );
    if (!ok) skipped++;
  }
  return { total: recordset.length, skipped };
}

async function syncStudentActivity(pool: sql.ConnectionPool): Promise<JobResult> {
  const { recordset } = await pool.request().query("SELECT * FROM dbo.StudentActivity");
  if (DRY_RUN) return { total: recordset.length, skipped: 0 };
  let skipped = 0;
  for (const row of recordset) {
    const data = {
      activityId: row.ActivityID,
      studentId: row.StudentID,
      schoolId: row.SchoolID,
      status: row.Status,
      billed: toBool(row.Billed),
      billDate: row.BillDate,
      createDate: row.CreateDate,
      deleted: toBool(row.Deleted),
      invoiceId: row.InvoiceID ?? null,
    };
    const ok = await safeUpsert(() =>
      prisma.studentActivity.upsert({
        where: { legacyId: row.ID },
        create: { legacyId: row.ID, ...data },
        update: data,
      })
    );
    if (!ok) skipped++;
  }
  return { total: recordset.length, skipped };
}

async function syncInvoices(pool: sql.ConnectionPool): Promise<JobResult> {
  const { recordset } = await pool.request().query("SELECT * FROM dbo.Invoices");
  if (DRY_RUN) return { total: recordset.length, skipped: 0 };
  let skipped = 0;
  for (const row of recordset) {
    const data = {
      invoiceDate: row.InvoiceDate,
      startDate: row.StartDate,
      endDate: row.EndDate,
      activityId: row.ActivityID ?? null,
      totalAmount: toDecimal(row.TotalAmount),
      closed: toBool(row.Closed),
      status: row.Status,
    };
    const ok = await safeUpsert(() =>
      prisma.invoice.upsert({
        where: { legacyId: row.ID },
        create: { legacyId: row.ID, ...data },
        update: data,
      })
    );
    if (!ok) skipped++;
  }
  return { total: recordset.length, skipped };
}

async function syncInvoiceItems(pool: sql.ConnectionPool): Promise<JobResult> {
  const { recordset } = await pool.request().query("SELECT * FROM dbo.InvoiceItems");
  if (DRY_RUN) return { total: recordset.length, skipped: 0 };
  let skipped = 0;
  for (const row of recordset) {
    const data = {
      invoiceId: row.InvoiceID,
      activityId: row.ActivityID,
      activityDetailsId: row.ActivityDetailsID,
      billingCodeId: row.BillingCodeID ?? null,
      fee: toDecimal(row.Fee),
      quantity: toDecimal(row.Quantity),
      billed: toBool(row.Billed),
      deleted: toBool(row.Deleted),
    };
    const ok = await safeUpsert(() =>
      prisma.invoiceItem.upsert({
        where: { legacyId: row.ID },
        create: { legacyId: row.ID, ...data },
        update: data,
      })
    );
    if (!ok) skipped++;
  }
  return { total: recordset.length, skipped };
}

async function syncStudentInvoiceItems(pool: sql.ConnectionPool): Promise<JobResult> {
  const { recordset } = await pool.request().query("SELECT * FROM dbo.StudentInvoiceItems");
  if (DRY_RUN) return { total: recordset.length, skipped: 0 };
  let skipped = 0;
  for (const row of recordset) {
    const data = {
      studentId: row.StudentID,
      invoiceId: row.InvoiceID,
      activityId: row.ActivityID,
      activityDetailsId: row.ActivityDetailsID,
      billingCodeId: row.BillingCodeID ?? null,
      fee: toDecimal(row.Fee),
      quantity: toDecimal(row.Quantity),
      billed: toBool(row.Billed),
      deleted: toBool(row.Deleted),
    };
    const ok = await safeUpsert(() =>
      prisma.studentInvoiceItem.upsert({
        where: { legacyId: row.ID },
        create: { legacyId: row.ID, ...data },
        update: data,
      })
    );
    if (!ok) skipped++;
  }
  return { total: recordset.length, skipped };
}

async function syncStudentNotes(pool: sql.ConnectionPool): Promise<JobResult> {
  const { recordset } = await pool.request().query("SELECT * FROM dbo.StudentNotes");
  if (DRY_RUN) return { total: recordset.length, skipped: 0 };
  let skipped = 0;
  for (const row of recordset) {
    const data = { studentId: row.StudentID, noteDate: row.NoteDate, note: row.Note };
    const ok = await safeUpsert(() =>
      prisma.studentNote.upsert({
        where: { legacyId: row.ID },
        create: { legacyId: row.ID, ...data },
        update: data,
      })
    );
    if (!ok) skipped++;
  }
  return { total: recordset.length, skipped };
}

async function syncStudentHistory(pool: sql.ConnectionPool): Promise<JobResult> {
  const { recordset } = await pool.request().query("SELECT * FROM dbo.StudentHistory");
  if (DRY_RUN) return { total: recordset.length, skipped: 0 };
  let skipped = 0;
  for (const row of recordset) {
    const data = { studentId: row.StudentID, historyDate: row.HistoryDate, historyEvent: row.HistoryEvent };
    const ok = await safeUpsert(() =>
      prisma.studentHistoryEntry.upsert({
        where: { legacyId: row.ID },
        create: { legacyId: row.ID, ...data },
        update: data,
      })
    );
    if (!ok) skipped++;
  }
  return { total: recordset.length, skipped };
}

async function syncStudentOutcome(pool: sql.ConnectionPool): Promise<JobResult> {
  const { recordset } = await pool.request().query("SELECT * FROM dbo.StudentOutcome");
  if (DRY_RUN) return { total: recordset.length, skipped: 0 };
  let skipped = 0;
  for (const row of recordset) {
    const data = {
      studentId: row.StudentID,
      graduated: row.Graduated === null ? null : toBool(row.Graduated),
      graduateDate: row.GraduateDate,
      employment: row.Employment,
      employmentDate: row.EmploymentDate,
      postSecondary: row.PostSecondary,
      postSecondaryDate: row.PSDate,
    };
    const ok = await safeUpsert(() =>
      prisma.studentOutcome.upsert({
        where: { legacyId: row.ID },
        create: { legacyId: row.ID, ...data },
        update: data,
      })
    );
    if (!ok) skipped++;
  }
  return { total: recordset.length, skipped };
}

async function syncStudentEquipment(pool: sql.ConnectionPool): Promise<JobResult> {
  const { recordset } = await pool.request().query("SELECT * FROM dbo.StudentEquipment");
  if (DRY_RUN) return { total: recordset.length, skipped: 0 };
  let skipped = 0;
  for (const row of recordset) {
    const data = {
      studentId: row.StudentID,
      equipmentType: row.EquipmentType,
      modelNumber: row.ModelNumber,
      serialNumber: row.SerialNumber,
      dateIssued: row.DateIssued,
      assistiveTechnology: row.AssistiveTechnology,
    };
    const ok = await safeUpsert(() =>
      prisma.studentEquipment.upsert({
        where: { legacyId: row.ID },
        create: { legacyId: row.ID, ...data },
        update: data,
      })
    );
    if (!ok) skipped++;
  }
  return { total: recordset.length, skipped };
}

async function syncStudentProgramCode(pool: sql.ConnectionPool): Promise<JobResult> {
  const { recordset } = await pool.request().query("SELECT * FROM dbo.StudentProgramCode");
  if (DRY_RUN) return { total: recordset.length, skipped: 0 };
  let skipped = 0;
  for (const row of recordset) {
    const data = { studentId: row.StudentID, programCode: row.ProgramCode };
    const ok = await safeUpsert(() =>
      prisma.studentProgramCode.upsert({
        where: { legacyId: row.ID },
        create: { legacyId: row.ID, ...data },
        update: data,
      })
    );
    if (!ok) skipped++;
  }
  return { total: recordset.length, skipped };
}

async function syncStudentParticipation(pool: sql.ConnectionPool): Promise<JobResult> {
  const { recordset } = await pool.request().query("SELECT * FROM dbo.StudentParticipationID");
  if (DRY_RUN) return { total: recordset.length, skipped: 0 };
  let skipped = 0;
  for (const row of recordset) {
    const ok = await safeUpsert(() =>
      prisma.studentParticipation.upsert({
        where: { studentId_participationId: { studentId: row.StudentID, participationId: row.ParticipationID } },
        create: { studentId: row.StudentID, participationId: row.ParticipationID },
        update: {},
      })
    );
    if (!ok) skipped++;
  }
  return { total: recordset.length, skipped };
}

// EnrollmentForm and StudentEnrollmentForm share identical columns in the
// legacy DB — both feed the same Postgres model, tagged by `source`, per
// the open question in MIGRATION.md.
async function syncEnrollmentForms(pool: sql.ConnectionPool): Promise<JobResult> {
  let total = 0;
  let skipped = 0;
  for (const [table, source] of [
    ["EnrollmentForm", "EnrollmentForm"],
    ["StudentEnrollmentForm", "StudentEnrollmentForm"],
  ] as const) {
    const { recordset } = await pool.request().query(`SELECT * FROM dbo.${table}`);
    total += recordset.length;
    if (DRY_RUN) continue;
    for (const row of recordset) {
      const data = {
        source,
        schoolId: row.SchoolID,
        firstName: row.FirstName,
        middleName: row.MiddleName,
        lastName: row.LastName,
        birthDate: row.BirthDate,
        phone: row.Phone,
        emailAddress: row.EmailAddress,
        streetAddress: row.StreetAddress,
        city: row.City,
        state: row.State,
        zip: row.Zip,
        county: row.County,
        active: toBool(row.Active),
        gender: row.Gender,
        race: row.Race,
        raceOther: row.RaceOther,
        ethnicHeritage: row.EthnicHeritage,
        autism: toBool(row.Autism),
        aspergers: toBool(row.Aspergers),
        deaf: toBool(row.Deaf),
        ebd: toBool(row.EBD),
        mobility: toBool(row.Mobility),
        ohi: toBool(row.OHI),
        orthopedic: toBool(row.Orthepedic),
        speech: toBool(row.Speech),
        sld: toBool(row.SLD),
        spinal: toBool(row.Spinal),
        tbi: toBool(row.TBI),
        visual: toBool(row.Visual),
        otherDisability: toBool(row.OtherDisability),
        otherInfo: row.OtherInfo,
        grade: row.Grade,
        enterDate: row.EnterDate,
        graduated: toBool(row.Graduated),
        graduateDate: row.GraduateDate,
        employmentDate: row.EmploymentDate,
        employment: row.Employment,
        eip: toBool(row.EIP),
        vrc: row.VRC,
        hshtCoordinator: row.HSHTCoordinator,
        reportableStudent: toBool(row.ReportableStudent),
        section504: toBool(row["504"]),
        createDate: row.CreateDate,
        signatureStudent: row.SignatureStudent ?? null,
        signatureParent: row.SignatureParent ?? null,
      };
      // legacyId isn't unique across the two source tables on its own, so
      // the natural key here is (source, legacyId).
      const legacyId = table === "EnrollmentForm" ? row.ID : row.ID + 1_000_000_000;
      const ok = await safeUpsert(() =>
        prisma.enrollmentForm.upsert({
          where: { legacyId },
          create: { legacyId, ...data },
          update: data,
        })
      );
      if (!ok) skipped++;
    }
  }
  return { total, skipped };
}

async function syncEnrollmentFormHistory(pool: sql.ConnectionPool): Promise<JobResult> {
  const { recordset } = await pool.request().query("SELECT * FROM dbo.EnrollmentFormHistory");
  if (DRY_RUN) return { total: recordset.length, skipped: 0 };
  let skipped = 0;
  for (const row of recordset) {
    const data = { studentId: row.StudentID, historyDate: row.HistoryDate, historyEvent: row.HistoryEvent };
    const ok = await safeUpsert(() =>
      prisma.enrollmentFormHistory.upsert({
        where: { legacyId: row.ID },
        create: { legacyId: row.ID, ...data },
        update: data,
      })
    );
    if (!ok) skipped++;
  }
  return { total: recordset.length, skipped };
}

async function syncStudentArchive(pool: sql.ConnectionPool): Promise<JobResult> {
  const { recordset } = await pool.request().query("SELECT * FROM dbo.StudentArchive");
  if (DRY_RUN) return { total: recordset.length, skipped: 0 };
  let skipped = 0;
  for (const row of recordset) {
    const data = {
      studentId: row.StudentID,
      schoolYear: row.SchoolYear,
      schoolId: row.SchoolID,
      firstName: row.FirstName,
      middleName: row.MiddleName,
      lastName: row.LastName,
      birthDate: row.BirthDate,
      phone: row.Phone,
      emailAddress: row.EmailAddress,
      streetAddress: row.StreetAddress,
      city: row.City,
      state: row.State,
      zip: row.Zip,
      county: row.County,
      active: toBool(row.Active),
      gender: row.Gender,
      race: row.Race,
      raceOther: row.RaceOther,
      ethnicHeritage: row.EthnicHeritage,
      grade: row.Grade,
      enrollDate: row.EnrollDate,
      createDate: row.CreateDate,
    };
    const ok = await safeUpsert(() =>
      prisma.studentArchive.upsert({
        where: { legacyId: row.ID },
        create: { legacyId: row.ID, ...data },
        update: data,
      })
    );
    if (!ok) skipped++;
  }
  return { total: recordset.length, skipped };
}

async function syncAuditLog(pool: sql.ConnectionPool): Promise<JobResult> {
  const { recordset } = await pool.request().query("SELECT ID, LogDate, UserName, LogEvent FROM dbo.AuditLog");
  if (DRY_RUN) return { total: recordset.length, skipped: 0 };
  let skipped = 0;
  for (const row of recordset) {
    const data = { logDate: row.LogDate, userName: row.UserName, logEvent: row.LogEvent };
    const ok = await safeUpsert(() =>
      prisma.auditLog.upsert({
        where: { legacyId: row.ID },
        create: { legacyId: row.ID, ...data },
        update: data,
      })
    );
    if (!ok) skipped++;
  }
  return { total: recordset.length, skipped };
}

// --- runner ---------------------------------------------------------------

const JOBS: Array<[string, (pool: sql.ConnectionPool) => Promise<JobResult>]> = [
  ["SchoolYear", syncSchoolYear],
  ["Districts", syncDistricts],
  ["Schools", syncSchools],
  ["Coordinators", syncCoordinators],
  ["UserList", syncStaffUsers],
  ["Vendors", syncVendors],
  ["BillingCodes", syncBillingCodes],
  ["Activity", syncActivities],
  ["ActivityItems", syncActivityItems],
  ["ActivityDetails", syncActivityDetails],
  ["Students", syncStudents],
  ["StudentActivity", syncStudentActivity],
  ["Invoices", syncInvoices],
  ["InvoiceItems", syncInvoiceItems],
  ["StudentInvoiceItems", syncStudentInvoiceItems],
  ["StudentNotes", syncStudentNotes],
  ["StudentHistory", syncStudentHistory],
  ["StudentOutcome", syncStudentOutcome],
  ["StudentEquipment", syncStudentEquipment],
  ["StudentProgramCode", syncStudentProgramCode],
  ["StudentParticipationID", syncStudentParticipation],
  ["EnrollmentForms", syncEnrollmentForms],
  ["EnrollmentFormHistory", syncEnrollmentFormHistory],
  ["StudentArchive", syncStudentArchive],
  ["AuditLog", syncAuditLog],
];

async function main() {
  const pool = await getLegacyPool();
  console.log(`Connected to legacy SQL Server.${DRY_RUN ? " (dry run — no writes)" : ""}`);
  let totalSkipped = 0;
  try {
    for (const [name, job] of JOBS) {
      if (!shouldRun(name)) continue;
      const start = Date.now();
      const { total, skipped } = await job(pool);
      totalSkipped += skipped;
      const synced = total - skipped;
      const skipNote = skipped > 0 ? `, skipped ${skipped} (FK/unique violation)` : "";
      console.log(`${name}: ${synced} rows${DRY_RUN ? " (not written)" : " synced"}${skipNote} (${Date.now() - start}ms)`);
    }
  } finally {
    await pool.close();
    await prisma.$disconnect();
  }
  if (totalSkipped > 0) {
    console.log(`Done. ${totalSkipped} total rows skipped across all tables — see MIGRATION.md.`);
  } else {
    console.log("Done.");
  }
}

main().catch((err) => {
  console.error("Sync failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
