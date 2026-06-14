import { notFound } from "next/navigation";
import * as eventsRepo from "@/lib/events/repositories/events.repository";
import * as guestsRepo from "@/lib/events/repositories/guests.repository";
import * as seatsRepo from "@/lib/events/repositories/seats.repository";
import * as businessesRepo from "@/lib/admin/repositories/businesses.repository";
import * as clientsRepo from "@/lib/admin/repositories/clients.repository";
import EventsMigrationNotice from "@/components/admin/EventsMigrationNotice";
import { listGuestAuditByEvent } from "@/lib/events/repositories/guest-audit.repository";
import { isEventsSchemaMissingError } from "@/lib/events/schema-guard";
import EventDetailClient from "./EventDetailClient";

type EventDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { id } = await params;

  try {
    const event = await eventsRepo.getEventById(id);
    if (!event) notFound();

    const [guests, seats, stats, businesses, clients, auditEntries] = await Promise.all([
      guestsRepo.listGuestsByEvent(id),
      seatsRepo.listSeatsByEvent(id),
      guestsRepo.getEventStats(id),
      businessesRepo.listBusinesses(),
      clientsRepo.listClients(),
      listGuestAuditByEvent(id).catch(() => []),
    ]);

    return (
      <EventDetailClient
        event={event}
        initialGuests={guests}
        initialSeats={seats}
        stats={stats}
        auditEntries={auditEntries}
        businesses={businesses.map((b) => ({ id: b.id, name: b.name }))}
        clients={clients}
      />
    );
  } catch (error) {
    if (isEventsSchemaMissingError(error)) {
      return <EventsMigrationNotice migrationFile="006_events_seating.sql" />;
    }
    throw error;
  }
}
