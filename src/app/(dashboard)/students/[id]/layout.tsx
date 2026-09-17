import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/authz";
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
  const session = await requireUser();
  const canManage = session.user.role === "STAFF" || session.user.role === "ADMIN";
  const { id } = await params;
  const student = await getStudentProfile(id);
  if (!student) notFound();

  const fullName = [student.firstName, student.lastName].filter(Boolean).join(" ") || "Unnamed student";

  return (
    <div className="flex flex-1 flex-col gap-5">
      <div className="flex items-center justify-between rounded-[14px] border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div>
          <div className="text-[15px] font-extrabold" style={{ color: "var(--heading)" }}>
            {fullName}
          </div>
          <div className="text-[12.5px]" style={{ color: "var(--muted)" }}>
            {student.school.name} · {student.school.district.name}
          </div>
        </div>
        {canManage && (
          <Link
            href={`/students/${id}/edit`}
            className="rounded-[9px] px-4 py-2 text-[12.5px] font-bold text-white"
            style={{ background: "#f59e0b" }}
          >
            Edit Student
          </Link>
        )}
      </div>

      <StudentTabs studentId={id} />

      {children}
    </div>
  );
}
