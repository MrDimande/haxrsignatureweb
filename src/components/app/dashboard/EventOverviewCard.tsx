import type { DashboardEventOverview } from "@/lib/dashboard/types";
import { CircleDot } from "lucide-react";
import MapPinIcon from "@/components/app/dashboard/MapPinIcon";

type EventOverviewCardProps = {
  event: DashboardEventOverview;
};

export default function EventOverviewCard({ event }: EventOverviewCardProps) {
  return (
    <div className="relative flex min-h-[220px] flex-col justify-between overflow-hidden rounded-3xl border border-brand-champagne/15 bg-[#120e0d] p-6 shadow-lg md:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(184,138,42,0.15),transparent)] opacity-10" />

      <div className="relative z-10 space-y-4">
        <div className="flex items-start justify-between">
          <span className="rounded-full bg-brand-gold/15 px-2 py-0.5 font-mono text-[8px] font-bold uppercase tracking-widest text-brand-gold">
            {event.type}
          </span>
          <span className="flex items-center gap-1.5 font-mono text-[10px] text-zinc-500">
            <CircleDot className="h-2 w-2 fill-brand-gold text-brand-gold" />
            {event.status}
          </span>
        </div>

        <div className="space-y-1">
          <h2 className="font-serif text-2xl font-light leading-tight text-white md:text-3xl">
            {event.name}
          </h2>
          <p className="flex items-center gap-1 font-sans text-xs font-light text-brand-gold">
            <MapPinIcon className="h-3.5 w-3.5 shrink-0" />
            <span>{event.location}</span>
          </p>
        </div>
      </div>

      <div className="relative z-10 mt-4 grid grid-cols-2 gap-4 border-t border-white/5 pt-4 font-sans text-xs">
        <div>
          <p className="font-mono text-[9px] uppercase text-zinc-500">Data do Evento</p>
          <p className="font-medium text-white">{event.date}</p>
        </div>
        <div>
          <p className="font-mono text-[9px] uppercase text-zinc-500">Responsável</p>
          <p className="font-medium text-white">{event.responsible}</p>
        </div>
      </div>
    </div>
  );
}
