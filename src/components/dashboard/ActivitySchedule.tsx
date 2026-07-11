import { getActivitySchedule, getWeeklyActivityBars } from "@/lib/dashboard-data";

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  Active: { color: "var(--positive)", bg: "var(--positive-soft)" },
  Pending: { color: "var(--c3)", bg: "var(--c3s)" },
  Closed: { color: "var(--muted)", bg: "var(--surface-2)" },
};

const GRID_COLS = "36px 92px 1.1fr 1.2fr 1.4fr 88px";

export function ActivitySchedule() {
  const rows = getActivitySchedule();
  const bars = getWeeklyActivityBars();

  return (
    <div
      className="overflow-hidden rounded-[14px] border"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <div className="flex items-start justify-between px-[22px] pb-[14px] pt-[18px]">
        <div>
          <div className="text-[15px] font-extrabold" style={{ color: "var(--heading)" }}>
            Activity Schedule
          </div>
          <div className="text-[11.5px]" style={{ color: "var(--muted)" }}>
            Weekly summary
          </div>
        </div>
        <a href="#" className="text-[11.5px] font-bold" style={{ color: "var(--accent)" }}>
          Export
        </a>
      </div>

      <div className="flex items-stretch">
        <div className="min-w-0 flex-1 px-2 pb-2">
          <div
            className="grid px-3.5 py-2 text-[10.5px] font-extrabold uppercase tracking-[0.05em]"
            style={{ gridTemplateColumns: GRID_COLS, color: "var(--muted)" }}
          >
            <span>#</span>
            <span>Date</span>
            <span>Activity</span>
            <span>School</span>
            <span>Description</span>
            <span className="text-right">Status</span>
          </div>
          {rows.map((row, i) => (
            <div
              key={i}
              className="grid items-center border-t px-3.5 py-[11px] text-[12.5px]"
              style={{ gridTemplateColumns: GRID_COLS, borderColor: "var(--border)" }}
            >
              <span className="font-bold" style={{ color: "var(--muted)" }}>
                {i + 1}
              </span>
              <span style={{ color: "var(--muted)" }}>{row.date}</span>
              <span className="truncate font-bold" style={{ color: "var(--text)" }}>
                {row.activity}
              </span>
              <span className="truncate" style={{ color: "var(--text)" }}>
                {row.school}
              </span>
              <span className="truncate" style={{ color: "var(--muted)" }}>
                {row.description}
              </span>
              <span className="text-right">
                <span
                  className="rounded-full px-[9px] py-[3px] text-[10.5px] font-extrabold"
                  style={{ color: STATUS_STYLE[row.status].color, background: STATUS_STYLE[row.status].bg }}
                >
                  {row.status}
                </span>
              </span>
            </div>
          ))}
        </div>

        <div className="w-[288px] flex-none border-l px-5 pb-[18px] pt-4" style={{ borderColor: "var(--border)" }}>
          <div className="text-[12.5px] font-bold" style={{ color: "var(--text)" }}>
            Weekly activity
          </div>
          <div className="text-[11px]" style={{ color: "var(--muted)" }}>
            Participation events logged
          </div>
          <div className="mt-4 flex h-24 items-end gap-[3px]">
            {bars.map((v, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-[3px]"
                style={{ height: `${v}%`, background: "var(--accent)", opacity: 0.85 }}
              />
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[10.5px]" style={{ color: "var(--muted)" }}>
            <span>Mon</span>
            <span>Wed</span>
            <span>Fri</span>
            <span>Sun</span>
          </div>
        </div>
      </div>
    </div>
  );
}
