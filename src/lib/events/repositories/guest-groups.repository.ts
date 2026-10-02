import type { GuestGroup, GuestGroupFormData } from "@/lib/events/types";
import {
  countGuestsInGroup as countGuestsInGroupNeon,
  createGroup as createGroupNeon,
  deleteGroup as deleteGroupNeon,
  listGroupsByEvent as listGroupsByEventNeon,
  updateGroup as updateGroupNeon,
} from "@/lib/events/repositories/guest-groups.neon.repository";

export function listGroupsByEvent(eventId: string): Promise<GuestGroup[]> {
  return listGroupsByEventNeon(eventId);
}

export function createGroup(
  eventId: string,
  data: GuestGroupFormData,
): Promise<GuestGroup> {
  return createGroupNeon(eventId, data);
}

export function updateGroup(
  id: string,
  data: GuestGroupFormData,
): Promise<GuestGroup> {
  return updateGroupNeon(id, data);
}

export function deleteGroup(id: string): Promise<void> {
  return deleteGroupNeon(id);
}

export function countGuestsInGroup(groupId: string): Promise<number> {
  return countGuestsInGroupNeon(groupId);
}
