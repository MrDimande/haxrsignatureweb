import type { Json } from "@/lib/supabase/database.types";

/** Postgres enums from migration 036 / 002 — not yet in generated Database types. */
export type ClientEventStatus = "planning" | "active" | "completed" | "archived";
export type ClientEventMemberRole = "owner" | "partner" | "planner" | "viewer";
export type ClientEventType =
  | "wedding"
  | "birthday"
  | "corporate"
  | "baby_shower"
  | "graduation"
  | "other";

export type ClientEventSource = "onboarding" | "manual" | "import";
export type OnboardingSnapshotSyncedFrom = "localStorage" | "api" | "manual";

export type ClientEventRow = {
  id: string;
  owner_user_id: string;
  slug: string;
  event_name: string;
  event_type: ClientEventType;
  bride_name: string;
  groom_name: string;
  event_date: string | null;
  event_location: string;
  estimated_guests: number;
  budget_min: number | null;
  budget_max: number | null;
  status: ClientEventStatus;
  source: ClientEventSource;
  services_interested: string[];
  phone: string | null;
  operational_event_id: string | null;
  is_active: boolean;
  onboarding_fingerprint: string | null;
  created_at: string;
  updated_at: string;
};

export type ClientEventInsert = {
  id?: string;
  owner_user_id: string;
  slug: string;
  event_name: string;
  event_type: ClientEventType;
  bride_name: string;
  groom_name: string;
  event_date?: string | null;
  event_location?: string;
  estimated_guests?: number;
  budget_min?: number | null;
  budget_max?: number | null;
  status?: ClientEventStatus;
  source?: ClientEventSource;
  services_interested?: string[];
  phone?: string | null;
  onboarding_fingerprint?: string | null;
  is_active?: boolean;
};

export type EventMemberInsert = {
  client_event_id: string;
  user_id: string;
  role?: ClientEventMemberRole;
};

export type OnboardingSnapshotInsert = {
  client_event_id: string;
  owner_user_id: string;
  local_fingerprint: string;
  payload: Json;
  synced_from?: OnboardingSnapshotSyncedFrom;
  idempotency_key?: string | null;
};

export type ClientEventPublic = {
  eventId: string;
  slug: string;
  status: ClientEventStatus;
  eventName: string;
  eventType: ClientEventType;
  eventDate: string | null;
  isActive: boolean;
  createdAt: string;
  redirectTo: string;
};
