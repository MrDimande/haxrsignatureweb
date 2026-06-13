import { GUEST_STATUS_LABELS, GUEST_STATUS_STYLES } from "@/lib/events/constants";
import type { EventGuest, EventStats } from "@/lib/events/types";

type CheckInDashboardProps = {
  guests: EventGuest[];
  stats: EventStats;
};

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-MZ", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Africa/Maputo",
  });
}

export default function CheckInDashboard({
  guests,
  stats,
}: CheckInDashboardProps) {
  const recent = guests
    .filter((g) => g.checkedInAt)
    .sort(
      (a, b) =>
        new Date(b.checkedInAt!).getTime() - new Date(a.checkedInAt!).getTime()
    )
    .slice(0, 12);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Convidados", value: stats.totalGuests },
          { label: "Confirmados", value: stats.confirmed },
          { label: "Check-in", value: stats.checkedIn },
          { label: "Lugares", value: `${stats.assignedSeats}/${stats.totalSeats}` },
        ].map((item) => (
          <div key={item.label} className="admin-stat-card">
            <p className="font-mono text-[8px] tracking-[0.3em] uppercase text-grey/50 mb-2">
              {item.label}
            </p>
            <p className="font-serif text-2xl font-light text-white">{item.value}</p>
          </div>
        ))}
      </div>

      <section className="admin-card overflow-hidden">
        <div className="px-6 py-4 border-b border-grey-dark/80">
          <h2 className="font-mono text-[9px] tracking-[0.4em] uppercase text-admin-gold">
            Chegadas recentes
          </h2>
        </div>
        {recent.length ? (
          <div className="divide-y divide-grey-dark/50">
            {recent.map((guest) => (
              <div
                key={guest.id}
                className="px-6 py-4 flex items-center justify-between gap-4"
              >
                <div>
                  <p className="text-white/90">{guest.name}</p>
                  <p className="text-xs text-grey/50 mt-1">
                    {guest.seat
                      ? `${guest.seat.tableName} · Lugar ${guest.seat.seatNumber}`
                      : "Sem lugar atribuído"}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block text-[9px] font-mono tracking-[0.15em] uppercase px-2 py-1 border rounded-sm ${GUEST_STATUS_STYLES[guest.status]}`}
                  >
                    {GUEST_STATUS_LABELS[guest.status]}
                  </span>
                  <p className="text-[10px] text-grey/50 font-mono mt-2">
                    {formatTime(guest.checkedInAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="px-6 py-10 text-sm text-grey/60 text-center">
            Ainda não há check-ins registados.
          </p>
        )}
      </section>
    </div>
  );
}
