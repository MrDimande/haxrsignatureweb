"use client";

import { useMemo, useState, useTransition } from "react";
import { Download, FileSpreadsheet, Search } from "lucide-react";
import { CLIENT_TYPE_LABELS } from "@/lib/admin/constants";
import { GUEST_STATUS_LABELS, GUEST_STATUS_STYLES, GUEST_STATUSES } from "@/lib/events/constants";
import {
  buildGuestEventReport,
  formatGuestCheckIn,
  formatGuestSeat,
  eventReportSlug,
} from "@/lib/events/export/report";
import {
  buildGuestReportCsv,
  downloadCsvFile,
} from "@/lib/events/export/csv";
import { downloadGuestReportPdf } from "@/lib/events/export/pdf";
import TableMapPrintView from "@/components/events/TableMapPrintView";
import type {
  EventGuest,
  EventSeat,
  EventStats,
  GuestStatus,
  ManagedEvent,
} from "@/lib/events/types";

type ViewMode = "list" | "tables" | "print";
type StatusFilter = "all" | GuestStatus;

type GuestReportPanelProps = {
  event: ManagedEvent;
  guests: EventGuest[];
  seats: EventSeat[];
  stats: EventStats;
};

export default function GuestReportPanel({
  event,
  guests,
  seats,
  stats,
}: GuestReportPanelProps) {
  const [view, setView] = useState<ViewMode>("list");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const report = useMemo(
    () => buildGuestEventReport(event, guests, seats, stats),
    [event, guests, seats, stats]
  );

  const filteredGuests = useMemo(() => {
    const query = search.trim().toLowerCase();
    return guests
      .filter((guest) => statusFilter === "all" || guest.status === statusFilter)
      .filter((guest) => {
        if (!query) return true;
        return (
          guest.name.toLowerCase().includes(query) ||
          guest.email.toLowerCase().includes(query) ||
          guest.phone.toLowerCase().includes(query) ||
          (guest.seat?.tableName.toLowerCase().includes(query) ?? false)
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name, "pt"));
  }, [guests, search, statusFilter]);

  function handleCsv() {
    const csv = buildGuestReportCsv(report);
    downloadCsvFile(csv, `haxr-convidados-${eventReportSlug(event)}.csv`);
    setMessage("CSV exportado com sucesso.");
  }

  function handlePdf() {
    startTransition(async () => {
      try {
        await downloadGuestReportPdf(report);
        setMessage("PDF gerado com sucesso.");
      } catch {
        setMessage("Não foi possível gerar o PDF.");
      }
    });
  }

  return (
    <div className="space-y-8">
      <section className="admin-card p-6 md:p-8 space-y-5">
        <div>
          <p className="font-mono text-[8px] tracking-[0.4em] uppercase text-grey/45 mb-2">
            Relatório por evento
          </p>
          <h3 className="font-serif text-xl font-light text-white/90">
            Gestão de convidados
          </h3>
          <p className="text-sm text-grey/55 mt-2 leading-relaxed">
            Lista completa, distribuição por mesa e exportação para recepção ou
            coordenação do evento.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total", value: stats.totalGuests },
            { label: "Confirmados", value: stats.confirmed },
            { label: "Check-in", value: stats.checkedIn },
            {
              label: "Sem lugar",
              value: stats.totalGuests - stats.assignedSeats,
            },
          ].map((item) => (
            <div key={item.label} className="admin-stat-card">
              <p className="font-mono text-[8px] tracking-[0.3em] uppercase text-grey/50 mb-2">
                {item.label}
              </p>
              <p className="font-serif text-2xl font-light text-white">
                {item.value}
              </p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={handleCsv} className="admin-btn-secondary">
            <FileSpreadsheet className="w-4 h-4" />
            Exportar CSV
          </button>
          <button
            type="button"
            onClick={handlePdf}
            disabled={isPending}
            className="admin-btn-primary"
          >
            <Download className="w-4 h-4" />
            {isPending ? "A gerar PDF…" : "Exportar PDF"}
          </button>
        </div>

        {message ? (
          <p className="text-xs text-grey/50 italic border-l border-admin-gold/30 pl-3">
            {message}
          </p>
        ) : null}
      </section>

      <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: "list", label: "Lista completa" },
              { id: "tables", label: "Por mesa" },
              { id: "print", label: "Mapa A4" },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setView(item.id)}
              className={`px-4 py-2 font-mono text-[9px] tracking-[0.25em] uppercase border rounded-sm transition-colors ${
                view === item.id
                  ? "bg-admin-gold/10 text-admin-gold border-admin-gold/25"
                  : "text-grey/60 border-grey-dark/80 hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <label className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-grey/40" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar convidado ou mesa…"
              className="admin-input w-full pl-10"
            />
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="admin-input min-w-[160px]"
          >
            <option value="all">Todos os estados</option>
            {GUEST_STATUSES.map((status) => (
              <option key={status} value={status}>
                {GUEST_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {view === "list" ? (
        <section className="admin-card overflow-hidden">
          <div className="px-6 py-4 border-b border-grey-dark/80 flex items-center justify-between gap-4">
            <h2 className="font-mono text-[9px] tracking-[0.4em] uppercase text-admin-gold">
              Lista de convidados
            </h2>
            <span className="text-xs text-grey/50 font-mono">
              {filteredGuests.length} de {guests.length}
            </span>
          </div>
          {filteredGuests.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-grey-dark/80 bg-black-soft">
                    {[
                      "Convidado",
                      "Contacto",
                      "Tipo",
                      "Estado",
                      "Extras",
                      "Lugar",
                      "Check-in",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="px-4 py-3 text-left font-mono text-[8px] tracking-[0.3em] uppercase text-grey/50"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredGuests.map((guest) => (
                    <tr
                      key={guest.id}
                      className="border-b border-grey-dark/50 hover:bg-white/[0.02]"
                    >
                      <td className="px-4 py-3 text-white/90">{guest.name}</td>
                      <td className="px-4 py-3 text-sm text-grey/60">
                        {guest.email || guest.phone || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-grey/60">
                        {CLIENT_TYPE_LABELS[guest.clientType]}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block text-[9px] font-mono tracking-[0.15em] uppercase px-2 py-1 border rounded-sm ${GUEST_STATUS_STYLES[guest.status]}`}
                        >
                          {GUEST_STATUS_LABELS[guest.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-grey/60">
                        {guest.plusOnes > 0 ? `+${guest.plusOnes}` : "—"}
                        {guest.dietaryNotes ? (
                          <span className="block text-xs text-grey/45 mt-1">
                            {guest.dietaryNotes}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-sm text-grey/60">
                        {formatGuestSeat(guest)}
                      </td>
                      <td className="px-4 py-3 text-xs text-grey/50 font-mono">
                        {formatGuestCheckIn(guest.checkedInAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="px-6 py-10 text-sm text-grey/60 text-center">
              Nenhum convidado corresponde aos filtros seleccionados.
            </p>
          )}
        </section>
      ) : view === "tables" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {report.tableGroups.map((group) => (
            <section key={group.tableName} className="admin-card overflow-hidden">
              <div className="px-5 py-4 border-b border-grey-dark/80">
                <h3 className="font-mono text-[9px] tracking-[0.35em] uppercase text-admin-gold">
                  Mesa {group.tableName}
                </h3>
              </div>
              <div className="divide-y divide-grey-dark/50">
                {group.seats.map((seat) => (
                  <div
                    key={`${group.tableName}-${seat.seatNumber}`}
                    className="px-5 py-3 flex items-start justify-between gap-3"
                  >
                    <div>
                      <p className="text-sm text-white/85">
                        Lugar {seat.seatNumber}
                        {seat.label ? (
                          <span className="text-grey/50"> · {seat.label}</span>
                        ) : null}
                      </p>
                      <p className="text-sm text-grey/60 mt-1">
                        {seat.guest?.name ?? "Vazio"}
                      </p>
                    </div>
                    {seat.guest ? (
                      <span
                        className={`shrink-0 text-[9px] font-mono tracking-[0.15em] uppercase px-2 py-1 border rounded-sm ${GUEST_STATUS_STYLES[seat.guest.status]}`}
                      >
                        {GUEST_STATUS_LABELS[seat.guest.status]}
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          ))}

          {report.unassignedGuests.length ? (
            <section className="admin-card overflow-hidden md:col-span-2 xl:col-span-3">
              <div className="px-5 py-4 border-b border-grey-dark/80">
                <h3 className="font-mono text-[9px] tracking-[0.35em] uppercase text-amber-300/80">
                  Sem lugar atribuído
                </h3>
              </div>
              <div className="divide-y divide-grey-dark/50">
                {report.unassignedGuests
                  .filter((guest) =>
                    filteredGuests.some((item) => item.id === guest.id)
                  )
                  .map((guest) => (
                    <div
                      key={guest.id}
                      className="px-5 py-3 flex items-center justify-between gap-3"
                    >
                      <p className="text-sm text-white/85">{guest.name}</p>
                      <span
                        className={`text-[9px] font-mono tracking-[0.15em] uppercase px-2 py-1 border rounded-sm ${GUEST_STATUS_STYLES[guest.status]}`}
                      >
                        {GUEST_STATUS_LABELS[guest.status]}
                      </span>
                    </div>
                  ))}
              </div>
            </section>
          ) : null}

          {!report.tableGroups.length ? (
            <p className="md:col-span-2 xl:col-span-3 text-sm text-grey/60 text-center py-10 admin-card">
              Ainda não há mesas configuradas. Crie lugares no separador Lugares.
            </p>
          ) : null}
        </div>
      ) : (
        <TableMapPrintView
          eventName={event.name}
          eventDate={event.date}
          tableGroups={report.tableGroups}
        />
      )}
    </div>
  );
}
