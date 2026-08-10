import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/authz";
import {
  getActivityById,
  getActivityItemsGrouped,
  getSchoolOptions,
  getCoordinatorOptions,
  getVendorOptions,
} from "@/lib/activity-queries";
import { updateActivityAction } from "@/lib/actions/activity-actions";
import { ActivityFormFields, type ActivityDetailChoice } from "@/components/activity/ActivityFormFields";

export const dynamic = "force-dynamic";

function toDateInputValue(date: Date | null): string | undefined {
  if (!date) return undefined;
  return date.toISOString().slice(0, 10);
}

export default async function EditActivityPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireStaff();
  const { id } = await params;
  const { error } = await searchParams;

  const result = await getActivityById(id);
  if (!result) notFound();
  const { activity } = result;

  const [groups, schools, coordinators, vendors] = await Promise.all([
    getActivityItemsGrouped(),
    getSchoolOptions(),
    getCoordinatorOptions(),
    getVendorOptions(),
  ]);

  const detailsByItemId = new Map<number, ActivityDetailChoice>(
    activity.details.map((d) => [d.activityItemId, { choice: d.hsht ? "hsht" : "other", funding: d.otherDetail }])
  );

  return (
    <div className="flex flex-1 flex-col gap-5">
      {error && (
        <div
          className="rounded-[10px] border px-4 py-3 text-[13px]"
          style={{ borderColor: "#f87171", color: "#f87171", background: "rgba(248,113,113,0.08)" }}
        >
          {error}
        </div>
      )}

      <form action={updateActivityAction} className="flex flex-col gap-5">
        <input type="hidden" name="id" value={activity.id} />
        <div className="text-[14px] font-extrabold" style={{ color: "var(--heading)" }}>
          Edit Activity
        </div>

        <ActivityFormFields
          groups={groups}
          schools={schools}
          coordinators={coordinators}
          vendors={vendors}
          defaults={{
            preets: activity.preets,
            name: activity.name,
            description: activity.description,
            activityDate: toDateInputValue(activity.activityDate),
            schoolId: activity.schoolId,
            coordinatorId: activity.coordinatorId,
            detailsByItemId,
          }}
        />

        <div className="flex items-center gap-3">
          <button type="submit" className="rounded-[9px] px-6 py-2.5 text-[13px] font-bold text-white" style={{ background: "var(--positive)" }}>
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
