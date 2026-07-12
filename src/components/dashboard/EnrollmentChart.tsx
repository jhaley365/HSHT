import { getEnrollmentSeries, getMiniMetrics } from "@/lib/dashboard-data";
import { BarSparkline } from "@/components/dashboard/Sparkline";

const GRIDLINES = [30, 75, 120, 165, 210];
const Y_LABELS = ["120", "90", "60", "30", "0"];

export function EnrollmentChart() {
  const { points, xLabels } = getEnrollmentSeries();
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaPath = `${linePath} L${points[points.length - 1].x},210 L${points[0].x},210 Z`;
  const metrics = getMiniMetrics();

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
            Weekly progress
          </div>
        </div>
        <div
          className="flex items-center gap-2 rounded-[8px] border px-[10px] py-[5px] text-[11.5px] font-bold"
          style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--muted)" }}
        >
          <span className="h-[9px] w-[9px] rounded-[2px]" style={{ background: "var(--accent)" }} />
          Email Sent
        </div>
      </div>

      <svg viewBox="0 0 920 240" className="mt-2 w-full">
        {GRIDLINES.map((y, i) => (
          <line
            key={y}
            x1={30}
            x2={900}
            y1={y}
            y2={y}
            stroke="var(--grid)"
            strokeWidth={i === GRIDLINES.length - 1 ? 1.5 : 1}
          />
        ))}
        {Y_LABELS.map((label, i) => (
          <text key={label} x={20} y={GRIDLINES[i] + 4} textAnchor="end" fontSize={11} fill="var(--muted)">
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
        {xLabels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      <div
        className="mt-4 grid grid-cols-2 gap-4 border-t pt-4"
        style={{ borderColor: "var(--border)" }}
      >
        {metrics.map((m) => (
          <div key={m.label}>
            <div className="text-[11.5px] font-semibold" style={{ color: "var(--muted)" }}>
              {m.label}
            </div>
            <div className="mt-1 flex items-center justify-between gap-2">
              <div className="flex items-baseline gap-1.5">
                <span className="text-[20px] font-extrabold" style={{ color: "var(--heading)" }}>
                  {m.value}
                </span>
                <span className="text-[11px] font-bold" style={{ color: "var(--positive)" }}>
                  +{m.deltaPercent.toFixed(1)}%
                </span>
              </div>
              <BarSparkline values={m.bars} color={m.color} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
