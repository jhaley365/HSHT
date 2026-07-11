"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";

const THEME_STORAGE_KEY = "hsht-dashboard-theme";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [collapsed, setCollapsed] = useState(false);

  // Reading the saved theme must happen after mount (localStorage isn't
  // available during SSR); setting it here — rather than in the initial
  // render — is what keeps the server-rendered HTML and the client's first
  // paint identical, avoiding a hydration mismatch.
  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored === "light" || stored === "dark") setTheme(stored);
  }, []);

  function handleSetTheme(next: "light" | "dark") {
    setTheme(next);
    window.localStorage.setItem(THEME_STORAGE_KEY, next);
  }

  return (
    <div data-theme={theme} className="flex h-full">
      <Sidebar collapsed={collapsed} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar theme={theme} onToggleTheme={handleSetTheme} onToggleSidebar={() => setCollapsed((c) => !c)} />
        <main className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 pb-[26px] pt-[22px]">{children}</main>
      </div>
    </div>
  );
}
