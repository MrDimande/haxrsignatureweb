import type {
  ConciergePortalRepository,
  CreateActivityInput,
  CreateClassificationInput,
  CreatePortalItemInput,
  CreateSuggestionInput,
} from "./concierge-portal-repository";
import { createInitialConciergeModuleData } from "./mock-concierge-data";
import type {
  ConciergeActivity,
  ConciergeClassification,
  ConciergeDestination,
  ConciergeInboxItem,
  ConciergeRoutingResult,
  ConciergeSuggestion,
} from "./types";

type EventStore = {
  items: Map<string, ConciergeInboxItem>;
  classifications: ConciergeClassification[];
  suggestions: ConciergeSuggestion[];
  activities: ConciergeActivity[];
  seeded: boolean;
};

const globalKey = "__haxrConciergePortalMemoryRepo__";

function getEventStores(): Map<string, EventStore> {
  const g = globalThis as typeof globalThis & {
    [globalKey]?: Map<string, EventStore>;
  };
  if (!g[globalKey]) {
    g[globalKey] = new Map();
  }
  return g[globalKey];
}

function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function getStore(eventId: string): EventStore {
  const stores = getEventStores();
  let store = stores.get(eventId);
  if (!store) {
    store = { items: new Map(), classifications: [], suggestions: [], activities: [], seeded: false };
    stores.set(eventId, store);
  }
  return store;
}

function seedIfNeeded(eventId: string, store: EventStore): void {
  if (store.seeded) return;
  const initial = createInitialConciergeModuleData(eventId);
  for (const item of initial.inboxItems) {
    store.items.set(item.id, structuredClone(item));
  }
  store.classifications = structuredClone(initial.classifications);
  store.suggestions = structuredClone(initial.suggestions);
  store.activities = structuredClone(initial.activities);
  store.seeded = true;
}

export class InMemoryConciergePortalRepository implements ConciergePortalRepository {
  readonly mode = "memory" as const;

  async listItems(eventId: string): Promise<ConciergeInboxItem[]> {
    const store = getStore(eventId);
    seedIfNeeded(eventId, store);
    return [...store.items.values()].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getItem(itemId: string): Promise<ConciergeInboxItem | null> {
    for (const store of getEventStores().values()) {
      const item = store.items.get(itemId);
      if (item) return structuredClone(item);
    }
    return null;
  }

  async createItem(input: CreatePortalItemInput): Promise<ConciergeInboxItem> {
    const store = getStore(input.eventId);
    seedIfNeeded(input.eventId, store);
    const now = new Date().toISOString();
    const item: ConciergeInboxItem = {
      id: createId(),
      eventId: input.eventId,
      title: input.title,
      description: input.description ?? input.manualText ?? "",
      type: input.type,
      status: input.status,
      priority: input.priority ?? "media",
      source: input.source,
      uploadedBy: input.uploadedBy,
      createdAt: now,
      updatedAt: now,
      fileName: input.file?.fileName,
      fileUrl: input.fileUrl,
      storagePath: input.storagePath,
      mimeType: input.file?.mimeType,
      sizeBytes: input.file?.sizeBytes,
      originalEmailFrom: input.email?.from,
      originalEmailSubject: input.email?.subject,
      originalEmailReceivedAt: input.email?.receivedAt,
      clippedUrl: input.url,
      clippedTitle: input.clippedTitle,
      clippedDescription: input.description,
      extractedText: input.extractedText ?? input.manualText ?? input.description,
      suggestedDestination: input.suggestedDestination,
      confidence: input.confidence,
      classificationReason: input.classificationReason,
      notes: input.notes,
    };
    store.items.set(item.id, item);
    return structuredClone(item);
  }

  async updateItem(itemId: string, patch: Partial<ConciergeInboxItem>): Promise<ConciergeInboxItem> {
    const existing = await this.getItem(itemId);
    if (!existing) throw new Error("Item não encontrado.");
    const store = getStore(existing.eventId);
    const updated = {
      ...existing,
      ...patch,
      id: itemId,
      eventId: existing.eventId,
      updatedAt: new Date().toISOString(),
    };
    store.items.set(itemId, updated);
    return structuredClone(updated);
  }

  async listClassifications(eventId: string): Promise<ConciergeClassification[]> {
    const store = getStore(eventId);
    seedIfNeeded(eventId, store);
    return structuredClone(store.classifications);
  }

  async createClassification(input: CreateClassificationInput): Promise<ConciergeClassification> {
    const item = await this.getItem(input.itemId);
    if (!item) throw new Error("Item não encontrado.");
    const store = getStore(item.eventId);
    const record: ConciergeClassification = {
      ...input.classification,
      itemId: input.itemId,
      createdAt: new Date().toISOString(),
    };
    store.classifications = [
      record,
      ...store.classifications.filter((c) => c.itemId !== input.itemId),
    ];
    return structuredClone(record);
  }

  async listSuggestions(eventId: string): Promise<ConciergeSuggestion[]> {
    const store = getStore(eventId);
    seedIfNeeded(eventId, store);
    return structuredClone(store.suggestions);
  }

  async createSuggestion(input: CreateSuggestionInput): Promise<ConciergeSuggestion> {
    const item = await this.getItem(input.itemId);
    if (!item) throw new Error("Item não encontrado.");
    const store = getStore(item.eventId);
    const record: ConciergeSuggestion = {
      id: createId(),
      itemId: input.itemId,
      status: input.suggestion.status ?? "pendente",
      ...input.suggestion,
    };
    store.suggestions.unshift(record);
    return structuredClone(record);
  }

  async updateSuggestion(
    suggestionId: string,
    patch: Partial<Pick<ConciergeSuggestion, "status">>
  ): Promise<ConciergeSuggestion> {
    for (const store of getEventStores().values()) {
      const idx = store.suggestions.findIndex((s) => s.id === suggestionId);
      if (idx >= 0) {
        store.suggestions[idx] = { ...store.suggestions[idx], ...patch };
        return structuredClone(store.suggestions[idx]);
      }
    }
    throw new Error("Sugestão não encontrada.");
  }

  async listActivities(eventId: string): Promise<ConciergeActivity[]> {
    const store = getStore(eventId);
    seedIfNeeded(eventId, store);
    return structuredClone(store.activities);
  }

  async createActivity(input: CreateActivityInput): Promise<ConciergeActivity> {
    const store = getStore(input.eventId);
    seedIfNeeded(input.eventId, store);
    const record: ConciergeActivity = {
      id: createId(),
      itemId: input.itemId,
      title: input.title,
      description: input.description,
      type: input.type,
      createdAt: new Date().toISOString(),
      actorName: input.actor?.name ?? "Sistema",
      actorId: input.actor?.id ?? undefined,
      actorRole: input.actor?.role ?? undefined,
    };
    store.activities.unshift(record);
    return structuredClone(record);
  }

  async archiveItem(itemId: string): Promise<ConciergeInboxItem> {
    return this.updateItem(itemId, { status: "arquivado" });
  }

  async rejectItem(itemId: string, _reason?: string): Promise<ConciergeInboxItem> {
    return this.updateItem(itemId, { status: "rejeitado" });
  }

  async validateItem(itemId: string): Promise<ConciergeInboxItem> {
    return this.updateItem(itemId, { status: "validado" });
  }

  async markItemRouted(
    itemId: string,
    destination: ConciergeDestination,
    routingResult: ConciergeRoutingResult
  ): Promise<ConciergeInboxItem> {
    return this.updateItem(itemId, {
      status: "enviado_para_modulo",
      linkedModule: destination,
      linkedRecordId: routingResult.linkedRecordId,
    });
  }
}
