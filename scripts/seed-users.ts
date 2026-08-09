// One-time(-ish) seed of the new `User` table (app auth) from the two
// already-synced legacy staging tables, `Coordinator` and `StaffUser` (run
// `npm run sync:legacy` first so those are populated from the real legacy
// SQL Server — see MIGRATION.md). Consolidates both into one `users` table
// per the client's decision: everyone starts as VIEWER, an admin promotes
// specific people to STAFF/ADMIN afterward.
//
// Idempotent and safe to re-run: an email that already has a `User` row is
// left untouched (never downgrades a role an admin has since set, never
// resurrects a deactivated account). Only brand-new emails get created.
//
// Unlike sync-legacy.ts, this logs the actual emails on conflicts — these
// are staff/coordinator work addresses (not the student PII sync-legacy.ts
// is careful about), and an admin needs to see which ones to resolve.
//
// Usage:
//   npm run seed:users -- --dry-run

import "dotenv/config";
import { prisma } from "../src/lib/prisma";

const DRY_RUN = process.argv.includes("--dry-run");

type LegacySource = "Coordinator" | "StaffUser";

type Candidate = {
  email: string;
  name: string | null;
  active: boolean;
  sources: LegacySource[];
};

function normalizeEmail(email: string | null): string | null {
  const trimmed = email?.trim().toLowerCase();
  return trimmed ? trimmed : null;
}

function nameFrom(firstName: string | null, lastName: string | null): string | null {
  const name = [firstName?.trim(), lastName?.trim()].filter(Boolean).join(" ");
  return name || null;
}

async function main() {
  const [coordinators, staffUsers] = await Promise.all([
    prisma.coordinator.findMany(),
    prisma.staffUser.findMany(),
  ]);

  const byEmail = new Map<string, Candidate>();
  const duplicates: string[] = [];

  function add(email: string | null, name: string | null, active: boolean, source: LegacySource) {
    const normalized = normalizeEmail(email);
    if (!normalized) return;
    const existing = byEmail.get(normalized);
    if (existing) {
      existing.active = existing.active || active;
      existing.name = existing.name ?? name;
      if (!existing.sources.includes(source)) existing.sources.push(source);
      duplicates.push(normalized);
      return;
    }
    byEmail.set(normalized, { email: normalized, name, active, sources: [source] });
  }

  for (const c of coordinators) add(c.email, nameFrom(c.firstName, c.lastName), c.active, "Coordinator");
  for (const s of staffUsers) add(s.email, nameFrom(s.firstName, s.lastName), s.active, "StaffUser");

  console.log(
    `Found ${byEmail.size} unique email(s) across ${coordinators.length} Coordinator + ${staffUsers.length} StaffUser rows.`
  );
  if (duplicates.length) {
    console.log(`${duplicates.length} email(s) appear more than once (e.g. in both legacy tables):`);
    for (const email of duplicates) console.log(`  - ${email}`);
  }

  let created = 0;
  let alreadyExisted = 0;

  for (const candidate of byEmail.values()) {
    const existing = await prisma.user.findUnique({ where: { email: candidate.email } });
    if (existing) {
      alreadyExisted++;
      continue;
    }
    if (!DRY_RUN) {
      await prisma.user.create({
        data: {
          email: candidate.email,
          name: candidate.name,
          active: candidate.active,
        },
      });
    }
    created++;
  }

  console.log(
    `${DRY_RUN ? "[dry-run] Would create" : "Created"} ${created} new user(s); ${alreadyExisted} already existed and were left untouched.`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
