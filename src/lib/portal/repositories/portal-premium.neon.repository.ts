import { neonQuery, withNeonTransaction } from "@/lib/neon/server-db";
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

type ApprovalRow = {
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
};

type MessageRow = {
  id: string;
  client_id: string;
  event_id: string | null;
  author_name: string;
  body: string;
  is_pinned: boolean;
  created_at: string;
};

type PaymentProofRow = {
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
};

type ContractRow = {
  id: string;
  client_id: string;
  event_id: string | null;
  title: string;
  description: string | null;
  file_url: string | null;
  signed_at: string | null;
  status: PortalContract["status"];
  created_at: string;
};

type JsonRow<T> = { row: T };
type CountRow = { count: number | string };

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

function mapApproval(row: ApprovalRow): PortalCreativeApproval {
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

function mapMessage(row: MessageRow): PortalTeamMessage {
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

function mapPaymentProof(row: PaymentProofRow): PortalPaymentProof {
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

function mapContract(row: ContractRow): PortalContract {
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

function isMissingRelation(error: unknown, relation: string): boolean {
  const candidate = error as { code?: string; message?: string } | null;
  return Boolean(
    candidate?.code === "42P01" ||
      candidate?.message?.includes(relation) ||
      candidate?.message?.includes("does not exist"),
  );
}

function readCount(row: CountRow | undefined): number {
  const value = Number(row?.count ?? 0);
  return Number.isFinite(value) ? value : 0;
}

export async function listTimelineForClient(
  clientId: string,
): Promise<PortalTimelineItem[]> {
  try {
    const result = await neonQuery<JsonRow<TimelineRow>>(
      `
        SELECT to_jsonb(t) AS row
        FROM public.portal_timeline_items t
        WHERE t.visibility='client'
          AND (t.client_id=$1::uuid OR t.client_id IS NULL)
        ORDER BY t.sort_order ASC
      `,
      [clientId],
    );
    return result.rows.map(({ row }) => mapTimeline(row));
  } catch (error) {
    if (isMissingRelation(error, "portal_timeline_items")) return [];
    throw error;
  }
}

export async function listTimelineForEvent(
  eventId: string,
): Promise<PortalTimelineItem[]> {
  try {
    const result = await neonQuery<JsonRow<TimelineRow>>(
      `SELECT to_jsonb(t) AS row FROM public.portal_timeline_items t WHERE t.event_id=$1::uuid ORDER BY t.sort_order ASC`,
      [eventId],
    );
    return result.rows.map(({ row }) => mapTimeline(row));
  } catch (error) {
    if (isMissingRelation(error, "portal_timeline_items")) return [];
    throw error;
  }
}

export type TimelineBatchResult = {
  available: boolean;
  items: PortalTimelineItem[];
};

export async function listTimelineByEventIds(
  eventIds: string[],
): Promise<TimelineBatchResult> {
  if (eventIds.length === 0) return { available: true, items: [] };
  try {
    const result = await neonQuery<JsonRow<TimelineRow>>(
      `
        SELECT to_jsonb(t) AS row
        FROM public.portal_timeline_items t
        WHERE t.event_id=ANY($1::uuid[])
        ORDER BY t.starts_at ASC, t.sort_order ASC
      `,
      [eventIds],
    );
    return { available: true, items: result.rows.map(({ row }) => mapTimeline(row)) };
  } catch (error) {
    if (isMissingRelation(error, "portal_timeline_items")) {
      return { available: false, items: [] };
    }
    throw error;
  }
}

export async function upsertOperationalTimelineForEvent(
  eventId: string,
  clientId: string | null,
): Promise<PortalTimelineItem[]> {
  return withNeonTransaction(async (client) => {
    await client.query(`SELECT id FROM public.events WHERE id=$1::uuid FOR UPDATE`, [eventId]);
    const existing = await client.query<JsonRow<TimelineRow>>(
      `SELECT to_jsonb(t) AS row FROM public.portal_timeline_items t WHERE t.event_id=$1::uuid ORDER BY t.sort_order ASC`,
      [eventId],
    );
    if (existing.rows.length > 0) {
      return existing.rows.map(({ row }) => mapTimeline(row));
    }

    const now = new Date();
    const rows = [
      ["briefing", "Briefing e alinhamento"],
      ["proposal", "Proposta comercial"],
      ["deposit", "Sinal e confirmação"],
      ["invite", "Convite digital"],
      ["rsvp", "Gestão de RSVP"],
      ["seating", "Seating plan"],
      ["checkin", "Check-in no dia"],
      ["report", "Relatório final"],
    ].map(([category, title], index) => ({
      event_id: eventId,
      client_id: clientId,
      title,
      description: null,
      starts_at: new Date(now.getTime() + index * 7 * 86400000).toISOString(),
      ends_at: null,
      category,
      visibility: "client",
      status: index === 0 ? "done" : "scheduled",
      sort_order: (index + 1) * 10,
    }));

    const inserted = await client.query<JsonRow<TimelineRow>>(
      `
        WITH saved AS (
          INSERT INTO public.portal_timeline_items (
            event_id,client_id,title,description,starts_at,ends_at,category,visibility,status,sort_order
          )
          SELECT x.event_id,x.client_id,x.title,x.description,x.starts_at,x.ends_at,
                 x.category,x.visibility,x.status,x.sort_order
          FROM jsonb_to_recordset($1::jsonb) AS x(
            event_id uuid,client_id uuid,title text,description text,starts_at timestamptz,
            ends_at timestamptz,category text,visibility text,status text,sort_order integer
          )
          RETURNING *
        )
        SELECT to_jsonb(saved) AS row FROM saved ORDER BY saved.sort_order ASC
      `,
      [JSON.stringify(rows)],
    );
    return inserted.rows.map(({ row }) => mapTimeline(row));
  });
}

export async function listCreativeApprovalsForClient(
  clientId: string,
): Promise<PortalCreativeApproval[]> {
  try {
    const result = await neonQuery<JsonRow<ApprovalRow>>(
      `SELECT to_jsonb(a) AS row FROM public.portal_approvals a WHERE a.client_id=$1::uuid ORDER BY a.created_at DESC`,
      [clientId],
    );
    return result.rows.map(({ row }) => mapApproval(row));
  } catch (error) {
    if (isMissingRelation(error, "portal_approvals")) return [];
    throw error;
  }
}

export type CreativeApprovalsBatchResult = {
  available: boolean;
  items: PortalCreativeApproval[];
};

export async function listCreativeApprovalsByEventIds(
  eventIds: string[],
): Promise<CreativeApprovalsBatchResult> {
  if (eventIds.length === 0) return { available: true, items: [] };
  try {
    const result = await neonQuery<JsonRow<ApprovalRow>>(
      `SELECT to_jsonb(a) AS row FROM public.portal_approvals a WHERE a.event_id=ANY($1::uuid[]) ORDER BY a.created_at DESC`,
      [eventIds],
    );
    return { available: true, items: result.rows.map(({ row }) => mapApproval(row)) };
  } catch (error) {
    if (isMissingRelation(error, "portal_approvals")) {
      return { available: false, items: [] };
    }
    throw error;
  }
}

export async function decideCreativeApproval(
  approvalId: string,
  status: "approved" | "changes_requested",
  note?: string,
): Promise<void> {
  await neonQuery(
    `
      UPDATE public.portal_approvals
      SET status=$2, decided_at=now(), decided_note=$3, updated_at=now()
      WHERE id=$1::uuid
    `,
    [approvalId, status, note?.trim() || null],
  );
}

export async function listMessagesForClient(
  clientId: string,
): Promise<PortalTeamMessage[]> {
  try {
    const result = await neonQuery<JsonRow<MessageRow>>(
      `
        SELECT to_jsonb(m) AS row
        FROM public.portal_messages m
        WHERE m.client_id=$1::uuid
        ORDER BY m.is_pinned DESC, m.created_at DESC
      `,
      [clientId],
    );
    return result.rows.map(({ row }) => mapMessage(row));
  } catch (error) {
    if (isMissingRelation(error, "portal_messages")) return [];
    throw error;
  }
}

export async function listContractsForClient(
  clientId: string,
): Promise<PortalContract[]> {
  try {
    const result = await neonQuery<JsonRow<ContractRow>>(
      `
        SELECT to_jsonb(c) AS row
        FROM public.portal_contracts c
        WHERE c.client_id=$1::uuid AND c.status='active'
        ORDER BY c.created_at DESC
      `,
      [clientId],
    );
    return result.rows.map(({ row }) => mapContract(row));
  } catch (error) {
    if (isMissingRelation(error, "portal_contracts")) return [];
    throw error;
  }
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
  const result = await neonQuery<JsonRow<PaymentProofRow>>(
    `
      WITH saved AS (
        INSERT INTO public.portal_payment_proofs (
          client_id,event_id,document_id,amount,currency,payment_method,reference,notes,
          file_name,mime_type,storage_path,status
        ) VALUES ($1::uuid,$2::uuid,$3::uuid,$4::numeric,$5,$6,$7,$8,$9,$10,$11,'pending_review')
        RETURNING *
      )
      SELECT to_jsonb(saved) AS row FROM saved
    `,
    [
      input.clientId,
      input.eventId ?? null,
      input.documentId ?? null,
      input.amount ?? null,
      input.currency ?? "MZN",
      input.paymentMethod ?? "transfer",
      input.reference ?? null,
      input.notes ?? null,
      input.fileName ?? null,
      input.mimeType ?? null,
      input.storagePath ?? null,
    ],
  );
  const row = result.rows[0]?.row;
  if (!row) throw new Error("Falha ao guardar comprovativo.");
  return mapPaymentProof(row);
}

export async function listPaymentProofsForClient(
  clientId: string,
): Promise<PortalPaymentProof[]> {
  try {
    const result = await neonQuery<JsonRow<PaymentProofRow>>(
      `SELECT to_jsonb(p) AS row FROM public.portal_payment_proofs p WHERE p.client_id=$1::uuid ORDER BY p.created_at DESC`,
      [clientId],
    );
    return result.rows.map(({ row }) => mapPaymentProof(row));
  } catch (error) {
    if (isMissingRelation(error, "portal_payment_proofs")) return [];
    throw error;
  }
}

export async function listPendingPaymentProofs(limit = 50): Promise<PortalPaymentProof[]> {
  try {
    const result = await neonQuery<JsonRow<PaymentProofRow>>(
      `
        SELECT to_jsonb(p) AS row FROM public.portal_payment_proofs p
        WHERE p.status='pending_review' ORDER BY p.created_at DESC LIMIT $1::integer
      `,
      [limit],
    );
    return result.rows.map(({ row }) => mapPaymentProof(row));
  } catch (error) {
    if (isMissingRelation(error, "portal_payment_proofs")) return [];
    throw error;
  }
}

export type PaymentProofsBatchResult = {
  available: boolean;
  items: PortalPaymentProof[];
};

export async function listPendingPaymentProofsBatch(): Promise<PaymentProofsBatchResult> {
  try {
    const result = await neonQuery<JsonRow<PaymentProofRow>>(
      `SELECT to_jsonb(p) AS row FROM public.portal_payment_proofs p WHERE p.status='pending_review' ORDER BY p.created_at DESC`,
    );
    return { available: true, items: result.rows.map(({ row }) => mapPaymentProof(row)) };
  } catch (error) {
    if (isMissingRelation(error, "portal_payment_proofs")) {
      return { available: false, items: [] };
    }
    throw error;
  }
}

export async function getPaymentProofById(id: string): Promise<PortalPaymentProof | null> {
  const result = await neonQuery<JsonRow<PaymentProofRow>>(
    `SELECT to_jsonb(p) AS row FROM public.portal_payment_proofs p WHERE p.id=$1::uuid LIMIT 1`,
    [id],
  );
  const row = result.rows[0]?.row;
  return row ? mapPaymentProof(row) : null;
}

export async function updatePaymentProofStatus(
  id: string,
  status: PortalPaymentProof["status"],
  options?: { paymentId?: string; receiptDocumentId?: string; note?: string },
): Promise<void> {
  await neonQuery(
    `
      UPDATE public.portal_payment_proofs
      SET status=$2, reviewed_at=now(), reviewed_note=$3,
          payment_id=$4::uuid, receipt_document_id=$5::uuid, updated_at=now()
      WHERE id=$1::uuid
    `,
    [
      id,
      status,
      options?.note ?? null,
      options?.paymentId ?? null,
      options?.receiptDocumentId ?? null,
    ],
  );
}

export async function createPortalMessage(input: {
  clientId: string;
  eventId?: string | null;
  authorName?: string;
  body: string;
  isPinned?: boolean;
}): Promise<PortalTeamMessage> {
  const result = await neonQuery<JsonRow<MessageRow>>(
    `
      WITH saved AS (
        INSERT INTO public.portal_messages (client_id,event_id,author_name,body,is_pinned)
        VALUES ($1::uuid,$2::uuid,$3,$4,$5)
        RETURNING *
      )
      SELECT to_jsonb(saved) AS row FROM saved
    `,
    [
      input.clientId,
      input.eventId ?? null,
      input.authorName?.trim() || "Equipa HAXR",
      input.body.trim(),
      input.isPinned ?? false,
    ],
  );
  const row = result.rows[0]?.row;
  if (!row) throw new Error("Falha ao criar mensagem.");
  return mapMessage(row);
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
  const result = await neonQuery<JsonRow<ApprovalRow>>(
    `
      WITH saved AS (
        INSERT INTO public.portal_approvals (
          event_id,client_id,approval_type,title,description,due_at,attachment_url,status
        ) VALUES ($1::uuid,$2::uuid,$3,$4,$5,$6::timestamptz,$7,'pending')
        RETURNING *
      )
      SELECT to_jsonb(saved) AS row FROM saved
    `,
    [
      input.eventId,
      input.clientId,
      input.approvalType,
      input.title.trim(),
      input.description?.trim() || null,
      input.dueAt ?? null,
      input.attachmentUrl?.trim() || null,
    ],
  );
  const row = result.rows[0]?.row;
  if (!row) throw new Error("Falha ao criar aprovação.");
  return mapApproval(row);
}

export async function createPortalContract(input: {
  clientId: string;
  eventId?: string | null;
  title: string;
  description?: string;
  fileUrl?: string;
}): Promise<PortalContract> {
  const result = await neonQuery<JsonRow<ContractRow>>(
    `
      WITH saved AS (
        INSERT INTO public.portal_contracts (client_id,event_id,title,description,file_url,status)
        VALUES ($1::uuid,$2::uuid,$3,$4,$5,'active')
        RETURNING *
      )
      SELECT to_jsonb(saved) AS row FROM saved
    `,
    [
      input.clientId,
      input.eventId ?? null,
      input.title.trim(),
      input.description?.trim() || null,
      input.fileUrl?.trim() || null,
    ],
  );
  const row = result.rows[0]?.row;
  if (!row) throw new Error("Falha ao criar contrato.");
  return mapContract(row);
}

export async function setEventDateHold(eventId: string, holdUntil: string): Promise<void> {
  await neonQuery(
    `UPDATE public.events SET date_hold_until=$2::timestamptz, updated_at=now() WHERE id=$1::uuid`,
    [eventId, holdUntil],
  );
}

export async function clearEventDateHold(eventId: string): Promise<void> {
  await neonQuery(
    `UPDATE public.events SET date_hold_until=NULL, updated_at=now() WHERE id=$1::uuid`,
    [eventId],
  );
}

export async function countPendingPaymentProofs(): Promise<number> {
  try {
    const result = await neonQuery<CountRow>(
      `SELECT count(*)::int AS count FROM public.portal_payment_proofs WHERE status='pending_review'`,
    );
    return readCount(result.rows[0]);
  } catch (error) {
    if (isMissingRelation(error, "portal_payment_proofs")) return 0;
    throw error;
  }
}

export async function countPendingPaymentProofsByEventIds(
  eventIds: string[],
): Promise<{ available: boolean; counts: Record<string, number> }> {
  const counts: Record<string, number> = Object.fromEntries(eventIds.map((id) => [id, 0]));
  if (eventIds.length === 0) return { available: true, counts };
  try {
    const result = await neonQuery<{ event_id: string; count: number | string }>(
      `
        SELECT event_id::text, count(*)::int AS count
        FROM public.portal_payment_proofs
        WHERE event_id=ANY($1::uuid[]) AND status='pending_review'
        GROUP BY event_id
      `,
      [eventIds],
    );
    for (const row of result.rows) {
      if (row.event_id in counts) counts[row.event_id] = Number(row.count) || 0;
    }
    return { available: true, counts };
  } catch (error) {
    if (isMissingRelation(error, "portal_payment_proofs")) {
      return { available: false, counts: {} };
    }
    throw error;
  }
}

export async function countPendingCreativeApprovals(clientId: string): Promise<number> {
  try {
    const result = await neonQuery<CountRow>(
      `SELECT count(*)::int AS count FROM public.portal_approvals WHERE client_id=$1::uuid AND status='pending'`,
      [clientId],
    );
    return readCount(result.rows[0]);
  } catch (error) {
    if (isMissingRelation(error, "portal_approvals")) return 0;
    throw error;
  }
}

export async function markTimelineCategoryDone(
  eventId: string,
  category: PortalTimelineItem["category"],
): Promise<void> {
  try {
    await neonQuery(
      `UPDATE public.portal_timeline_items SET status='done' WHERE event_id=$1::uuid AND category=$2`,
      [eventId, category],
    );
  } catch (error) {
    if (isMissingRelation(error, "portal_timeline_items")) return;
    throw error;
  }
}
