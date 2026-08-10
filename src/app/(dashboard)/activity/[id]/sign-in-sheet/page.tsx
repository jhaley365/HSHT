import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/authz";
import { getActivityById, getAssignedStudentsForSignIn } from "@/lib/activity-queries";
import { PrintButton } from "@/components/PrintButton";

export const dynamic = "force-dynamic";

// Fixed program letterhead — this is the organization the HSHT program
// runs under, not activity/school data, so it isn't modeled anywhere.
// Update here if the mailing address or invoice prefix ever changes.
const ORG_NAME = "GA Committee on Employment of People with Disabilities, Inc.";
const ORG_ADDRESS = "P.O. Box 6514, Athens, GA 30604";
const INVOICE_PREFIX = "GC";

const MIN_ROWS = 22;

function stripGroupPrefix(preets: string | null): string {
  return preets?.replace(/^\([A-Z]\)\s*/, "") ?? "";
}

export default async function SignInSheetPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const result = await getActivityById(id);
  if (!result) notFound();
  const { activity } = result;
  const students = await getAssignedStudentsForSignIn(activity.legacyId);

  const blankRows = Math.max(0, MIN_ROWS - students.length);

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="print:hidden flex items-center gap-3">
        <PrintButton />
        <Link href={`/activity/${activity.id}`} className="rounded-[9px] px-5 py-2 text-[13px] font-bold" style={{ background: "var(--surface-2)", color: "var(--text)" }}>
          Back to activity
        </Link>
      </div>

      <div className="mx-auto w-full max-w-[900px] rounded-[10px] border bg-white p-8 text-black print:border-0 print:p-0" style={{ borderColor: "var(--border)" }}>
        <div className="text-[15px] font-bold">{ORG_NAME}</div>
        <div className="text-[13px]">{ORG_ADDRESS}</div>

        <div className="mt-4 flex items-start justify-between gap-8">
          <div className="text-[13px]">
            <div className="mb-1 text-[15px] font-bold">HSHT Attendance Form</div>
            <div>{activity.description}</div>
            <div>{stripGroupPrefix(activity.preets)}</div>
            <div>PRE_ets Service Code: ____________</div>
            <div>{activity.school.name}</div>
            <div>Date of Service: {activity.activityDate ? formatMMDDYYYY(activity.activityDate) : "____________"}</div>
          </div>
          <div className="text-[13px] leading-[1.9]">
            <div>
              Invoice #: {INVOICE_PREFIX} <span className="inline-block w-[120px] border-b border-black" />
            </div>
            <div>
              A&amp;I #: <span className="inline-block w-[140px] border-b border-black" />
            </div>
            <div>
              Start Time: <span className="inline-block w-[100px] border-b border-black" />
            </div>
            <div>
              End Time: <span className="inline-block w-[100px] border-b border-black" />
            </div>
            <div>
              Total Time: <span className="inline-block w-[100px] border-b border-black" />
            </div>
            <div className="mt-1">
              Invoice Type: <span className="inline-block h-3 w-3 border border-black align-middle" /> Individual /{" "}
              <span className="inline-block h-3 w-3 border border-black align-middle" /> Group
            </div>
          </div>
        </div>

        <table className="mt-4 w-full border-collapse text-[13px]">
          <thead>
            <tr>
              <th className="w-[30px] border border-black bg-[#3b5aa0] p-1.5 text-white"></th>
              <th className="border border-black bg-[#3b5aa0] p-1.5 text-white">Student Name</th>
              <th className="w-[90px] border border-black bg-[#3b5aa0] p-1.5 text-white">PID</th>
              <th className="border border-black bg-[#3b5aa0] p-1.5 text-white">Student Signature</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s, i) => (
              <tr key={s.id}>
                <td className="border border-black p-1.5">{i + 1}</td>
                <td className="border border-black p-1.5">
                  {s.firstName} {s.lastName}
                </td>
                <td className="border border-black p-1.5">{s.legacyId}</td>
                <td className="border border-black p-1.5">&nbsp;</td>
              </tr>
            ))}
            {Array.from({ length: blankRows }).map((_, i) => (
              <tr key={`blank-${i}`}>
                <td className="border border-black p-1.5">{students.length + i + 1}</td>
                <td className="border border-black p-1.5">&nbsp;</td>
                <td className="border border-black p-1.5">&nbsp;</td>
                <td className="border border-black p-1.5">&nbsp;</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatMMDDYYYY(date: Date): string {
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const yyyy = date.getUTCFullYear();
  return `${mm}-${dd}-${yyyy}`;
}
