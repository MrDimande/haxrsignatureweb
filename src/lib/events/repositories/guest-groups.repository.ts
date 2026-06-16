import { createAdminClient } from "@/lib/supabase/server";
import { asTableRow, asTableRows } from "@/lib/supabase/helpers";
import type { GuestGroup, GuestGroupFormData } from "@/lib/events/types";

function mapGroup(row: {
  id: string;
  event_id: string;
  name: string;
  notes: string;
  created_at: string;
  updated_at: string;
}): GuestGroup {
  return {
    id: row.id,
    eventId: row.event_id,
    name: row.name,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listGroupsByEvent(eventId: string): Promise<GuestGroup[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("guest_groups")
    .select("*")
    .eq("event_id", eventId)
    .order("name");

  if (error) throw new Error(error.message);
  return asTableRows<"guest_groups">(data).map(mapGroup);
}

export async function createGroup(
  eventId: string,
  data: GuestGroupFormData
): Promise<GuestGroup> {
  const supabase = createAdminClient();
  const { data: saved, error } = await supabase
    .from("guest_groups")
    .insert({
      event_id: eventId,
      name: data.name.trim(),
      notes: data.notes.trim(),
    } as never)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  const row = asTableRow<"guest_groups">(saved);
  if (!row) throw new Error("Falha ao criar grupo.");
  return mapGroup(row);
}

export async function updateGroup(
  id: string,
  data: GuestGroupFormData
): Promise<GuestGroup> {
  const supabase = createAdminClient();
  const { data: saved, error } = await supabase
    .from("guest_groups")
    .update({
      name: data.name.trim(),
      notes: data.notes.trim(),
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  const row = asTableRow<"guest_groups">(saved);
  if (!row) throw new Error("Grupo não encontrado.");
  return mapGroup(row);
}

export async function deleteGroup(id: string): Promise<void> {
  const supabase = createAdminClient();

  const { error: clearError } = await supabase
    .from("guests")
    .update({ group_id: null } as never)
    .eq("group_id", id);

  if (clearError) throw new Error(clearError.message);

  const { error } = await supabase.from("guest_groups").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function countGuestsInGroup(groupId: string): Promise<number> {
  const supabase = createAdminClient();
  const { count, error } = await supabase
    .from("guests")
    .select("*", { count: "exact", head: true })
    .eq("group_id", groupId);

  if (error) throw new Error(error.message);
  return count ?? 0;
}
