import type { ConciergeInboxItem } from "@/lib/concierge/portal/types";
import {
  CONCIERGE_DESTINATION_LABELS,
  CONCIERGE_TYPE_LABELS,
  formatConciergeDate,
} from "@/lib/concierge/portal/presentation";
import {
  ConciergeConfidenceBadge,
  ConciergePriorityBadge,
  ConciergeSourceBadge,
  ConciergeStatusBadge,
} from "./ConciergeBadges";

type ConciergeInboxProps = {
  items: ConciergeInboxItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  filterValidation?: boolean;
  showConfidence?: boolean;
};

export default function ConciergeInbox({
  items,
  selectedId,
  onSelect,
  filterValidation,
  showConfidence = true,
}: ConciergeInboxProps) {
  const visible = filterValidation
    ? items.filter(
        (i) =>
          i.status === "aguardando_validacao" ||
          i.status === "classificado" ||
          i.status === "por_classificar"
      )
    : items;

  if (visible.length === 0) {
    return (
      <p className="rounded-2xl border border-brand-champagne/10 bg-white/5 p-6 text-center text-sm text-zinc-400">
        Nenhum item na fila seleccionada.
      </p>
    );
  }

  return (
    <section className="rounded-3xl border border-brand-champagne/15 bg-white/[0.03] overflow-hidden">
      <div className="border-b border-brand-champagne/10 px-5 py-4">
        <h2 className="font-mono text-[9px] font-bold uppercase tracking-widest text-brand-gold">
          Inbox / Fila de classificação
        </h2>
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[900px] text-left text-xs">
          <thead>
            <tr className="border-b border-brand-champagne/10 font-mono text-[8px] uppercase tracking-widest text-zinc-500">
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Origem</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Destino</th>
              {showConfidence ? <th className="px-4 py-3">Confiança</th> : null}
              <th className="px-4 py-3">Prioridade</th>
              <th className="px-4 py-3">Data</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((item) => (
              <ConciergeItemRow
                key={item.id}
                item={item}
                selected={selectedId === item.id}
                onSelect={onSelect}
                variant="table"
                showConfidence={showConfidence}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 p-4 md:hidden">
        {visible.map((item) => (
          <ConciergeItemRow
            key={item.id}
            item={item}
            selected={selectedId === item.id}
            onSelect={onSelect}
            variant="card"
            showConfidence={showConfidence}
          />
        ))}
      </div>
    </section>
  );
}

function ConciergeItemRow({
  item,
  selected,
  onSelect,
  variant,
  showConfidence = true,
}: {
  item: ConciergeInboxItem;
  selected: boolean;
  onSelect: (id: string) => void;
  variant: "table" | "card";
  showConfidence?: boolean;
}) {
  const dest = item.suggestedDestination
    ? CONCIERGE_DESTINATION_LABELS[item.suggestedDestination]
    : "—";

  if (variant === "card") {
    return (
      <button
        type="button"
        onClick={() => onSelect(item.id)}
        className={`w-full rounded-2xl border p-4 text-left transition ${
          selected ? "border-brand-gold/50 bg-brand-gold/10" : "border-brand-champagne/10 bg-black/20"
        }`}
      >
        <p className="font-serif text-sm text-white">{item.title}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <ConciergeSourceBadge source={item.source} />
          <ConciergeStatusBadge status={item.status} />
          {showConfidence ? <ConciergeConfidenceBadge confidence={item.confidence} /> : null}
        </div>
        <p className="mt-2 font-mono text-[9px] text-zinc-500">{formatConciergeDate(item.createdAt)}</p>
      </button>
    );
  }

  return (
    <tr
      className={`cursor-pointer border-b border-brand-champagne/5 transition hover:bg-white/5 ${
        selected ? "bg-brand-gold/10" : ""
      }`}
      onClick={() => onSelect(item.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSelect(item.id);
      }}
      tabIndex={0}
      role="button"
      aria-pressed={selected}
    >
      <td className="px-4 py-3 font-serif text-sm text-white">{item.title}</td>
      <td className="px-4 py-3">
        <ConciergeSourceBadge source={item.source} />
      </td>
      <td className="px-4 py-3 text-zinc-300">{CONCIERGE_TYPE_LABELS[item.type]}</td>
      <td className="px-4 py-3">
        <ConciergeStatusBadge status={item.status} />
      </td>
      <td className="px-4 py-3 text-zinc-300">{dest}</td>
      {showConfidence ? (
        <td className="px-4 py-3">
          <ConciergeConfidenceBadge confidence={item.confidence} />
        </td>
      ) : null}
      <td className="px-4 py-3">
        <ConciergePriorityBadge priority={item.priority} />
      </td>
      <td className="px-4 py-3 font-mono text-[9px] text-zinc-500">
        {formatConciergeDate(item.createdAt)}
      </td>
    </tr>
  );
}
