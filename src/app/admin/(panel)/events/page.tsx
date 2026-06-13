import * as eventsRepo from "@/lib/events/repositories/events.repository";
import * as guestsRepo from "@/lib/events/repositories/guests.repository";
import * as businessesRepo from "@/lib/admin/repositories/businesses.repository";
import EventsMigrationNotice from "@/components/admin/EventsMigrationNotice";
import { isEventsSchemaMissingError } from "@/lib/events/schema-guard";
import EventsPageClient from "./EventsPageClient";

export default async function EventsPage() {
  try {
    const [events, businesses] = await Promise.all([
      eventsRepo.listAllEvents(),
      businessesRepo.listBusinesses(),
    ]);

    const guestStats = await guestsRepo.listGuestStatsByEventIds(
      events.map((event) => event.id)
    );

    return (
      <EventsPageClient
        initialEvents={events}
        guestStats={guestStats}
        businesses={businesses.map((b) => ({ id: b.id, name: b.name }))}
      />
    );
  } catch (error) {
    if (isEventsSchemaMissingError(error)) {
      return <EventsMigrationNotice migrationFile="006_events_seating.sql" />;
    }
    throw error;
  }
}
