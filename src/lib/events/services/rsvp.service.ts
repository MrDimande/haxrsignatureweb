import { shouldUseNeonServerDatabase } from "@/lib/neon/config";
import * as neon from "@/lib/events/services/rsvp.neon.service";
import * as supabase from "@/lib/events/services/rsvp.supabase.service";

export const performRsvp: typeof supabase.performRsvp = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.performRsvp(...args)
    : supabase.performRsvp(...args);

export { lookupCheckin } from "@/lib/events/services/checkin.service";
