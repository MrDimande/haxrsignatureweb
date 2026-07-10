import { Suspense } from "react";
import { VendorsModulePageClient } from "@/components/app/modules/module-page-clients";
import { ModuleSkeleton } from "@/components/app/modules/ModuleShell";
import { isRealClientEventId } from "@/lib/auth/resolve-active-event-id";
import { getVendorModuleData } from "@/lib/event-modules/get-event-module-data";
import { loadClientEventVendorsModuleData } from "@/lib/vendors/client-event-vendors-api";

async function VendorsContent({ eventId }: { eventId: string }) {
  const trimmedEventId = eventId.trim();
  const result = isRealClientEventId(trimmedEventId)
    ? await loadClientEventVendorsModuleData(trimmedEventId)
    : await getVendorModuleData(trimmedEventId);

  return <VendorsModulePageClient eventId={trimmedEventId} initialResult={result} />;
}

export default async function VendorsPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  return (
    <Suspense fallback={<ModuleSkeleton />}>
      <VendorsContent eventId={eventId} />
    </Suspense>
  );
}
