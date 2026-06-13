"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import EventForm from "@/components/events/EventForm";
import SeatAssignment from "@/components/events/SeatAssignment";
import GuestManagement from "@/components/events/GuestManagement";
import GuestHistoryPanel from "@/components/events/GuestHistoryPanel";
import CheckInDashboard from "@/components/events/CheckInDashboard";
import GuestReportPanel from "@/components/events/GuestReportPanel";
import EventQrPanel from "@/components/events/EventQrPanel";
import GoogleSheetsSync from "@/components/events/GoogleSheetsSync";
import { EVENT_TYPE_LABELS } from "@/lib/admin/constants";
import type { BusinessId } from "@/lib/admin/types";
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
}: EventDetailClientProps) {
  const router = useRouter();
  const [event, setEvent] = useState(initialEvent);
  const [tab, setTab] = useState<Tab>("guests");

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
        </section>
      ) : null}
    </AdminShell>
  );
}
