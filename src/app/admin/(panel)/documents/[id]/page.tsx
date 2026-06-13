import Link from "next/link";
import * as businessesRepo from "@/lib/admin/repositories/businesses.repository";
import * as catalogRepo from "@/lib/admin/repositories/catalog.repository";
import * as clientsRepo from "@/lib/admin/repositories/clients.repository";
import * as signaturesRepo from "@/lib/admin/repositories/signatures.repository";
import * as documentsRepo from "@/lib/admin/repositories/documents.repository";
import * as paymentsRepo from "@/lib/finance/repositories/payments.repository";
import DocumentDetailClient from "./DocumentDetailClient";

type PageProps = {
  params: Promise<{ id: string }>;
};

async function isPaymentsEnabled(): Promise<boolean> {
  try {
    await paymentsRepo.listPayments(1);
    return true;
  } catch {
    return false;
  }
}

export default async function DocumentDetailPage({ params }: PageProps) {
  const { id } = await params;

  const document = await documentsRepo.getDocumentById(id);

  if (!document) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-8">
        <div className="admin-card p-8 text-center max-w-md">
          <p className="text-grey mb-4">Documento não encontrado.</p>
          <Link href="/admin/documents" className="admin-btn-secondary">
            Voltar aos Documentos
          </Link>
        </div>
      </div>
    );
  }

  const [businesses, catalog, clients, signatures, paymentsEnabled] =
    await Promise.all([
      businessesRepo.listBusinesses(),
      catalogRepo.listCatalog(),
      clientsRepo.listClients(),
      signaturesRepo.listSignatures(),
      isPaymentsEnabled(),
    ]);

  return (
    <DocumentDetailClient
      document={document}
      businesses={businesses}
      catalog={catalog}
      clients={clients}
      signatures={signatures}
      paymentsEnabled={paymentsEnabled}
    />
  );
}
