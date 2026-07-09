import { Suspense } from "react";
import { BudgetModulePageClient } from "@/components/app/modules/module-page-clients";
import { ModuleSkeleton } from "@/components/app/modules/ModuleShell";
import { isRealClientEventId } from "@/lib/auth/resolve-active-event-id";
import { getBudgetModuleData } from "@/lib/event-modules/get-event-module-data";
import { loadClientEventPaymentsModuleData } from "@/lib/payments/client-event-payments-api";

async function BudgetContent({ eventId }: { eventId: string }) {
  const trimmedEventId = eventId.trim();
  const result = isRealClientEventId(trimmedEventId)
    ? await loadClientEventPaymentsModuleData(trimmedEventId)
    : await getBudgetModuleData(trimmedEventId);

  return <BudgetModulePageClient eventId={trimmedEventId} initialResult={result} />;
}

export default async function BudgetPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  return (
    <Suspense fallback={<ModuleSkeleton />}>
      <BudgetContent eventId={eventId} />
    </Suspense>
  );
}
