import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/authz";
import { getUserById } from "@/lib/users-queries";
import { updateUserAction, deleteUserAction } from "@/lib/actions/user-actions";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Admin",
  STAFF: "Staff",
  VIEWER: "Viewer",
};

const inputStyle = {
  background: "var(--surface-2)",
  borderColor: "var(--border)",
  color: "var(--text)",
} as const;

export default async function EditUserPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireAdmin();
  const { id } = await params;
  const { error } = await searchParams;
  const user = await getUserById(id);
  if (!user) notFound();
  const isSelf = user.id === session.user.id;

  return (
    <div className="flex max-w-[560px] flex-1 flex-col gap-5">
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
          {user.email}
        </div>
        <div className="mb-4 text-[12.5px]" style={{ color: "var(--muted)" }}>
          Added {user.createdAt.toLocaleDateString()}
        </div>

        <form action={updateUserAction} className="flex flex-col gap-3">
          <input type="hidden" name="id" value={user.id} />

          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold" style={{ color: "var(--text)" }}>
              Name
            </span>
            <input
              type="text"
              name="name"
              defaultValue={user.name ?? ""}
              className="h-[38px] rounded-[9px] border px-3 text-[13px] outline-none"
              style={inputStyle}
            />
          </label>

          {isSelf ? (
            <p className="text-[12.5px]" style={{ color: "var(--muted)" }}>
              Role: <strong style={{ color: "var(--text)" }}>{ROLE_LABEL[user.role] ?? user.role}</strong> · You
              can&apos;t change your own role or active status here.
            </p>
          ) : (
            <>
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-semibold" style={{ color: "var(--text)" }}>
                  Role
                </span>
                <select
                  name="role"
                  defaultValue={user.role}
                  className="h-[38px] rounded-[9px] border px-3 text-[13px] outline-none"
                  style={inputStyle}
                >
                  <option value="VIEWER">Viewer</option>
                  <option value="STAFF">Staff</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </label>

              <label className="flex items-center gap-2">
                <input type="checkbox" name="active" defaultChecked={user.active} />
                <span className="text-[13px]" style={{ color: "var(--text)" }}>
                  Active
                </span>
              </label>
            </>
          )}

          <button
            type="submit"
            className="mt-1 h-[38px] rounded-[9px] text-[13px] font-bold text-white"
            style={{ background: "var(--primary)" }}
          >
            Save changes
          </button>
        </form>
      </div>

      {!isSelf && (
        <form action={deleteUserAction}>
          <input type="hidden" name="id" value={user.id} />
          <button
            type="submit"
            className="rounded-[9px] px-5 py-2 text-[13px] font-bold"
            style={{ background: "rgba(248,113,113,0.12)", color: "#f87171" }}
          >
            Delete user
          </button>
        </form>
      )}
    </div>
  );
}
