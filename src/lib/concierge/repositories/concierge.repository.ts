import { createAdminClient } from "@/lib/supabase/server";
import type {
  ConciergeReviewItem,
  ConciergeReviewStatus,
  ConciergeUpload,
  EventVendor,
  EventChecklistItem,
  EventMoodboardItem,
  ConciergeDocType,
} from "@/lib/concierge/types";

type UploadRow = {
  id: string;
  event_id: string;
  file_name: string;
  storage_path: string;
  mime_type: string;
  file_size: number;
  status: ConciergeReviewStatus;
  extracted_text: string;
  error_message: string;
  created_at: string;
  updated_at: string;
};

type ReviewItemRow = {
  id: string;
  upload_id: string;
  event_id: string;
  document_type: ConciergeDocType;
  status: ConciergeReviewStatus;
  extracted_data: Record<string, unknown>;
  final_data: Record<string, unknown> | null;
  ai_model: string;
  ai_raw_response: string;
  reviewed_by: string;
  reviewed_at: string | null;
  applied_at: string | null;
  apply_error: string;
  created_at: string;
  updated_at: string;
};

function mapUpload(row: UploadRow): ConciergeUpload {
  return {
    id: row.id,
    eventId: row.event_id,
    fileName: row.file_name,
    storagePath: row.storage_path,
    mimeType: row.mime_type,
    fileSize: row.file_size,
    status: row.status,
    extractedText: row.extracted_text,
    errorMessage: row.error_message,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapReview(
  row: ReviewItemRow & { concierge_uploads?: UploadRow | null }
): ConciergeReviewItem {
  const upload = row.concierge_uploads;
  return {
    id: row.id,
    uploadId: row.upload_id,
    eventId: row.event_id,
    documentType: row.document_type,
    status: row.status,
    extractedData: row.extracted_data ?? {},
    finalData: row.final_data,
    aiModel: row.ai_model,
    aiRawResponse: row.ai_raw_response,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    appliedAt: row.applied_at,
    applyError: row.apply_error,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    upload: upload
      ? {
          fileName: upload.file_name,
          mimeType: upload.mime_type,
          storagePath: upload.storage_path,
        }
      : undefined,
  };
}

export async function createUploadRecord(input: {
  eventId: string;
  fileName: string;
  storagePath: string;
  mimeType: string;
  fileSize: number;
}): Promise<ConciergeUpload> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("concierge_uploads")
    .insert({
      event_id: input.eventId,
      file_name: input.fileName,
      storage_path: input.storagePath,
      mime_type: input.mimeType,
      file_size: input.fileSize,
      status: "uploaded",
    } as never)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return mapUpload(data as UploadRow);
}

export async function updateUpload(
  id: string,
  patch: Partial<{
    status: ConciergeReviewStatus;
    extracted_text: string;
    error_message: string;
  }>
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("concierge_uploads")
    .update(patch as never)
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function createReviewItem(input: {
  uploadId: string;
  eventId: string;
  documentType: ConciergeDocType;
  extractedData: Record<string, unknown>;
  aiModel: string;
  aiRawResponse: string;
}): Promise<ConciergeReviewItem> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("concierge_review_items")
    .insert({
      upload_id: input.uploadId,
      event_id: input.eventId,
      document_type: input.documentType,
      status: "pending_review",
      extracted_data: input.extractedData,
      ai_model: input.aiModel,
      ai_raw_response: input.aiRawResponse,
    } as never)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return mapReview(data as ReviewItemRow);
}

export async function listReviewItemsByEvent(
  eventId: string,
  status?: ConciergeReviewStatus
): Promise<ConciergeReviewItem[]> {
  const supabase = createAdminClient();
  let query = supabase
    .from("concierge_review_items")
    .select("*, concierge_uploads(file_name, mime_type, storage_path)")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data as Array<ReviewItemRow & { concierge_uploads: UploadRow | null }>).map(
    (row) => mapReview(row)
  );
}

export async function getReviewItemById(
  id: string
): Promise<ConciergeReviewItem | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("concierge_review_items")
    .select("*, concierge_uploads(file_name, mime_type, storage_path)")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapReview(data as ReviewItemRow & { concierge_uploads: UploadRow | null });
}

export async function updateReviewItem(
  id: string,
  patch: Partial<{
    status: ConciergeReviewStatus;
    final_data: Record<string, unknown>;
    reviewed_by: string;
    reviewed_at: string;
    applied_at: string;
    apply_error: string;
  }>
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("concierge_review_items")
    .update(patch as never)
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function logAiAudit(input: {
  eventId: string;
  uploadId?: string;
  reviewId?: string;
  action: string;
  model: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const supabase = createAdminClient();
  await supabase.from("concierge_ai_audit_logs").insert({
    event_id: input.eventId,
    upload_id: input.uploadId ?? null,
    review_id: input.reviewId ?? null,
    action: input.action,
    model: input.model,
    metadata: input.metadata ?? {},
  } as never);
}

export async function listEventVendors(eventId: string): Promise<EventVendor[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("event_vendors")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data as Array<{
    id: string;
    event_id: string;
    name: string;
    service_category: string;
    contact_email: string;
    contact_phone: string;
    proposed_amount: number | null;
    currency: string;
    payment_terms: string;
    deadline: string | null;
    notes: string;
    status: string;
    source_review_id: string | null;
    created_at: string;
  }>).map((row) => ({
    id: row.id,
    eventId: row.event_id,
    name: row.name,
    serviceCategory: row.service_category,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    proposedAmount: row.proposed_amount,
    currency: row.currency,
    paymentTerms: row.payment_terms,
    deadline: row.deadline,
    notes: row.notes,
    status: row.status,
    sourceReviewId: row.source_review_id,
    createdAt: row.created_at,
  }));
}

export async function insertEventVendor(input: {
  eventId: string;
  name: string;
  serviceCategory: string;
  contactEmail: string;
  contactPhone: string;
  proposedAmount: number | null;
  currency: string;
  paymentTerms: string;
  deadline: string | null;
  notes: string;
  sourceReviewId: string;
}): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("event_vendors").insert({
    event_id: input.eventId,
    name: input.name,
    service_category: input.serviceCategory,
    contact_email: input.contactEmail,
    contact_phone: input.contactPhone,
    proposed_amount: input.proposedAmount,
    currency: input.currency,
    payment_terms: input.paymentTerms,
    deadline: input.deadline,
    notes: input.notes,
    status: "em_analise",
    source_review_id: input.sourceReviewId,
  } as never);
  if (error) throw new Error(error.message);
}

export async function insertChecklistItems(
  eventId: string,
  items: Array<{ title: string; dueDate: string | null; priority: string }>,
  sourceReviewId: string
): Promise<void> {
  if (!items.length) return;
  const supabase = createAdminClient();
  const { error } = await supabase.from("event_checklist_items").insert(
    items.map((item) => ({
      event_id: eventId,
      title: item.title,
      due_date: item.dueDate,
      priority: item.priority,
      status: "pending",
      source_review_id: sourceReviewId,
    })) as never
  );
  if (error) throw new Error(error.message);
}

export async function listEventChecklistItems(
  eventId: string
): Promise<EventChecklistItem[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("event_checklist_items")
    .select("*")
    .eq("event_id", eventId)
    .order("due_date", { ascending: true, nullsFirst: false });

  if (error) throw new Error(error.message);

  return (data as Array<{
    id: string;
    event_id: string;
    title: string;
    due_date: string | null;
    priority: string;
    status: string;
    source_review_id: string | null;
    created_at: string;
  }>).map((row) => ({
    id: row.id,
    eventId: row.event_id,
    title: row.title,
    dueDate: row.due_date,
    priority: row.priority,
    status: row.status,
    sourceReviewId: row.source_review_id,
    createdAt: row.created_at,
  }));
}

export async function listEventMoodboardItems(
  eventId: string
): Promise<EventMoodboardItem[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("event_moodboard_items")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data as Array<{
    id: string;
    event_id: string;
    title: string;
    category: string;
    tags: string[];
    storage_path: string;
    notes: string;
    source_review_id: string | null;
    created_at: string;
  }>).map((row) => ({
    id: row.id,
    eventId: row.event_id,
    title: row.title,
    category: row.category,
    tags: row.tags ?? [],
    storagePath: row.storage_path,
    notes: row.notes,
    sourceReviewId: row.source_review_id,
    createdAt: row.created_at,
  }));
}

export async function insertMoodboardItem(input: {
  eventId: string;
  title: string;
  category: string;
  tags: string[];
  storagePath: string;
  notes: string;
  sourceReviewId: string;
}): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("event_moodboard_items").insert({
    event_id: input.eventId,
    title: input.title,
    category: input.category,
    tags: input.tags,
    storage_path: input.storagePath,
    notes: input.notes,
    source_review_id: input.sourceReviewId,
  } as never);
  if (error) throw new Error(error.message);
}

export async function countPendingConciergeReviews(): Promise<number> {
  const supabase = createAdminClient();
  const { count, error } = await supabase
    .from("concierge_review_items")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending_review");

  if (error) {
    if (error.message.includes("does not exist")) return 0;
    throw new Error(error.message);
  }
  return count ?? 0;
}
