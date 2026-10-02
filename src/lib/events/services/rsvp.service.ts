import * as neon from "@/lib/events/services/rsvp.neon.service";

export const performRsvp: typeof neon.performRsvp = (...args) =>
  neon.performRsvp(...args);

export { lookupCheckin } from "@/lib/events/services/checkin.service";
