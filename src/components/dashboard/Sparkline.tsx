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

