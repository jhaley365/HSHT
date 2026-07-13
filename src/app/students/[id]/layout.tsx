import { notFound } from "next/navigation";
import { getStudentProfile } from "@/lib/student-detail-queries";
import { StudentTabs } from "@/components/students/StudentTabs";

export const dynamic = "force-dynamic";

export default async function StudentDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const student = await getStudentProfile(id);
  if (!student) notFound();

  const fullName = [student.firstName, student.lastName].filter(Boolean).join(" ") || "Unnamed student";

  return (
    <div className="flex flex-1 flex-col gap-5">
      <div className="rounded-[14px] border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="text-[15px] font-extrabold" style={{ color: "var(--heading)" }}>
          {fullName}
        </div>
        <div className="text-[12.5px]" style={{ color: "var(--muted)" }}>
          {student.school.name} · {student.school.district.name}
        </div>
      </div>

      <StudentTabs studentId={id} />

      {children}
    </div>
  );
}
