import { Suspense } from "react";
import { DocumentsModulePageClient } from "@/components/app/modules/module-page-clients";
import { ModuleSkeleton } from "@/components/app/modules/ModuleShell";
import { loadClientEventDocumentsModuleData } from "@/lib/documents/client-event-documents-api";

async function DocumentsContent({ eventId }: { eventId: string }) {
  const result = await loadClientEventDocumentsModuleData(eventId);
  return <DocumentsModulePageClient eventId={eventId} initialResult={result} />;
}

export default async function DocumentsPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  return (
    <Suspense fallback={<ModuleSkeleton />}>
      <DocumentsContent eventId={eventId} />
    </Suspense>
  );
}
