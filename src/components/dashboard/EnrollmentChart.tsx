import type { EnrollmentTrend } from "@/lib/db-queries";
import { BarSparkline } from "@/components/dashboard/Sparkline";

const CHART_LEFT = 30;
const CHART_RIGHT = 900;
const CHART_TOP = 30;
const CHART_BOTTOM = 210;
const GRID_STEPS = 4;
const MAX_X_LABELS = 7;

function niceMax(value: number): number {
  if (value <= 0) return 10;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  return Math.ceil(value / magnitude) * magnitude;
}

export function EnrollmentChart({ trend }: { trend: EnrollmentTrend }) {
  const counts = trend.cumulativeCounts;
  const n = counts.length;
  const yMax = niceMax(Math.max(...counts, 1));

  const xFor = (i: number) => (n <= 1 ? CHART_LEFT : CHART_LEFT + (i * (CHART_RIGHT - CHART_LEFT)) / (n - 1));
  const yFor = (value: number) => CHART_BOTTOM - (value / yMax) * (CHART_BOTTOM - CHART_TOP);

  const points = counts.map((value, i) => ({ x: xFor(i), y: yFor(value) }));
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaPath = n > 0 ? `${linePath} L${points[n - 1].x},${CHART_BOTTOM} L${points[0].x},${CHART_BOTTOM} Z` : "";

  const gridLines = Array.from({ length: GRID_STEPS + 1 }, (_, i) => CHART_TOP + (i * (CHART_BOTTOM - CHART_TOP)) / GRID_STEPS);
  const yLabels = Array.from({ length: GRID_STEPS + 1 }, (_, i) => Math.round(yMax * ((GRID_STEPS - i) / GRID_STEPS)));

  // Thin the x-axis labels so they don't overlap once the school year has
  // run for many weeks — always includes the first and last week.
  const labelStep = Math.max(1, Math.ceil(n / MAX_X_LABELS));
  const xLabels = trend.weekLabels.filter((_, i) => i % labelStep === 0 || i === n - 1);

  const maxWeeklyNew = Math.max(...trend.weeklyNewCounts, 1);
  const sparklineValues = trend.weeklyNewCounts.map((v) => Math.round((v / maxWeeklyNew) * 100));

  return (
    <div
      className="flex min-w-0 flex-1 flex-col rounded-[14px] border px-[22px] pb-[18px] pt-5"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[15px] font-extrabold" style={{ color: "var(--heading)" }}>
            Enrollment Summary
          </div>
          <div className="text-[11.5px]" style={{ color: "var(--muted)" }}>
            {trend.schoolYearLabel ? `Students enrolled, ${trend.schoolYearLabel} school year` : "Students enrolled"}
          </div>
        </div>
        <div
          className="flex items-center gap-2 rounded-[8px] border px-[10px] py-[5px] text-[11.5px] font-bold"
          style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--muted)" }}
        >
          <span className="h-[9px] w-[9px] rounded-[2px]" style={{ background: "var(--accent)" }} />
          Students Enrolled
        </div>
      </div>

      {n === 0 ? (
        <div className="flex flex-1 items-center justify-center py-16 text-[13px]" style={{ color: "var(--muted)" }}>
          No enrollment data for the current school year yet.
        </div>
      ) : (
        <>
          <svg viewBox="0 0 920 240" className="mt-2 w-full">
            {gridLines.map((y, i) => (
              <line key={y} x1={CHART_LEFT} x2={CHART_RIGHT} y1={y} y2={y} stroke="var(--grid)" strokeWidth={i === gridLines.length - 1 ? 1.5 : 1} />
            ))}
            {yLabels.map((label, i) => (
              <text key={i} x={CHART_LEFT - 10} y={gridLines[i] + 4} textAnchor="end" fontSize={11} fill="var(--muted)">
                {label}
              </text>
            ))}
            <path d={areaPath} fill="var(--accent)" fillOpacity={0.13} />
            <path d={linePath} fill="none" stroke="var(--accent)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
            {points.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={3.6} fill="var(--surface)" stroke="var(--accent)" strokeWidth={2} />
            ))}
          </svg>
          <div className="flex justify-between pl-[30px] text-[11px]" style={{ color: "var(--muted)" }}>
            {xLabels.map((label, i) => (
              <span key={i}>{label}</span>
            ))}
          </div>
        </>
      )}

      <div className="mt-4 flex items-center justify-between gap-4 border-t pt-4" style={{ borderColor: "var(--border)" }}>
        <div>
          <div className="text-[11.5px] font-semibold" style={{ color: "var(--muted)" }}>
            Total Enrolled This School Year
          </div>
          <div className="mt-1 text-[20px] font-extrabold" style={{ color: "var(--heading)" }}>
            {trend.totalEnrolled.toLocaleString()}
          </div>
        </div>
        {n > 0 && <BarSparkline values={sparklineValues} color="c1" />}
      </div>
    </div>
  );
}
