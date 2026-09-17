import type { Prisma } from "@/generated/prisma/client";

// Activity/ActivityDetail/Vendor all model `legacyId` as a required unique
// Int — correct for rows synced 1:1 from the legacy SQL Server (see
// MIGRATION.md), but this app also needs to create genuinely new rows
// itself (new activities, new funding sources) that have no legacy row at
// all. Rather than loosen legacyId to nullable — which would mean changing
// the relation ActivityDetail.activityId depends on, against data already
// synced into production — new rows get a legacyId computed here, safely
// above any real legacy ID range (legacy Activity IDs top out in the
// 10,000s as of this writing).
const APP_CREATED_ID_FLOOR = 9_000_000;

type LegacyIdModel = "activity" | "activityDetail" | "vendor" | "studentActivity" | "student";

export async function nextLegacyId(tx: Prisma.TransactionClient, model: LegacyIdModel): Promise<number> {
  const { _max } =
    model === "activity"
      ? await tx.activity.aggregate({ _max: { legacyId: true } })
      : model === "activityDetail"
        ? await tx.activityDetail.aggregate({ _max: { legacyId: true } })
        : model === "vendor"
          ? await tx.vendor.aggregate({ _max: { legacyId: true } })
          : model === "studentActivity"
            ? await tx.studentActivity.aggregate({ _max: { legacyId: true } })
            : await tx.student.aggregate({ _max: { legacyId: true } });
  // Student legacyIds also need to stay clear of the YTEP sync's offset range
  // (YTEP_ID_OFFSET = 2,000,000,000 in scripts/sync-legacy-ytep.ts) — the
  // floor here (9,000,000) is comfortably below that, same as every other
  // app-created id.
  return Math.max((_max.legacyId ?? 0) + 1, APP_CREATED_ID_FLOOR);
}
