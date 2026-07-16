import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import EventsMigrationNotice from "@/components/admin/EventsMigrationNotice";
import { isCampaignsSchemaMissingError } from "@/lib/campaigns/schema-guard";
import * as campaignsRepo from "@/lib/campaigns/repositories/campaigns.repository";
import * as eventsRepo from "@/lib/events/repositories/events.repository";
import { Plus } from "lucide-react";
import CampaignsPageClient from "./CampaignsPageClient";

type PageProps = {
  searchParams: Promise<{ eventId?: string }>;
};

export default async function CampaignsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const events = await eventsRepo.listAllEvents().catch(() => []);
  const eventId = params.eventId ?? events[0]?.id ?? "";

  try {
    const campaigns = eventId
      ? await campaignsRepo.listCampaignsByEvent(eventId)
      : [];

    return (
      <AdminShell
        title="Campanhas"
        subtitle="Convites WhatsApp por evento"
        actions={
          <Link
            href={`/admin/invitations/campaigns/new${eventId ? `?eventId=${eventId}` : ""}`}
            className="admin-btn-primary"
          >
            <Plus className="w-4 h-4" />
            Nova campanha
          </Link>
        }
      >
        <CampaignsPageClient
          events={events.map((e) => ({ id: e.id, name: e.name }))}
          selectedEventId={eventId}
          campaigns={campaigns}
        />
      </AdminShell>
    );
  } catch (error) {
    if (isCampaignsSchemaMissingError(error)) {
      return (
        <AdminShell title="Campanhas" subtitle="Schema pendente">
          <EventsMigrationNotice migrationFile="044_invitation_campaigns_senders_manual.sql" />
        </AdminShell>
      );
    }
    throw error;
  }
}
