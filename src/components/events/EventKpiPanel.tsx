import { SHEETS_SYNC_MODE_LABELS } from "@/lib/events/sheets/detect-mode";
import type { EventStats, ManagedEvent } from "@/lib/events/types";

type EventKpiPanelProps = {
  event: ManagedEvent;
  stats: EventStats;
};

function formatSyncDate(iso: string | null): string {
  if (!iso) return "Nunca";
  return new Date(iso).toLocaleString("pt-MZ", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Maputo",
  });
}

function KpiCard({
  label,
  value,
  hint,
  accent,
  warning,
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: boolean;
  warning?: boolean;
}) {
  return (
    <div className="admin-stat-card">
      <p className="font-mono text-[8px] tracking-[0.3em] uppercase text-grey/50 mb-2">
        {label}
      </p>
      <p
        className={`font-serif text-2xl font-light ${
          warning
            ? "text-amber-300"
            : accent
              ? "text-admin-gold"
              : "text-white"
        }`}
      >
        {value}
      </p>
      {hint ? <p className="text-xs text-grey/45 mt-2">{hint}</p> : null}
    </div>
  );
}

export default function EventKpiPanel({ event, stats }: EventKpiPanelProps) {
  return (
    <section className="space-y-6 mb-8">
      <div>
        <p className="font-mono text-[9px] tracking-[0.45em] uppercase text-admin-gold mb-2">
          Panorama operacional
        </p>
        <p className="text-sm text-grey/55">
          Métricas de convidados, capacidade, grupos e sincronização em tempo
          real.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
        <KpiCard label="Total convidados" value={stats.totalGuests} />
        <KpiCard
          label="Confirmados"
          value={stats.confirmed + stats.checkedIn}
          accent
        />
        <KpiCard label="Pendentes" value={stats.invited} />
        <KpiCard label="Recusados" value={stats.declined} />
        <KpiCard label="Acompanhantes" value={stats.plusOnesTotal} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
        <KpiCard
          label="Total esperado"
          value={stats.expectedAttendance}
          hint="Confirmados + check-in + acompanhantes"
          accent
        />
        <KpiCard
          label="Sem mesa"
          value={stats.unassignedGuests}
          warning={stats.unassignedGuests > 0}
        />
        <KpiCard
          label="Possíveis duplicados"
          value={stats.duplicateGuests}
          warning={stats.duplicateGuests > 0}
        />
        <KpiCard label="Grupos" value={stats.groupCount} />
        <KpiCard
          label="Taxa de confirmação"
          value={`${stats.confirmationRate}%`}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <KpiCard label="Mesas" value={stats.uniqueTables} />
        <KpiCard
          label="Capacidade utilizada"
          value={stats.capacityUsed}
          hint={`de ${stats.totalSeats} lugares`}
        />
        <KpiCard label="Capacidade disponível" value={stats.capacityAvailable} />
        <KpiCard
          label="Última sync Sheets"
          value={formatSyncDate(event.sheetsLastSyncedAt)}
          hint={
            event.googleSheetUrl
              ? `Modo ${SHEETS_SYNC_MODE_LABELS[event.sheetsSyncMode]}`
              : "Sem folha ligada"
          }
        />
      </div>
    </section>
  );
}
