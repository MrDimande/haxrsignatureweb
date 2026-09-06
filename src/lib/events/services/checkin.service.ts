import { shouldUseNeonServerDatabase } from "@/lib/neon/config";
import * as neon from "@/lib/events/services/checkin.neon.service";
import * as supabase from "@/lib/events/services/checkin.supabase.service";

export const lookupCheckin: typeof supabase.lookupCheckin = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.lookupCheckin(...args)
    : supabase.lookupCheckin(...args);

export const performCheckin: typeof supabase.performCheckin = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.performCheckin(...args)
    : supabase.performCheckin(...args);
