"use client";

export function PrintButton() {
  function handlePrint() {
    // The @media print CSS override for forcing closed <details> open isn't
    // reliable across Chromium versions — newer Chromium renders a closed
    // details' content through an internal ::details-content pseudo-element
    // whose own content-visibility/height a plain `display` (or even
    // content-visibility) override on the light-DOM content doesn't always
    // reach, so it can lay out with real geometry yet never actually paint.
    // Toggling the real `open` attribute sidesteps that entirely.
    const closedDetails = Array.from(document.querySelectorAll<HTMLDetailsElement>("details:not([open])"));
    closedDetails.forEach((d) => {
      d.open = true;
    });

    function restore() {
      closedDetails.forEach((d) => {
        d.open = false;
      });
      window.removeEventListener("afterprint", restore);
    }
    window.addEventListener("afterprint", restore);

    window.print();
  }

  return (
    <button
      type="button"
      onClick={handlePrint}
      className="print:hidden rounded-[9px] px-5 py-2 text-[13px] font-bold text-white"
      style={{ background: "#2563eb" }}
    >
      Print
    </button>
  );
}
