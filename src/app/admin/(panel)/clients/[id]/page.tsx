import { notFound } from "next/navigation";
import * as clientsRepo from "@/lib/admin/repositories/clients.repository";
import { getClientCommercialOverview } from "@/lib/admin/repositories/client-overview.repository";
import { buildClientTimeline } from "@/lib/admin/services/client-timeline.service";
import ClientDetailClient from "./ClientDetailClient";

type ClientDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  const { id } = await params;
  const client = await clientsRepo.getClientById(id);
  if (!client) notFound();

  const overview = await getClientCommercialOverview(client);
  const timeline = buildClientTimeline({
    client,
    events: overview.events,
    documents: overview.documents,
    payments: overview.payments,
  });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
  const portalUrl = client.portalToken
    ? `${siteUrl.replace(/\/$/, "")}/portal/${client.portalToken}`
    : null;

  return (
    <ClientDetailClient
      client={client}
      events={overview.events}
      documents={overview.documents}
      payments={overview.payments}
      stats={overview.stats}
      portalUrl={portalUrl}
      timeline={timeline}
    />
  );
}
