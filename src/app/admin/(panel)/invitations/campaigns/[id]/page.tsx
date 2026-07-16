import AdminShell from "@/components/admin/AdminShell";
import EventsMigrationNotice from "@/components/admin/EventsMigrationNotice";
import {
  getCampaignSendModeStatus,
  listCampaignManualOps,
  listSendersForEvent,
} from "@/lib/campaigns/admin-campaigns.service";
import { isCampaignsSchemaMissingError } from "@/lib/campaigns/schema-guard";
import * as campaignsRepo from "@/lib/campaigns/repositories/campaigns.repository";
import CampaignDetailClient from "./CampaignDetailClient";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ eventId?: string }>;
};

export default async function CampaignDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const query = await searchParams;
  const eventId = query.eventId ?? "";

  if (!eventId) {
    return (
      <AdminShell title="Campanha" subtitle="event_id em falta">
        <p className="text-sm text-grey/60">
          Abra a campanha a partir da lista com um evento seleccionado.
        </p>
      </AdminShell>
    );
  }

  try {
    const campaign = await campaignsRepo.getCampaignById(eventId, id);
    if (!campaign) {
      return (
        <AdminShell title="Campanha" subtitle="Não encontrada">
          <p className="text-sm text-grey/60">
            Campanha inexistente neste evento (isolamento event_id).
          </p>
        </AdminShell>
      );
    }

    const [recipients, senders] = await Promise.all([
      listCampaignManualOps(eventId, id),
      listSendersForEvent(eventId),
    ]);
    const sendMode = getCampaignSendModeStatus();

    return (
      <AdminShell title={campaign.name} subtitle="Operações manuais · preview">
        <CampaignDetailClient
          campaign={campaign}
          recipients={recipients}
          senders={senders}
          sendMode={sendMode}
        />
      </AdminShell>
    );
  } catch (error) {
    if (isCampaignsSchemaMissingError(error)) {
      return (
        <AdminShell title="Campanha" subtitle="Schema pendente">
          <EventsMigrationNotice migrationFile="044_invitation_campaigns_senders_manual.sql" />
        </AdminShell>
      );
    }
    throw error;
  }
}
