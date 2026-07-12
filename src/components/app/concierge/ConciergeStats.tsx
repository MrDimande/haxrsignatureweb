import type { ConciergeStats } from "@/lib/concierge/portal/types";

const STAT_ITEMS: Array<{ key: keyof ConciergeStats; label: string }> = [
  { key: "totalItems", label: "Total de itens" },
  { key: "pendingClassification", label: "Por classificar" },
  { key: "awaitingValidation", label: "Aguardam validação" },
  { key: "sentToModules", label: "Enviados para módulos" },
  { key: "webClips", label: "Links guardados" },
  { key: "urgentItems", label: "Urgentes" },
];

export default function ConciergeStats({ stats }: { stats: ConciergeStats }) {
  return (
    <section aria-label="Resumo do Concierge">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {STAT_ITEMS.map(({ key, label }) => (
          <div
            key={key}
            className="rounded-2xl border border-brand-champagne/15 bg-white/5 p-4"
          >
            <p className="font-mono text-[8px] font-bold uppercase tracking-widest text-zinc-500">
              {label}
            </p>
            <p className="mt-2 font-serif text-2xl font-light text-white">{stats[key]}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
