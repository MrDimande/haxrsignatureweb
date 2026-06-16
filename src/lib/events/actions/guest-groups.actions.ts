"use server";

import { revalidatePath } from "next/cache";
import { runAction } from "@/lib/admin/actions/auth";
import * as groupsRepo from "@/lib/events/repositories/guest-groups.repository";
import type { GuestGroupFormData } from "@/lib/events/types";

function revalidateEvent(eventId: string) {
  revalidatePath(`/admin/events/${eventId}`);
  revalidatePath("/admin/events");
}

export async function listGuestGroupsAction(eventId: string) {
  return runAction(() => groupsRepo.listGroupsByEvent(eventId));
}

export async function saveGuestGroupAction(
  eventId: string,
  data: GuestGroupFormData,
  id?: string
) {
  const result = await runAction(() =>
    id ? groupsRepo.updateGroup(id, data) : groupsRepo.createGroup(eventId, data)
  );
  if (result.success) revalidateEvent(eventId);
  return result;
}

export async function deleteGuestGroupAction(eventId: string, groupId: string) {
  const result = await runAction(() => groupsRepo.deleteGroup(groupId));
  if (result.success) revalidateEvent(eventId);
  return result;
}
