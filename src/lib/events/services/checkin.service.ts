import * as neon from "@/lib/events/services/checkin.neon.service";

export const lookupCheckin: typeof neon.lookupCheckin = (...args) =>
  neon.lookupCheckin(...args);

export const performCheckin: typeof neon.performCheckin = (...args) =>
  neon.performCheckin(...args);
