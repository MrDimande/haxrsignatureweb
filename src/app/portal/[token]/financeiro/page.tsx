import PortalInvalidLink from "@/components/portal/PortalInvalidLink";
import { PortalPaymentsSection } from "@/components/portal/sections/PortalPremiumSections";
import DateHoldBadge from "@/components/shared/DateHoldBadge";
import { loadPortalPage, PortalSectionHeader } from "@/lib/portal/portal-page";

type PortalFinancePageProps = {
  params: Promise<{ token: string }>;
};

export default async function PortalFinancePage({ params }: PortalFinancePageProps) {
  const { token } = await params;
  const data = await loadPortalPage(token);
  if (!data) return <PortalInvalidLink />;

  return (
    <div className="space-y-6">
      <PortalSectionHeader
        title="Financeiro"
        description="Histórico de pagamentos, saldo pendente e envio de comprovativos de sinal."
      />
      <DateHoldBadge holdUntil={data.activeDateHoldUntil} variant="portal" />
      <PortalPaymentsSection token={token} data={data} />
    </div>
  );
}
