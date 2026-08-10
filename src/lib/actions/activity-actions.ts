"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/authz";
import { nextLegacyId } from "@/lib/next-legacy-id";

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

  // Every checklist row that got a choice (HS/HT or Other) becomes one
  // ActivityDetail; rows left untouched aren't recorded at all.
  const items = await prisma.activityItem.findMany({ where: { enabled: true } });
  const itemRows: { activityItemId: number; description: string; hsht: boolean; other: boolean; otherDetail: string | null }[] = [];
  for (const item of items) {
    const choice = formData.get(`item_${item.activityItemId}_choice`);
    if (choice !== "hsht" && choice !== "other") continue;
    const funding = String(formData.get(`item_${item.activityItemId}_funding`) ?? "").trim() || null;
    itemRows.push({
      activityItemId: item.activityItemId,
      description: item.description,
      hsht: choice === "hsht",
      other: choice === "other",
      otherDetail: choice === "other" ? funding : null,
    });
  }

  const coordinator = coordinatorId
    ? await prisma.coordinator.findUnique({ where: { legacyId: coordinatorId } })
    : null;
  const coordinatorName = coordinator ? [coordinator.firstName, coordinator.lastName].filter(Boolean).join(" ") || null : null;

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
