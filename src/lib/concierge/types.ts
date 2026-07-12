export type ConciergeDocType =
  | "vendor_proposal"
  | "payment_receipt"
  | "guest_list"
  | "visual_reference"
  | "checklist"
  | "contract"
  | "other";

export type ConciergeReviewStatus =
  | "uploaded"
  | "processing"
  | "pending_review"
  | "approved"
  | "rejected"
  | "failed";

export type ConciergeUpload = {
  id: string;
  eventId: string;
  fileName: string;
  storagePath: string;
  mimeType: string;
  fileSize: number;
  status: ConciergeReviewStatus;
  extractedText: string;
  errorMessage: string;
  createdAt: string;
  updatedAt: string;
};

export type ConciergeReviewItem = {
  id: string;
  uploadId: string;
  eventId: string;
  documentType: ConciergeDocType;
  status: ConciergeReviewStatus;
  extractedData: Record<string, unknown>;
  finalData: Record<string, unknown> | null;
  aiModel: string;
  aiRawResponse: string;
  reviewedBy: string;
  reviewedAt: string | null;
  appliedAt: string | null;
  applyError: string;
  createdAt: string;
  updatedAt: string;
  upload?: Pick<ConciergeUpload, "fileName" | "mimeType" | "storagePath">;
};

export type EventVendor = {
  id: string;
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
  status: string;
  sourceReviewId: string | null;
  createdAt: string;
};

export type EventChecklistItem = {
  id: string;
  eventId: string;
  title: string;
  dueDate: string | null;
  priority: string;
  status: string;
  sourceReviewId: string | null;
  createdAt: string;
};

export type EventMoodboardItem = {
  id: string;
  eventId: string;
  title: string;
  category: string;
  tags: string[];
  storagePath: string;
  notes: string;
  sourceReviewId: string | null;
  createdAt: string;
};

export type ConciergeSubTab = "fila" | "fornecedores" | "checklist" | "moodboard";

export const CONCIERGE_BUCKET = "concierge-uploads";

export const CONCIERGE_MAX_FILE_BYTES = 20 * 1024 * 1024;

export const CONCIERGE_ALLOWED_MIME = new Set([
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export function isConciergeSchemaMissingError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes("concierge_uploads") ||
    msg.includes("concierge_review_items") ||
    msg.includes("relation") && msg.includes("concierge")
  );
}
