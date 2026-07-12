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
      <div className="flex items-center justify-center h-48 border border-dashed border-admin-gold/20 rounded-xl bg-black/[0.15]">
        <p className="text-sm text-grey/45 italic font-mono tracking-wide">Sem receitas registadas</p>
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
    <div className="flex flex-col sm:flex-row items-center gap-10 p-6 rounded-xl border border-white/[0.03] bg-black/40">
      {/* Interactive Conic Ring with Glassmorphism Overlay */}
      <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
        {/* Glow behind the ring */}
        <div className="absolute inset-2 rounded-full bg-admin-gold/5 blur-lg" />

        {/* Conic Ring */}
        <div
          className="absolute inset-0 rounded-full shadow-[0_0_24px_rgba(0,0,0,0.6)]"
          style={{
            background: `conic-gradient(${gradientStops})`,
          }}
        />

        {/* Glassmorphism Center Plate */}
        <div className="absolute inset-5 rounded-full bg-[#0e0c0a] border border-white/[0.04] flex flex-col items-center justify-center text-center px-3 shadow-[inset_0_2px_12px_rgba(0,0,0,0.8)] backdrop-blur-md">
          <p className="font-mono text-[8px] tracking-[0.25em] uppercase text-grey-medium opacity-70">
            {centerLabel}
          </p>
          <p className="font-serif text-[17px] font-light text-white mt-1.5 leading-tight tracking-wide">
            {centerValue ?? formatValue(total)}
          </p>
          {/* Financial Volume Status Indicator */}
          <span className="mt-2 px-2 py-0.5 rounded-full bg-emerald-500/10 text-[7px] text-emerald-400 font-mono tracking-widest uppercase border border-emerald-500/20">
            Faturação Ativa
          </span>
        </div>
      </div>

      {/* Financial Ledger Details */}
      <ul className="space-y-4 flex-1 w-full">
        {segments.map((segment) => {
          const share = total > 0 ? (segment.value / total) * 100 : 0;
          return (
            <li key={segment.label} className="space-y-2 group">
              <div className="flex items-center justify-between gap-3 text-[12px] font-mono">
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Glowing color pilot dot */}
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-[0_0_8px_currentColor] border border-black/35"
                    style={{ backgroundColor: segment.color, color: segment.color }}
                  />
                  <span className="text-white/80 group-hover:text-white transition-colors truncate">{segment.label}</span>
                </div>
                <span className="text-grey-medium group-hover:text-admin-gold transition-colors font-medium">
                  {share.toFixed(0)}%
                </span>
              </div>

              {/* Premium Progress Bar */}
              <div className="h-[2px] bg-white/[0.05] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${share}%`,
                    backgroundColor: segment.color,
                  }}
                />
              </div>

              <p className="font-serif text-[14.5px] font-light text-grey-dark/85 mt-1">
                {formatValue(segment.value)}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
