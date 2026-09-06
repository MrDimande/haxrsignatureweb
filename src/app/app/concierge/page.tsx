import { Suspense } from "react";
import ConciergePageClient from "@/components/app/concierge/ConciergePageClient";
import { ConciergeSkeleton } from "@/components/app/concierge/ConciergeStates";
import { getCurrentAppSession } from "@/lib/auth/app-session";
import { getConciergeData } from "@/lib/concierge/portal/get-concierge-data";
import type { ConciergeModuleData, ConciergeServiceResult } from "@/lib/concierge/portal/types";

async function ConciergeContent() {
  const session = await getCurrentAppSession();
  const eventId = session.profile?.active_client_event_id?.trim() ?? "";

  let result: ConciergeServiceResult<ConciergeModuleData>;
  if (!session.user) {
    result = {
      ok: false,
      error: "unauthorized",
      message: "Inicie sessão para aceder ao HAXR Concierge.",
    };
  } else if (!eventId) {
    result = {
      ok: false,
      error: "no_active_event",
      message: "Seleccione ou crie um evento antes de abrir o HAXR Concierge.",
    };
  } else {
    result = await getConciergeData(eventId);
  }

  return <ConciergePageClient eventId={eventId} initialResult={result} />;
}

export default function ConciergePage() {
  return (
    <Suspense fallback={<ConciergeSkeleton />}>
      <ConciergeContent />
    </Suspense>
  );
}
