import type { getActivityItemsGrouped, getSchoolOptions, getCoordinatorOptions, getVendorOptions } from "@/lib/activity-queries";

type Groups = Awaited<ReturnType<typeof getActivityItemsGrouped>>;
type Schools = Awaited<ReturnType<typeof getSchoolOptions>>;
type Coordinators = Awaited<ReturnType<typeof getCoordinatorOptions>>;
type Vendors = Awaited<ReturnType<typeof getVendorOptions>>;

export type ActivityDetailChoice = { choice: "hsht" | "other"; funding: string | null };

export type ActivityFormDefaults = {
  preets?: string | null;
  name?: string;
  description?: string | null;
  activityDate?: string; // yyyy-mm-dd, matches <input type="date">
  schoolId?: number;
  coordinatorId?: number | null;
  detailsByItemId?: Map<number, ActivityDetailChoice>;
};

const inputStyle = {
  background: "var(--surface-2)",
  borderColor: "var(--border)",
  color: "var(--text)",
} as const;

export function ActivityFormFields({
  groups,
  schools,
  coordinators,
  vendors,
  defaults = {},
}: {
  groups: Groups;
  schools: Schools;
  coordinators: Coordinators;
  vendors: Vendors;
  defaults?: ActivityFormDefaults;
}) {
  return (
    <>
      <div className="rounded-[14px] border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="grid max-w-[560px] gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold" style={{ color: "var(--text)" }}>
              PRE-ETS
            </span>
            <select
              name="preets"
              defaultValue={defaults.preets ?? groups[0]?.group}
              className="h-[38px] rounded-[9px] border px-3 text-[13px] outline-none"
              style={inputStyle}
            >
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
            <input
              type="text"
              name="name"
              required
              defaultValue={defaults.name}
              className="h-[38px] rounded-[9px] border px-3 text-[13px] outline-none"
              style={inputStyle}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold" style={{ color: "var(--text)" }}>
              Description
            </span>
            <input
              type="text"
              name="description"
              defaultValue={defaults.description ?? ""}
              className="h-[38px] rounded-[9px] border px-3 text-[13px] outline-none"
              style={inputStyle}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold" style={{ color: "var(--text)" }}>
              Date
            </span>
            <input
              type="date"
              name="activityDate"
              defaultValue={defaults.activityDate}
              className="h-[38px] rounded-[9px] border px-3 text-[13px] outline-none"
              style={inputStyle}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold" style={{ color: "var(--text)" }}>
              School
            </span>
            <select
              name="schoolId"
              required
              defaultValue={defaults.schoolId ?? ""}
              className="h-[38px] rounded-[9px] border px-3 text-[13px] outline-none"
              style={inputStyle}
            >
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
            <select
              name="coordinatorId"
              defaultValue={defaults.coordinatorId ?? ""}
              className="h-[38px] rounded-[9px] border px-3 text-[13px] outline-none"
              style={inputStyle}
            >
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
            {g.items.map((item) => {
              const existing = defaults.detailsByItemId?.get(item.activityItemId);
              return (
                <div key={item.activityItemId} className="flex flex-wrap items-center gap-4">
                  <span className="w-[380px] flex-none text-[13px] font-semibold" style={{ color: "var(--text)" }}>
                    {item.description}
                  </span>
                  <label className="flex items-center gap-1.5 text-[12.5px]" style={{ color: "var(--text)" }}>
                    <input
                      type="radio"
                      name={`item_${item.activityItemId}_choice`}
                      value="hsht"
                      defaultChecked={existing?.choice === "hsht"}
                    />
                    HS/HT
                  </label>
                  <label className="flex items-center gap-1.5 text-[12.5px]" style={{ color: "var(--text)" }}>
                    <input
                      type="radio"
                      name={`item_${item.activityItemId}_choice`}
                      value="other"
                      defaultChecked={existing?.choice === "other"}
                    />
                    Other
                  </label>
                  <select
                    name={`item_${item.activityItemId}_funding`}
                    defaultValue={existing?.funding ?? ""}
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
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}
