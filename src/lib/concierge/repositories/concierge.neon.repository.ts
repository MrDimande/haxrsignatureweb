import { neonQuery, withNeonTransaction } from "@/lib/neon/server-db";
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

type NeonJsonRow = { row: unknown };
type NeonCountRow = { count: number | string };
type NeonEventCountRow = { event_id: string; count: number | string };

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
  row: ReviewItemRow & { concierge_uploads?: UploadRow | null },
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

function isMissingTableError(cause: unknown): boolean {
  return Boolean(
    cause &&
      typeof cause === "object" &&
      "code" in cause &&
      (cause as { code?: string }).code === "42P01",
  );
}

export async function createUploadRecord(input: {
  eventId: string;
  fileName: string;
  storagePath: string;
  mimeType: string;
  fileSize: number;
}): Promise<ConciergeUpload> {
  const result = await neonQuery<NeonJsonRow>(
    `WITH inserted AS (
       INSERT INTO public.concierge_uploads (
         event_id, file_name, storage_path, mime_type, file_size, status
       )
       VALUES ($1::uuid, $2, $3, $4, $5, 'uploaded'::public.concierge_review_status)
       RETURNING *
     )
     SELECT to_jsonb(inserted) AS row FROM inserted`,
    [input.eventId, input.fileName, input.storagePath, input.mimeType, input.fileSize],
  );

  return mapUpload(result.rows[0]!.row as UploadRow);
}

export async function updateUpload(
  id: string,
  patch: Partial<{
    status: ConciergeReviewStatus;
    extracted_text: string;
    error_message: string;
  }>,
): Promise<void> {
  const assignments: string[] = [];
  const values: unknown[] = [];

  if (patch.status !== undefined) {
    values.push(patch.status);
    assignments.push(`status = $${values.length}::public.concierge_review_status`);
  }
  if (patch.extracted_text !== undefined) {
    values.push(patch.extracted_text);
    assignments.push(`extracted_text = $${values.length}`);
  }
  if (patch.error_message !== undefined) {
    values.push(patch.error_message);
    assignments.push(`error_message = $${values.length}`);
  }
  if (!assignments.length) return;

  values.push(id);
  await neonQuery(
    `UPDATE public.concierge_uploads
     SET ${assignments.join(", ")}
     WHERE id = $${values.length}::uuid`,
    values,
  );
}

export async function createReviewItem(input: {
  uploadId: string;
  eventId: string;
  documentType: ConciergeDocType;
  extractedData: Record<string, unknown>;
  aiModel: string;
  aiRawResponse: string;
}): Promise<ConciergeReviewItem> {
  const result = await neonQuery<NeonJsonRow>(
    `WITH inserted AS (
       INSERT INTO public.concierge_review_items (
         upload_id,
         event_id,
         document_type,
         status,
         extracted_data,
         ai_model,
         ai_raw_response
       )
       VALUES (
         $1::uuid,
         $2::uuid,
         $3::public.concierge_doc_type,
         'pending_review'::public.concierge_review_status,
         $4::jsonb,
         $5,
         $6
       )
       RETURNING *
     )
     SELECT to_jsonb(inserted) AS row FROM inserted`,
    [
      input.uploadId,
      input.eventId,
      input.documentType,
      JSON.stringify(input.extractedData),
      input.aiModel,
      input.aiRawResponse,
    ],
  );

  return mapReview(result.rows[0]!.row as ReviewItemRow);
}

export async function listReviewItemsByEvent(
  eventId: string,
  status?: ConciergeReviewStatus,
): Promise<ConciergeReviewItem[]> {
  const values: unknown[] = [eventId];
  const statusFilter = status
    ? (() => {
        values.push(status);
        return `AND r.status = $2::public.concierge_review_status`;
      })()
    : "";

  const result = await neonQuery<NeonJsonRow>(
    `SELECT
       to_jsonb(r) || jsonb_build_object(
         'concierge_uploads',
         CASE
           WHEN u.id IS NULL THEN NULL
           ELSE jsonb_build_object(
             'file_name', u.file_name,
             'mime_type', u.mime_type,
             'storage_path', u.storage_path
           )
         END
       ) AS row
     FROM public.concierge_review_items r
     LEFT JOIN public.concierge_uploads u ON u.id = r.upload_id
     WHERE r.event_id = $1::uuid
     ${statusFilter}
     ORDER BY r.created_at DESC`,
    values,
  );

  return result.rows.map(({ row }) =>
    mapReview(row as ReviewItemRow & { concierge_uploads: UploadRow | null }),
  );
}

export async function getReviewItemById(
  id: string,
): Promise<ConciergeReviewItem | null> {
  const result = await neonQuery<NeonJsonRow>(
    `SELECT
       to_jsonb(r) || jsonb_build_object(
         'concierge_uploads',
         CASE
           WHEN u.id IS NULL THEN NULL
           ELSE jsonb_build_object(
             'file_name', u.file_name,
             'mime_type', u.mime_type,
             'storage_path', u.storage_path
           )
         END
       ) AS row
     FROM public.concierge_review_items r
     LEFT JOIN public.concierge_uploads u ON u.id = r.upload_id
     WHERE r.id = $1::uuid
     LIMIT 1`,
    [id],
  );

  const row = result.rows[0]?.row;
  return row
    ? mapReview(row as ReviewItemRow & { concierge_uploads: UploadRow | null })
    : null;
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
  }>,
): Promise<void> {
  const assignments: string[] = [];
  const values: unknown[] = [];

  if (patch.status !== undefined) {
    values.push(patch.status);
    assignments.push(`status = $${values.length}::public.concierge_review_status`);
  }
  if (patch.final_data !== undefined) {
    values.push(JSON.stringify(patch.final_data));
    assignments.push(`final_data = $${values.length}::jsonb`);
  }
  if (patch.reviewed_by !== undefined) {
    values.push(patch.reviewed_by);
    assignments.push(`reviewed_by = $${values.length}`);
  }
  if (patch.reviewed_at !== undefined) {
    values.push(patch.reviewed_at);
    assignments.push(`reviewed_at = $${values.length}::timestamptz`);
  }
  if (patch.applied_at !== undefined) {
    values.push(patch.applied_at);
    assignments.push(`applied_at = $${values.length}::timestamptz`);
  }
  if (patch.apply_error !== undefined) {
    values.push(patch.apply_error);
    assignments.push(`apply_error = $${values.length}`);
  }
  if (!assignments.length) return;

  values.push(id);
  await neonQuery(
    `UPDATE public.concierge_review_items
     SET ${assignments.join(", ")}
     WHERE id = $${values.length}::uuid`,
    values,
  );
}

export async function logAiAudit(input: {
  eventId: string;
  uploadId?: string;
  reviewId?: string;
  action: string;
  model: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await neonQuery(
      `INSERT INTO public.concierge_ai_audit_logs (
         event_id, upload_id, review_id, action, model, metadata
       )
       VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5, $6::jsonb)`,
      [
        input.eventId,
        input.uploadId ?? null,
        input.reviewId ?? null,
        input.action,
        input.model,
        JSON.stringify(input.metadata ?? {}),
      ],
    );
  } catch (cause) {
    console.warn(
      "[concierge-neon] audit log unavailable",
      cause instanceof Error ? cause.message : "unknown error",
    );
  }
}

export async function listEventVendors(eventId: string): Promise<EventVendor[]> {
  const result = await neonQuery<NeonJsonRow>(
    `SELECT to_jsonb(v) AS row
     FROM public.event_vendors v
     WHERE v.event_id = $1::uuid
     ORDER BY v.created_at DESC`,
    [eventId],
  );

  return result.rows.map(({ row }) => {
    const value = row as {
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
    };
    return {
      id: value.id,
      eventId: value.event_id,
      name: value.name,
      serviceCategory: value.service_category,
      contactEmail: value.contact_email,
      contactPhone: value.contact_phone,
      proposedAmount: value.proposed_amount,
      currency: value.currency,
      paymentTerms: value.payment_terms,
      deadline: value.deadline,
      notes: value.notes,
      status: value.status,
      sourceReviewId: value.source_review_id,
      createdAt: value.created_at,
    };
  });
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
  await neonQuery(
    `INSERT INTO public.event_vendors (
       event_id,
       name,
       service_category,
       contact_email,
       contact_phone,
       proposed_amount,
       currency,
       payment_terms,
       deadline,
       notes,
       status,
       source_review_id
     )
     VALUES (
       $1::uuid, $2, $3, $4, $5, $6::numeric, $7, $8,
       $9::date, $10, 'em_analise', $11::uuid
     )`,
    [
      input.eventId,
      input.name,
      input.serviceCategory,
      input.contactEmail,
      input.contactPhone,
      input.proposedAmount,
      input.currency,
      input.paymentTerms,
      input.deadline,
      input.notes,
      input.sourceReviewId,
    ],
  );
}

export async function insertChecklistItems(
  eventId: string,
  items: Array<{ title: string; dueDate: string | null; priority: string }>,
  sourceReviewId: string,
): Promise<void> {
  if (!items.length) return;

  await withNeonTransaction(async (client) => {
    for (const item of items) {
      await client.query(
        `INSERT INTO public.event_checklist_items (
           event_id, title, due_date, priority, status, source_review_id
         )
         VALUES ($1::uuid, $2, $3::date, $4, 'pending', $5::uuid)`,
        [eventId, item.title, item.dueDate, item.priority, sourceReviewId],
      );
    }
  });
}

export async function listEventChecklistItems(
  eventId: string,
): Promise<EventChecklistItem[]> {
  const result = await neonQuery<NeonJsonRow>(
    `SELECT to_jsonb(c) AS row
     FROM public.event_checklist_items c
     WHERE c.event_id = $1::uuid
     ORDER BY c.due_date ASC NULLS LAST`,
    [eventId],
  );

  return result.rows.map(({ row }) => {
    const value = row as {
      id: string;
      event_id: string;
      title: string;
      due_date: string | null;
      priority: string;
      status: string;
      source_review_id: string | null;
      created_at: string;
    };
    return {
      id: value.id,
      eventId: value.event_id,
      title: value.title,
      dueDate: value.due_date,
      priority: value.priority,
      status: value.status,
      sourceReviewId: value.source_review_id,
      createdAt: value.created_at,
    };
  });
}

export async function listEventMoodboardItems(
  eventId: string,
): Promise<EventMoodboardItem[]> {
  const result = await neonQuery<NeonJsonRow>(
    `SELECT to_jsonb(m) AS row
     FROM public.event_moodboard_items m
     WHERE m.event_id = $1::uuid
     ORDER BY m.created_at DESC`,
    [eventId],
  );

  return result.rows.map(({ row }) => {
    const value = row as {
      id: string;
      event_id: string;
      title: string;
      category: string;
      tags: string[];
      storage_path: string;
      notes: string;
      source_review_id: string | null;
      created_at: string;
    };
    return {
      id: value.id,
      eventId: value.event_id,
      title: value.title,
      category: value.category,
      tags: value.tags ?? [],
      storagePath: value.storage_path,
      notes: value.notes,
      sourceReviewId: value.source_review_id,
      createdAt: value.created_at,
    };
  });
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
  await neonQuery(
    `INSERT INTO public.event_moodboard_items (
       event_id, title, category, tags, storage_path, notes, source_review_id
     )
     VALUES ($1::uuid, $2, $3, $4::text[], $5, $6, $7::uuid)`,
    [
      input.eventId,
      input.title,
      input.category,
      input.tags,
      input.storagePath,
      input.notes,
      input.sourceReviewId,
    ],
  );
}

export async function countPendingConciergeReviews(): Promise<number> {
  try {
    const result = await neonQuery<NeonCountRow>(
      `SELECT count(*) AS count
       FROM public.concierge_review_items
       WHERE status = 'pending_review'::public.concierge_review_status`,
    );
    return Number(result.rows[0]?.count ?? 0);
  } catch (cause) {
    if (isMissingTableError(cause)) return 0;
    throw cause;
  }
}

export async function countPendingConciergeReviewsByEventIds(
  eventIds: string[],
): Promise<{ available: boolean; counts: Record<string, number> }> {
  const counts: Record<string, number> = {};
  if (!eventIds.length) return { available: true, counts };

  for (const id of eventIds) counts[id] = 0;

  try {
    const result = await neonQuery<NeonEventCountRow>(
      `SELECT event_id::text AS event_id, count(*) AS count
       FROM public.concierge_review_items
       WHERE event_id = ANY($1::uuid[])
         AND status = 'pending_review'::public.concierge_review_status
       GROUP BY event_id`,
      [eventIds],
    );

    for (const row of result.rows) {
      if (row.event_id in counts) counts[row.event_id] = Number(row.count);
    }
    return { available: true, counts };
  } catch (cause) {
    if (isMissingTableError(cause)) return { available: false, counts: {} };
    throw cause;
  }
}
