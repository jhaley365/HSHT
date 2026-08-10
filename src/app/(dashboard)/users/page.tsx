import Link from "next/link";
import { requireAdmin } from "@/lib/authz";
import { getUsersList } from "@/lib/users-queries";
import { createUserAction } from "@/lib/actions/user-actions";

export const dynamic = "force-dynamic";

const GRID_COLS = "1.2fr 1.6fr 110px 100px 70px";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Admin",
  STAFF: "Staff",
  VIEWER: "Viewer",
};

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin();
  const { error } = await searchParams;
  const users = await getUsersList();

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
        <div className="mb-3 text-[14px] font-extrabold" style={{ color: "var(--heading)" }}>
          Add a user
        </div>
        <form action={createUserAction} className="flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1">
            <label className="mb-1 block text-[12px] font-semibold" style={{ color: "var(--muted)" }}>
              Email
            </label>
            <input
              type="email"
              name="email"
              required
              placeholder="name@haley365.com"
              className="w-full rounded-[9px] border px-3 py-2 text-[13px] outline-none"
              style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" }}
            />
          </div>
          <div className="min-w-[180px]">
            <label className="mb-1 block text-[12px] font-semibold" style={{ color: "var(--muted)" }}>
              Name (optional)
            </label>
            <input
              type="text"
              name="name"
              placeholder="Jane Doe"
              className="w-full rounded-[9px] border px-3 py-2 text-[13px] outline-none"
              style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" }}
            />
          </div>
          <div>
            <label className="mb-1 block text-[12px] font-semibold" style={{ color: "var(--muted)" }}>
              Role
            </label>
            <select
              name="role"
              defaultValue="VIEWER"
              className="rounded-[9px] border px-3 py-2 text-[13px] outline-none"
              style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" }}
            >
              <option value="VIEWER">Viewer</option>
              <option value="STAFF">Staff</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <button
            type="submit"
            className="rounded-[9px] px-5 py-2 text-[13px] font-bold text-white"
            style={{ background: "var(--primary)" }}
          >
            Add user
          </button>
        </form>
      </div>

      <div className="overflow-hidden rounded-[14px] border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div
          className="grid px-5 py-3 text-[10.5px] font-extrabold uppercase tracking-[0.05em]"
          style={{ gridTemplateColumns: GRID_COLS, color: "var(--muted)" }}
        >
          <span>Name</span>
          <span>Email</span>
          <span>Role</span>
          <span>Status</span>
          <span></span>
        </div>

        {users.length === 0 && (
          <div className="px-5 py-10 text-center text-[13px]" style={{ color: "var(--muted)" }}>
            No users yet.
          </div>
        )}

        {users.map((u) => (
          <div
            key={u.id}
            className="grid items-center border-t px-5 py-3 text-[13px]"
            style={{ gridTemplateColumns: GRID_COLS, borderColor: "var(--border)" }}
          >
            <span style={{ color: "var(--text)" }}>{u.name || "—"}</span>
            <span style={{ color: "var(--muted)" }}>{u.email}</span>
            <span style={{ color: "var(--text)" }}>{ROLE_LABEL[u.role] ?? u.role}</span>
            <span style={{ color: u.active ? "var(--positive)" : "var(--muted)" }}>
              {u.active ? "Active" : "Inactive"}
            </span>
            <Link
              href={`/users/${u.id}`}
              className="justify-self-end text-[12.5px] font-bold"
              style={{ color: "var(--primary)" }}
            >
              Edit
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
