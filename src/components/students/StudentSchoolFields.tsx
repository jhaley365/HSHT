type SchoolOption = { legacyId: number; name: string; schoolCode: string | null; district: { code: string | null } };

const inputStyle = {
  background: "var(--surface-2)",
  borderColor: "var(--border)",
  color: "var(--text)",
} as const;

// A School always belongs to exactly one District, so there's no need for a
// separate District selector — matches ActivityFormFields' School select,
// which shows the district code right in the option label.
export function StudentSchoolFields({ schools, defaultSchoolId }: { schools: SchoolOption[]; defaultSchoolId?: number }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12px] font-semibold" style={{ color: "var(--text)" }}>
        School
      </span>
      <select
        name="schoolId"
        required
        defaultValue={defaultSchoolId ?? ""}
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
  );
}
