import Link from "next/link";
import PortalInvalidLink from "@/components/portal/PortalInvalidLink";
import PortalApprovalCard from "@/components/portal/PortalApprovalCard";
import PortalKpiGrid, { PortalProgressOverview } from "@/components/portal/sections/PortalKpiGrid";
import PortalEventsGrid from "@/components/portal/sections/PortalEventsGrid";
import { PortalMessagesSection } from "@/components/portal/sections/PortalPremiumSections";
import { loadPortalPage, PortalSectionHeader } from "@/lib/portal/portal-page";
import { portalHref } from "@/lib/portal/portal-routes";

type PortalDashboardPageProps = {
  params: Promise<{ token: string }>;
};

export default async function PortalDashboardPage({ params }: PortalDashboardPageProps) {
  const { token } = await params;
  const data = await loadPortalPage(token);
  if (!data) return <PortalInvalidLink />;

  return (
    <div className="space-y-10">
      <PortalSectionHeader
        title="Resumo do projecto"
        description="Acompanhe o progresso, aprovações e próximos passos do vosso evento."
      />

      <PortalKpiGrid data={data} />
      <PortalProgressOverview data={data} token={token} showLink />

      {data.upcomingMilestone ? (
        <section className="border border-admin-gold/20 rounded-sm p-5 bg-admin-gold/5">
          <p className="font-mono text-[8px] tracking-[0.35em] uppercase text-admin-gold mb-2">
            Próximo marco
          </p>
          <p className="font-serif text-2xl">{data.upcomingMilestone.title}</p>
          {data.upcomingMilestone.description ? (
            <p className="text-sm text-grey/55 mt-2">
              {data.upcomingMilestone.description}
            </p>
          ) : null}
        </section>
      ) : null}

      {data.pendingApprovals.length > 0 ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h3 className="font-mono text-[9px] tracking-[0.4em] uppercase text-admin-gold">
              Aprovações pendentes
            </h3>
            <Link
              href={portalHref(token, "aprovacoes")}
              className="text-[10px] font-mono uppercase tracking-wider text-admin-gold hover:underline"
            >
              Ver todas
            </Link>
          </div>
          {data.pendingApprovals.slice(0, 2).map((document) => (
            <PortalApprovalCard key={document.id} token={token} document={document} />
          ))}
        </section>
      ) : null}

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h3 className="font-mono text-[9px] tracking-[0.4em] uppercase text-admin-gold">
            Os vossos eventos
          </h3>
          <Link
            href={portalHref(token, "eventos")}
            className="text-[10px] font-mono uppercase tracking-wider text-admin-gold hover:underline"
          >
            Ver todos
          </Link>
        </div>
        <PortalEventsGrid events={data.events.slice(0, 2)} />
      </section>

      {data.messages.length > 0 ? (
        <section className="space-y-4">
          <h3 className="font-mono text-[9px] tracking-[0.4em] uppercase text-admin-gold">
            Mensagens recentes
          </h3>
          <PortalMessagesSection messages={data.messages.slice(0, 2)} />
        </section>
      ) : null}
    </div>
  );
}
