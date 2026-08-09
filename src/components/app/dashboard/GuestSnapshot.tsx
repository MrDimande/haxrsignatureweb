import type { DashboardGuestSnapshot } from "@/lib/dashboard/types";
import { Users } from "lucide-react";

type GuestSnapshotProps = {
  guests: DashboardGuestSnapshot;
};

export default function GuestSnapshotCard({ guests }: GuestSnapshotProps) {
  return (
    <div className="haxr-dashboard-card mt-6 flex flex-1 flex-col justify-between rounded-3xl border border-brand-champagne/10 bg-white/5 p-6 lg:mt-0">
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <h4 className="font-serif text-sm text-white">Convidados &amp; RSVP</h4>
        <Users className="h-4 w-4 text-brand-gold" />
      </div>

      <div className="grid grid-cols-3 gap-2 py-4 text-center font-sans text-xs">
        <div className="rounded-lg bg-black/20 p-2">
          <p className="font-bold text-white">{guests.confirmed}</p>
          <p className="mt-0.5 font-mono text-[8px] uppercase text-zinc-500">Sim</p>
        </div>
        <div className="rounded-lg bg-black/20 p-2">
          <p className="font-bold text-white">{guests.pending}</p>
          <p className="mt-0.5 font-mono text-[8px] font-bold uppercase text-brand-gold">Pendente</p>
        </div>
        <div className="rounded-lg bg-black/20 p-2">
          <p className="font-bold text-white">{guests.declined}</p>
          <p className="mt-0.5 font-mono text-[8px] uppercase text-zinc-500">Não</p>
        </div>
      </div>

      <div className="flex justify-between border-t border-white/5 pt-3 text-[10px] text-zinc-400">
        <span>
          Acompanhantes: <strong className="text-white">{guests.plusOnes}</strong>
        </span>
        <span>
          Lugares:{" "}
          <strong className="text-white">
            {guests.tablesAssigned} / {guests.tablesTotal} mesas
          </strong>
        </span>
      </div>
    </div>
  );
}
