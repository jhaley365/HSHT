"use client";

import { usePathname } from "next/navigation";
import { Menu, Sun, Moon, Search, Bell, ChevronDown } from "lucide-react";
import { NAV_ITEMS } from "@/lib/nav";

export function Topbar({
  theme,
  onToggleTheme,
  onToggleSidebar,
}: {
  theme: "light" | "dark";
  onToggleTheme: (theme: "light" | "dark") => void;
  onToggleSidebar: () => void;
}) {
  const pathname = usePathname();
  const activeItem = NAV_ITEMS.find((item) =>
    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
  );
  const isHome = activeItem?.href === "/";

  return (
    <header
      className="flex h-16 flex-none items-center gap-4 border-b px-6"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <button
        type="button"
        onClick={onToggleSidebar}
        aria-label="Toggle sidebar"
        className="flex h-9 w-9 flex-none items-center justify-center rounded-[9px] border"
        style={{ borderColor: "var(--border)", color: "var(--muted)" }}
      >
        <Menu size={18} strokeWidth={2} />
      </button>

      <div className="leading-tight">
        <div className="text-[16px] font-extrabold tracking-[-0.01em]" style={{ color: "var(--heading)" }}>
          {isHome ? "Dashboard" : activeItem?.label ?? "Dashboard"}
        </div>
        <div className="text-[11.5px]" style={{ color: "var(--muted)" }}>
          {isHome ? "Enrollment overview · July 2026" : activeItem?.label}
        </div>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <div
          className="flex h-[38px] items-center gap-1 rounded-[11px] border p-1"
          style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
        >
          {(["light", "dark"] as const).map((mode) => {
            const active = theme === mode;
            const Icon = mode === "light" ? Sun : Moon;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => onToggleTheme(mode)}
                className="flex items-center gap-1.5 rounded-[8px] px-[11px] py-[6px] text-[13px] capitalize transition-colors"
                style={{
                  fontWeight: active ? 700 : 600,
                  background: active ? "var(--surface)" : "transparent",
                  color: active ? "var(--text)" : "var(--muted)",
                  boxShadow: active ? "0 1px 3px rgba(0,0,0,.16)" : "none",
                }}
              >
                <Icon size={15} />
                {mode}
              </button>
            );
          })}
        </div>

        <div
          className="hidden h-[38px] w-[210px] items-center gap-2 rounded-[10px] border px-3 sm:flex"
          style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--muted)" }}
        >
          <Search size={16} />
          <span className="text-[12.5px]">Search students, schools…</span>
        </div>

        <button
          type="button"
          aria-label="Notifications"
          className="relative flex h-[38px] w-[38px] items-center justify-center rounded-[10px] border"
          style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--muted)" }}
        >
          <Bell size={18} />
          <span
            className="absolute -right-1 -top-1 flex h-[17px] min-w-[17px] items-center justify-center rounded-full text-[10px] font-extrabold text-white"
            style={{ background: "var(--primary)", boxShadow: "0 0 0 2px var(--surface)" }}
          >
            2
          </span>
        </button>

        <button
          type="button"
          className="flex h-[38px] items-center gap-2 rounded-[10px] border py-0 pl-[6px] pr-2"
          style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
        >
          <div
            className="flex h-7 w-7 items-center justify-center rounded-[8px] text-[11px] font-extrabold text-white"
            style={{ background: "var(--primary)" }}
          >
            HC
          </div>
          <span className="text-[12.5px] font-bold" style={{ color: "var(--text)" }}>
            hcsupport
          </span>
          <ChevronDown size={14} style={{ color: "var(--muted)" }} />
        </button>
      </div>
    </header>
  );
}
