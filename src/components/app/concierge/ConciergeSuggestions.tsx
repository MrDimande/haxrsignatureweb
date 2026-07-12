import type { ConciergeActivity, ConciergeSuggestion } from "@/lib/concierge/portal/types";
import { CONCIERGE_DESTINATION_LABELS, formatConciergeDate } from "@/lib/concierge/portal/presentation";
import { ConciergeConfidenceBadge } from "./ConciergeBadges";

export default function ConciergeSuggestions({
  suggestions,
}: {
  suggestions: ConciergeSuggestion[];
}) {
  if (suggestions.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="font-mono text-[8px] font-bold uppercase tracking-widest text-brand-gold">
        Acções sugeridas
      </h3>
      <ul className="space-y-2">
        {suggestions.map((s) => (
          <li
            key={s.id}
            className="rounded-xl border border-brand-champagne/10 bg-black/20 p-3 text-xs"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-serif text-sm text-white">{s.title}</p>
              <ConciergeConfidenceBadge confidence={s.confidence} />
            </div>
            <p className="mt-1 text-zinc-400">{s.description}</p>
            <p className="mt-2 font-mono text-[8px] uppercase text-zinc-500">
              {CONCIERGE_DESTINATION_LABELS[s.destination]} · {s.status}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ConciergeActivityFeed({ activities }: { activities: ConciergeActivity[] }) {
  return (
    <div className="space-y-2">
      <h3 className="font-mono text-[8px] font-bold uppercase tracking-widest text-brand-gold">
        Actividade recente
      </h3>
      <ul className="space-y-2">
        {activities.map((a) => (
          <li key={a.id} className="rounded-xl border border-brand-champagne/10 bg-black/10 p-3 text-xs">
            <p className="text-white">{a.title}</p>
            <p className="mt-1 text-zinc-500">{a.description}</p>
            <p className="mt-2 font-mono text-[8px] text-zinc-600">
              {a.actorName} · {formatConciergeDate(a.createdAt)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
