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
      <div className="flex items-center justify-center h-48 border border-dashed border-admin-gold/20 rounded-xl bg-black/[0.15]">
        <p className="text-sm text-grey/45 italic font-mono tracking-wide">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 relative p-4 rounded-xl border border-white/[0.03] bg-black/40 overflow-hidden">
      {/* Background elegant grid lines for a financial terminal feel */}
      <div className="absolute inset-x-4 top-4 bottom-14 flex flex-col justify-between pointer-events-none opacity-[0.05]">
        <div className="w-full border-t border-admin-gold" />
        <div className="w-full border-t border-admin-gold" />
        <div className="w-full border-t border-admin-gold" />
        <div className="w-full border-t border-admin-gold" />
      </div>

      <div className="flex items-end gap-2.5 sm:gap-4 h-56 relative z-10">
        {data.map((item, index) => {
          const height = Math.max((item.value / max) * 100, item.value > 0 ? 8 : 2);
          const active =
            highlightLast && index === data.length - 1 && item.value > 0;

          return (
            <div
              key={item.label}
              className="flex-1 flex flex-col items-center justify-end gap-3 min-w-0 h-full group"
            >
              <div className="w-full flex flex-col items-center justify-end h-44 relative">
                {/* Value tooltip displayed above the bar */}
                {item.value > 0 && (
                  <span className="font-mono text-[9px] text-grey-medium mb-2 opacity-60 group-hover:opacity-100 group-hover:text-admin-gold group-hover:scale-105 transition-all duration-300 truncate max-w-full">
                    {formatValue(item.value)}
                  </span>
                )}

                {/* Glowing neon bar */}
                <div className="w-full max-w-[28px] relative h-full flex items-end justify-center">
                  <div
                    className={`w-full rounded-t-[3px] transition-all duration-700 relative ${
                      active
                        ? "bg-gradient-to-t from-admin-gold to-[#E3C46B] shadow-[0_0_15px_rgba(184,138,42,0.3)]"
                        : "bg-gradient-to-t from-white/[0.04] to-white/[0.15] group-hover:from-admin-gold/30 group-hover:to-admin-gold/70 group-hover:shadow-[0_0_12px_rgba(184,138,42,0.2)]"
                    }`}
                    style={{ height: `${height}%` }}
                    title={item.hint}
                  >
                    {/* Futuristic center highlight thread line */}
                    {item.value > 0 && (
                      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[1px] bg-white/20" />
                    )}

                    {/* LED light dot at the top edge */}
                    {item.value > 0 && (
                      <span className={`absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full border border-black transition-all ${
                        active
                          ? "bg-white animate-ping"
                          : "bg-admin-gold group-hover:bg-white"
                      }`} />
                    )}
                  </div>
                </div>
              </div>
              <span className="font-mono text-[8px] tracking-[0.2em] uppercase text-grey-medium/70 group-hover:text-white transition-colors duration-300">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
