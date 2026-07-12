import PortalInvalidLink from "@/components/portal/PortalInvalidLink";
import PortalApprovalCard from "@/components/portal/PortalApprovalCard";
import { PortalCreativeApprovalCard } from "@/components/portal/sections/PortalPremiumSections";
import { loadPortalPage, PortalSectionHeader } from "@/lib/portal/portal-page";

type PortalApprovalsPageProps = {
  params: Promise<{ token: string }>;
};

export default async function PortalApprovalsPage({ params }: PortalApprovalsPageProps) {
  const { token } = await params;
  const data = await loadPortalPage(token);
  if (!data) return <PortalInvalidLink />;

  const hasProforma = data.pendingApprovals.length > 0;
  const hasCreative = data.pendingCreativeApprovals.length > 0;

  return (
    <div className="space-y-10">
      <PortalSectionHeader
        title="Aprovações"
        description="Aprove propostas comerciais, convites digitais e layouts de entrega."
      />

      <section className="space-y-4">
        <h3 className="font-mono text-[9px] tracking-[0.4em] uppercase text-admin-gold">
          Propostas comerciais
        </h3>
        {hasProforma ? (
          data.pendingApprovals.map((document) => (
            <PortalApprovalCard key={document.id} token={token} document={document} />
          ))
        ) : (
          <p className="text-sm text-grey/50">Não há propostas à espera de aprovação.</p>
        )}
      </section>

      <section className="space-y-4">
        <h3 className="font-mono text-[9px] tracking-[0.4em] uppercase text-admin-gold">
          Convite e layout
        </h3>
        {hasCreative ? (
          data.pendingCreativeApprovals.map((approval) => (
            <PortalCreativeApprovalCard key={approval.id} token={token} approval={approval} />
          ))
        ) : (
          <p className="text-sm text-grey/50">
            Não há convites ou layouts à espera de decisão.
          </p>
        )}
      </section>
    </div>
  );
}
