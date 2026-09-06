import { shouldUseNeonServerDatabase } from "@/lib/neon/config";
import { neonQuery } from "@/lib/neon/server-db";
import { createAdminClient } from "@/lib/supabase/server";
import type { ConciergeUpload } from "@/lib/concierge/types";
import * as neon from "./concierge.neon.repository";
import * as supabase from "./concierge.supabase.repository";

type UploadRow = {
  id: string;
  event_id: string;
  file_name: string;
  storage_path: string;
  mime_type: string;
  file_size: number;
  status: ConciergeUpload["status"];
  extracted_text: string;
  error_message: string;
  created_at: string;
  updated_at: string;
};

type NeonJsonRow = { row: UploadRow };

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

export const createUploadRecord: typeof supabase.createUploadRecord = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.createUploadRecord(...args)
    : supabase.createUploadRecord(...args);

export const updateUpload: typeof supabase.updateUpload = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.updateUpload(...args)
    : supabase.updateUpload(...args);

export async function getUploadById(id: string): Promise<ConciergeUpload | null> {
  if (shouldUseNeonServerDatabase()) {
    const result = await neonQuery<NeonJsonRow>(
      `SELECT to_jsonb(u) AS row
       FROM public.concierge_uploads u
       WHERE u.id = $1::uuid
       LIMIT 1`,
      [id],
    );
    const row = result.rows[0]?.row;
    return row ? mapUpload(row) : null;
  }

  const client = createAdminClient();
  const { data, error } = await client
    .from("concierge_uploads")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapUpload(data as UploadRow) : null;
}

export async function updateUploadStoragePath(
  id: string,
  storagePath: string,
): Promise<void> {
  if (shouldUseNeonServerDatabase()) {
    await neonQuery(
      `UPDATE public.concierge_uploads
       SET storage_path = $2
       WHERE id = $1::uuid`,
      [id, storagePath],
    );
    return;
  }

  const client = createAdminClient();
  const { error } = await client
    .from("concierge_uploads")
    .update({ storage_path: storagePath } as never)
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export const createReviewItem: typeof supabase.createReviewItem = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.createReviewItem(...args)
    : supabase.createReviewItem(...args);

export const listReviewItemsByEvent: typeof supabase.listReviewItemsByEvent = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.listReviewItemsByEvent(...args)
    : supabase.listReviewItemsByEvent(...args);

export const getReviewItemById: typeof supabase.getReviewItemById = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.getReviewItemById(...args)
    : supabase.getReviewItemById(...args);

export const updateReviewItem: typeof supabase.updateReviewItem = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.updateReviewItem(...args)
    : supabase.updateReviewItem(...args);

export const logAiAudit: typeof supabase.logAiAudit = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.logAiAudit(...args)
    : supabase.logAiAudit(...args);

export const listEventVendors: typeof supabase.listEventVendors = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.listEventVendors(...args)
    : supabase.listEventVendors(...args);

export const insertEventVendor: typeof supabase.insertEventVendor = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.insertEventVendor(...args)
    : supabase.insertEventVendor(...args);

export const insertChecklistItems: typeof supabase.insertChecklistItems = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.insertChecklistItems(...args)
    : supabase.insertChecklistItems(...args);

export const listEventChecklistItems: typeof supabase.listEventChecklistItems = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.listEventChecklistItems(...args)
    : supabase.listEventChecklistItems(...args);

export const listEventMoodboardItems: typeof supabase.listEventMoodboardItems = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.listEventMoodboardItems(...args)
    : supabase.listEventMoodboardItems(...args);

export const insertMoodboardItem: typeof supabase.insertMoodboardItem = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.insertMoodboardItem(...args)
    : supabase.insertMoodboardItem(...args);

export const countPendingConciergeReviews: typeof supabase.countPendingConciergeReviews = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.countPendingConciergeReviews(...args)
    : supabase.countPendingConciergeReviews(...args);

export const countPendingConciergeReviewsByEventIds: typeof supabase.countPendingConciergeReviewsByEventIds = (...args) =>
  shouldUseNeonServerDatabase()
    ? neon.countPendingConciergeReviewsByEventIds(...args)
    : supabase.countPendingConciergeReviewsByEventIds(...args);
