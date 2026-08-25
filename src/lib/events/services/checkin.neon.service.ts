import type { CheckinLookup } from "@/lib/events/types";
import { parseEventLookup } from "@/lib/events/services/lookup-parser";
import { neonQuery } from "@/lib/neon/server-db";

type LookupRow = {
  payload: Record<string, unknown>;
};

async function callLookupFunction(
  functionName: "lookup_event_checkin" | "perform_event_checkin",
  eventId: string,
  token: string,
): Promise<Record<string, unknown>> {
  const result = await neonQuery<LookupRow>(
    `SELECT public.${functionName}($1::uuid, $2) AS payload`,
    [eventId, token],
  );

  const payload = result.rows[0]?.payload;
  if (!payload) {
    throw new Error(`[checkin-neon] ${functionName}: no payload returned`);
  }
  return payload;
}

export async function lookupCheckin(
  eventId: string,
  token: string,
): Promise<CheckinLookup> {
  const data = await callLookupFunction("lookup_event_checkin", eventId, token);
  return parseEventLookup(data);
}

export async function performCheckin(
  eventId: string,
  token: string,
): Promise<CheckinLookup> {
  const data = await callLookupFunction("perform_event_checkin", eventId, token);
  const result = parseEventLookup(data);
  return {
    ...result,
    checkedIn: Boolean(data.checkedIn),
    alreadyCheckedIn: Boolean(data.alreadyCheckedIn),
  };
}
