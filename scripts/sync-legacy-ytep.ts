// One-way sync from YTEP's legacy SQL Server database (a database-level
// duplicate of the original HSHT application — see the ycomm-yep site) into
// this app's Postgres database. Safe to run repeatedly (upserts keyed on
// legacyId, same as sync-legacy.ts).
//
// YTEP and HSHT are two separately-run programs that share the same real
// Districts/Schools/Coordinators. This script MATCHES those three tables
// against what sync-legacy.ts already imported from HSHT (by natural key —
// school code, district name+county, coordinator email/name) rather than
// duplicating them, and only creates a new row when genuinely nothing
// matches. Every other table (Students, Activity, ActivityItems,
// ActivityDetails, StudentActivity, StudentArchive, StudentOutcome, etc.)
// is YTEP's own data and is imported as new rows tagged `program: YTEP`.
//
// ID collisions: YTEP's database numbers its own tables from 1, independent
// of HSHT's — a YTEP Student.ID=42 has nothing to do with HSHT's
// Student.ID=42. Every legacyId (and ActivityItem's separately-unique
// activityItemId) sourced from a YTEP-native table gets YTEP_ID_OFFSET
// added so it can never collide with an HSHT-sourced one, while FK
// references to the matched Districts/Schools/Coordinators use their
// existing (unmodified) legacyId.
//
// NOT synced in this pass (see MIGRATION.md's exclusions for the HSHT
// rationale, which applies the same way here): backup/BAK tables, the
// ad-hoc `Query` staging table, SchoolYear/UserList/Vendors/BillingCodes
// (shared, org-wide reference data — already present from the HSHT sync),
// Invoices/InvoiceItems* (invoicing was never used in production),
// Audit/AuditLog (login events, and Audit stores plaintext passwords — see
// MIGRATION.md), and EnrollmentForm/StudentEnrollmentForm/
// EnrollmentFormHistory (YTEP's intake-form paperwork — can be added later
// following the same pattern once the core student/activity data is
// confirmed correct).
//
// SAFETY: logs row COUNTS only, never field values — this data includes
// student PII. Do not add logging that prints individual records.
//
// Usage:
//   npm run sync:legacy:ytep                         # sync everything
//   npm run sync:legacy:ytep -- --only=Students,Activity
//   npm run sync:legacy:ytep -- --dry-run            # fetch + transform, no writes
//
// Required env vars (see .env.example): LEGACY_MSSQL_HOST, LEGACY_MSSQL_PORT,
// LEGACY_MSSQL_USER, LEGACY_MSSQL_PASSWORD (same as sync-legacy.ts — same
// server/credentials), LEGACY_MSSQL_DATABASE_YTEP (YTEP's database name).

import "dotenv/config";
import type sql from "mssql";
import { prisma } from "../src/lib/prisma";
import { type JobResult, toBool, safeUpsert, connectMssql } from "./lib/legacy-sync-helpers";

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const ONLY = args.find((a) => a.startsWith("--only="))?.slice("--only=".length).split(",");

function shouldRun(name: string) {
  return !ONLY || ONLY.includes(name);
}

// Added to every legacyId (and ActivityItem.activityItemId) sourced from a
// YTEP-native row, so it can never collide with an HSHT-sourced one. HSHT's
// largest legacy table (StudentActivity) has ~82k rows (see MIGRATION.md),
// nowhere near this range.
const YTEP_ID_OFFSET = 2_000_000_000;

// --- connection ------------------------------------------------------------

async function getYtepPool() {
  const host = process.env.LEGACY_MSSQL_HOST;
  const user = process.env.LEGACY_MSSQL_USER;
  const password = process.env.LEGACY_MSSQL_PASSWORD;
  const database = process.env.LEGACY_MSSQL_DATABASE_YTEP;
  if (!host || !user || !password || !database) {
    throw new Error(
      "Missing LEGACY_MSSQL_HOST / LEGACY_MSSQL_USER / LEGACY_MSSQL_PASSWORD / LEGACY_MSSQL_DATABASE_YTEP env vars"
    );
  }
  return connectMssql({
    host,
    port: Number(process.env.LEGACY_MSSQL_PORT ?? 1433),
    user,
    password,
    database,
    encrypt: (process.env.LEGACY_MSSQL_ENCRYPT ?? "true") === "true",
    trustServerCertificate: (process.env.LEGACY_MSSQL_TRUST_SERVER_CERTIFICATE ?? "true") === "true",
  });
}

// --- reference-table matching ----------------------------------------------
// Districts/Schools/Coordinators are the same real-world entities in both
// programs, so these look up an existing HSHT-synced row by natural key and
// only create a new one when nothing matches. Every match/create is logged
// by name so a real run's output can be sanity-checked against what's
// expected, rather than silently trusting the heuristic.

export type MatchStats = { matched: number; created: number };

export async function matchOrCreateDistricts(pool: sql.ConnectionPool, stats: MatchStats): Promise<Map<number, number>> {
  const { recordset } = await pool.request().query("SELECT * FROM dbo.Districts");
  const idMap = new Map<number, number>();
  for (const row of recordset) {
    const existing = await prisma.district.findFirst({ where: { name: row.DistrictName, county: row.County } });
    if (existing) {
      idMap.set(row.ID, existing.legacyId);
      stats.matched++;
      continue;
    }
    const legacyId = row.ID + YTEP_ID_OFFSET;
    if (!DRY_RUN) {
      await prisma.district.create({
        data: {
          legacyId,
          code: row.DistrictID,
          name: row.DistrictName,
          county: row.County,
          active: toBool(row.Active),
          notes: row.Notes,
          coordinator: row.HSHTCoordinator,
          vrQuadrant: row.VRQuadrant,
          serviceArea: row.HSHTServiceArea,
        },
      });
    }
    idMap.set(row.ID, legacyId);
    stats.created++;
  }
  return idMap;
}

export async function matchOrCreateSchools(
  pool: sql.ConnectionPool,
  districtIdMap: Map<number, number>,
  stats: MatchStats
): Promise<Map<number, number>> {
  const { recordset } = await pool.request().query("SELECT * FROM dbo.Schools");
  const idMap = new Map<number, number>();
  for (const row of recordset) {
    const districtId = districtIdMap.get(parseInt(row.DID, 10));
    if (districtId === undefined) {
      // A school whose district we couldn't resolve — skip rather than
      // create with a dangling FK.
      continue;
    }
    // schoolCode is only unique WITHIN a district (it's a small per-district
    // number, e.g. "01"/"02" — see the "{district.code}-{schoolCode}" label
    // used everywhere else in the app). Matching on schoolCode alone let a
    // YTEP school silently match an unrelated HSHT school in a different
    // district that happened to reuse the same code, misrouting every
    // Activity/Student/etc. synced against it — caught via a client report
    // of YTEP activities showing up under the wrong school.
    const existing = await prisma.school.findFirst({ where: { schoolCode: row.SchoolCode, districtId } });
    if (existing) {
      idMap.set(row.ID, existing.legacyId);
      stats.matched++;
      continue;
    }
    const legacyId = row.ID + YTEP_ID_OFFSET;
    if (!DRY_RUN) {
      await prisma.school.create({
        data: {
          legacyId,
          districtId,
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
        },
      });
    }
    idMap.set(row.ID, legacyId);
    stats.created++;
  }
  return idMap;
}

export async function matchOrCreateCoordinators(pool: sql.ConnectionPool, stats: MatchStats): Promise<Map<number, number>> {
  const { recordset } = await pool.request().query("SELECT * FROM dbo.Coordinators");
  const idMap = new Map<number, number>();
  for (const row of recordset) {
    const email = row.Email ? String(row.Email).trim().toLowerCase() : null;
    const existing = email
      ? await prisma.coordinator.findFirst({ where: { email: { equals: email, mode: "insensitive" } } })
      : await prisma.coordinator.findFirst({ where: { firstName: row.FirstName, lastName: row.LastName, email: null } });
    if (existing) {
      idMap.set(row.ID, existing.legacyId);
      stats.matched++;
      continue;
    }
    const legacyId = row.ID + YTEP_ID_OFFSET;
    if (!DRY_RUN) {
      // Deliberately NOT copying row.Password — see MIGRATION.md "Auth".
      await prisma.coordinator.create({
        data: { legacyId, firstName: row.FirstName, lastName: row.LastName, email: row.Email, active: toBool(row.Active) },
      });
    }
    idMap.set(row.ID, legacyId);
    stats.created++;
  }
  return idMap;
}

// --- YTEP-native data --------------------------------------------------

export async function syncStudents(pool: sql.ConnectionPool, schoolIdMap: Map<number, number>): Promise<JobResult> {
  const { recordset } = await pool.request().query("SELECT * FROM dbo.Students");
  let skipped = 0;
  for (const row of recordset) {
    const schoolId = schoolIdMap.get(row.SchoolID);
    if (schoolId === undefined) {
      skipped++;
      continue;
    }
    if (DRY_RUN) continue;
    const legacyId = row.ID + YTEP_ID_OFFSET;
    const data = {
      schoolId,
      program: "YTEP" as const,
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
      mid: toBool(row.MID),
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
      prisma.student.upsert({ where: { legacyId }, create: { legacyId, ...data }, update: data })
    );
    if (!ok) skipped++;
  }
  return { total: recordset.length, skipped };
}

export async function syncActivities(
  pool: sql.ConnectionPool,
  schoolIdMap: Map<number, number>,
  coordinatorIdMap: Map<number, number>
): Promise<JobResult> {
  const { recordset } = await pool.request().query("SELECT * FROM dbo.Activity");
  let skipped = 0;
  for (const row of recordset) {
    const schoolId = schoolIdMap.get(row.SchoolID);
    if (schoolId === undefined) {
      skipped++;
      continue;
    }
    if (DRY_RUN) continue;
    const legacyId = row.ID + YTEP_ID_OFFSET;
    const data = {
      name: row.Name,
      description: row.Description,
      activityDate: row.ActivityDate,
      startDate: row.StartDate,
      endDate: row.EndDate,
      schoolId,
      program: "YTEP" as const,
      closed: toBool(row.Closed),
      billed: toBool(row.Billed),
      deleted: toBool(row.Deleted),
      createDate: row.CreateDate,
      preets: row.PREETS,
      coordinatorId: row.HSHTCoordinator ? (coordinatorIdMap.get(row.HSHTCoordinator) ?? null) : null,
    };
    const ok = await safeUpsert(() =>
      prisma.activity.upsert({ where: { legacyId }, create: { legacyId, ...data }, update: data })
    );
    if (!ok) skipped++;
  }
  return { total: recordset.length, skipped };
}

// ActivityItems is YTEP's own training/checklist catalog — per the client,
// YTEP has different levels of training than HSHT, so these are imported as
// new entries rather than matched against HSHT's catalog. activityItemId
// (not just legacyId) is separately unique on this model and is the field
// ActivityDetails actually joins on, so it needs the same offset too.
export async function syncActivityItems(pool: sql.ConnectionPool): Promise<{ result: JobResult; activityItemIdMap: Map<number, number> }> {
  const { recordset } = await pool.request().query("SELECT * FROM dbo.ActivityItems");
  const activityItemIdMap = new Map<number, number>();
  let skipped = 0;
  for (const row of recordset) {
    const legacyId = row.ID + YTEP_ID_OFFSET;
    const activityItemId = row.ActivityItemID + YTEP_ID_OFFSET;
    activityItemIdMap.set(row.ActivityItemID, activityItemId);
    if (DRY_RUN) continue;
    const data = {
      activityItemId,
      group: row.Group,
      description: row.Description,
      billingCode: row.BillingCode,
      enabled: toBool(row.Enabled),
    };
    const ok = await safeUpsert(() =>
      prisma.activityItem.upsert({ where: { legacyId }, create: { legacyId, ...data }, update: data })
    );
    if (!ok) skipped++;
  }
  return { result: { total: recordset.length, skipped }, activityItemIdMap };
}

export async function syncActivityDetails(pool: sql.ConnectionPool, activityItemIdMap: Map<number, number>): Promise<JobResult> {
  const { recordset } = await pool.request().query("SELECT * FROM dbo.ActivityDetails");
  let skipped = 0;
  for (const row of recordset) {
    const activityItemId = activityItemIdMap.get(row.ActivityItemID);
    if (activityItemId === undefined) {
      skipped++;
      continue;
    }
    if (DRY_RUN) continue;
    const legacyId = row.ID + YTEP_ID_OFFSET;
    const data = {
      activityId: row.ActivityID + YTEP_ID_OFFSET,
      activityItemId,
      description: row.Description,
      hsht: toBool(row.HSHT),
      hshtCoordinator: row.HSHTCoordinator,
      other: toBool(row.Other),
      otherDetail: row.OtherDetail,
    };
    const ok = await safeUpsert(() =>
      prisma.activityDetail.upsert({ where: { legacyId }, create: { legacyId, ...data }, update: data })
    );
    if (!ok) skipped++;
  }
  return { total: recordset.length, skipped };
}

export async function syncStudentActivity(pool: sql.ConnectionPool, schoolIdMap: Map<number, number>): Promise<JobResult> {
  const { recordset } = await pool.request().query("SELECT * FROM dbo.StudentActivity");
  let skipped = 0;
  for (const row of recordset) {
    const schoolId = schoolIdMap.get(row.SchoolID);
    if (schoolId === undefined) {
      skipped++;
      continue;
    }
    if (DRY_RUN) continue;
    const legacyId = row.ID + YTEP_ID_OFFSET;
    const data = {
      activityId: row.ActivityID + YTEP_ID_OFFSET,
      studentId: row.StudentID + YTEP_ID_OFFSET,
      schoolId,
      status: row.Status,
      billed: toBool(row.Billed),
      billDate: row.BillDate,
      createDate: row.CreateDate,
      deleted: toBool(row.Deleted),
    };
    const ok = await safeUpsert(() =>
      prisma.studentActivity.upsert({ where: { legacyId }, create: { legacyId, ...data }, update: data })
    );
    if (!ok) skipped++;
  }
  return { total: recordset.length, skipped };
}

export async function syncStudentArchive(pool: sql.ConnectionPool, schoolIdMap: Map<number, number>): Promise<JobResult> {
  const { recordset } = await pool.request().query("SELECT * FROM dbo.StudentArchive");
  let skipped = 0;
  for (const row of recordset) {
    const schoolId = schoolIdMap.get(row.SchoolID);
    if (schoolId === undefined) {
      skipped++;
      continue;
    }
    if (DRY_RUN) continue;
    const legacyId = row.ID + YTEP_ID_OFFSET;
    const data = {
      studentId: row.StudentID + YTEP_ID_OFFSET,
      schoolYear: row.SchoolYear,
      schoolId,
      program: "YTEP" as const,
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
      enterDate: row.EnterDate,
      enrollDate: row.EnrollDate,
      createDate: row.CreateDate,
      autism: toBool(row.Autism),
      aspergers: toBool(row.Aspergers),
      deaf: toBool(row.Deaf),
      ebd: toBool(row.EBD),
      mid: toBool(row.MID),
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
      eip: toBool(row.EIP),
      vrc: row.VRC,
      hshtCoordinator: row.HSHTCoordinator,
      reportableStudent: toBool(row.ReportableStudent),
      receivedForm: toBool(row.ReceivedForm),
      vocationalRehab: toBool(row.VocationalRehab),
      reportableCheck: toBool(row.ReportableCheck),
      vrCaseloadCheck: toBool(row.VRCaseloadCheck),
      graduated: toBool(row.Graduated),
      graduateDate: row.GraduateDate,
    };
    const ok = await safeUpsert(() =>
      prisma.studentArchive.upsert({ where: { legacyId }, create: { legacyId, ...data }, update: data })
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
    const legacyId = row.ID + YTEP_ID_OFFSET;
    const data = {
      studentId: row.StudentID + YTEP_ID_OFFSET,
      graduated: row.Graduated === null ? null : toBool(row.Graduated),
      graduateDate: row.GraduateDate,
      employment: row.Employment,
      employmentDate: row.EmploymentDate,
      postSecondary: row.PostSecondary,
      postSecondaryDate: row.PSDate,
    };
    const ok = await safeUpsert(() =>
      prisma.studentOutcome.upsert({ where: { legacyId }, create: { legacyId, ...data }, update: data })
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
    const legacyId = row.ID + YTEP_ID_OFFSET;
    const data = {
      studentId: row.StudentID + YTEP_ID_OFFSET,
      equipmentType: row.EquipmentType,
      modelNumber: row.ModelNumber,
      serialNumber: row.SerialNumber,
      dateIssued: row.DateIssued,
      assistiveTechnology: row.AssistiveTechnology,
    };
    const ok = await safeUpsert(() =>
      prisma.studentEquipment.upsert({ where: { legacyId }, create: { legacyId, ...data }, update: data })
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
    const legacyId = row.ID + YTEP_ID_OFFSET;
    const data = { studentId: row.StudentID + YTEP_ID_OFFSET, historyDate: row.HistoryDate, historyEvent: row.HistoryEvent };
    const ok = await safeUpsert(() =>
      prisma.studentHistoryEntry.upsert({ where: { legacyId }, create: { legacyId, ...data }, update: data })
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
    const legacyId = row.ID + YTEP_ID_OFFSET;
    const data = { studentId: row.StudentID + YTEP_ID_OFFSET, noteDate: row.NoteDate, note: row.Note };
    const ok = await safeUpsert(() =>
      prisma.studentNote.upsert({ where: { legacyId }, create: { legacyId, ...data }, update: data })
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
    const legacyId = row.ID + YTEP_ID_OFFSET;
    const data = { studentId: row.StudentID + YTEP_ID_OFFSET, programCode: row.ProgramCode };
    const ok = await safeUpsert(() =>
      prisma.studentProgramCode.upsert({ where: { legacyId }, create: { legacyId, ...data }, update: data })
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
    const studentId = row.StudentID + YTEP_ID_OFFSET;
    const ok = await safeUpsert(() =>
      prisma.studentParticipation.upsert({
        where: { studentId_participationId: { studentId, participationId: row.ParticipationID } },
        create: { studentId, participationId: row.ParticipationID },
        update: {},
      })
    );
    if (!ok) skipped++;
  }
  return { total: recordset.length, skipped };
}

// --- runner ---------------------------------------------------------------

async function main() {
  const pool = await getYtepPool();
  console.log(`Connected to YTEP legacy SQL Server.${DRY_RUN ? " (dry run — no writes)" : ""}`);
  let totalSkipped = 0;

  function report(name: string, total: number, skipped: number, start: number) {
    totalSkipped += skipped;
    const synced = total - skipped;
    const skipNote = skipped > 0 ? `, skipped ${skipped}` : "";
    console.log(`${name}: ${synced} rows${DRY_RUN ? " (not written)" : " synced"}${skipNote} (${Date.now() - start}ms)`);
  }

  try {
    let districtIdMap = new Map<number, number>();
    let schoolIdMap = new Map<number, number>();
    let coordinatorIdMap = new Map<number, number>();
    let activityItemIdMap = new Map<number, number>();

    if (shouldRun("Districts")) {
      const start = Date.now();
      const stats: MatchStats = { matched: 0, created: 0 };
      districtIdMap = await matchOrCreateDistricts(pool, stats);
      console.log(`Districts: ${stats.matched} matched, ${stats.created} created (${Date.now() - start}ms)`);
    }
    if (shouldRun("Schools")) {
      const start = Date.now();
      const stats: MatchStats = { matched: 0, created: 0 };
      schoolIdMap = await matchOrCreateSchools(pool, districtIdMap, stats);
      console.log(`Schools: ${stats.matched} matched, ${stats.created} created (${Date.now() - start}ms)`);
    }
    if (shouldRun("Coordinators")) {
      const start = Date.now();
      const stats: MatchStats = { matched: 0, created: 0 };
      coordinatorIdMap = await matchOrCreateCoordinators(pool, stats);
      console.log(`Coordinators: ${stats.matched} matched, ${stats.created} created (${Date.now() - start}ms)`);
    }
    if (shouldRun("Students")) {
      const start = Date.now();
      const { total, skipped } = await syncStudents(pool, schoolIdMap);
      report("Students", total, skipped, start);
    }
    if (shouldRun("Activity")) {
      const start = Date.now();
      const { total, skipped } = await syncActivities(pool, schoolIdMap, coordinatorIdMap);
      report("Activity", total, skipped, start);
    }
    if (shouldRun("ActivityItems")) {
      const start = Date.now();
      const { result, activityItemIdMap: map } = await syncActivityItems(pool);
      activityItemIdMap = map;
      report("ActivityItems", result.total, result.skipped, start);
    }
    if (shouldRun("ActivityDetails")) {
      const start = Date.now();
      const { total, skipped } = await syncActivityDetails(pool, activityItemIdMap);
      report("ActivityDetails", total, skipped, start);
    }
    if (shouldRun("StudentActivity")) {
      const start = Date.now();
      const { total, skipped } = await syncStudentActivity(pool, schoolIdMap);
      report("StudentActivity", total, skipped, start);
    }
    if (shouldRun("StudentArchive")) {
      const start = Date.now();
      const { total, skipped } = await syncStudentArchive(pool, schoolIdMap);
      report("StudentArchive", total, skipped, start);
    }
    if (shouldRun("StudentOutcome")) {
      const start = Date.now();
      const { total, skipped } = await syncStudentOutcome(pool);
      report("StudentOutcome", total, skipped, start);
    }
    if (shouldRun("StudentEquipment")) {
      const start = Date.now();
      const { total, skipped } = await syncStudentEquipment(pool);
      report("StudentEquipment", total, skipped, start);
    }
    if (shouldRun("StudentHistory")) {
      const start = Date.now();
      const { total, skipped } = await syncStudentHistory(pool);
      report("StudentHistory", total, skipped, start);
    }
    if (shouldRun("StudentNotes")) {
      const start = Date.now();
      const { total, skipped } = await syncStudentNotes(pool);
      report("StudentNotes", total, skipped, start);
    }
    if (shouldRun("StudentProgramCode")) {
      const start = Date.now();
      const { total, skipped } = await syncStudentProgramCode(pool);
      report("StudentProgramCode", total, skipped, start);
    }
    if (shouldRun("StudentParticipationID")) {
      const start = Date.now();
      const { total, skipped } = await syncStudentParticipation(pool);
      report("StudentParticipationID", total, skipped, start);
    }
  } finally {
    await pool.close();
    await prisma.$disconnect();
  }

  if (totalSkipped > 0) {
    console.log(`Done. ${totalSkipped} total rows skipped across all tables.`);
  } else {
    console.log("Done.");
  }
}

// Guarded so this module's sync functions can be imported (e.g. by tests)
// without triggering a real run against LEGACY_MSSQL_* env vars.
const isMainModule = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  main().catch((err) => {
    console.error("YTEP sync failed:", err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
