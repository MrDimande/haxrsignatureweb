import PortalInvalidLink from "@/components/portal/PortalInvalidLink";
import PortalDocumentsList from "@/components/portal/sections/PortalDocumentsList";
import { isPortalApprovalPending } from "@/lib/portal/services/portal-approval-rules";
import { loadPortalPage, PortalSectionHeader } from "@/lib/portal/portal-page";

type PortalDocumentsPageProps = {
  params: Promise<{ token: string }>;
};

export default async function PortalDocumentsPage({ params }: PortalDocumentsPageProps) {
  const { token } = await params;
  const data = await loadPortalPage(token);
  if (!data) return <PortalInvalidLink />;

  const documents = data.documents.filter((doc) => !isPortalApprovalPending(doc));

  return (
    <div className="space-y-6">
      <PortalSectionHeader
        title="Documentos"
        description="Proformas, facturas e recibos disponíveis para consulta e download."
      />
      <PortalDocumentsList token={token} documents={documents} />
    </div>
  );
}
