import AdminShell from "@/components/admin/AdminShell";
import EventsMigrationNotice from "@/components/admin/EventsMigrationNotice";
import {
  getCampaignSendModeStatus,
  listEditionInviteOptions,
  listSendersForEvent,
} from "@/lib/campaigns/admin-campaigns.service";
import { isCampaignsSchemaMissingError } from "@/lib/campaigns/schema-guard";
import * as eventsRepo from "@/lib/events/repositories/events.repository";
import * as guestsRepo from "@/lib/events/repositories/guests.repository";
import NewCampaignPageClient from "./NewCampaignPageClient";

type PageProps = {
  searchParams: Promise<{ eventId?: string }>;
};

export default async function NewCampaignPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const events = await eventsRepo.listAllEvents().catch(() => []);
  const eventId = params.eventId ?? events[0]?.id ?? "";
  const sendMode = getCampaignSendModeStatus();
  const invites = listEditionInviteOptions();

  try {
    const event = eventId
      ? events.find((e) => e.id === eventId) ?? null
      : null;
    const guests = eventId
      ? await guestsRepo.listGuestsByEvent(eventId).catch(() => [])
      : [];
    const senders = eventId
      ? await listSendersForEvent(eventId).catch((error) => {
          if (isCampaignsSchemaMissingError(error)) throw error;
          return [];
        })
      : [];

    return (
      <AdminShell
        title="Nova campanha"
        subtitle="Editor de convites WhatsApp (fail-closed)"
      >
        <NewCampaignPageClient
          events={events.map((e) => ({
            id: e.id,
            name: e.name,
            date: e.date,
            location: e.location,
            editionRegistryKey: e.editionRegistryKey,
            clientName: e.clientName,
          }))}
          selectedEventId={eventId}
          guests={guests.map((g) => ({
            id: g.id,
            name: g.name,
            phone: g.phone,
          }))}
          senders={senders}
          invites={invites}
          sendMode={sendMode}
          defaultRegistryKey={event?.editionRegistryKey ?? ""}
        />
      </AdminShell>
    );
  } catch (error) {
    if (isCampaignsSchemaMissingError(error)) {
      return (
        <AdminShell title="Nova campanha" subtitle="Schema pendente">
          <EventsMigrationNotice migrationFile="044_invitation_campaigns_senders_manual.sql" />
        </AdminShell>
      );
    }
    throw error;
  }
}
