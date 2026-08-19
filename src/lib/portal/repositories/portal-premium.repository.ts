import { createAdminClient } from "@/lib/supabase/server";
import { asGenericRow, asGenericRows } from "@/lib/supabase/helpers";
import type {
  PortalContract,
  PortalCreativeApproval,
  PortalPaymentProof,
  PortalTeamMessage,
  PortalTimelineItem,
} from "@/lib/portal/portal-premium.types";

type TimelineRow = {
  id: string;
  event_id: string;
  client_id: string | null;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string | null;
  category: PortalTimelineItem["category"];
  visibility: PortalTimelineItem["visibility"];
  status: PortalTimelineItem["status"];
  sort_order: number;
  created_at: string;
};

function mapTimeline(row: TimelineRow): PortalTimelineItem {
  return {
    id: row.id,
    eventId: row.event_id,
    clientId: row.client_id,
    title: row.title,
    description: row.description,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    category: row.category,
    visibility: row.visibility,
    status: row.status,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

export async function listTimelineForClient(
  clientId: string
): Promise<PortalTimelineItem[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("portal_timeline_items")
    .select("*")
    .eq("visibility", "client")
    .or(`client_id.eq.${clientId},client_id.is.null`)
    .order("sort_order", { ascending: true });

  if (error) {
    if (error.message.includes("portal_timeline_items")) return [];
    throw new Error(error.message);
  }
  return asGenericRows<TimelineRow>(data).map(mapTimeline);
}

export async function listTimelineForEvent(
  eventId: string
): Promise<PortalTimelineItem[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("portal_timeline_items")
    .select("*")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true });

  if (error) {
    if (error.message.includes("portal_timeline_items")) return [];
    throw new Error(error.message);
  }
  return asGenericRows<TimelineRow>(data).map(mapTimeline);
}

export async function upsertOperationalTimelineForEvent(
  eventId: string,
  clientId: string | null
): Promise<PortalTimelineItem[]> {
  const existing = await listTimelineForEvent(eventId);
  if (existing.length > 0) return existing;

  const supabase = createAdminClient();
  const now = new Date();
  const rows = [
    "briefing",
    "proposal",
    "deposit",
    "invite",
    "rsvp",
    "seating",
    "checkin",
    "report",
  ].map((category, index) => ({
    event_id: eventId,
    client_id: clientId,
    title:
      category === "briefing"
        ? "Briefing e alinhamento"
        : category === "proposal"
          ? "Proposta comercial"
          : category === "deposit"
            ? "Sinal e confirmação"
            : category === "invite"
              ? "Convite digital"
              : category === "rsvp"
                ? "Gestão de RSVP"
                : category === "seating"
                  ? "Seating plan"
                  : category === "checkin"
                    ? "Check-in no dia"
                    : "Relatório final",
    description: null,
    starts_at: new Date(now.getTime() + index * 86400000 * 7).toISOString(),
    ends_at: null,
    category,
    visibility: "client",
    status: index === 0 ? "done" : "scheduled",
    sort_order: (index + 1) * 10,
  }));

  const { data, error } = await supabase
    .from("portal_timeline_items")
    .insert(rows as never)
    .select("*");

  if (error) throw new Error(error.message);
  return asGenericRows<TimelineRow>(data).map(mapTimeline);
}

export async function listCreativeApprovalsForClient(
  clientId: string
): Promise<PortalCreativeApproval[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("portal_approvals")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error) {
    if (error.message.includes("portal_approvals")) return [];
    throw new Error(error.message);
  }

  return asGenericRows<{
    id: string;
    event_id: string;
    client_id: string | null;
    approval_type: PortalCreativeApproval["approvalType"];
    title: string;
    description: string | null;
    status: PortalCreativeApproval["status"];
    due_at: string | null;
    decided_at: string | null;
    decided_note: string | null;
    attachment_url: string | null;
    created_at: string;
  }>(data).map((row) => ({
    id: row.id,
    eventId: row.event_id,
    clientId: row.client_id,
    approvalType: row.approval_type,
    title: row.title,
    description: row.description,
    status: row.status,
    dueAt: row.due_at,
    decidedAt: row.decided_at,
    decidedNote: row.decided_note,
    attachmentUrl: row.attachment_url,
    createdAt: row.created_at,
  }));
}

export async function decideCreativeApproval(
  approvalId: string,
  status: "approved" | "changes_requested",
  note?: string
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("portal_approvals")
    .update({
      status,
      decided_at: new Date().toISOString(),
      decided_note: note?.trim() || null,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", approvalId);

  if (error) throw new Error(error.message);
}

export async function listMessagesForClient(
  clientId: string
): Promise<PortalTeamMessage[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("portal_messages")
    .select("*")
    .eq("client_id", clientId)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    if (error.message.includes("portal_messages")) return [];
    throw new Error(error.message);
  }

  return asGenericRows<{
    id: string;
    client_id: string;
    event_id: string | null;
    author_name: string;
    body: string;
    is_pinned: boolean;
    created_at: string;
  }>(data).map((row) => ({
    id: row.id,
    clientId: row.client_id,
    eventId: row.event_id,
    authorName: row.author_name,
    body: row.body,
    isPinned: row.is_pinned,
    createdAt: row.created_at,
  }));
}

export async function listContractsForClient(
  clientId: string
): Promise<PortalContract[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("portal_contracts")
    .select("*")
    .eq("client_id", clientId)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    if (error.message.includes("portal_contracts")) return [];
    throw new Error(error.message);
  }

  return asGenericRows<{
    id: string;
    client_id: string;
    event_id: string | null;
    title: string;
    description: string | null;
    file_url: string | null;
    signed_at: string | null;
    status: PortalContract["status"];
    created_at: string;
  }>(data).map((row) => ({
    id: row.id,
    clientId: row.client_id,
    eventId: row.event_id,
    title: row.title,
    description: row.description,
    fileUrl: row.file_url,
    signedAt: row.signed_at,
    status: row.status,
    createdAt: row.created_at,
  }));
}

export async function createPaymentProof(input: {
  clientId: string;
  eventId?: string | null;
  documentId?: string | null;
  amount?: number | null;
  currency?: string;
  paymentMethod?: string;
  reference?: string;
  notes?: string;
  fileName?: string;
  mimeType?: string;
  storagePath?: string;
}): Promise<PortalPaymentProof> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("portal_payment_proofs")
    .insert({
      client_id: input.clientId,
      event_id: input.eventId ?? null,
      document_id: input.documentId ?? null,
      amount: input.amount ?? null,
      currency: input.currency ?? "MZN",
      payment_method: input.paymentMethod ?? "transfer",
      reference: input.reference ?? null,
      notes: input.notes ?? null,
      file_name: input.fileName ?? null,
      mime_type: input.mimeType ?? null,
      storage_path: input.storagePath ?? null,
      status: "pending_review",
    } as never)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  const row = asGenericRow<{
    id: string;
    client_id: string;
    event_id: string | null;
    document_id: string | null;
    amount: number | null;
    currency: string;
    payment_method: string;
    reference: string | null;
    notes: string | null;
    file_name: string | null;
    status: PortalPaymentProof["status"];
    created_at: string;
  }>(data);
  if (!row) throw new Error("Falha ao guardar comprovativo.");

  return {
    id: row.id,
    clientId: row.client_id,
    eventId: row.event_id,
    documentId: row.document_id,
    amount: row.amount,
    currency: row.currency,
    paymentMethod: row.payment_method,
    reference: row.reference,
    notes: row.notes,
    fileName: row.file_name,
    status: row.status,
    createdAt: row.created_at,
  };
}

export async function listPaymentProofsForClient(
  clientId: string
): Promise<PortalPaymentProof[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("portal_payment_proofs")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error) {
    if (error.message.includes("portal_payment_proofs")) return [];
    throw new Error(error.message);
  }

  return asGenericRows<{
    id: string;
    client_id: string;
    event_id: string | null;
    document_id: string | null;
    amount: number | null;
    currency: string;
    payment_method: string;
    reference: string | null;
    notes: string | null;
    file_name: string | null;
    status: PortalPaymentProof["status"];
    created_at: string;
  }>(data).map((row) => ({
    id: row.id,
    clientId: row.client_id,
    eventId: row.event_id,
    documentId: row.document_id,
    amount: row.amount,
    currency: row.currency,
    paymentMethod: row.payment_method,
    reference: row.reference,
    notes: row.notes,
    fileName: row.file_name,
    status: row.status,
    createdAt: row.created_at,
  }));
}

export async function listPendingPaymentProofs(limit = 50): Promise<PortalPaymentProof[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("portal_payment_proofs")
    .select("*")
    .eq("status", "pending_review")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (error.message.includes("portal_payment_proofs")) return [];
    throw new Error(error.message);
  }

  return asGenericRows<{
    id: string;
    client_id: string;
    event_id: string | null;
    document_id: string | null;
    amount: number | null;
    currency: string;
    payment_method: string;
    reference: string | null;
    notes: string | null;
    file_name: string | null;
    status: PortalPaymentProof["status"];
    created_at: string;
  }>(data).map((row) => ({
    id: row.id,
    clientId: row.client_id,
    eventId: row.event_id,
    documentId: row.document_id,
    amount: row.amount,
    currency: row.currency,
    paymentMethod: row.payment_method,
    reference: row.reference,
    notes: row.notes,
    fileName: row.file_name,
    status: row.status,
    createdAt: row.created_at,
  }));
}

export async function getPaymentProofById(
  id: string
): Promise<PortalPaymentProof | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("portal_payment_proofs")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  const row = asGenericRow<{
    id: string;
    client_id: string;
    event_id: string | null;
    document_id: string | null;
    amount: number | null;
    currency: string;
    payment_method: string;
    reference: string | null;
    notes: string | null;
    file_name: string | null;
    status: PortalPaymentProof["status"];
    created_at: string;
  }>(data);
  if (!row) return null;

  return {
    id: row.id,
    clientId: row.client_id,
    eventId: row.event_id,
    documentId: row.document_id,
    amount: row.amount,
    currency: row.currency,
    paymentMethod: row.payment_method,
    reference: row.reference,
    notes: row.notes,
    fileName: row.file_name,
    status: row.status,
    createdAt: row.created_at,
  };
}

export async function updatePaymentProofStatus(
  id: string,
  status: PortalPaymentProof["status"],
  options?: { paymentId?: string; receiptDocumentId?: string; note?: string }
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("portal_payment_proofs")
    .update({
      status,
      reviewed_at: new Date().toISOString(),
      reviewed_note: options?.note ?? null,
      payment_id: options?.paymentId ?? null,
      receipt_document_id: options?.receiptDocumentId ?? null,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function createPortalMessage(input: {
  clientId: string;
  eventId?: string | null;
  authorName?: string;
  body: string;
  isPinned?: boolean;
}): Promise<PortalTeamMessage> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("portal_messages")
    .insert({
      client_id: input.clientId,
      event_id: input.eventId ?? null,
      author_name: input.authorName?.trim() || "Equipa HAXR",
      body: input.body.trim(),
      is_pinned: input.isPinned ?? false,
    } as never)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  const row = asGenericRow<{
    id: string;
    client_id: string;
    event_id: string | null;
    author_name: string;
    body: string;
    is_pinned: boolean;
    created_at: string;
  }>(data);
  if (!row) throw new Error("Falha ao criar mensagem.");

  return {
    id: row.id,
    clientId: row.client_id,
    eventId: row.event_id,
    authorName: row.author_name,
    body: row.body,
    isPinned: row.is_pinned,
    createdAt: row.created_at,
  };
}

export async function createCreativeApproval(input: {
  eventId: string;
  clientId: string | null;
  approvalType: PortalCreativeApproval["approvalType"];
  title: string;
  description?: string;
  dueAt?: string;
  attachmentUrl?: string;
}): Promise<PortalCreativeApproval> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("portal_approvals")
    .insert({
      event_id: input.eventId,
      client_id: input.clientId,
      approval_type: input.approvalType,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      due_at: input.dueAt ?? null,
      attachment_url: input.attachmentUrl?.trim() || null,
      status: "pending",
    } as never)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  const row = asGenericRow<{
    id: string;
    event_id: string;
    client_id: string | null;
    approval_type: PortalCreativeApproval["approvalType"];
    title: string;
    description: string | null;
    status: PortalCreativeApproval["status"];
    due_at: string | null;
    decided_at: string | null;
    decided_note: string | null;
    attachment_url: string | null;
    created_at: string;
  }>(data);
  if (!row) throw new Error("Falha ao criar aprovação.");

  return {
    id: row.id,
    eventId: row.event_id,
    clientId: row.client_id,
    approvalType: row.approval_type,
    title: row.title,
    description: row.description,
    status: row.status,
    dueAt: row.due_at,
    decidedAt: row.decided_at,
    decidedNote: row.decided_note,
    attachmentUrl: row.attachment_url,
    createdAt: row.created_at,
  };
}

export async function createPortalContract(input: {
  clientId: string;
  eventId?: string | null;
  title: string;
  description?: string;
  fileUrl?: string;
}): Promise<PortalContract> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("portal_contracts")
    .insert({
      client_id: input.clientId,
      event_id: input.eventId ?? null,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      file_url: input.fileUrl?.trim() || null,
      status: "active",
    } as never)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  const row = asGenericRow<{
    id: string;
    client_id: string;
    event_id: string | null;
    title: string;
    description: string | null;
    file_url: string | null;
    signed_at: string | null;
    status: PortalContract["status"];
    created_at: string;
  }>(data);
  if (!row) throw new Error("Falha ao criar contrato.");

  return {
    id: row.id,
    clientId: row.client_id,
    eventId: row.event_id,
    title: row.title,
    description: row.description,
    fileUrl: row.file_url,
    signedAt: row.signed_at,
    status: row.status,
    createdAt: row.created_at,
  };
}

export async function setEventDateHold(
  eventId: string,
  holdUntil: string
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("events")
    .update({
      date_hold_until: holdUntil,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", eventId);

  if (error) throw new Error(error.message);
}

export async function clearEventDateHold(eventId: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("events")
    .update({
      date_hold_until: null,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", eventId);

  if (error) throw new Error(error.message);
}

export async function countPendingPaymentProofs(): Promise<number> {
  const supabase = createAdminClient();
  const { count, error } = await supabase
    .from("portal_payment_proofs")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending_review");

  if (error) {
    if (error.message.includes("portal_payment_proofs")) return 0;
    throw new Error(error.message);
  }
  return count ?? 0;
}

export async function countPendingPaymentProofsByEventIds(
  eventIds: string[]
): Promise<Record<string, number>> {
  const result: Record<string, number> = {};
  if (!eventIds.length) return result;

  for (const id of eventIds) {
    result[id] = 0;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("portal_payment_proofs")
    .select("event_id")
    .in("event_id", eventIds)
    .eq("status", "pending_review");

  if (error) {
    if (error.message.includes("portal_payment_proofs")) return result;
    throw new Error(error.message);
  }

  for (const row of (data as Array<{ event_id: string | null }> | null) ?? []) {
    if (row.event_id && row.event_id in result) {
      result[row.event_id] = (result[row.event_id] ?? 0) + 1;
    }
  }

  return result;
}

export async function countPendingCreativeApprovals(
  clientId: string
): Promise<number> {
  const supabase = createAdminClient();
  const { count, error } = await supabase
    .from("portal_approvals")
    .select("*", { count: "exact", head: true })
    .eq("client_id", clientId)
    .eq("status", "pending");

  if (error) {
    if (error.message.includes("portal_approvals")) return 0;
    throw new Error(error.message);
  }
  return count ?? 0;
}

export async function markTimelineCategoryDone(
  eventId: string,
  category: PortalTimelineItem["category"]
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("portal_timeline_items")
    .update({ status: "done" } as never)
    .eq("event_id", eventId)
    .eq("category", category);

  if (error) {
    if (error.message.includes("portal_timeline_items")) return;
    throw new Error(error.message);
  }
}
