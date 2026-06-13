import type { GuestAuditEntry } from "@/lib/events/types";

type GuestHistoryPanelProps = {
  entries: GuestAuditEntry[];
};

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString("pt-MZ", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Africa/Maputo",
  });
}

export default function GuestHistoryPanel({ entries }: GuestHistoryPanelProps) {
  return (
    <section className="admin-card overflow-hidden">
      <div className="px-6 py-4 border-b border-grey-dark/80">
        <h2 className="font-mono text-[9px] tracking-[0.4em] uppercase text-admin-gold">
          Histórico de alterações
        </h2>
        <p className="text-sm text-grey/55 mt-2">
          Registo de estados, lugares, etiquetas e acções na equipa.
        </p>
      </div>
      {entries.length ? (
        <div className="divide-y divide-grey-dark/50 max-h-[520px] overflow-y-auto">
          {entries.map((entry) => (
            <div key={entry.id} className="px-6 py-4 flex gap-4 justify-between">
              <div>
                <p className="text-white/85 text-sm">{entry.guestName}</p>
                <p className="text-xs text-admin-gold/80 mt-1">{entry.action}</p>
                {entry.details ? (
                  <p className="text-xs text-grey/50 mt-1">{entry.details}</p>
                ) : null}
              </div>
              <p className="text-[10px] font-mono text-grey/45 shrink-0">
                {formatWhen(entry.changedAt)}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="px-6 py-10 text-sm text-grey/60 text-center">
          Ainda não há alterações registadas.
        </p>
      )}
    </section>
  );
}
