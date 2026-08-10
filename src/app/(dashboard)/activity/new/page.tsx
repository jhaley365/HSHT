import { requireStaff } from "@/lib/authz";
import {
  getActivityItemsGrouped,
  getSchoolOptions,
  getCoordinatorOptions,
  getVendorOptions,
} from "@/lib/activity-queries";
import { createActivityAction } from "@/lib/actions/activity-actions";
import { ActivityFormFields } from "@/components/activity/ActivityFormFields";

export const dynamic = "force-dynamic";

export default async function NewActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireStaff();
  const { error } = await searchParams;

  const [groups, schools, coordinators, vendors] = await Promise.all([
    getActivityItemsGrouped(),
    getSchoolOptions(),
    getCoordinatorOptions(),
    getVendorOptions(),
  ]);

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

      <form action={createActivityAction} className="flex flex-col gap-5">
        <div className="text-[14px] font-extrabold" style={{ color: "var(--heading)" }}>
          New Activity
        </div>

        <ActivityFormFields groups={groups} schools={schools} coordinators={coordinators} vendors={vendors} />

        <div className="flex items-center gap-3">
          <button type="submit" className="rounded-[9px] px-6 py-2.5 text-[13px] font-bold text-white" style={{ background: "var(--positive)" }}>
            Submit
          </button>
          <button type="reset" className="rounded-[9px] px-6 py-2.5 text-[13px] font-bold text-white" style={{ background: "var(--primary)" }}>
            Reset
          </button>
        </div>
      </form>
    </div>
  );
}
