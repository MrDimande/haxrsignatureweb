"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Archive, ArrowLeft, Trash2 } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import EventForm from "@/components/events/EventForm";
import SeatAssignment from "@/components/events/SeatAssignment";
import GuestManagement from "@/components/events/GuestManagement";
import GuestReviewQueue from "@/components/events/GuestReviewQueue";
import EventContactProfilesPanel from "@/components/events/EventContactProfilesPanel";
import GuestHistoryPanel from "@/components/events/GuestHistoryPanel";
import CheckInDashboard from "@/components/events/CheckInDashboard";
import GuestReportPanel from "@/components/events/GuestReportPanel";
import EditionGiftReservationsPanel from "@/components/events/EditionGiftReservationsPanel";
import EditionInviteCard from "@/components/events/EditionInviteCard";
import EditionRsvpOpsPanel from "@/components/events/EditionRsvpOpsPanel";
import type { EditionGiftReservation } from "@/lib/events/repositories/edition-gifts.repository";
import EventQrPanel from "@/components/events/EventQrPanel";
import GoogleSheetsSync from "@/components/events/GoogleSheetsSync";
import EventKpiPanel from "@/components/events/EventKpiPanel";
import { EVENT_TYPE_LABELS } from "@/lib/admin/constants";
import { archiveEventAction, deleteEventAction } from "@/lib/events/actions/events.actions";
import ConciergePanel from "@/components/concierge/ConciergePanel";
import ConciergeMigrationNotice from "@/components/concierge/ConciergeMigrationNotice";
import EventPortalPanel from "@/components/admin/events/EventPortalPanel";
import EventCommercialShortcutsPanel from "@/components/admin/events/EventCommercialShortcutsPanel";
import EventCommandCenterPanel from "@/components/admin/events/EventCommandCenterPanel";
import EventOperationalTimelinePanel from "@/components/admin/events/EventOperationalTimelinePanel";
import EventWhatsAppShortcutsPanel from "@/components/admin/events/EventWhatsAppShortcutsPanel";
import PortalPaymentProofsPanel from "@/components/admin/events/PortalPaymentProofsPanel";
import EventPortalContentPanel from "@/components/admin/events/EventPortalContentPanel";
import type { EventCommandCenterData } from "@/lib/admin/services/event-command-center.service";
import type {
  PortalContract,
  PortalCreativeApproval,
  PortalPaymentProof,
  PortalTeamMessage,
  PortalTimelineItem,
} from "@/lib/portal/portal-premium.types";
import type { BusinessId, Client, InvoiceDocument } from "@/lib/admin/types";
import type {
  ConciergeReviewItem,
  EventChecklistItem,
  EventMoodboardItem,
  EventVendor,
} from "@/lib/concierge/types";
import type {
  EventGuest,
  EventSeat,
  EventStats,
  GuestAuditEntry,
  GuestGroup,
  ManagedEvent,
  ReviewQueueResult,
} from "@/lib/events/types";
import type { EventContactProfileRow } from "@/lib/events/repositories/event-contact-profiles.repository";

type Tab =
  | "guests"
  | "review"
  | "contacts"
  | "seats"
  | "qr"
  | "sheets"
  | "checkin"
  | "report"
  | "gifts"
  | "history"
  | "concierge"
  | "portal"
  | "settings";

type EventDetailClientProps = {
  event: ManagedEvent;
  initialGuests: EventGuest[];
  initialSeats: EventSeat[];
  groups: GuestGroup[];
  stats: EventStats;
  auditEntries: GuestAuditEntry[];
  businesses: { id: BusinessId; name: string }[];
  clients: Client[];
  giftReservations?: EditionGiftReservation[];
  conciergeReviews?: ConciergeReviewItem[];
  conciergeVendors?: EventVendor[];
  conciergeChecklist?: EventChecklistItem[];
  conciergeMoodboard?: EventMoodboardItem[];
  conciergeSchemaMissing?: boolean;
  conciergeAiConfigured?: boolean;
  conciergeAiModel?: string;
  reviewQueue?: ReviewQueueResult;
  contactProfiles?: EventContactProfileRow[];
  clientPortalUrl?: string | null;
  eventDocuments?: InvoiceDocument[];
  commandCenter?: EventCommandCenterData;
  operationalPhases?: PortalTimelineItem[];
  portalPaymentProofs?: PortalPaymentProof[];
  portalMessages?: PortalTeamMessage[];
  portalApprovals?: PortalCreativeApproval[];
  portalContracts?: PortalContract[];
  clientPhone?: string | null;
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
  groups,
  stats: initialStats,
  auditEntries,
  businesses,
  clients,
  giftReservations = [],
  conciergeReviews = [],
  conciergeVendors = [],
  conciergeChecklist = [],
  conciergeMoodboard = [],
  conciergeSchemaMissing = false,
  conciergeAiConfigured = false,
  conciergeAiModel = "gemini-2.0-flash",
  reviewQueue = { items: [], summary: { toReview: 0, ignored: 0, missingGuest: 0, possibleDuplicates: 0, syncErrors: 0, total: 0 } },
  contactProfiles = [],
  clientPortalUrl = null,
  eventDocuments = [],
  commandCenter,
  operationalPhases = [],
  portalPaymentProofs = [],
  portalMessages = [],
  portalApprovals = [],
  portalContracts = [],
  clientPhone = null,
}: EventDetailClientProps) {
  const router = useRouter();
  const [event, setEvent] = useState(initialEvent);
  const [tab, setTab] = useState<Tab>("guests");
  const [archiving, setArchiving] = useState(false);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const reviewBadge =
    reviewQueue.summary.toReview +
    reviewQueue.summary.missingGuest +
    reviewQueue.summary.syncErrors;

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: "guests", label: "Convidados" },
    {
      id: "review",
      label: "Revisão",
      badge: reviewBadge > 0 ? reviewBadge : undefined,
    },
    { id: "contacts", label: "Contactos" },
    ...(event.editionRegistryKey
      ? [{ id: "gifts" as const, label: "Presentes" }]
      : []),
    { id: "seats", label: "Lugares" },
    { id: "qr", label: "Atelier QR" },
    { id: "sheets", label: "Sheets" },
    { id: "checkin", label: "Check-in" },
    { id: "concierge", label: "Concierge" },
    { id: "report", label: "Relatório" },
    { id: "history", label: "Histórico" },
    { id: "portal", label: "Portal" },
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

  async function handleDelete() {
    if (deleteConfirm.trim() !== event.name.trim()) {
      setDeleteError("Escreva o nome exacto do evento para confirmar.");
      return;
    }

    const confirmed = window.confirm(
      `Eliminar permanentemente «${event.name}»?\n\nConvidados, lugares e histórico serão apagados. Esta acção não pode ser desfeita.`
    );
    if (!confirmed) return;

    setDeleting(true);
    setDeleteError(null);

    const result = await deleteEventAction(event.id);
    if (!result.success) {
      setDeleteError(result.error ?? "Não foi possível eliminar o evento.");
      setDeleting(false);
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

      {commandCenter ? (
        <EventCommandCenterPanel
          event={event}
          guestStats={initialStats}
          command={commandCenter}
          clientPortalUrl={clientPortalUrl}
          onOpenTab={(tab) => setTab(tab)}
        />
      ) : null}

      <EventOperationalTimelinePanel phases={operationalPhases} />

      <PortalPaymentProofsPanel proofs={portalPaymentProofs} />

      {event.clientId ? (
        <EventPortalContentPanel
          eventId={event.id}
          clientId={event.clientId}
          messages={portalMessages}
          approvals={portalApprovals}
          contracts={portalContracts}
        />
      ) : null}

      <EventWhatsAppShortcutsPanel
        event={event}
        clientPhone={clientPhone}
        portalUrl={clientPortalUrl}
        documentNumber={
          eventDocuments.find((doc) => doc.documentType === "proforma")?.documentNumber ??
          null
        }
      />

      <EventCommercialShortcutsPanel
        event={event}
        documents={eventDocuments}
        clientPortalUrl={clientPortalUrl}
      />

      <EditionInviteCard
        registryKey={event.editionRegistryKey}
        eventName={event.name}
      />

      {event.editionRegistryKey ? (
        <EditionRsvpOpsPanel
          event={event}
          guests={initialGuests}
          stats={initialStats}
          giftReservationCount={giftReservations.length}
          onOpenReport={() => setTab("report")}
        />
      ) : null}

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
            {item.badge ? (
              <span className="ml-2 inline-flex min-w-[1.25rem] justify-center rounded-full bg-amber-500/20 text-amber-200 px-1.5 py-0.5 text-[8px]">
                {item.badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {tab === "guests" ? (
        <GuestManagement
          event={event}
          guests={initialGuests}
          groups={groups}
          seats={initialSeats}
          onChanged={handleRefresh}
        />
      ) : null}

      {tab === "review" ? (
        <GuestReviewQueue
          eventId={event.id}
          guests={initialGuests}
          initialQueue={reviewQueue}
          onChanged={handleRefresh}
        />
      ) : null}

      {tab === "contacts" ? (
        <EventContactProfilesPanel
          contacts={contactProfiles}
          guests={initialGuests}
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
        <EventQrPanel
          eventId={event.id}
          eventName={event.name}
          findSeatCode={event.findSeatCode}
        />
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

      {tab === "concierge" ? (
        conciergeSchemaMissing ? (
          <ConciergeMigrationNotice />
        ) : (
          <ConciergePanel
            eventId={event.id}
            initialReviews={conciergeReviews}
            initialVendors={conciergeVendors}
            initialChecklist={conciergeChecklist}
            initialMoodboard={conciergeMoodboard}
            aiConfigured={conciergeAiConfigured}
            aiModel={conciergeAiModel}
            onNavigateTab={(target) => setTab(target)}
          />
        )
      ) : null}

      {tab === "report" ? (
        <GuestReportPanel
          event={event}
          guests={initialGuests}
          seats={initialSeats}
          stats={initialStats}
          giftReservations={giftReservations}
        />
      ) : null}

      {tab === "gifts" && event.editionRegistryKey ? (
        <EditionGiftReservationsPanel
          reservations={giftReservations}
          registryKey={event.editionRegistryKey}
        />
      ) : null}

      {tab === "history" ? (
        <GuestHistoryPanel entries={auditEntries} />
      ) : null}

      {tab === "portal" ? (
        <EventPortalPanel event={event} portalUrl={clientPortalUrl} />
      ) : null}

      {tab === "settings" ? (
        <section className="admin-card p-6 max-w-3xl">
          <h2 className="font-mono text-[9px] tracking-[0.4em] uppercase text-admin-gold mb-2">
            Definições do evento
          </h2>
          <p className="text-sm text-grey/55 mb-6">
            Edite o nome, data e local — o Atelier QR actualiza automaticamente
            com o nome do evento.
          </p>
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

              <div className="mt-8 pt-8 border-t border-red-500/20">
                <h3 className="font-mono text-[9px] tracking-[0.35em] uppercase text-red-300/70 mb-3">
                  Eliminar permanentemente
                </h3>
                <p className="text-sm text-grey/55 mb-4 max-w-lg">
                  Use apenas se o evento foi criado por engano. Remove convidados,
                  lugares, QR e histórico — irreversível.
                </p>
                <label className="block max-w-md mb-4">
                  <span className="block font-mono text-[8px] tracking-[0.3em] uppercase text-grey/45 mb-2">
                    Escreva o nome do evento para confirmar
                  </span>
                  <input
                    value={deleteConfirm}
                    onChange={(e) => {
                      setDeleteConfirm(e.target.value);
                      setDeleteError(null);
                    }}
                    placeholder={event.name}
                    className="admin-input w-full"
                  />
                </label>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={
                    deleting || deleteConfirm.trim() !== event.name.trim()
                  }
                  className="inline-flex items-center gap-2 border border-red-600/40 text-red-400 text-[10px] tracking-[0.25em] uppercase px-4 py-2.5 hover:border-red-500/60 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {deleting ? "A eliminar..." : "Eliminar evento"}
                </button>
                {deleteError ? (
                  <p className="text-sm text-red-400/80 mt-3">{deleteError}</p>
                ) : null}
              </div>
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
