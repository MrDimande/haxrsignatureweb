import { Suspense } from "react";
import { GuestsModulePageClient } from "@/components/app/modules/module-page-clients";
import { ModuleSkeleton } from "@/components/app/modules/ModuleShell";
import { isRealClientEventId } from "@/lib/auth/resolve-active-event-id";
import { getGuestModuleData } from "@/lib/event-modules/get-event-module-data";
import { loadClientEventGuestsModuleData } from "@/lib/guests/client-event-guests-api";

async function GuestsContent({ eventId }: { eventId: string }) {
  const trimmedEventId = eventId.trim();
  const result = isRealClientEventId(trimmedEventId)
    ? await loadClientEventGuestsModuleData(trimmedEventId)
    : await getGuestModuleData(trimmedEventId);

  return <GuestsModulePageClient eventId={trimmedEventId} initialResult={result} />;
}

export default async function GuestsPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  return (
    <Suspense fallback={<ModuleSkeleton />}>
      <GuestsContent eventId={eventId} />
    </Suspense>
  );
}
