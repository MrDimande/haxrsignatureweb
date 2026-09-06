import { normalizeGuestName } from "@/lib/events/normalize";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { asTableRows } from "@/lib/supabase/helpers";
import type { Tables } from "@/lib/supabase/database.types";
import type { EditionGuestMatchCandidate } from "@/lib/edition/rsvp/guest-match";
import type {
  EditionRsvpAuditInput,
  EditionRsvpInsertInput,
  EditionRsvpPersistenceRepository,
  EditionRsvpRpcInput,
  EditionRsvpRpcPayload,
  EditionRsvpUpdateInput,
} from "@/lib/edition/rsvp/persist.repository.types";

export const backendName = "supabase" as const;

export function isConfigured(): boolean {
  return isSupabaseConfigured();
}

export async function loadEventGuestCandidates(
  eventId: string,
): Promise<EditionGuestMatchCandidate[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("guests")
    .select(
      "id, event_id, name, name_normalized, email, phone, guest_source, qr_token",
    )
    .eq("event_id", eventId);

  if (error) {
    throw new Error(error.message);
  }

  return asTableRows<"guests">(data).map((row: Tables<"guests">) => ({
    id: row.id,
    eventId: row.event_id,
    name: row.name,
    nameNormalized: row.name_normalized ?? normalizeGuestName(row.name),
    email: row.email ?? "",
    phone: row.phone ?? "",
    guestSource: row.guest_source ?? "manual",
    qrToken: row.qr_token ?? undefined,
  }));
}

export async function insertEditionGuest(
  input: EditionRsvpInsertInput,
): Promise<string> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("guests")
    .insert({
      event_id: input.eventId,
      name: input.name,
      name_normalized: input.nameNormalized,
      email: input.email,
      phone: input.phone,
      qr_token: input.qrToken,
      status: input.status,
      plus_ones: input.plusOnes,
      guest_notes: input.guestNotes,
      guest_source: "edition_rsvp",
    } as never)
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "persist_failed");
  }

  return (data as { id: string }).id;
}

export async function updateEditionGuest(
  input: EditionRsvpUpdateInput,
): Promise<boolean> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("guests")
    .update({
      name: input.name,
      name_normalized: input.nameNormalized,
      email: input.email,
      phone: input.phone,
      status: input.status,
      plus_ones: input.plusOnes,
      guest_notes: input.guestNotes,
      guest_source: "edition_rsvp",
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", input.guestId)
    .eq("event_id", input.eventId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
}

export async function logEditionRsvpAudit(
  input: EditionRsvpAuditInput,
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("guest_audit_log").insert({
    guest_id: input.guestId,
    event_id: input.eventId,
    guest_name: input.guestName,
    action: input.action,
    details: input.details,
  } as never);

  if (error) {
    console.error("[edition/rsvp] Supabase audit failed:", error.message);
  }
}

export async function submitEditionRsvpRpc(
  input: EditionRsvpRpcInput,
): Promise<EditionRsvpRpcPayload | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("submit_edition_rsvp", {
    p_event_id: input.eventId,
    p_name: input.name,
    p_name_normalized: input.nameNormalized,
    p_attending: input.attending,
    p_party_size: input.partySize,
    p_edition_slug: input.editionSlug,
    p_email: input.email,
    p_phone: input.phone,
    p_message_for_bride: input.messageForBride,
    p_size: input.size,
    p_dress_code_confirmed: input.dressCodeConfirmed,
  } as never);

  if (error) {
    throw new Error(error.message);
  }

  return data as EditionRsvpRpcPayload | null;
}

const repository: EditionRsvpPersistenceRepository = {
  backendName,
  isConfigured,
  loadEventGuestCandidates,
  insertEditionGuest,
  updateEditionGuest,
  logEditionRsvpAudit,
  submitEditionRsvpRpc,
};

export default repository;
