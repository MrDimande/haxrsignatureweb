import PortalInvalidLink from "@/components/portal/PortalInvalidLink";
import PortalEventsGrid from "@/components/portal/sections/PortalEventsGrid";
import { loadPortalPage, PortalSectionHeader } from "@/lib/portal/portal-page";

type PortalEventsPageProps = {
  params: Promise<{ token: string }>;
};

export default async function PortalEventsPage({ params }: PortalEventsPageProps) {
  const { token } = await params;
  const data = await loadPortalPage(token);
  if (!data) return <PortalInvalidLink />;

  return (
    <div className="space-y-6">
      <PortalSectionHeader
        title="Eventos"
        description="Progresso operacional e estatísticas de RSVP por evento."
      />
      <PortalEventsGrid events={data.events} />
    </div>
  );
}
