"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { NAV_ITEMS } from "@/lib/nav";

export function Sidebar({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname();

  return (
    <aside
      className="flex flex-none flex-col border-r transition-[width] duration-150"
      style={{
        width: collapsed ? 74 : 236,
        background: "var(--sidebar-bg)",
        borderColor: "var(--sidebar-border)",
        padding: collapsed ? "18px 10px 20px" : "18px 14px 20px",
      }}
    >
      <div
        className={`flex items-center gap-2.5 pb-[22px] pt-1.5 ${collapsed ? "justify-center px-0" : "px-2"}`}
      >
        <div
          className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[10px] text-[13px] font-extrabold text-white"
          style={{ background: "var(--primary)" }}
        >
          HE
        </div>
        {!collapsed && (
          <div className="min-w-0 leading-tight">
            <div className="text-[15px] font-extrabold" style={{ color: "var(--sidebar-brand)" }}>
              HSHT
            </div>
            <div
              className="text-[10px] font-semibold tracking-[0.16em]"
              style={{ color: "var(--sidebar-muted)" }}
            >
              ENROLLMENT
            </div>
          </div>
        )}
      </div>

      {!collapsed && (
        <div
          className="px-2.5 pb-2 text-[10px] font-bold tracking-[0.14em]"
          style={{ color: "var(--sidebar-muted)" }}
        >
          GENERAL
        </div>
      )}

      <nav className="flex flex-col gap-[3px]">
        {NAV_ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[13.5px] transition-colors ${
                collapsed ? "justify-center" : ""
              }`}
              style={{
                fontWeight: active ? 700 : 600,
                color: active ? "var(--sidebar-active-text)" : "var(--sidebar-text)",
                background: active ? "var(--sidebar-active-bg)" : "transparent",
              }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.background = "var(--sidebar-hover)";
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.background = "transparent";
              }}
            >
              <Icon size={18} strokeWidth={1.9} className="flex-none" />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {!collapsed && item.expandable && (
                <ChevronDown size={14} className="ml-auto flex-none" style={{ color: "var(--sidebar-muted)" }} />
              )}
            </Link>
          );
        })}
      </nav>

      <div
        className={`mt-auto flex items-center gap-2.5 border-t pt-3.5 ${collapsed ? "justify-center px-0" : "px-3"}`}
        style={{ borderColor: "var(--sidebar-border)" }}
      >
        <div
          className="flex h-8 w-8 flex-none items-center justify-center rounded-[9px] text-[11px] font-extrabold"
          style={{ background: "var(--c2s)", color: "var(--c2)" }}
        >
          HC
        </div>
        {!collapsed && (
          <div className="min-w-0 leading-tight">
            <div className="truncate text-[12.5px] font-bold" style={{ color: "var(--sidebar-brand)" }}>
              hcsupport
            </div>
            <div className="text-[11px]" style={{ color: "var(--sidebar-muted)" }}>
              Administrator
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
