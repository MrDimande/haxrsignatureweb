import { Suspense } from "react";
import { RSVPModulePageClient } from "@/components/app/modules/module-page-clients";
import { ModuleSkeleton } from "@/components/app/modules/ModuleShell";
import { getRsvpModuleData } from "@/lib/event-modules/get-event-module-data";

async function RSVPContent({ eventId }: { eventId: string }) {
  const result = await getRsvpModuleData(eventId);
  return <RSVPModulePageClient eventId={eventId} initialResult={result} />;
}

export default async function RSVPPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  return (
    <Suspense fallback={<ModuleSkeleton />}>
      <RSVPContent eventId={eventId} />
    </Suspense>
  );
}
