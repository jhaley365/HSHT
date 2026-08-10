"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="print:hidden rounded-[9px] px-5 py-2 text-[13px] font-bold text-white"
      style={{ background: "#2563eb" }}
    >
      Print
    </button>
  );
}
