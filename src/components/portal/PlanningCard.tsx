import Link from "next/link";
import type { PlanningCardData } from "@/lib/portal/dashboard-content";

type PlanningCardProps = {
  card: PlanningCardData;
  interactive?: boolean;
};

export default function PlanningCard({
  card,
  interactive = true,
}: PlanningCardProps) {
  const Icon = card.icon;

  const body = (
    <>
      <div className="flex items-start justify-between gap-3 mb-5">
        <span className="inline-flex items-center justify-center w-10 h-10 border border-brand-gold/35 text-brand-gold bg-brand-gold/8">
          <Icon className="w-4 h-4" strokeWidth={1.5} />
        </span>
        <span className="font-sans text-[10px] font-semibold uppercase tracking-wider text-brand-gold/80">
          {card.status}
        </span>
      </div>

      <h3 className="font-serif text-lg text-brand-text-dark mb-1">{card.title}</h3>

      <div className="flex items-baseline gap-2 mb-4">
        <span className="font-serif text-2xl text-brand-gold">{card.metric}</span>
        <span className="font-sans text-xs text-brand-text-dark/50">
          {card.metricLabel}
        </span>
      </div>

      <div className="h-1.5 w-full bg-brand-champagne/50 overflow-hidden">
        <div
          className="h-full bg-brand-gold/75 transition-all"
          style={{ width: `${card.progress}%` }}
        />
      </div>
      <p className="font-sans text-[10px] text-brand-text-dark/40 mt-2 text-right">
        {card.progress}% concluído
      </p>
    </>
  );

  const className =
    "block h-full p-5 md:p-6 border border-brand-champagne/60 bg-white hover:border-brand-gold/35 hover:shadow-[0_8px_32px_rgba(8,7,6,0.06)] transition-all";

  if (interactive) {
    return (
      <Link href={card.href} className={className}>
        {body}
      </Link>
    );
  }

  return <div className={className}>{body}</div>;
}
