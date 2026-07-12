"use client";

import { useCallback, useState, useTransition } from "react";
import ConciergePageClient from "@/components/app/concierge/ConciergePageClient";
import { ConciergeSkeleton } from "@/components/app/concierge/ConciergeStates";
import type { ConciergeServiceResult, ConciergeModuleData } from "@/lib/concierge/portal/types";
import type { ManagedEvent } from "@/lib/events/types";

type PortalConciergeClientProps = {
  token: string;
  events: ManagedEvent[];
  initialEventId: string;
  initialResult: ConciergeServiceResult<ConciergeModuleData>;
};

export default function PortalConciergeClient({
  token,
  events,
  initialEventId,
  initialResult,
}: PortalConciergeClientProps) {
  const [eventId, setEventId] = useState(initialEventId);
  const [result, setResult] = useState(initialResult);
  const [isPending, startTransition] = useTransition();

  const apiBasePath = `/api/portal/${encodeURIComponent(token)}/concierge`;

  const loadEvent = useCallback(
    (nextEventId: string) => {
      startTransition(async () => {
        const response = await fetch(
          `${apiBasePath}?eventId=${encodeURIComponent(nextEventId)}`,
          { cache: "no-store" }
        );
        const payload = (await response.json()) as ConciergeServiceResult<ConciergeModuleData>;
        setEventId(nextEventId);
        setResult(payload);
      });
    },
    [apiBasePath]
  );

  if (isPending) return <ConciergeSkeleton />;

  return (
    <div className="space-y-6">
      {events.length > 1 ? (
        <label className="block max-w-md space-y-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-admin-gold">
            Evento
          </span>
          <select
            value={eventId}
            onChange={(e) => loadEvent(e.target.value)}
            className="w-full rounded-sm border border-white/15 bg-black px-3 py-2 text-sm text-white"
          >
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name}
                {event.date ? ` — ${event.date}` : ""}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <ConciergePageClient
        key={eventId}
        eventId={eventId}
        initialResult={result}
        apiBasePath={apiBasePath}
      />
    </div>
  );
}
