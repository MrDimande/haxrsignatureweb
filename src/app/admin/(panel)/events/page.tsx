import * as eventsRepo from "@/lib/events/repositories/events.repository";
import * as guestsRepo from "@/lib/events/repositories/guests.repository";
import * as businessesRepo from "@/lib/admin/repositories/businesses.repository";
import * as clientsRepo from "@/lib/admin/repositories/clients.repository";
import EventsMigrationNotice from "@/components/admin/EventsMigrationNotice";
import { isEventsSchemaMissingError } from "@/lib/events/schema-guard";
import EventsPageClient from "./EventsPageClient";

type EventsPageProps = {
  searchParams: Promise<{ create?: string; clientId?: string }>;
};

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const params = await searchParams;

  try {
    const [events, businesses, clients] = await Promise.all([
      eventsRepo.listAllEvents(),
      businessesRepo.listBusinesses(),
      clientsRepo.listClients(),
    ]);

    const guestStats = await guestsRepo.listGuestStatsByEventIds(
      events.map((event) => event.id)
    );

    return (
      <EventsPageClient
        initialEvents={events}
        guestStats={guestStats}
        businesses={businesses.map((b) => ({ id: b.id, name: b.name }))}
        clients={clients}
        defaultClientId={params.clientId ?? null}
        openCreate={params.create === "1"}
      />
    );
  } catch (error) {
    if (isEventsSchemaMissingError(error)) {
      return <EventsMigrationNotice migrationFile="006_events_seating.sql" />;
    }
    throw error;
  }
}
