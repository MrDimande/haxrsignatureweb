import { parseEventLookup } from "@/lib/events/services/lookup-parser";
import {
  getGuestByEventAndToken,
  safeSyncGuestContactProfile,
  upsertEventContactProfile,
} from "@/lib/events/repositories/event-contact-profiles.repository";
import { neonQuery } from "@/lib/neon/server-db";
import type { CheckinLookup, RsvpSubmitInput } from "@/lib/events/types";

type RsvpRow = {
  payload: Record<string, unknown>;
};

export async function performRsvp(input: RsvpSubmitInput): Promise<CheckinLookup> {
  const query = await neonQuery<RsvpRow>(
    `
      SELECT public.perform_event_rsvp(
        $1::uuid,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7::integer,
        $8,
        $9
      ) AS payload
    `,
    [
      input.eventId,
      input.token,
      input.attendance,
      input.name,
      input.email ?? "",
      input.phone ?? "",
      input.plusOnes,
      input.dietaryNotes ?? "",
      input.guestNotes ?? "",
    ],
  );

  const data = query.rows[0]?.payload;
  if (!data) throw new Error("[rsvp-neon] no payload returned");
  const result = parseEventLookup(data);

  if (result.ok) {
    const guest = await getGuestByEventAndToken(input.eventId, input.token);
    if (guest) {
      await safeSyncGuestContactProfile({
        eventId: input.eventId,
        guest,
        source: "rsvp",
      });
    } else {
      await upsertEventContactProfile({
        eventId: input.eventId,
        fullName: input.name,
        email: input.email,
        phone: input.phone,
        source: "rsvp",
      }).catch((syncError) => {
        console.error("[rsvp] contact profile sync failed:", syncError);
      });
    }
  }

  return result;
}
