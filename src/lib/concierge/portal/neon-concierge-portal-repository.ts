import { neonQuery } from "@/lib/neon/server-db";
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

type NeonPortalItemRow = Omit<PortalItemRow, "size_bytes" | "confidence"> & {
  size_bytes: number | string | null;
  confidence: number | string | null;
};

type NeonPortalClassificationRow = Omit<PortalClassificationRow, "confidence"> & {
  confidence: number | string;
};

type NeonPortalSuggestionRow = Omit<PortalSuggestionRow, "confidence"> & {
  confidence: number | string;
};

function normalizeItemRow(row: NeonPortalItemRow): PortalItemRow {
  return {
    ...row,
    size_bytes: row.size_bytes == null ? null : Number(row.size_bytes),
    confidence: row.confidence == null ? null : Number(row.confidence),
  };
}

function normalizeClassificationRow(
  row: NeonPortalClassificationRow,
): PortalClassificationRow {
  return { ...row, confidence: Number(row.confidence) };
}

function normalizeSuggestionRow(row: NeonPortalSuggestionRow): PortalSuggestionRow {
  return { ...row, confidence: Number(row.confidence) };
}

function itemValues(row: Record<string, unknown>): unknown[] {
  return [
    row.event_id,
    row.title,
    row.description,
    row.type,
    row.status,
    row.priority,
    row.source,
    row.uploaded_by,
    row.file_name,
    row.file_url,
    row.storage_path,
    row.mime_type,
    row.size_bytes,
    row.original_email_from,
    row.original_email_subject,
    row.original_email_received_at,
    row.clipped_url,
    row.clipped_title,
    row.clipped_description,
    row.extracted_text,
    row.extracted_data,
    row.suggested_destination,
    row.confidence,
    row.linked_module,
    row.linked_record_id,
    row.notes,
    row.classification_reason,
  ];
}

const ITEM_COLUMNS = `
  event_id,
  title,
  description,
  type,
  status,
  priority,
  source,
  uploaded_by,
  file_name,
  file_url,
  storage_path,
  mime_type,
  size_bytes,
  original_email_from,
  original_email_subject,
  original_email_received_at,
  clipped_url,
  clipped_title,
  clipped_description,
  extracted_text,
  extracted_data,
  suggested_destination,
  confidence,
  linked_module,
  linked_record_id,
  notes,
  classification_reason
`;

export class NeonConciergePortalRepository implements ConciergePortalRepository {
  readonly mode = "neon" as const;

  async listItems(eventId: string): Promise<ConciergeInboxItem[]> {
    const result = await neonQuery<NeonPortalItemRow>(
      `SELECT *
       FROM public.concierge_portal_items
       WHERE event_id = $1
       ORDER BY created_at DESC`,
      [eventId],
    );
    return result.rows.map((row) => mapPortalItemRow(normalizeItemRow(row)));
  }

  async getItem(itemId: string): Promise<ConciergeInboxItem | null> {
    const result = await neonQuery<NeonPortalItemRow>(
      `SELECT *
       FROM public.concierge_portal_items
       WHERE id = $1::uuid
       LIMIT 1`,
      [itemId],
    );
    const row = result.rows[0];
    return row ? mapPortalItemRow(normalizeItemRow(row)) : null;
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

    const result = await neonQuery<NeonPortalItemRow>(
      `INSERT INTO public.concierge_portal_items (${ITEM_COLUMNS})
       VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
         $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
         $21::jsonb, $22, $23, $24, $25, $26, $27
       )
       RETURNING *`,
      itemValues(row),
    );

    return mapPortalItemRow(normalizeItemRow(result.rows[0]!));
  }

  async updateItem(
    itemId: string,
    patch: Partial<ConciergeInboxItem>,
  ): Promise<ConciergeInboxItem> {
    const existing = await this.getItem(itemId);
    if (!existing) throw new Error("Item não encontrado.");

    const merged = { ...existing, ...patch };
    const row = mapItemToPortalRow(merged);
    const values = itemValues(row).slice(1);

    const result = await neonQuery<NeonPortalItemRow>(
      `UPDATE public.concierge_portal_items
       SET
         title = $1,
         description = $2,
         type = $3,
         status = $4,
         priority = $5,
         source = $6,
         uploaded_by = $7,
         file_name = $8,
         file_url = $9,
         storage_path = $10,
         mime_type = $11,
         size_bytes = $12,
         original_email_from = $13,
         original_email_subject = $14,
         original_email_received_at = $15,
         clipped_url = $16,
         clipped_title = $17,
         clipped_description = $18,
         extracted_text = $19,
         extracted_data = $20::jsonb,
         suggested_destination = $21,
         confidence = $22,
         linked_module = $23,
         linked_record_id = $24,
         notes = $25,
         classification_reason = $26
       WHERE id = $27::uuid
       RETURNING *`,
      [...values, itemId],
    );

    const updated = result.rows[0];
    if (!updated) throw new Error("Item não encontrado.");
    return mapPortalItemRow(normalizeItemRow(updated));
  }

  async listClassifications(eventId: string): Promise<ConciergeClassification[]> {
    const result = await neonQuery<NeonPortalClassificationRow>(
      `SELECT c.*
       FROM public.concierge_portal_classifications c
       INNER JOIN public.concierge_portal_items i ON i.id = c.item_id
       WHERE i.event_id = $1
       ORDER BY c.created_at DESC`,
      [eventId],
    );
    return result.rows.map((row) =>
      mapPortalClassificationRow(normalizeClassificationRow(row)),
    );
  }

  async createClassification(
    input: CreateClassificationInput,
  ): Promise<ConciergeClassification> {
    const result = await neonQuery<NeonPortalClassificationRow>(
      `INSERT INTO public.concierge_portal_classifications (
         item_id,
         detected_type,
         suggested_destination,
         confidence,
         extracted_fields,
         reason,
         engine,
         summary
       )
       VALUES ($1::uuid, $2, $3, $4, $5::jsonb, $6, $7, $8::jsonb)
       RETURNING *`,
      [
        input.itemId,
        input.classification.detectedType,
        input.classification.suggestedDestination,
        input.classification.confidence,
        input.classification.extractedFields,
        input.classification.reason,
        input.classification.provider ?? "rule_based",
        input.classification.summary ?? null,
      ],
    );
    return mapPortalClassificationRow(normalizeClassificationRow(result.rows[0]!));
  }

  async listSuggestions(eventId: string): Promise<ConciergeSuggestion[]> {
    const result = await neonQuery<NeonPortalSuggestionRow>(
      `SELECT s.*
       FROM public.concierge_portal_suggestions s
       INNER JOIN public.concierge_portal_items i ON i.id = s.item_id
       WHERE i.event_id = $1
       ORDER BY s.created_at DESC`,
      [eventId],
    );
    return result.rows.map((row) => mapPortalSuggestionRow(normalizeSuggestionRow(row)));
  }

  async createSuggestion(input: CreateSuggestionInput): Promise<ConciergeSuggestion> {
    const result = await neonQuery<NeonPortalSuggestionRow>(
      `INSERT INTO public.concierge_portal_suggestions (
         item_id,
         title,
         description,
         action_type,
         destination,
         payload,
         confidence,
         status
       )
       VALUES ($1::uuid, $2, $3, $4, $5, $6::jsonb, $7, $8)
       RETURNING *`,
      [
        input.itemId,
        input.suggestion.title,
        input.suggestion.description,
        input.suggestion.actionType,
        input.suggestion.destination,
        input.suggestion.payload,
        input.suggestion.confidence,
        input.suggestion.status ?? "pendente",
      ],
    );
    return mapPortalSuggestionRow(normalizeSuggestionRow(result.rows[0]!));
  }

  async updateSuggestion(
    suggestionId: string,
    patch: Partial<Pick<ConciergeSuggestion, "status">>,
  ): Promise<ConciergeSuggestion> {
    const result = patch.status
      ? await neonQuery<NeonPortalSuggestionRow>(
          `UPDATE public.concierge_portal_suggestions
           SET status = $1
           WHERE id = $2::uuid
           RETURNING *`,
          [patch.status, suggestionId],
        )
      : await neonQuery<NeonPortalSuggestionRow>(
          `SELECT *
           FROM public.concierge_portal_suggestions
           WHERE id = $1::uuid
           LIMIT 1`,
          [suggestionId],
        );

    const row = result.rows[0];
    if (!row) throw new Error("Sugestão não encontrada.");
    return mapPortalSuggestionRow(normalizeSuggestionRow(row));
  }

  async listActivities(eventId: string): Promise<ConciergeActivity[]> {
    const result = await neonQuery<PortalActivityRow>(
      `SELECT *
       FROM public.concierge_portal_activities
       WHERE event_id = $1
       ORDER BY created_at DESC`,
      [eventId],
    );
    return result.rows.map(mapPortalActivityRow);
  }

  async createActivity(input: CreateActivityInput): Promise<ConciergeActivity> {
    const result = await neonQuery<PortalActivityRow>(
      `INSERT INTO public.concierge_portal_activities (
         event_id,
         item_id,
         title,
         description,
         type,
         actor_id,
         actor_name,
         actor_role
       )
       VALUES ($1, $2::uuid, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        input.eventId,
        input.itemId ?? null,
        input.title,
        input.description,
        input.type,
        input.actor?.id ?? null,
        input.actor?.name ?? "Sistema",
        input.actor?.role ?? null,
      ],
    );
    return mapPortalActivityRow(result.rows[0]!);
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
    routingResult: ConciergeRoutingResult,
  ): Promise<ConciergeInboxItem> {
    return this.updateItem(itemId, {
      status: "enviado_para_modulo",
      linkedModule: destination,
      linkedRecordId: routingResult.linkedRecordId,
    });
  }
}
