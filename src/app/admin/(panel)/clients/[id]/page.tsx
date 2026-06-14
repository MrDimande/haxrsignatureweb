import { notFound } from "next/navigation";
import * as clientsRepo from "@/lib/admin/repositories/clients.repository";
import { getClientCommercialOverview } from "@/lib/admin/repositories/client-overview.repository";
import ClientDetailClient from "./ClientDetailClient";

type ClientDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  const { id } = await params;
  const client = await clientsRepo.getClientById(id);
  if (!client) notFound();

  const overview = await getClientCommercialOverview(id);

  return (
    <ClientDetailClient
      client={client}
      events={overview.events}
      documents={overview.documents}
      payments={overview.payments}
      stats={overview.stats}
    />
  );
}
