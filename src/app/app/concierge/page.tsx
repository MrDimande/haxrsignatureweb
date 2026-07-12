import { Suspense } from "react";
import ConciergePageClient from "@/components/app/concierge/ConciergePageClient";
import { ConciergeSkeleton } from "@/components/app/concierge/ConciergeStates";
import { getConciergeData } from "@/lib/concierge/portal/get-concierge-data";
import { DEFAULT_EVENT_ID } from "@/lib/event-modules/module-config";

async function ConciergeContent() {
  const result = await getConciergeData(DEFAULT_EVENT_ID);
  return <ConciergePageClient eventId={DEFAULT_EVENT_ID} initialResult={result} />;
}

export default function ConciergePage() {
  return (
    <Suspense fallback={<ConciergeSkeleton />}>
      <ConciergeContent />
    </Suspense>
  );
}
