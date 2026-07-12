import PortalInvalidLink from "@/components/portal/PortalInvalidLink";
import { PortalProgressOverview } from "@/components/portal/sections/PortalKpiGrid";
import {
  PortalOperationalTimeline,
  PortalProjectTimeline,
} from "@/components/portal/sections/PortalTimelineSections";
import { loadPortalPage, PortalSectionHeader } from "@/lib/portal/portal-page";

type PortalTimelinePageProps = {
  params: Promise<{ token: string }>;
};

export default async function PortalTimelinePage({ params }: PortalTimelinePageProps) {
  const { token } = await params;
  const data = await loadPortalPage(token);
  if (!data) return <PortalInvalidLink />;

  return (
    <div className="space-y-10">
      <PortalSectionHeader
        title="Cronograma"
        description="Marcos operacionais e histórico de actividade do projecto."
      />

      <PortalProgressOverview data={data} token={token} />

      <section className="space-y-4">
        <h3 className="font-mono text-[9px] tracking-[0.4em] uppercase text-admin-gold">
          Fases operacionais
        </h3>
        <PortalOperationalTimeline phases={data.operationalTimeline} />
      </section>

      <section className="space-y-4">
        <h3 className="font-mono text-[9px] tracking-[0.4em] uppercase text-admin-gold">
          Actividade recente
        </h3>
        <PortalProjectTimeline timeline={data.timeline} />
      </section>
    </div>
  );
}
