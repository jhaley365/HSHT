import { requireStaff } from "@/lib/authz";
import {
  getActivityItemsGrouped,
  getSchoolOptions,
  getCoordinatorOptions,
  getVendorOptions,
} from "@/lib/activity-queries";
import { createActivityAction } from "@/lib/actions/activity-actions";

export const dynamic = "force-dynamic";

const inputStyle = {
  background: "var(--surface-2)",
  borderColor: "var(--border)",
  color: "var(--text)",
} as const;

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
        <div className="rounded-[14px] border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="mb-4 text-[14px] font-extrabold" style={{ color: "var(--heading)" }}>
            New Activity
          </div>

          <div className="grid max-w-[560px] gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold" style={{ color: "var(--text)" }}>
                PRE-ETS
              </span>
              <select name="preets" defaultValue={groups[0]?.group} className="h-[38px] rounded-[9px] border px-3 text-[13px] outline-none" style={inputStyle}>
                {groups.map((g) => (
                  <option key={g.group} value={g.group}>
                    {g.group}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold" style={{ color: "var(--text)" }}>
                Activity
              </span>
              <input type="text" name="name" required className="h-[38px] rounded-[9px] border px-3 text-[13px] outline-none" style={inputStyle} />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold" style={{ color: "var(--text)" }}>
                Description
              </span>
              <input type="text" name="description" className="h-[38px] rounded-[9px] border px-3 text-[13px] outline-none" style={inputStyle} />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold" style={{ color: "var(--text)" }}>
                Date
              </span>
              <input type="date" name="activityDate" className="h-[38px] rounded-[9px] border px-3 text-[13px] outline-none" style={inputStyle} />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold" style={{ color: "var(--text)" }}>
                School
              </span>
              <select name="schoolId" required defaultValue="" className="h-[38px] rounded-[9px] border px-3 text-[13px] outline-none" style={inputStyle}>
                <option value="" disabled>
                  Select a school
                </option>
                {schools.map((s) => (
                  <option key={s.legacyId} value={s.legacyId}>
                    {s.name} ({s.district.code}-{s.schoolCode})
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold" style={{ color: "var(--text)" }}>
                HSHT Coordinator
              </span>
              <select name="coordinatorId" defaultValue="" className="h-[38px] rounded-[9px] border px-3 text-[13px] outline-none" style={inputStyle}>
                <option value="">—</option>
                {coordinators.map((c) => (
                  <option key={c.legacyId} value={c.legacyId}>
                    {c.lastName}, {c.firstName}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {groups.map((g) => (
          <div key={g.group} className="rounded-[14px] border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="mb-3 border-b pb-3 text-[14px] font-extrabold" style={{ color: "var(--heading)", borderColor: "var(--border)" }}>
              {g.group}
            </div>
            <div className="flex flex-col gap-3">
              {g.items.map((item) => (
                <div key={item.activityItemId} className="grid grid-cols-[1fr_auto_auto_180px] items-center gap-4">
                  <span className="text-[13px] font-semibold" style={{ color: "var(--text)" }}>
                    {item.description}
                  </span>
                  <label className="flex items-center gap-1.5 text-[12.5px]" style={{ color: "var(--text)" }}>
                    <input type="radio" name={`item_${item.activityItemId}_choice`} value="hsht" />
                    HS/HT
                  </label>
                  <label className="flex items-center gap-1.5 text-[12.5px]" style={{ color: "var(--text)" }}>
                    <input type="radio" name={`item_${item.activityItemId}_choice`} value="other" />
                    Other
                  </label>
                  <select
                    name={`item_${item.activityItemId}_funding`}
                    defaultValue=""
                    className="h-[34px] rounded-[8px] border px-2 text-[12.5px] outline-none"
                    style={inputStyle}
                  >
                    <option value=""></option>
                    {vendors.map((v) => (
                      <option key={v.legacyId} value={v.vendorCode ?? ""}>
                        {v.vendorCode}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="rounded-[9px] px-6 py-2.5 text-[13px] font-bold text-white"
            style={{ background: "var(--positive)" }}
          >
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
