import PortalInvalidLink from "@/components/portal/PortalInvalidLink";
import PortalConciergeClient from "@/components/portal/PortalConciergeClient";
import { ConciergeSkeleton } from "@/components/app/concierge/ConciergeStates";
import { loadPortalPage, PortalSectionHeader } from "@/lib/portal/portal-page";
import {
  getPortalConciergeData,
  listPortalConciergeEvents,
} from "@/lib/portal/services/portal-concierge.service";
import { Suspense } from "react";

type PortalConciergePageProps = {
  params: Promise<{ token: string }>;
};

async function PortalConciergeContent({ token }: { token: string }) {
  const [events, dashboard] = await Promise.all([
    listPortalConciergeEvents(token),
    loadPortalPage(token),
  ]);

  if (!dashboard || !events?.length) {
    return <PortalInvalidLink />;
  }

  const initialEventId = events[0].id;
  const initialResult = await getPortalConciergeData(token, initialEventId);

  return (
    <PortalConciergeClient
      token={token}
      events={events}
      initialEventId={initialEventId}
      initialResult={initialResult}
    />
  );
}

export default async function PortalConciergePage({ params }: PortalConciergePageProps) {
  const { token } = await params;

  return (
    <div className="space-y-6">
      <PortalSectionHeader
        title="HAXR Concierge"
        description="Envie propostas, comprovativos, listas e notas. A equipa classifica e encaminha para o módulo certo."
      />
      <Suspense fallback={<ConciergeSkeleton />}>
        <PortalConciergeContent token={token} />
      </Suspense>
    </div>
  );
}
