import * as clientsRepo from "@/lib/admin/repositories/clients.repository";
import * as documentsRepo from "@/lib/admin/repositories/documents.repository";

export type ClientPortalData = {
  clientName: string;
  documents: Awaited<
    ReturnType<typeof documentsRepo.listPortalDocumentsForClient>
  >;
};

export async function getClientPortalData(
  token: string
): Promise<ClientPortalData | null> {
  const client = await clientsRepo.getClientByPortalToken(token);
  if (!client) return null;

  const documents = await documentsRepo.listPortalDocumentsForClient(client);

  return {
    clientName: client.fullName,
    documents,
  };
}

export async function getClientPortalUrl(
  clientId: string,
  siteUrl: string
): Promise<string> {
  const token = await clientsRepo.ensureClientPortalToken(clientId);
  const base = siteUrl.replace(/\/$/, "");
  return `${base}/portal/${token}`;
}
