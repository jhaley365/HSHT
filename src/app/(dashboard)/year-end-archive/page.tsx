import { requireAdmin } from "@/lib/authz";
import { getSchoolYearArchiveStatus, getActiveStudentCount } from "@/lib/year-end-archive-queries";
import { archiveCurrentYearAction, undoCurrentYearArchiveAction } from "@/lib/actions/year-end-archive-actions";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";

export const dynamic = "force-dynamic";

export default async function YearEndArchivePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin();
  const { error } = await searchParams;
  const [schoolYears, activeStudentCount] = await Promise.all([getSchoolYearArchiveStatus(), getActiveStudentCount()]);
  const current = schoolYears.find((sy) => sy.isCurrent);

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

      <div className="rounded-[14px] border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="mb-1 text-[14px] font-extrabold" style={{ color: "var(--heading)" }}>
          Year-End Archive
        </div>
        <div className="mb-4 text-[12.5px]" style={{ color: "var(--muted)" }}>
          Moves every active student into StudentArchive for the current school year and marks them inactive. This is
          a one-time, per-year operation — {current?.label ?? "the current school year"} has {activeStudentCount}{" "}
          active student{activeStudentCount === 1 ? "" : "s"} right now.
        </div>

        {current && !current.isArchived && (
          <form action={archiveCurrentYearAction}>
            <ConfirmSubmitButton
              confirmMessage={`Archive ${activeStudentCount} active student${activeStudentCount === 1 ? "" : "s"} for ${current.label} and mark them inactive? This can be undone from this page afterward.`}
              className="rounded-[9px] px-5 py-2 text-[13px] font-bold text-white"
              style={{ background: "var(--positive)" }}
            >
              Archive Current Year
            </ConfirmSubmitButton>
          </form>
        )}

        {current?.isArchived && (
          <form action={undoCurrentYearArchiveAction}>
            <input type="hidden" name="schoolYear" value={current.archiveYearKey} />
            <ConfirmSubmitButton
              confirmMessage={`Undo the archive for ${current.label}? This reactivates ${current.archivedCount} student${current.archivedCount === 1 ? "" : "s"} and removes their archive snapshot.`}
              className="rounded-[9px] px-5 py-2 text-[13px] font-bold"
              style={{ background: "rgba(248,113,113,0.12)", color: "#f87171" }}
            >
              Undo Archive
            </ConfirmSubmitButton>
          </form>
        )}
      </div>

      <div className="rounded-[14px] border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div
          className="grid px-5 py-2 text-[10.5px] font-extrabold uppercase tracking-[0.05em]"
          style={{ gridTemplateColumns: "1fr 100px 90px", color: "var(--muted)" }}
        >
          <span>School Year</span>
          <span>Total</span>
          <span>Status</span>
        </div>
        {schoolYears.map((sy) => (
          <div
            key={sy.legacyId}
            className="grid items-center border-t px-5 py-1.5 text-[12.5px]"
            style={{ gridTemplateColumns: "1fr 100px 90px", borderColor: "var(--border)" }}
          >
            <span style={{ color: "var(--text)" }}>
              {sy.label} {sy.isCurrent ? <span style={{ color: "var(--muted)" }}>(current)</span> : null}
            </span>
            <span style={{ color: "var(--muted)" }}>{sy.isArchived ? sy.archivedCount : ""}</span>
            <span style={{ color: sy.isArchived ? "var(--positive)" : "var(--muted)" }}>{sy.isArchived ? "ARCHIVED" : "—"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
