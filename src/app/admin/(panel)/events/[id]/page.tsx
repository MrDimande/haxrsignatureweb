import { notFound } from "next/navigation";
import * as eventsRepo from "@/lib/events/repositories/events.repository";
import * as groupsRepo from "@/lib/events/repositories/guest-groups.repository";
import { listEditionGiftReservations } from "@/lib/events/repositories/edition-gifts.repository";
import * as guestsRepo from "@/lib/events/repositories/guests.repository";
import * as seatsRepo from "@/lib/events/repositories/seats.repository";
import * as businessesRepo from "@/lib/admin/repositories/businesses.repository";
import * as clientsRepo from "@/lib/admin/repositories/clients.repository";
import * as documentsRepo from "@/lib/admin/repositories/documents.repository";
import { buildEventCommandCenterData } from "@/lib/admin/services/event-command-center.service";
import * as paymentsRepo from "@/lib/finance/repositories/payments.repository";
import * as portalPremiumRepo from "@/lib/portal/repositories/portal-premium.repository";
import EventsMigrationNotice from "@/components/admin/EventsMigrationNotice";
import { listGuestAuditByEvent } from "@/lib/events/repositories/guest-audit.repository";
import * as batchesRepo from "@/lib/events/repositories/guest-import-batches.repository";
import { isEventsSchemaMissingError } from "@/lib/events/schema-guard";
import { isConciergeSchemaMissingError } from "@/lib/concierge/types";
import {
  listReviewItemsByEvent,
  listEventVendors,
  listEventChecklistItems,
  listEventMoodboardItems,
} from "@/lib/concierge/repositories/concierge.repository";
import { isConciergeAiConfigured, getConciergeModelName } from "@/lib/concierge/provider";
import { buildGuestReviewQueue } from "@/lib/events/services/guest-review-queue.service";
import { listEventContactProfiles } from "@/lib/events/repositories/event-contact-profiles.repository";
import EventDetailClient from "./EventDetailClient";
import { getClientPortalUrl } from "@/lib/portal/services/client-portal.service";

type EventDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { id } = await params;

  try {
    const event = await eventsRepo.getEventById(id);
    if (!event) notFound();

    const [
      guests,
      seats,
      stats,
      businesses,
      clients,
      auditEntries,
      groups,
      importBatches,
    ] =
      await Promise.all([
      guestsRepo.listGuestsByEvent(id, { includeArchived: true }),
      seatsRepo.listSeatsByEvent(id),
      guestsRepo.getEventStats(id),
      businessesRepo.listBusinesses(),
      clientsRepo.listClients(),
      listGuestAuditByEvent(id).catch(() => []),
      groupsRepo.listGroupsByEvent(id).catch(() => []),
      batchesRepo.listImportBatchesByEvent(id).catch(() => []),
    ]);

    const giftReservations = event.editionRegistryKey
      ? await listEditionGiftReservations(event.editionRegistryKey).catch(
          () => []
        )
      : [];

    const reviewQueue = await buildGuestReviewQueue(id, guests).catch(() => ({
      items: [],
      summary: {
        toReview: 0,
        ignored: 0,
        missingGuest: 0,
        possibleDuplicates: 0,
        syncErrors: 0,
        total: 0,
      },
    }));

    const contactProfiles = await listEventContactProfiles(id).catch(() => []);

    let conciergeReviews: Awaited<ReturnType<typeof listReviewItemsByEvent>> = [];
    let conciergeVendors: Awaited<ReturnType<typeof listEventVendors>> = [];
    let conciergeChecklist: Awaited<ReturnType<typeof listEventChecklistItems>> = [];
    let conciergeMoodboard: Awaited<ReturnType<typeof listEventMoodboardItems>> = [];
    let conciergeSchemaMissing = false;
    try {
      [conciergeReviews, conciergeVendors, conciergeChecklist, conciergeMoodboard] =
        await Promise.all([
          listReviewItemsByEvent(id),
          listEventVendors(id),
          listEventChecklistItems(id),
          listEventMoodboardItems(id),
        ]);
    } catch (conciergeError) {
      if (!isConciergeSchemaMissingError(conciergeError)) {
        throw conciergeError;
      }
      conciergeSchemaMissing = true;
    }

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
    const clientPortalUrl = event.clientId
      ? await getClientPortalUrl(event.clientId, siteUrl).catch(() => null)
      : null;

    const eventDocuments = await documentsRepo.listDocuments({ eventId: id });
    const eventPayments = await paymentsRepo.listPaymentsByEventId(id).catch(
      () => []
    );
    const portalPaymentProofs = event.clientId
      ? await portalPremiumRepo
          .listPaymentProofsForClient(event.clientId)
          .catch(() => [])
      : [];
    const commandCenter = buildEventCommandCenterData({
      event,
      guestStats: stats,
      documents: eventDocuments,
      payments: eventPayments,
      conciergePending: conciergeReviews.filter(
        (item) => item.status === "pending_review"
      ).length,
      reviewOpen:
        reviewQueue.summary.toReview +
        reviewQueue.summary.missingGuest +
        reviewQueue.summary.syncErrors,
      reviewSummary: reviewQueue.summary,
      pendingPaymentProofs: portalPaymentProofs.filter(
        (proof) =>
          proof.status === "pending_review" &&
          (proof.eventId === id || !proof.eventId)
      ).length,
    });

    const operationalPhases =
      await portalPremiumRepo.upsertOperationalTimelineForEvent(
        id,
        event.clientId
      );
    const [portalMessages, portalApprovals, portalContracts] = event.clientId
      ? await Promise.all([
          portalPremiumRepo.listMessagesForClient(event.clientId).catch(() => []),
          portalPremiumRepo.listCreativeApprovalsForClient(event.clientId).catch(() => []),
          portalPremiumRepo.listContractsForClient(event.clientId).catch(() => []),
        ])
      : [[], [], []];
    const linkedClient = event.clientId
      ? clients.find((client) => client.id === event.clientId)
      : null;

    return (
      <EventDetailClient
        event={event}
        initialGuests={guests}
        importBatches={importBatches}
        initialSeats={seats}
        groups={groups}
        stats={stats}
        auditEntries={auditEntries}
        businesses={businesses.map((b) => ({ id: b.id, name: b.name }))}
        clients={clients}
        giftReservations={giftReservations}
        conciergeReviews={conciergeReviews}
        conciergeVendors={conciergeVendors}
        conciergeChecklist={conciergeChecklist}
        conciergeMoodboard={conciergeMoodboard}
        conciergeSchemaMissing={conciergeSchemaMissing}
        conciergeAiConfigured={isConciergeAiConfigured()}
        conciergeAiModel={getConciergeModelName()}
        reviewQueue={reviewQueue}
        contactProfiles={contactProfiles}
        clientPortalUrl={clientPortalUrl}
        eventDocuments={eventDocuments}
        commandCenter={commandCenter}
        operationalPhases={operationalPhases}
        portalPaymentProofs={portalPaymentProofs}
        portalMessages={portalMessages}
        portalApprovals={portalApprovals}
        portalContracts={portalContracts}
        clientPhone={linkedClient?.phone ?? null}
      />
    );
  } catch (error) {
    if (isEventsSchemaMissingError(error)) {
      return <EventsMigrationNotice migrationFile="006_events_seating.sql" />;
    }
    throw error;
  }
}
