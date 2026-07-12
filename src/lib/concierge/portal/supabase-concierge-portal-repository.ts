import { createAdminClient } from "@/lib/supabase/server";
import type {
  ConciergePortalRepository,
  CreateActivityInput,
  CreateClassificationInput,
  CreatePortalItemInput,
  CreateSuggestionInput,
} from "./concierge-portal-repository";
import {
  mapItemToPortalRow,
  mapPortalActivityRow,
  mapPortalClassificationRow,
  mapPortalItemRow,
  mapPortalSuggestionRow,
  type PortalActivityRow,
  type PortalClassificationRow,
  type PortalItemRow,
  type PortalSuggestionRow,
} from "./portal-row-mappers";
import type {
  ConciergeActivity,
  ConciergeClassification,
  ConciergeDestination,
  ConciergeInboxItem,
  ConciergeRoutingResult,
  ConciergeSuggestion,
} from "./types";

export class SupabaseConciergePortalRepository implements ConciergePortalRepository {
  readonly mode = "supabase" as const;

  private client() {
    return createAdminClient();
  }

  async listItems(eventId: string): Promise<ConciergeInboxItem[]> {
    const { data, error } = await this.client()
      .from("concierge_portal_items")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data as PortalItemRow[]).map(mapPortalItemRow);
  }

  async getItem(itemId: string): Promise<ConciergeInboxItem | null> {
    const { data, error } = await this.client()
      .from("concierge_portal_items")
      .select("*")
      .eq("id", itemId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return mapPortalItemRow(data as PortalItemRow);
  }

  async createItem(input: CreatePortalItemInput): Promise<ConciergeInboxItem> {
    const row = mapItemToPortalRow({
      eventId: input.eventId,
      title: input.title,
      description: input.description ?? input.manualText ?? "",
      type: input.type,
      status: input.status,
      priority: input.priority ?? "media",
      source: input.source,
      uploadedBy: input.uploadedBy,
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
    });

    const { data, error } = await this.client()
      .from("concierge_portal_items")
      .insert(row as never)
      .select("*")
      .single();
    if (error) throw error;
    return mapPortalItemRow(data as PortalItemRow);
  }

  async updateItem(itemId: string, patch: Partial<ConciergeInboxItem>): Promise<ConciergeInboxItem> {
    const existing = await this.getItem(itemId);
    if (!existing) throw new Error("Item não encontrado.");

    const merged = { ...existing, ...patch };
    const row = mapItemToPortalRow(merged);
    delete (row as { event_id?: string }).event_id;

    const { data, error } = await this.client()
      .from("concierge_portal_items")
      .update(row as never)
      .eq("id", itemId)
      .select("*")
      .single();
    if (error) throw error;
    return mapPortalItemRow(data as PortalItemRow);
  }

  async listClassifications(eventId: string): Promise<ConciergeClassification[]> {
    const items = await this.listItems(eventId);
    const itemIds = items.map((i) => i.id);
    if (itemIds.length === 0) return [];

    const { data, error } = await this.client()
      .from("concierge_portal_classifications")
      .select("*")
      .in("item_id", itemIds)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data as PortalClassificationRow[]).map(mapPortalClassificationRow);
  }

  async createClassification(input: CreateClassificationInput): Promise<ConciergeClassification> {
    const { data, error } = await this.client()
      .from("concierge_portal_classifications")
      .insert({
        item_id: input.itemId,
        detected_type: input.classification.detectedType,
        suggested_destination: input.classification.suggestedDestination,
        confidence: input.classification.confidence,
        extracted_fields: input.classification.extractedFields,
        reason: input.classification.reason,
        engine: input.classification.provider ?? "rule_based",
        summary: input.classification.summary ?? null,
      } as never)
      .select("*")
      .single();
    if (error) throw error;
    return mapPortalClassificationRow(data as PortalClassificationRow);
  }

  async listSuggestions(eventId: string): Promise<ConciergeSuggestion[]> {
    const items = await this.listItems(eventId);
    const itemIds = items.map((i) => i.id);
    if (itemIds.length === 0) return [];

    const { data, error } = await this.client()
      .from("concierge_portal_suggestions")
      .select("*")
      .in("item_id", itemIds)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data as PortalSuggestionRow[]).map(mapPortalSuggestionRow);
  }

  async createSuggestion(input: CreateSuggestionInput): Promise<ConciergeSuggestion> {
    const { data, error } = await this.client()
      .from("concierge_portal_suggestions")
      .insert({
        item_id: input.itemId,
        title: input.suggestion.title,
        description: input.suggestion.description,
        action_type: input.suggestion.actionType,
        destination: input.suggestion.destination,
        payload: input.suggestion.payload,
        confidence: input.suggestion.confidence,
        status: input.suggestion.status ?? "pendente",
      } as never)
      .select("*")
      .single();
    if (error) throw error;
    return mapPortalSuggestionRow(data as PortalSuggestionRow);
  }

  async updateSuggestion(
    suggestionId: string,
    patch: Partial<Pick<ConciergeSuggestion, "status">>
  ): Promise<ConciergeSuggestion> {
    const { data, error } = await this.client()
      .from("concierge_portal_suggestions")
      .update(patch as never)
      .eq("id", suggestionId)
      .select("*")
      .single();
    if (error) throw error;
    return mapPortalSuggestionRow(data as PortalSuggestionRow);
  }

  async listActivities(eventId: string): Promise<ConciergeActivity[]> {
    const { data, error } = await this.client()
      .from("concierge_portal_activities")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data as PortalActivityRow[]).map(mapPortalActivityRow);
  }

  async createActivity(input: CreateActivityInput): Promise<ConciergeActivity> {
    const { data, error } = await this.client()
      .from("concierge_portal_activities")
      .insert({
        event_id: input.eventId,
        item_id: input.itemId ?? null,
        title: input.title,
        description: input.description,
        type: input.type,
        actor_id: input.actor?.id ?? null,
        actor_name: input.actor?.name ?? "Sistema",
        actor_role: input.actor?.role ?? null,
      } as never)
      .select("*")
      .single();
    if (error) throw error;
    return mapPortalActivityRow(data as PortalActivityRow);
  }

  async archiveItem(itemId: string): Promise<ConciergeInboxItem> {
    return this.updateItem(itemId, { status: "arquivado" });
  }

  async rejectItem(itemId: string, reason?: string): Promise<ConciergeInboxItem> {
    const patch: Partial<ConciergeInboxItem> = { status: "rejeitado" };
    if (reason) patch.notes = reason;
    return this.updateItem(itemId, patch);
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
