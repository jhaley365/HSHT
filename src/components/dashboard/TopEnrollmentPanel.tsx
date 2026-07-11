import { Building2 } from "lucide-react";
import { getTopEnrollment } from "@/lib/dashboard-data";

export function TopEnrollmentPanel() {
  const schools = getTopEnrollment();

  return (
    <div
      className="w-[322px] flex-none rounded-[14px] border px-5 pb-3 pt-5"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <div className="flex items-center justify-between">
        <div className="text-[15px] font-extrabold" style={{ color: "var(--heading)" }}>
          Top Enrollment
        </div>
        <a href="#" className="text-[11.5px] font-bold" style={{ color: "var(--accent)" }}>
          View all
        </a>
      </div>

      <div className="mt-1">
        {schools.map((school) => (
          <div
            key={school.name}
            className="flex items-center gap-3 rounded-[10px] px-2 py-[10px] transition-colors hover:[background:var(--surface-2)]"
          >
            <div
              className="flex h-9 w-9 flex-none items-center justify-center rounded-[10px]"
              style={{ background: `var(--${school.color}s)`, color: `var(--${school.color})` }}
            >
              <Building2 size={19} strokeWidth={1.9} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-bold" style={{ color: "var(--text)" }}>
                {school.name}
              </div>
              <div className="text-[11.5px]" style={{ color: "var(--muted)" }}>
                {school.county}
              </div>
            </div>
            <div className="flex-none text-right">
              <div className="text-[15px] font-extrabold" style={{ color: "var(--heading)" }}>
                {school.students}
              </div>
              <div className="text-[10.5px]" style={{ color: "var(--muted)" }}>
                students
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
