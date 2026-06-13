import * as clientsRepo from "@/lib/admin/repositories/clients.repository";
import ClientsPageClient from "./ClientsPageClient";

export default async function ClientsPage() {
  const clients = await clientsRepo.listClients();
  return <ClientsPageClient initialClients={clients} />;
}
