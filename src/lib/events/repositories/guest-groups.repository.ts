import type { GuestGroup, GuestGroupFormData } from "@/lib/events/types";
import { shouldUseNeonServerDatabase } from "@/lib/neon/config";
import {
  countGuestsInGroup as countGuestsInGroupNeon,
  createGroup as createGroupNeon,
  deleteGroup as deleteGroupNeon,
  listGroupsByEvent as listGroupsByEventNeon,
  updateGroup as updateGroupNeon,
} from "@/lib/events/repositories/guest-groups.neon.repository";
import {
  countGuestsInGroup as countGuestsInGroupSupabase,
  createGroup as createGroupSupabase,
  deleteGroup as deleteGroupSupabase,
  listGroupsByEvent as listGroupsByEventSupabase,
  updateGroup as updateGroupSupabase,
} from "@/lib/events/repositories/guest-groups.supabase.repository";

export function listGroupsByEvent(eventId: string): Promise<GuestGroup[]> {
  return shouldUseNeonServerDatabase()
    ? listGroupsByEventNeon(eventId)
    : listGroupsByEventSupabase(eventId);
}

export function createGroup(
  eventId: string,
  data: GuestGroupFormData,
): Promise<GuestGroup> {
  return shouldUseNeonServerDatabase()
    ? createGroupNeon(eventId, data)
    : createGroupSupabase(eventId, data);
}

export function updateGroup(
  id: string,
  data: GuestGroupFormData,
): Promise<GuestGroup> {
  return shouldUseNeonServerDatabase()
    ? updateGroupNeon(id, data)
    : updateGroupSupabase(id, data);
}

export function deleteGroup(id: string): Promise<void> {
  return shouldUseNeonServerDatabase()
    ? deleteGroupNeon(id)
    : deleteGroupSupabase(id);
}

export function countGuestsInGroup(groupId: string): Promise<number> {
  return shouldUseNeonServerDatabase()
    ? countGuestsInGroupNeon(groupId)
    : countGuestsInGroupSupabase(groupId);
}
