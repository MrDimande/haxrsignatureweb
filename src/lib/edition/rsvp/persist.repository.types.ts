import type { EditionGuestMatchCandidate } from "@/lib/edition/rsvp/guest-match";

export type EditionRsvpStatus = "confirmed" | "declined";

export type EditionRsvpInsertInput = {
  eventId: string;
  name: string;
  nameNormalized: string;
  email: string;
  phone: string;
  qrToken: string;
  status: EditionRsvpStatus;
  plusOnes: number;
  guestNotes: string;
};

export type EditionRsvpUpdateInput = {
  guestId: string;
  eventId: string;
  name: string;
  nameNormalized: string;
  email: string;
  phone: string;
  status: EditionRsvpStatus;
  plusOnes: number;
  guestNotes: string;
};

export type EditionRsvpAuditInput = {
  guestId: string;
  eventId: string;
  guestName: string;
  action: string;
  details: string;
};

export type EditionRsvpRpcInput = {
  eventId: string;
  name: string;
  nameNormalized: string;
  attending: boolean;
  partySize: number;
  editionSlug: string;
  email: string;
  phone: string;
  messageForBride: string;
  size: string;
  dressCodeConfirmed: boolean | null;
};

export type EditionRsvpRpcPayload = {
  ok?: boolean;
  error?: string;
  guestId?: string;
  status?: EditionRsvpStatus;
  created?: boolean;
  partySize?: number;
  plusOnes?: number;
};

export type EditionRsvpPersistenceBackend = "supabase" | "neon";

export type EditionRsvpPersistenceRepository = {
  backendName: EditionRsvpPersistenceBackend;
  isConfigured: () => boolean;
  loadEventGuestCandidates: (
    eventId: string,
  ) => Promise<EditionGuestMatchCandidate[]>;
  insertEditionGuest: (input: EditionRsvpInsertInput) => Promise<string>;
  updateEditionGuest: (input: EditionRsvpUpdateInput) => Promise<boolean>;
  logEditionRsvpAudit: (input: EditionRsvpAuditInput) => Promise<void>;
  submitEditionRsvpRpc: (
    input: EditionRsvpRpcInput,
  ) => Promise<EditionRsvpRpcPayload | null>;
};
