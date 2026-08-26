import type {
  ConciergeActivity,
  ConciergeClassification,
  ConciergeDestination,
  ConciergeInboxItem,
  ConciergeIntakeInput,
  ConciergeRoutingResult,
  ConciergeSuggestion,
} from "./types";
import type { PortalConciergeActor } from "./portal-concierge-auth";

export type ConciergePortalPersistenceMode = "memory" | "supabase" | "neon";

export interface CreatePortalItemInput extends ConciergeIntakeInput {
  type: ConciergeInboxItem["type"];
  status: ConciergeInboxItem["status"];
  uploadedBy: string;
  confidence?: number;
  suggestedDestination?: ConciergeDestination;
  classificationReason?: string;
  extractedText?: string;
  storagePath?: string;
  fileUrl?: string;
}

export interface CreateClassificationInput {
  itemId: string;
  classification: Omit<ConciergeClassification, "itemId" | "createdAt">;
}

export interface CreateSuggestionInput {
  itemId: string;
  suggestion: Omit<ConciergeSuggestion, "id" | "itemId" | "status"> & {
    status?: ConciergeSuggestion["status"];
  };
}

export interface CreateActivityInput {
  eventId: string;
  itemId?: string;
  title: string;
  description: string;
  type: ConciergeActivity["type"];
  actor?: Pick<PortalConciergeActor, "id" | "name" | "role">;
}

export interface ConciergePortalRepository {
  readonly mode: ConciergePortalPersistenceMode;

  listItems(eventId: string): Promise<ConciergeInboxItem[]>;
  getItem(itemId: string): Promise<ConciergeInboxItem | null>;
  createItem(input: CreatePortalItemInput): Promise<ConciergeInboxItem>;
  updateItem(itemId: string, patch: Partial<ConciergeInboxItem>): Promise<ConciergeInboxItem>;

  listClassifications(eventId: string): Promise<ConciergeClassification[]>;
  createClassification(input: CreateClassificationInput): Promise<ConciergeClassification>;

  listSuggestions(eventId: string): Promise<ConciergeSuggestion[]>;
  createSuggestion(input: CreateSuggestionInput): Promise<ConciergeSuggestion>;
  updateSuggestion(
    suggestionId: string,
    patch: Partial<Pick<ConciergeSuggestion, "status">>
  ): Promise<ConciergeSuggestion>;

  listActivities(eventId: string): Promise<ConciergeActivity[]>;
  createActivity(input: CreateActivityInput): Promise<ConciergeActivity>;

  archiveItem(itemId: string): Promise<ConciergeInboxItem>;
  rejectItem(itemId: string, reason?: string): Promise<ConciergeInboxItem>;
  validateItem(itemId: string): Promise<ConciergeInboxItem>;
  markItemRouted(
    itemId: string,
    destination: ConciergeDestination,
    routingResult: ConciergeRoutingResult
  ): Promise<ConciergeInboxItem>;
}

export function isConciergePortalSchemaMissingError(error: unknown): boolean {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" &&
          error !== null &&
          "message" in error &&
          typeof (error as { message: unknown }).message === "string"
        ? (error as { message: string }).message
        : String(error);

  const msg = message.toLowerCase();
  return (
    msg.includes("concierge_portal_items") ||
    msg.includes("concierge_portal_") ||
    msg.includes("pgrst205") ||
    (msg.includes("relation") && msg.includes("concierge_portal"))
  );
}
