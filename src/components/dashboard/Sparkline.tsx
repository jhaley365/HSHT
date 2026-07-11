export function BarSparkline({ values, color }: { values: number[]; color: string }) {
  return (
    <div className="flex h-8 w-24 flex-none items-end gap-[2px]">
      {values.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-t-[2px]"
          style={{ height: `${v}%`, background: `var(--${color})`, opacity: 0.8 }}
        />
      ))}
    </div>
  );
}

export function LineSparkline({ color }: { color: string }) {
  // Static illustrative curve — matches the design handoff's "Total Invoicing" mini-metric.
  const path = "M2,34 L14,30 L26,32 L38,24 L50,20 L62,26 L74,14 L86,18 L98,8 L110,12 L122,4 L134,10 L146,2 L158,6";
  const area = `${path} L158,44 L2,44 Z`;
  return (
    <svg viewBox="0 0 160 44" className="h-8 w-24 flex-none">
      <path d={area} fill={`var(--${color})`} fillOpacity={0.14} />
      <path d={path} fill="none" stroke={`var(--${color})`} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
