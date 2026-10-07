import { Suspense } from "react";
import { RSVPModulePageClient } from "@/components/app/modules/module-page-clients";
import { ModuleSkeleton } from "@/components/app/modules/ModuleShell";
import { isRealClientEventId } from "@/lib/auth/resolve-active-event-id";
import { getRsvpModuleData } from "@/lib/event-modules/get-event-module-data";
import { loadClientEventRsvpModuleData } from "@/lib/rsvp/client-event-rsvp-api";

async function RSVPContent({ eventId }: { eventId: string }) {
  const trimmedEventId = eventId.trim();
  const result = isRealClientEventId(trimmedEventId)
    ? await loadClientEventRsvpModuleData(trimmedEventId)
    : await getRsvpModuleData(trimmedEventId);
  return <RSVPModulePageClient eventId={trimmedEventId} initialResult={result} />;
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
