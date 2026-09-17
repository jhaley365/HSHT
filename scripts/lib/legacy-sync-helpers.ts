// Shared helpers for the legacy SQL Server -> Postgres sync scripts
// (sync-legacy.ts for HSHT, sync-legacy-ytep.ts for YTEP). Kept in one place
// so the two stay consistent — e.g. if the boolean-encoding assumption below
// ever needs correcting, it only needs fixing once.
import sql from "mssql";

export type JobResult = { total: number; skipped: number };

// Legacy boolean-ish columns show up as int (0/1) or varchar(1)/char(1)
// ('Y'/'N' by convention in most SQL Server apps). Permissive on purpose —
// confirm the real encoding against the first dry-run before trusting this
// for the disability/accommodation flags.
export function toBool(v: unknown): boolean {
  if (v === null || v === undefined) return false;
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  const s = String(v).trim().toUpperCase();
  return s === "Y" || s === "1" || s === "T" || s === "TRUE";
}

export function toDecimal(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

// P2003 = foreign key constraint failed, P2002 = unique constraint failed.
// Both indicate a row referencing/duplicating something that doesn't hold up
// in the real data (see MIGRATION.md) — skip it rather than abort the sync.
export function isSkippableConstraintError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    typeof (err as { code?: unknown }).code === "string" &&
    ["P2003", "P2002"].includes((err as { code: string }).code)
  );
}

export async function safeUpsert(fn: () => Promise<unknown>): Promise<boolean> {
  try {
    await fn();
    return true;
  } catch (err) {
    if (isSkippableConstraintError(err)) return false;
    throw err;
  }
}

export async function connectMssql(config: {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  encrypt: boolean;
  trustServerCertificate: boolean;
}) {
  return sql.connect({
    server: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    options: {
      encrypt: config.encrypt,
      trustServerCertificate: config.trustServerCertificate,
    },
  });
}
