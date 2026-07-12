import type {
  ConciergeActivity,
  ConciergeClassification,
  ConciergeInboxItem,
  ConciergeSuggestion,
} from "./types";

export type PortalItemRow = {
  id: string;
  event_id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  priority: string;
  source: string;
  uploaded_by: string;
  file_name: string | null;
  file_url: string | null;
  storage_path: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  original_email_from: string | null;
  original_email_subject: string | null;
  original_email_received_at: string | null;
  clipped_url: string | null;
  clipped_title: string | null;
  clipped_description: string | null;
  extracted_text: string | null;
  extracted_data: Record<string, unknown> | null;
  suggested_destination: string | null;
  confidence: number | null;
  linked_module: string | null;
  linked_record_id: string | null;
  notes: string | null;
  classification_reason: string | null;
  created_at: string;
  updated_at: string;
};

export function mapPortalItemRow(row: PortalItemRow): ConciergeInboxItem {
  return {
    id: row.id,
    eventId: row.event_id,
    title: row.title,
    description: row.description,
    type: row.type as ConciergeInboxItem["type"],
    status: row.status as ConciergeInboxItem["status"],
    priority: row.priority as ConciergeInboxItem["priority"],
    source: row.source as ConciergeInboxItem["source"],
    uploadedBy: row.uploaded_by,
    fileName: row.file_name ?? undefined,
    fileUrl: row.file_url ?? undefined,
    storagePath: row.storage_path ?? undefined,
    mimeType: row.mime_type ?? undefined,
    sizeBytes: row.size_bytes ?? undefined,
    originalEmailFrom: row.original_email_from ?? undefined,
    originalEmailSubject: row.original_email_subject ?? undefined,
    originalEmailReceivedAt: row.original_email_received_at ?? undefined,
    clippedUrl: row.clipped_url ?? undefined,
    clippedTitle: row.clipped_title ?? undefined,
    clippedDescription: row.clipped_description ?? undefined,
    extractedText: row.extracted_text ?? undefined,
    extractedData: row.extracted_data ?? undefined,
    suggestedDestination: (row.suggested_destination as ConciergeInboxItem["suggestedDestination"]) ?? undefined,
    confidence: row.confidence ?? undefined,
    linkedModule: (row.linked_module as ConciergeInboxItem["linkedModule"]) ?? undefined,
    linkedRecordId: row.linked_record_id ?? undefined,
    notes: row.notes ?? undefined,
    classificationReason: row.classification_reason ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapItemToPortalRow(
  item: Partial<ConciergeInboxItem> & { eventId: string; title: string }
): Record<string, unknown> {
  return {
    event_id: item.eventId,
    title: item.title,
    description: item.description ?? "",
    type: item.type ?? "outro",
    status: item.status ?? "novo",
    priority: item.priority ?? "media",
    source: item.source ?? "upload",
    uploaded_by: item.uploadedBy ?? "",
    file_name: item.fileName ?? null,
    file_url: item.fileUrl ?? null,
    storage_path: item.storagePath ?? null,
    mime_type: item.mimeType ?? null,
    size_bytes: item.sizeBytes ?? null,
    original_email_from: item.originalEmailFrom ?? null,
    original_email_subject: item.originalEmailSubject ?? null,
    original_email_received_at: item.originalEmailReceivedAt ?? null,
    clipped_url: item.clippedUrl ?? null,
    clipped_title: item.clippedTitle ?? null,
    clipped_description: item.clippedDescription ?? null,
    extracted_text: item.extractedText ?? null,
    extracted_data: item.extractedData ?? {},
    suggested_destination: item.suggestedDestination ?? null,
    confidence: item.confidence ?? null,
    linked_module: item.linkedModule ?? null,
    linked_record_id: item.linkedRecordId ?? null,
    notes: item.notes ?? null,
    classification_reason: item.classificationReason ?? null,
  };
}

export type PortalClassificationRow = {
  id: string;
  item_id: string;
  detected_type: string;
  suggested_destination: string;
  confidence: number;
  extracted_fields: Record<string, unknown>;
  reason: string;
  engine: string;
  summary: Record<string, unknown> | null;
  created_at: string;
};

export function mapPortalClassificationRow(row: PortalClassificationRow): ConciergeClassification {
  return {
    itemId: row.item_id,
    detectedType: row.detected_type as ConciergeClassification["detectedType"],
    suggestedDestination: row.suggested_destination as ConciergeClassification["suggestedDestination"],
    confidence: Number(row.confidence),
    extractedFields: row.extracted_fields ?? {},
    reason: row.reason,
    createdAt: row.created_at,
    provider: row.engine === "gemini" ? "gemini" : "rule_based",
    summary: row.summary ? (row.summary as unknown as ConciergeClassification["summary"]) : undefined,
  };
}

export type PortalSuggestionRow = {
  id: string;
  item_id: string;
  title: string;
  description: string;
  action_type: string;
  destination: string;
  payload: Record<string, unknown>;
  confidence: number;
  status: string;
  created_at: string;
  updated_at: string;
};

export function mapPortalSuggestionRow(row: PortalSuggestionRow): ConciergeSuggestion {
  return {
    id: row.id,
    itemId: row.item_id,
    title: row.title,
    description: row.description,
    actionType: row.action_type as ConciergeSuggestion["actionType"],
    destination: row.destination as ConciergeSuggestion["destination"],
    payload: row.payload ?? {},
    confidence: Number(row.confidence),
    status: row.status as ConciergeSuggestion["status"],
  };
}

export type PortalActivityRow = {
  id: string;
  item_id: string | null;
  event_id: string;
  title: string;
  description: string;
  type: string;
  actor_id: string | null;
  actor_name: string | null;
  actor_role: string | null;
  created_at: string;
};

export function mapPortalActivityRow(row: PortalActivityRow): ConciergeActivity {
  return {
    id: row.id,
    itemId: row.item_id ?? undefined,
    title: row.title,
    description: row.description,
    type: row.type as ConciergeActivity["type"],
    createdAt: row.created_at,
    actorName: row.actor_name ?? "Sistema",
    actorId: row.actor_id ?? undefined,
    actorRole: row.actor_role ?? undefined,
  };
}
