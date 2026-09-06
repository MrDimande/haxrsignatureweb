import { shouldUseNeonServerDatabase } from "@/lib/neon/config";
import neonRepository from "@/lib/edition/rsvp/persist.neon.repository";
import supabaseRepository from "@/lib/edition/rsvp/persist.supabase.repository";
import type {
  EditionRsvpAuditInput,
  EditionRsvpInsertInput,
  EditionRsvpPersistenceBackend,
  EditionRsvpPersistenceRepository,
  EditionRsvpRpcInput,
  EditionRsvpRpcPayload,
  EditionRsvpUpdateInput,
} from "@/lib/edition/rsvp/persist.repository.types";
import type { EditionGuestMatchCandidate } from "@/lib/edition/rsvp/guest-match";

function getRepository(): EditionRsvpPersistenceRepository {
  return shouldUseNeonServerDatabase() ? neonRepository : supabaseRepository;
}

export function getEditionRsvpPersistenceBackend(): EditionRsvpPersistenceBackend {
  return getRepository().backendName;
}

export function isEditionRsvpPersistenceConfigured(): boolean {
  return getRepository().isConfigured();
}

export function loadEventGuestCandidates(
  eventId: string,
): Promise<EditionGuestMatchCandidate[]> {
  return getRepository().loadEventGuestCandidates(eventId);
}

export function insertEditionGuest(
  input: EditionRsvpInsertInput,
): Promise<string> {
  return getRepository().insertEditionGuest(input);
}

export function updateEditionGuest(
  input: EditionRsvpUpdateInput,
): Promise<boolean> {
  return getRepository().updateEditionGuest(input);
}

export function logEditionRsvpAudit(
  input: EditionRsvpAuditInput,
): Promise<void> {
  return getRepository().logEditionRsvpAudit(input);
}

export function submitEditionRsvpRpc(
  input: EditionRsvpRpcInput,
): Promise<EditionRsvpRpcPayload | null> {
  return getRepository().submitEditionRsvpRpc(input);
}

export type {
  EditionRsvpAuditInput,
  EditionRsvpInsertInput,
  EditionRsvpPersistenceBackend,
  EditionRsvpRpcInput,
  EditionRsvpRpcPayload,
  EditionRsvpUpdateInput,
} from "@/lib/edition/rsvp/persist.repository.types";
