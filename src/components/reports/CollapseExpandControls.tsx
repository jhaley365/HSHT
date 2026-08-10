"use client";

// Native <details>/<summary> elements have no built-in "collapse all" —
// this just flips the `open` attribute on every <details> inside the
// given container id. Hidden when printing since drill-downs are always
// forced open there (see globals.css).
export function CollapseExpandControls({ containerId }: { containerId: string }) {
  function setAll(open: boolean) {
    document.querySelectorAll(`#${containerId} details`).forEach((el) => {
      (el as HTMLDetailsElement).open = open;
    });
  }

  return (
    <div className="print:hidden flex items-center gap-2">
      <button
        type="button"
        onClick={() => setAll(true)}
        className="rounded-[9px] px-3 py-1.5 text-[12.5px] font-bold"
        style={{ background: "var(--surface-2)", color: "var(--text)" }}
      >
        Expand All
      </button>
      <button
        type="button"
        onClick={() => setAll(false)}
        className="rounded-[9px] px-3 py-1.5 text-[12.5px] font-bold"
        style={{ background: "var(--surface-2)", color: "var(--text)" }}
      >
        Collapse All
      </button>
    </div>
  );
}
