"use client";

type DonutSegment = {
  label: string;
  value: number;
  color: string;
};

type EditorialDonutChartProps = {
  segments: DonutSegment[];
  formatValue: (value: number) => string;
  centerLabel?: string;
  centerValue?: string;
};

export default function EditorialDonutChart({
  segments,
  formatValue,
  centerLabel = "Total",
  centerValue,
}: EditorialDonutChartProps) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);

  if (total <= 0) {
    return (
      <div className="flex items-center justify-center h-48 border border-dashed border-grey-dark/60">
        <p className="text-sm text-grey/45 italic">Sem receitas registadas</p>
      </div>
    );
  }

  let cumulative = 0;
  const gradientStops = segments
    .filter((segment) => segment.value > 0)
    .map((segment) => {
      const start = (cumulative / total) * 100;
      cumulative += segment.value;
      const end = (cumulative / total) * 100;
      return `${segment.color} ${start}% ${end}%`;
    })
    .join(", ");

  return (
    <div className="flex flex-col sm:flex-row items-center gap-8">
      <div
        className="relative w-40 h-40 rounded-full shrink-0"
        style={{
          background: `conic-gradient(${gradientStops})`,
        }}
      >
        <div className="absolute inset-5 rounded-full bg-black-soft flex flex-col items-center justify-center text-center px-2">
          <p className="font-mono text-[8px] tracking-[0.25em] uppercase text-grey/45">
            {centerLabel}
          </p>
          <p className="font-serif text-lg font-light text-white/90 mt-1 leading-tight">
            {centerValue ?? formatValue(total)}
          </p>
        </div>
      </div>

      <ul className="space-y-3 flex-1 w-full">
        {segments.map((segment) => {
          const share = total > 0 ? (segment.value / total) * 100 : 0;
          return (
            <li key={segment.label} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: segment.color }}
                  />
                  <span className="text-white/80 truncate">{segment.label}</span>
                </div>
                <span className="font-mono text-xs text-grey/55 shrink-0">
                  {share.toFixed(0)}%
                </span>
              </div>
              <div className="h-px bg-grey-dark/80 overflow-hidden">
                <div
                  className="h-full transition-all duration-700"
                  style={{
                    width: `${share}%`,
                    backgroundColor: segment.color,
                  }}
                />
              </div>
              <p className="font-serif text-base text-white/75">
                {formatValue(segment.value)}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
