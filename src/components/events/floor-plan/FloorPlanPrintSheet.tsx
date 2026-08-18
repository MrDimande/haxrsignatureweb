"use client";

import FloorPlanSvg from "@/components/events/floor-plan/FloorPlanSvg";
import {
  FLOOR_PLAN_GOLD,
  TEMPLATE_LABELS,
  formatOccupancy,
  themeForTemplate,
} from "@/lib/events/floor-plan/presentation";
import type { EventFloorPlan, FloorPlanTableSource } from "@/lib/events/floor-plan/types";
import type { ManagedEvent } from "@/lib/events/types";

type FloorPlanPrintSheetProps = {
  event: ManagedEvent;
  plan: EventFloorPlan;
  tables: FloorPlanTableSource[];
  seatCount: number;
  showGuestNames: boolean;
};

export default function FloorPlanPrintSheet({
  event,
  plan,
  tables,
  seatCount,
  showGuestNames,
}: FloorPlanPrintSheetProps) {
  const theme = themeForTemplate(plan.printPreferences.template);
  const occupied = tables.reduce((sum, table) => sum + table.occupied, 0);
  const occupancyPct = seatCount > 0 ? Math.round((occupied / seatCount) * 100) : 0;

  return (
    <section className="floor-plan-print-page bg-[#FBF8F3] text-[#1C1814]">
      <style jsx global>{`
        @media print {
          @page {
            size: ${plan.printPreferences.format} ${plan.printPreferences.orientation};
            margin: 8mm;
          }
          body * {
            visibility: hidden;
          }
          .floor-plan-print-page,
          .floor-plan-print-page * {
            visibility: visible;
          }
          .floor-plan-print-page {
            position: absolute;
            inset: 0;
            background: #fff !important;
          }
        }
      `}</style>

      <div className="mx-auto max-w-[1100px] px-6 py-8 print:px-0 print:py-0">
        <header className="mb-6 border-b border-[#D4B87A]/60 pb-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.45em] text-[#9A7B3C]">
                HAXR Signature · Planta do evento
              </p>
              <h2 className="font-serif text-3xl font-light tracking-tight text-[#1C1814] md:text-4xl">
                {event.name}
              </h2>
              <p className="text-sm text-[#5C5348]">
                {event.date ?? "Data por confirmar"}
                {event.location ? ` · ${event.location}` : ""}
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono text-[9px] uppercase tracking-[0.35em] text-[#9A7B3C]">
                {TEMPLATE_LABELS[plan.printPreferences.template]}
              </p>
              <p className="mt-1 font-serif text-lg text-[#1C1814]">
                {plan.room.width} × {plan.room.length} m
              </p>
              <p className="mt-1 text-xs text-[#6B5E4A]">
                {plan.printPreferences.format} · {plan.printPreferences.orientation}
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Mesas", value: String(tables.length) },
              { label: "Lugares", value: String(seatCount) },
              { label: "Ocupados", value: String(occupied) },
              { label: "Taxa", value: `${occupancyPct}%` },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded border border-[#E8DFD0] bg-white/80 px-3 py-2"
              >
                <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-[#9A7B3C]">
                  {stat.label}
                </p>
                <p className="mt-1 font-serif text-xl text-[#1C1814]">{stat.value}</p>
              </div>
            ))}
          </div>
        </header>

        <div
          className="overflow-hidden rounded-lg border border-[#E8DFD0] bg-white"
          style={{ boxShadow: "0 24px 60px rgba(28, 24, 20, 0.06)" }}
        >
          <div className="border-b border-[#F0EBE3] bg-[#FBF8F3] px-4 py-2">
            <p className="font-mono text-[9px] uppercase tracking-[0.35em] text-[#9A7B3C]">
              Croqui · escala métrica
            </p>
          </div>
          <div className="aspect-[1.414/1] min-h-[420px] p-3 md:p-5">
            <FloorPlanSvg
              room={plan.room}
              items={plan.items}
              tables={tables}
              template={plan.printPreferences.template}
              showGuestNames={showGuestNames}
            />
          </div>
        </div>

        <footer className="mt-5 grid gap-4 border-t border-[#E8DFD0] pt-4 md:grid-cols-[1fr_auto]">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.35em] text-[#9A7B3C]">
              Legenda
            </p>
            <div className="mt-2 flex flex-wrap gap-4 text-xs text-[#5C5348]">
              <span className="inline-flex items-center gap-2">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full border"
                  style={{ background: theme.seatOccupied, borderColor: theme.seatStroke }}
                />
                Lugar ocupado
              </span>
              <span className="inline-flex items-center gap-2">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full border border-[#D4B87A]"
                  style={{ background: theme.seatEmpty }}
                />
                Lugar disponível
              </span>
              <span className="inline-flex items-center gap-2">
                <span
                  className="inline-block h-3 w-5 rounded-sm border"
                  style={{ background: theme.tableFill, borderColor: theme.tableStroke }}
                />
                Mesa
              </span>
            </div>
          </div>
          <div className="text-right text-xs text-[#6B5E4A]">
            <p>Documento gerado pela HAXR Signature</p>
            <p className="mt-1">
              {tables.length} mesas · {formatOccupancy(occupied, seatCount)} confirmados
            </p>
          </div>
        </footer>
      </div>
    </section>
  );
}
