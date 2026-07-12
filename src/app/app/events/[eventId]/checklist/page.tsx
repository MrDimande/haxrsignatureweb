import { Suspense } from "react";
import { ChecklistModulePageClient } from "@/components/app/modules/module-page-clients";
import { ModuleSkeleton } from "@/components/app/modules/ModuleShell";
import { isRealClientEventId } from "@/lib/auth/resolve-active-event-id";
import { getChecklistModuleData } from "@/lib/event-modules/get-event-module-data";
import { loadClientEventChecklistModuleData } from "@/lib/checklist/client-event-checklist-api";

async function ChecklistContent({ eventId }: { eventId: string }) {
  const trimmedEventId = eventId.trim();
  const result = isRealClientEventId(trimmedEventId)
    ? await loadClientEventChecklistModuleData(trimmedEventId)
    : await getChecklistModuleData(trimmedEventId);

  return <ChecklistModulePageClient eventId={trimmedEventId} initialResult={result} />;
}

export default async function ChecklistPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  return (
    <Suspense fallback={<ModuleSkeleton />}>
      <ChecklistContent eventId={eventId} />
    </Suspense>
  );
}
