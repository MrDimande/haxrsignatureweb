"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Archive, ArrowLeft } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import EventForm from "@/components/events/EventForm";
import SeatAssignment from "@/components/events/SeatAssignment";
import GuestManagement from "@/components/events/GuestManagement";
import GuestHistoryPanel from "@/components/events/GuestHistoryPanel";
import CheckInDashboard from "@/components/events/CheckInDashboard";
import GuestReportPanel from "@/components/events/GuestReportPanel";
import EventQrPanel from "@/components/events/EventQrPanel";
import GoogleSheetsSync from "@/components/events/GoogleSheetsSync";
import EventKpiPanel from "@/components/events/EventKpiPanel";
import { EVENT_TYPE_LABELS } from "@/lib/admin/constants";
import { archiveEventAction } from "@/lib/events/actions/events.actions";
import type { BusinessId, Client } from "@/lib/admin/types";
import type {
  EventGuest,
  EventSeat,
  EventStats,
  GuestAuditEntry,
  ManagedEvent,
} from "@/lib/events/types";

type Tab = "guests" | "seats" | "qr" | "sheets" | "checkin" | "report" | "history" | "settings";

type EventDetailClientProps = {
  event: ManagedEvent;
  initialGuests: EventGuest[];
  initialSeats: EventSeat[];
  stats: EventStats;
  auditEntries: GuestAuditEntry[];
  businesses: { id: BusinessId; name: string }[];
  clients: Client[];
};

function formatDate(date: string | null): string {
  if (!date) return "Data por confirmar";
  return new Date(date).toLocaleDateString("pt-MZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Maputo",
  });
}

export default function EventDetailClient({
  event: initialEvent,
  initialGuests,
  initialSeats,
  stats: initialStats,
  auditEntries,
  businesses,
  clients,
}: EventDetailClientProps) {
  const router = useRouter();
  const [event, setEvent] = useState(initialEvent);
  const [tab, setTab] = useState<Tab>("guests");
  const [archiving, setArchiving] = useState(false);
  const [archiveError, setArchiveError] = useState<string | null>(null);

  const tabs: { id: Tab; label: string }[] = [
    { id: "guests", label: "Convidados" },
    { id: "seats", label: "Lugares" },
    { id: "qr", label: "Atelier QR" },
    { id: "sheets", label: "Sheets" },
    { id: "checkin", label: "Check-in" },
    { id: "report", label: "Relatório" },
    { id: "history", label: "Histórico" },
    { id: "settings", label: "Definições" },
  ];

  function handleRefresh() {
    router.refresh();
  }

  async function handleArchive() {
    const confirmed = window.confirm(
      `Arquivar «${event.name}»?\n\nO evento deixa de aparecer na lista activa, mas os dados permanecem consultáveis.`
    );
    if (!confirmed) return;

    setArchiving(true);
    setArchiveError(null);

    const result = await archiveEventAction(event.id);
    if (!result.success) {
      setArchiveError(result.error ?? "Não foi possível arquivar o evento.");
      setArchiving(false);
      return;
    }

    router.push("/admin/events");
    router.refresh();
  }

  return (
    <AdminShell
      title={event.name}
      subtitle={`${EVENT_TYPE_LABELS[event.type]} · ${formatDate(event.date)}`}
      actions={
        <Link href="/admin/events" className="admin-btn-secondary">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>
      }
    >
      <EventKpiPanel event={event} stats={initialStats} />

      <div className="flex flex-wrap gap-2 mb-8 border-b border-grey-dark/80 pb-4">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`px-4 py-2 font-mono text-[9px] tracking-[0.25em] uppercase border rounded-sm transition-colors ${
              tab === item.id
                ? "bg-admin-gold/10 text-admin-gold border-admin-gold/25"
                : "text-grey/60 border-transparent hover:text-white"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "guests" ? (
        <GuestManagement
          event={event}
          guests={initialGuests}
          seats={initialSeats}
          onChanged={handleRefresh}
        />
      ) : null}

      {tab === "seats" ? (
        <SeatAssignment
          eventId={event.id}
          seats={initialSeats}
          guests={initialGuests}
          onChanged={handleRefresh}
        />
      ) : null}

      {tab === "qr" ? (
        <EventQrPanel eventId={event.id} eventName={event.name} />
      ) : null}

      {tab === "sheets" ? (
        <GoogleSheetsSync
          event={event}
          onUpdated={setEvent}
          onSynced={handleRefresh}
        />
      ) : null}

      {tab === "checkin" ? (
        <CheckInDashboard guests={initialGuests} stats={initialStats} />
      ) : null}

      {tab === "report" ? (
        <GuestReportPanel
          event={event}
          guests={initialGuests}
          seats={initialSeats}
          stats={initialStats}
        />
      ) : null}

      {tab === "history" ? (
        <GuestHistoryPanel entries={auditEntries} />
      ) : null}

      {tab === "settings" ? (
        <section className="admin-card p-6 max-w-3xl">
          <h2 className="font-mono text-[9px] tracking-[0.4em] uppercase text-admin-gold mb-6">
            Definições do evento
          </h2>
          <EventForm
            businesses={businesses}
            clients={clients}
            event={event}
            onSaved={(updated) => {
              setEvent(updated);
              handleRefresh();
            }}
          />
          {event.location ? (
            <p className="mt-6 text-sm text-grey/60">
              <span className="font-mono text-[8px] tracking-[0.3em] uppercase text-grey/40 mr-3">
                Local
              </span>
              {event.location}
            </p>
          ) : null}

          {event.isActive ? (
            <div className="mt-10 pt-8 border-t border-grey-dark/60">
              <h3 className="font-mono text-[9px] tracking-[0.35em] uppercase text-grey/45 mb-3">
                Zona de risco
              </h3>
              <p className="text-sm text-grey/55 mb-4 max-w-lg">
                Arquivar remove o evento da operação activa. Convidados, lugares e
                histórico mantêm-se intactos.
              </p>
              <button
                type="button"
                onClick={handleArchive}
                disabled={archiving}
                className="inline-flex items-center gap-2 border border-red-500/30 text-red-300/90 text-[10px] tracking-[0.25em] uppercase px-4 py-2.5 hover:border-red-400/50 hover:bg-red-500/5 transition-colors disabled:opacity-50"
              >
                <Archive className="w-3.5 h-3.5" />
                {archiving ? "A arquivar..." : "Arquivar evento"}
              </button>
              {archiveError ? (
                <p className="text-sm text-red-400/80 mt-3">{archiveError}</p>
              ) : null}
            </div>
          ) : (
            <p className="mt-10 pt-8 border-t border-grey-dark/60 text-sm text-grey/50">
              Este evento está arquivado e já não aparece na lista activa.
            </p>
          )}
        </section>
      ) : null}
    </AdminShell>
  );
}
