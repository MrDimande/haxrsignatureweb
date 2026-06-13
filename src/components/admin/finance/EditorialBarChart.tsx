"use client";

type EditorialBarChartProps = {
  data: { label: string; value: number; hint?: string }[];
  formatValue: (value: number) => string;
  highlightLast?: boolean;
  emptyLabel?: string;
};

export default function EditorialBarChart({
  data,
  formatValue,
  highlightLast = false,
  emptyLabel = "Sem dados no período",
}: EditorialBarChartProps) {
  const max = Math.max(...data.map((item) => item.value), 1);
  const hasData = data.some((item) => item.value > 0);

  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-48 border border-dashed border-grey-dark/60">
        <p className="text-sm text-grey/45 italic">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-2 sm:gap-3 h-52">
        {data.map((item, index) => {
          const height = Math.max((item.value / max) * 100, item.value > 0 ? 8 : 2);
          const active =
            highlightLast && index === data.length - 1 && item.value > 0;

          return (
            <div
              key={item.label}
              className="flex-1 flex flex-col items-center justify-end gap-2 min-w-0"
            >
              <div className="w-full flex flex-col items-center justify-end h-40">
                {item.value > 0 ? (
                  <span className="font-mono text-[9px] text-grey/50 mb-1.5 truncate max-w-full">
                    {formatValue(item.value)}
                  </span>
                ) : null}
                <div
                  className={`w-full max-w-10 transition-all duration-700 ${
                    active
                      ? "bg-gradient-to-t from-admin-gold/80 to-admin-gold/30"
                      : "bg-gradient-to-t from-white/20 to-white/5"
                  }`}
                  style={{ height: `${height}%` }}
                  title={item.hint}
                />
              </div>
              <span className="font-mono text-[9px] tracking-[0.15em] uppercase text-grey/45">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
