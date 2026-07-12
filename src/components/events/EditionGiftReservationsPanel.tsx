"use client";

import { useMemo, useState } from "react";
import { Gift, Search } from "lucide-react";
import type { EditionGiftReservation } from "@/lib/events/repositories/edition-gifts.repository";

type EditionGiftReservationsPanelProps = {
  reservations: EditionGiftReservation[];
  registryKey: string;
};

function formatReservedAt(value: string): string {
  return new Date(value).toLocaleString("pt-MZ", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Maputo",
  });
}

export default function EditionGiftReservationsPanel({
  reservations,
  registryKey,
}: EditionGiftReservationsPanelProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return reservations;
    return reservations.filter(
      (item) =>
        item.giftName.toLowerCase().includes(query) ||
        item.reservedBy.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
    );
  }, [reservations, search]);

  const stats = useMemo(() => {
    const byCategory = new Map<string, number>();
    for (const item of reservations) {
      byCategory.set(item.category, (byCategory.get(item.category) ?? 0) + 1);
    }
    return {
      total: reservations.length,
      byCategory: [...byCategory.entries()].sort((a, b) =>
        a[0].localeCompare(b[0], "pt")
      ),
    };
  }, [reservations]);

  return (
    <div className="space-y-8">
      <section className="admin-card p-6 md:p-8 space-y-5">
        <div className="flex items-start gap-3">
          <Gift className="w-5 h-5 text-admin-gold mt-0.5 shrink-0" />
          <div>
            <p className="font-mono text-[8px] tracking-[0.4em] uppercase text-grey/45 mb-2">
              Edition · Lista de presentes
            </p>
            <h3 className="font-serif text-xl font-light text-white/90">
              Reservas de presentes
            </h3>
            <p className="text-sm text-grey/55 mt-2 leading-relaxed">
              Presentes reservados no convite digital ({registryKey}). A equipa
              recebe email automático a cada nova reserva.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="admin-stat-card">
            <p className="font-mono text-[8px] tracking-[0.3em] uppercase text-grey/50 mb-2">
              Total reservado
            </p>
            <p className="font-serif text-2xl font-light text-white">
              {stats.total}
            </p>
          </div>
          {stats.byCategory.map(([category, count]) => (
            <div key={category} className="admin-stat-card">
              <p className="font-mono text-[8px] tracking-[0.3em] uppercase text-grey/50 mb-2">
                {category}
              </p>
              <p className="font-serif text-2xl font-light text-white">
                {count}
              </p>
            </div>
          ))}
        </div>

        <label className="relative block max-w-md">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-grey/40 pointer-events-none"
            aria-hidden
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar presente ou convidada…"
            className="admin-input admin-input-icon w-full"
          />
        </label>
      </section>

      <section className="admin-card overflow-hidden">
        <div className="px-6 py-4 border-b border-grey-dark/80 flex items-center justify-between gap-4">
          <h2 className="font-mono text-[9px] tracking-[0.4em] uppercase text-admin-gold">
            Lista de reservas
          </h2>
          <span className="text-xs text-grey/50 font-mono">
            {filtered.length} de {reservations.length}
          </span>
        </div>

        {filtered.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-grey-dark/80 bg-black-soft">
                  {["Presente", "Categoria", "Reservado por", "Data"].map(
                    (heading) => (
                      <th
                        key={heading}
                        className="px-4 py-3 text-left font-mono text-[8px] tracking-[0.3em] uppercase text-grey/50"
                      >
                        {heading}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-grey-dark/50 hover:bg-white/[0.02]"
                  >
                    <td className="px-4 py-3 text-white/90">{item.giftName}</td>
                    <td className="px-4 py-3 text-sm text-grey/60">
                      {item.category}
                    </td>
                    <td className="px-4 py-3 text-sm text-grey/60">
                      {item.reservedBy}
                    </td>
                    <td className="px-4 py-3 text-xs text-grey/50 font-mono">
                      {formatReservedAt(item.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-6 py-10 text-sm text-grey/60 text-center">
            {reservations.length
              ? "Nenhuma reserva corresponde à pesquisa."
              : "Ainda não há presentes reservados neste evento."}
          </p>
        )}
      </section>
    </div>
  );
}
