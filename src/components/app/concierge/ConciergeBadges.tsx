import type {
  ConciergeIntakeSource,
  ConciergeItemStatus,
  ConciergePriority,
} from "@/lib/concierge/portal/types";
import {
  CONCIERGE_PRIORITY_LABELS,
  CONCIERGE_SOURCE_LABELS,
  CONCIERGE_STATUS_LABELS,
  CONCIERGE_STATUS_STYLES,
  formatConfidence,
} from "@/lib/concierge/portal/presentation";

export function ConciergeStatusBadge({ status }: { status: ConciergeItemStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[8px] font-bold uppercase tracking-widest ${CONCIERGE_STATUS_STYLES[status]}`}
    >
      {CONCIERGE_STATUS_LABELS[status]}
    </span>
  );
}

export function ConciergeSourceBadge({ source }: { source: ConciergeIntakeSource }) {
  return (
    <span className="inline-flex items-center rounded-full border border-brand-champagne/20 bg-white/5 px-2 py-0.5 font-mono text-[8px] uppercase tracking-widest text-zinc-300">
      {CONCIERGE_SOURCE_LABELS[source]}
    </span>
  );
}

export function ConciergeConfidenceBadge({ confidence }: { confidence?: number }) {
  const label = formatConfidence(confidence);
  const level =
    confidence === undefined
      ? "text-zinc-400 border-zinc-600/30 bg-zinc-700/20"
      : confidence >= 0.9
        ? "text-emerald-200 border-emerald-500/30 bg-emerald-500/15"
        : confidence >= 0.7
          ? "text-sky-200 border-sky-500/30 bg-sky-500/15"
          : confidence >= 0.5
            ? "text-amber-200 border-amber-500/30 bg-amber-500/15"
            : "text-zinc-300 border-zinc-500/30 bg-zinc-500/15";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[8px] font-bold uppercase tracking-widest ${level}`}
      aria-label={`Confiança: ${label}`}
    >
      {label}
    </span>
  );
}

export function ConciergePriorityBadge({ priority }: { priority: ConciergePriority }) {
  const styles: Record<ConciergePriority, string> = {
    baixa: "text-zinc-400 border-zinc-600/30",
    media: "text-sky-200 border-sky-500/30",
    alta: "text-orange-200 border-orange-500/30",
    urgente: "text-red-200 border-red-500/30 bg-red-500/10",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[8px] uppercase tracking-widest ${styles[priority]}`}
    >
      {CONCIERGE_PRIORITY_LABELS[priority]}
    </span>
  );
}
