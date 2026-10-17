import type { Metadata } from "next";
import * as eventsRepo from "@/lib/events/repositories/events.repository";
import * as guestsRepo from "@/lib/events/repositories/guests.repository";
import * as businessesRepo from "@/lib/admin/repositories/businesses.repository";
import EventsMigrationNotice from "@/components/admin/EventsMigrationNotice";
import { isEventsSchemaMissingError } from "@/lib/events/schema-guard";
import ReceptionEventsClient from "./ReceptionEventsClient";

export const metadata: Metadata = {
  title: "Recepção & Check-in · HAXR Signature",
  robots: { index: false, follow: false },
};

export default async function ReceptionEventsPage() {
  try {
    const [events, businesses] = await Promise.all([
      eventsRepo.listAllEvents(),
      businessesRepo.listBusinesses(),
    ]);

    const guestStats = await guestsRepo.listGuestStatsByEventIds(
      events.map((event) => event.id)
    );

    return (
      <ReceptionEventsClient
        events={events}
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
