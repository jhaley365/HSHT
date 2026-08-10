"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/authz";
import { nextLegacyId } from "@/lib/next-legacy-id";

type ChecklistRow = { activityItemId: number; description: string; hsht: boolean; other: boolean; otherDetail: string | null };

// Every checklist row that got a choice (HS/HT or Other) becomes one
// ActivityDetail; rows left untouched aren't recorded at all. Shared by
// create and update — both submit the same field naming.
async function parseChecklistRows(formData: FormData): Promise<ChecklistRow[]> {
  const items = await prisma.activityItem.findMany({ where: { enabled: true } });
  const rows: ChecklistRow[] = [];
  for (const item of items) {
    const choice = formData.get(`item_${item.activityItemId}_choice`);
    if (choice !== "hsht" && choice !== "other") continue;
    const funding = String(formData.get(`item_${item.activityItemId}_funding`) ?? "").trim() || null;
    rows.push({
      activityItemId: item.activityItemId,
      description: item.description,
      hsht: choice === "hsht",
      other: choice === "other",
      otherDetail: choice === "other" ? funding : null,
    });
  }
  return rows;
}

async function coordinatorDisplayName(coordinatorId: number | null): Promise<string | null> {
  if (!coordinatorId) return null;
  const coordinator = await prisma.coordinator.findUnique({ where: { legacyId: coordinatorId } });
  return coordinator ? [coordinator.firstName, coordinator.lastName].filter(Boolean).join(" ") || null : null;
}

export async function createActivityAction(formData: FormData) {
  await requireStaff();

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const activityDateRaw = String(formData.get("activityDate") ?? "");
  const schoolId = Number(formData.get("schoolId"));
  const coordinatorIdRaw = formData.get("coordinatorId");
  const coordinatorId = coordinatorIdRaw ? Number(coordinatorIdRaw) : null;
  const preets = String(formData.get("preets") ?? "").trim() || null;

  if (!name) redirect("/activity/new?error=Activity name is required");
  if (!schoolId) redirect("/activity/new?error=School is required");

  const activityDate = activityDateRaw ? new Date(activityDateRaw) : null;
  const itemRows = await parseChecklistRows(formData);
  const coordinatorName = await coordinatorDisplayName(coordinatorId);

  const activity = await prisma.$transaction(async (tx) => {
    const created = await tx.activity.create({
      data: {
        legacyId: await nextLegacyId(tx, "activity"),
        name,
        description,
        activityDate,
        schoolId,
        coordinatorId,
        preets,
      },
    });

    for (const row of itemRows) {
      await tx.activityDetail.create({
        data: {
          legacyId: await nextLegacyId(tx, "activityDetail"),
          activityId: created.legacyId,
          activityItemId: row.activityItemId,
          description: row.description,
          hsht: row.hsht,
          hshtCoordinator: row.hsht ? coordinatorName : null,
          other: row.other,
          otherDetail: row.otherDetail,
        },
      });
    }

    return created;
  });

  revalidatePath("/activity/list");
  redirect(`/activity/${activity.id}`);
}

// Soft delete — sets the existing `deleted` flag rather than removing the
// row. Matches the legacy schema's own intent (the column already existed
// for this) and keeps activity/billing history intact.
export async function deleteActivityAction(formData: FormData) {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  await prisma.activity.update({ where: { id }, data: { deleted: true } });
  revalidatePath("/activity/list");
  redirect("/activity/list");
}

export async function updateActivityAction(formData: FormData) {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  const activity = await prisma.activity.findUnique({ where: { id } });
  if (!activity) redirect("/activity/list");

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const activityDateRaw = String(formData.get("activityDate") ?? "");
  const schoolId = Number(formData.get("schoolId"));
  const coordinatorIdRaw = formData.get("coordinatorId");
  const coordinatorId = coordinatorIdRaw ? Number(coordinatorIdRaw) : null;
  const preets = String(formData.get("preets") ?? "").trim() || null;

  if (!name) redirect(`/activity/${id}/edit?error=Activity name is required`);
  if (!schoolId) redirect(`/activity/${id}/edit?error=School is required`);

  const activityDate = activityDateRaw ? new Date(activityDateRaw) : null;
  const submittedRows = await parseChecklistRows(formData);
  const submittedByItem = new Map(submittedRows.map((r) => [r.activityItemId, r]));
  const coordinatorName = await coordinatorDisplayName(coordinatorId);

  const existingDetails = await prisma.activityDetail.findMany({ where: { activityId: activity.legacyId } });
  const existingByItem = new Map(existingDetails.map((d) => [d.activityItemId, d]));

  await prisma.$transaction(async (tx) => {
    await tx.activity.update({
      where: { id },
      data: { name, description, activityDate, schoolId, coordinatorId, preets },
    });

    for (const [activityItemId, row] of submittedByItem) {
      const existing = existingByItem.get(activityItemId);
      const data = {
        hsht: row.hsht,
        other: row.other,
        otherDetail: row.otherDetail,
        hshtCoordinator: row.hsht ? coordinatorName : null,
      };
      if (existing) {
        await tx.activityDetail.update({ where: { id: existing.id }, data });
      } else {
        await tx.activityDetail.create({
          data: {
            legacyId: await nextLegacyId(tx, "activityDetail"),
            activityId: activity.legacyId,
            activityItemId,
            description: row.description,
            ...data,
          },
        });
      }
    }

    // A row that no longer has a choice submitted gets removed entirely —
    // unlike Activity/StudentActivity there's no soft-delete flag on
    // ActivityDetail, and an unchecked item genuinely means "this wasn't
    // part of the activity," not "delete this history."
    for (const existing of existingDetails) {
      if (!submittedByItem.has(existing.activityItemId)) {
        await tx.activityDetail.delete({ where: { id: existing.id } });
      }
    }
  });

  revalidatePath(`/activity/${id}`);
  revalidatePath("/activity/list");
  redirect(`/activity/${id}`);
}

export async function toggleActivityClosedAction(formData: FormData) {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  const activity = await prisma.activity.findUnique({ where: { id }, select: { closed: true } });
  if (!activity) redirect("/activity/list");

  await prisma.activity.update({ where: { id }, data: { closed: !activity.closed } });
  revalidatePath(`/activity/${id}`);
  redirect(`/activity/${id}`);
}

// Reconciles the checked students against StudentActivity rows for this
// activity. Prefers reviving an existing soft-deleted row over creating a
// new one, so repeatedly checking/unchecking the same student doesn't pile
// up duplicate history rows.
export async function saveAssignedStudentsAction(formData: FormData) {
  await requireStaff();
  const activityDbId = String(formData.get("activityDbId") ?? "");
  const activity = await prisma.activity.findUnique({ where: { id: activityDbId } });
  if (!activity) redirect("/activity/list");

  const checkedStudentIds = new Set(formData.getAll("studentId").map((v) => Number(v)));
  const existingAll = await prisma.studentActivity.findMany({ where: { activityId: activity.legacyId } });
  const existingByStudent = new Map(existingAll.map((e) => [e.studentId, e]));

  await prisma.$transaction(async (tx) => {
    for (const studentId of checkedStudentIds) {
      const existing = existingByStudent.get(studentId);
      if (existing?.deleted === false) continue;
      if (existing) {
        await tx.studentActivity.update({ where: { id: existing.id }, data: { deleted: false } });
        continue;
      }
      await tx.studentActivity.create({
        data: {
          legacyId: await nextLegacyId(tx, "studentActivity"),
          activityId: activity.legacyId,
          studentId,
          schoolId: activity.schoolId,
          status: 1,
        },
      });
    }

    for (const existing of existingAll) {
      if (!existing.deleted && !checkedStudentIds.has(existing.studentId)) {
        await tx.studentActivity.update({ where: { id: existing.id }, data: { deleted: true } });
      }
    }
  });

  revalidatePath(`/activity/${activityDbId}`);
  redirect(`/activity/${activityDbId}`);
}

export async function createFundingSourceAction(formData: FormData) {
  await requireStaff();

  const name = String(formData.get("name") ?? "").trim();
  const vendorCode = String(formData.get("vendorCode") ?? "").trim().toUpperCase() || null;
  const address = String(formData.get("address") ?? "").trim() || null;
  const city = String(formData.get("city") ?? "").trim() || null;
  const state = String(formData.get("state") ?? "").trim() || null;
  const zip = String(formData.get("zip") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const email = String(formData.get("email") ?? "").trim() || null;
  const contact = String(formData.get("contact") ?? "").trim() || null;

  if (!name) redirect("/activity/funding-source?error=Name is required");

  await prisma.$transaction(async (tx) => {
    await tx.vendor.create({
      data: { legacyId: await nextLegacyId(tx, "vendor"), name, vendorCode, address, city, state, zip, phone, email, contact },
    });
  });

  revalidatePath("/activity/funding-source");
  redirect("/activity/funding-source");
}
