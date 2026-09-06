import type { PoolClient } from "pg";
import { VAT_RATE } from "@/lib/admin/constants";
import { parseSignatureDataUrl } from "@/lib/admin/signatures";
import { mapDocument } from "@/lib/admin/db/mappers";
import { calculateLineItems, calculateTotals } from "@/lib/calculations";
import type {
  AdminOperationalDocument,
  BusinessId,
  Client,
  Currency,
  DashboardStats,
  DocumentStatus,
  DocumentType,
  EventType,
  InvoiceDocument,
  InvoiceFormData,
} from "@/lib/admin/types";
import type { Tables } from "@/lib/supabase/database.types";
import { documentBelongsToPortalClient } from "@/lib/portal/services/portal-client-match";
import { neonQuery, withNeonTransaction } from "@/lib/neon/server-db";

type DocumentRow = Tables<"documents"> & {
  pdf_template?: string;
  contact_channel?: string;
};
type LineItemRow = Tables<"document_line_items">;
type NeonDocumentJsonRow = { row: DocumentRow };
type NeonLineJsonRow = { row: LineItemRow };
type CountRow = { count: number };
type NumberRow = { number: string };
type ClientIdRow = { id: string };

export type NeonSaveDocumentOptions = {
  convertedFromDocumentId?: string;
  createClientIfMissing?: boolean;
};

function mapOperationalDocument(row: DocumentRow): AdminOperationalDocument {
  return {
    id: row.id,
    documentType: row.document_type as DocumentType,
    documentNumber: row.document_number,
    businessId: row.business_id as BusinessId,
    status: row.status as DocumentStatus,
    currency: row.currency as Currency,
    clientId: row.client_id,
    clientName: row.client_name,
    event: {
      eventId: row.event_id ?? null,
      eventType: (row.event_type as EventType | null) ?? null,
      eventName: row.event_name,
      eventDate: row.event_date,
      eventLocation: row.event_location,
    },
    issueDate: row.issue_date,
    expiryDate: row.expiry_date,
    totals: {
      subtotal: Number(row.subtotal),
      vatRate: Number(row.vat_rate),
      vatAmount: Number(row.vat_amount),
      grandTotal: Number(row.grand_total),
      includeVat: row.include_vat,
      currency: row.currency as Currency,
    },
    convertedFromDocumentId:
      typeof row.converted_from_document_id === "string"
        ? row.converted_from_document_id
        : null,
    clientApprovalStatus:
      typeof row.client_approval_status === "string"
        ? (row.client_approval_status as InvoiceDocument["clientApprovalStatus"])
        : null,
    clientApprovedAt:
      typeof row.client_approved_at === "string" ? row.client_approved_at : null,
    clientApprovalNote:
      typeof row.client_approval_note === "string" ? row.client_approval_note : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    emailSentAt:
      typeof row.email_sent_at === "string" ? row.email_sent_at : null,
  };
}

async function queryDocuments(
  sql: string,
  values: readonly unknown[] = [],
): Promise<DocumentRow[]> {
  const result = await neonQuery<NeonDocumentJsonRow>(sql, values);
  return result.rows.map(({ row }) => row);
}

async function fetchLineItems(
  documentIds: string[],
  client?: PoolClient,
): Promise<LineItemRow[]> {
  if (!documentIds.length) return [];

  const sql = `
    SELECT to_jsonb(li) AS row
    FROM public.document_line_items li
    WHERE li.document_id = ANY($1::uuid[])
    ORDER BY li.sort_order, li.created_at, li.id
  `;

  const result = client
    ? await client.query<NeonLineJsonRow>(sql, [documentIds])
    : await neonQuery<NeonLineJsonRow>(sql, [documentIds]);

  return result.rows.map(({ row }) => row);
}

async function mapDocumentsWithLines(rows: DocumentRow[]): Promise<InvoiceDocument[]> {
  if (!rows.length) return [];
  const lineItems = await fetchLineItems(rows.map((row) => row.id));
  return rows.map((row) =>
    mapDocument(
      row,
      lineItems.filter((item) => item.document_id === row.id),
    ),
  );
}

export async function listOperationalDocumentsNeon(): Promise<AdminOperationalDocument[]> {
  const rows = await queryDocuments(`
    SELECT to_jsonb(d) AS row
    FROM public.documents d
    ORDER BY d.updated_at DESC
  `);
  return rows.map(mapOperationalDocument);
}

export async function listDocumentsNeon(filters?: {
  documentType?: DocumentType;
  businessId?: BusinessId;
  status?: InvoiceDocument["status"];
  clientId?: string;
  eventId?: string;
  limit?: number;
}): Promise<InvoiceDocument[]> {
  const clauses: string[] = [];
  const values: unknown[] = [];

  const add = (clause: string, value: unknown) => {
    values.push(value);
    clauses.push(clause.replace("?", `$${values.length}`));
  };

  if (filters?.documentType) add("d.document_type = ?::public.document_type", filters.documentType);
  if (filters?.businessId) add("d.business_id = ?", filters.businessId);
  if (filters?.status) add("d.status = ?::public.document_status", filters.status);
  if (filters?.clientId) add("d.client_id = ?::uuid", filters.clientId);
  if (filters?.eventId) add("d.event_id = ?::uuid", filters.eventId);

  let limitSql = "";
  if (filters?.limit) {
    values.push(filters.limit);
    limitSql = `LIMIT $${values.length}`;
  }

  const rows = await queryDocuments(
    `
      SELECT to_jsonb(d) AS row
      FROM public.documents d
      ${clauses.length ? `WHERE ${clauses.join(" AND ")}` : ""}
      ORDER BY d.updated_at DESC
      ${limitSql}
    `,
    values,
  );

  return mapDocumentsWithLines(rows);
}

export async function listDocumentsByEventIdsNeon(
  eventIds: string[],
): Promise<InvoiceDocument[]> {
  if (!eventIds.length) return [];
  const rows = await queryDocuments(
    `
      SELECT to_jsonb(d) AS row
      FROM public.documents d
      WHERE d.event_id = ANY($1::uuid[])
      ORDER BY d.updated_at DESC
    `,
    [eventIds],
  );
  return mapDocumentsWithLines(rows);
}

export async function listPortalDocumentsForClientNeon(
  client: Pick<Client, "id" | "fullName">,
): Promise<InvoiceDocument[]> {
  const documents = await listDocumentsForClientNeon(client);
  return documents.filter((doc) => doc.status === "sent" || doc.status === "paid");
}

export async function listDocumentsForClientNeon(
  client: Pick<Client, "id" | "fullName">,
): Promise<InvoiceDocument[]> {
  const rows = await queryDocuments(
    `
      SELECT to_jsonb(d) AS row
      FROM public.documents d
      WHERE d.client_id = $1::uuid OR d.client_id IS NULL
      ORDER BY d.updated_at DESC
    `,
    [client.id],
  );

  const matchingRows = rows.filter((row) =>
    documentBelongsToPortalClient(mapDocument(row, []), client),
  );
  return mapDocumentsWithLines(matchingRows);
}

export async function getDocumentByIdNeon(id: string): Promise<InvoiceDocument | null> {
  const rows = await queryDocuments(
    `
      SELECT to_jsonb(d) AS row
      FROM public.documents d
      WHERE d.id = $1::uuid
      LIMIT 1
    `,
    [id],
  );
  const row = rows[0];
  if (!row) return null;
  const lineItems = await fetchLineItems([row.id]);
  return mapDocument(row, lineItems);
}

export async function peekDocumentNumberNeon(
  businessId: BusinessId,
  documentType: DocumentType,
): Promise<string> {
  const result = await neonQuery<NumberRow>(
    "SELECT public.peek_document_number($1, $2::public.document_type) AS number",
    [businessId, documentType],
  );
  const number = result.rows[0]?.number;
  if (!number) throw new Error("Falha ao prever número do documento.");
  return number;
}

export async function reserveDocumentNumberNeon(
  businessId: BusinessId,
  documentType: DocumentType,
): Promise<string> {
  const result = await neonQuery<NumberRow>(
    "SELECT public.next_document_number($1, $2::public.document_type) AS number",
    [businessId, documentType],
  );
  const number = result.rows[0]?.number;
  if (!number) throw new Error("Falha ao reservar número do documento.");
  return number;
}

async function createClientInsideTransaction(
  client: PoolClient,
  form: InvoiceFormData,
): Promise<string> {
  const result = await client.query<ClientIdRow>(
    `
      INSERT INTO public.clients (
        client_name,
        client_type,
        company_name,
        nuit,
        email,
        phone,
        address
      )
      VALUES ($1, $2::public.client_type, $3, $4, $5, $6, $7)
      RETURNING id
    `,
    [
      form.clientName.trim(),
      form.clientType,
      form.companyName.trim(),
      form.clientNuit.trim(),
      form.clientEmail.trim(),
      form.clientPhone.trim(),
      form.clientAddress.trim(),
    ],
  );
  const id = result.rows[0]?.id;
  if (!id) throw new Error("Falha ao guardar cliente.");
  return id;
}

function buildDocumentPayload(
  form: InvoiceFormData,
  documentNumber: string,
  clientId: string | null,
  options?: NeonSaveDocumentOptions,
) {
  const lineItems = calculateLineItems(form.lineItems);
  const totals = calculateTotals(lineItems, form.includeVat, form.currency, VAT_RATE);

  const payload: Record<string, unknown> = {
    business_id: form.businessId,
    document_type: form.documentType,
    document_number: documentNumber,
    status: form.status,
    currency: form.currency,
    client_id: clientId,
    client_type: form.clientType,
    client_name: form.clientName.trim(),
    company_name: form.companyName.trim(),
    client_nuit: form.clientNuit.trim(),
    client_email: form.clientEmail.trim(),
    client_phone: form.clientPhone.trim(),
    client_address: form.clientAddress.trim(),
    event_type: form.eventType,
    event_id: form.eventId,
    event_name: form.eventName.trim(),
    event_date: form.eventDate,
    event_location: form.eventLocation.trim(),
    issue_date: form.issueDate,
    expiry_date: form.expiryDate,
    notes: form.notes.trim(),
    subtotal: totals.subtotal,
    vat_rate: totals.vatRate,
    vat_amount: totals.vatAmount,
    grand_total: totals.grandTotal,
    include_vat: totals.includeVat,
    issuer_signature_id: form.issuerSignatureId,
    issuer_name: form.issuerName.trim(),
    issuer_role: form.issuerRole.trim(),
    issuer_signature_image: form.issuerSignatureImage,
    pdf_template: form.pdfTemplate ?? "editorial_ivory",
    contact_channel: form.contactChannel ?? "financeiro",
  };

  if (options?.convertedFromDocumentId) {
    payload.converted_from_document_id = options.convertedFromDocumentId;
  }

  return { payload, lineItems };
}

const DOCUMENT_RECORD_DEFINITION = `
  business_id text,
  document_type public.document_type,
  document_number text,
  status public.document_status,
  currency public.currency_code,
  client_id uuid,
  client_type public.client_type,
  client_name text,
  company_name text,
  client_nuit text,
  client_email text,
  client_phone text,
  client_address text,
  event_type public.event_type,
  event_id uuid,
  event_name text,
  event_date date,
  event_location text,
  issue_date date,
  expiry_date date,
  notes text,
  subtotal numeric,
  vat_rate numeric,
  vat_amount numeric,
  grand_total numeric,
  include_vat boolean,
  issuer_signature_id uuid,
  issuer_name text,
  issuer_role text,
  issuer_signature_image text,
  pdf_template text,
  contact_channel text,
  converted_from_document_id uuid
`;

async function insertDocument(
  client: PoolClient,
  payload: Record<string, unknown>,
): Promise<DocumentRow> {
  const result = await client.query<NeonDocumentJsonRow>(
    `
      WITH input AS (
        SELECT * FROM jsonb_to_record($1::jsonb) AS x(${DOCUMENT_RECORD_DEFINITION})
      ), saved AS (
        INSERT INTO public.documents (
          business_id, document_type, document_number, status, currency,
          client_id, client_type, client_name, company_name, client_nuit,
          client_email, client_phone, client_address, event_type, event_id,
          event_name, event_date, event_location, issue_date, expiry_date,
          notes, subtotal, vat_rate, vat_amount, grand_total, include_vat,
          issuer_signature_id, issuer_name, issuer_role, issuer_signature_image,
          pdf_template, contact_channel, converted_from_document_id
        )
        SELECT
          business_id, document_type, document_number, status, currency,
          client_id, client_type, client_name, company_name, client_nuit,
          client_email, client_phone, client_address, event_type, event_id,
          event_name, event_date, event_location, issue_date, expiry_date,
          notes, subtotal, vat_rate, vat_amount, grand_total, include_vat,
          issuer_signature_id, issuer_name, issuer_role, issuer_signature_image,
          pdf_template, contact_channel, converted_from_document_id
        FROM input
        RETURNING *
      )
      SELECT to_jsonb(saved) AS row FROM saved
    `,
    [JSON.stringify(payload)],
  );
  const row = result.rows[0]?.row;
  if (!row) throw new Error("Falha ao guardar documento.");
  return row;
}

async function updateDocument(
  client: PoolClient,
  id: string,
  payload: Record<string, unknown>,
): Promise<DocumentRow> {
  const result = await client.query<NeonDocumentJsonRow>(
    `
      WITH input AS (
        SELECT * FROM jsonb_to_record($2::jsonb) AS x(${DOCUMENT_RECORD_DEFINITION})
      ), saved AS (
        UPDATE public.documents d SET
          business_id = input.business_id,
          document_type = input.document_type,
          document_number = input.document_number,
          status = input.status,
          currency = input.currency,
          client_id = input.client_id,
          client_type = input.client_type,
          client_name = input.client_name,
          company_name = input.company_name,
          client_nuit = input.client_nuit,
          client_email = input.client_email,
          client_phone = input.client_phone,
          client_address = input.client_address,
          event_type = input.event_type,
          event_id = input.event_id,
          event_name = input.event_name,
          event_date = input.event_date,
          event_location = input.event_location,
          issue_date = input.issue_date,
          expiry_date = input.expiry_date,
          notes = input.notes,
          subtotal = input.subtotal,
          vat_rate = input.vat_rate,
          vat_amount = input.vat_amount,
          grand_total = input.grand_total,
          include_vat = input.include_vat,
          issuer_signature_id = input.issuer_signature_id,
          issuer_name = input.issuer_name,
          issuer_role = input.issuer_role,
          issuer_signature_image = input.issuer_signature_image,
          pdf_template = input.pdf_template,
          contact_channel = input.contact_channel,
          converted_from_document_id = CASE
            WHEN $2::jsonb ? 'converted_from_document_id'
              THEN input.converted_from_document_id
            ELSE d.converted_from_document_id
          END
        FROM input
        WHERE d.id = $1::uuid
        RETURNING d.*
      )
      SELECT to_jsonb(saved) AS row FROM saved
    `,
    [id, JSON.stringify(payload)],
  );
  const row = result.rows[0]?.row;
  if (!row) throw new Error("Documento não encontrado.");
  return row;
}

async function replaceLineItems(
  client: PoolClient,
  documentId: string,
  lineItems: ReturnType<typeof calculateLineItems>,
): Promise<LineItemRow[]> {
  await client.query("DELETE FROM public.document_line_items WHERE document_id = $1::uuid", [
    documentId,
  ]);

  if (!lineItems.length) return [];

  const payload = lineItems.map((item, index) => ({
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    total: item.total,
    sort_order: index,
    catalog_service_id: item.catalogServiceId ?? null,
    item_source: item.source,
  }));

  const result = await client.query<NeonLineJsonRow>(
    `
      WITH input AS (
        SELECT *
        FROM jsonb_to_recordset($2::jsonb) AS x(
          description text,
          quantity numeric,
          unit_price numeric,
          total numeric,
          sort_order integer,
          catalog_service_id text,
          item_source public.item_source
        )
      ), saved AS (
        INSERT INTO public.document_line_items (
          document_id, description, quantity, unit_price, total,
          sort_order, catalog_service_id, item_source
        )
        SELECT
          $1::uuid, description, quantity, unit_price, total,
          sort_order, catalog_service_id, item_source
        FROM input
        ORDER BY sort_order
        RETURNING *
      )
      SELECT to_jsonb(saved) AS row
      FROM saved
      ORDER BY (row->>'sort_order')::integer
    `,
    [documentId, JSON.stringify(payload)],
  );

  return result.rows.map(({ row }) => row);
}

export async function saveDocumentNeon(
  form: InvoiceFormData,
  existingId?: string,
  options?: NeonSaveDocumentOptions,
): Promise<InvoiceDocument> {
  if (form.issuerSignatureImage.trim()) {
    parseSignatureDataUrl(form.issuerSignatureImage);
  }

  return withNeonTransaction(async (client) => {
    let clientId = form.clientId;
    if (
      !clientId &&
      options?.createClientIfMissing &&
      form.clientName.trim()
    ) {
      clientId = await createClientInsideTransaction(client, form);
    }

    let documentNumber = form.documentNumber;
    if (!existingId) {
      const numberResult = await client.query<NumberRow>(
        "SELECT public.next_document_number($1, $2::public.document_type) AS number",
        [form.businessId, form.documentType],
      );
      documentNumber = numberResult.rows[0]?.number ?? "";
      if (!documentNumber) {
        throw new Error("Falha ao reservar número do documento.");
      }
    }

    const { payload, lineItems } = buildDocumentPayload(
      form,
      documentNumber,
      clientId,
      options,
    );

    const row = existingId
      ? await updateDocument(client, existingId, payload)
      : await insertDocument(client, payload);

    const savedLines = await replaceLineItems(client, row.id, lineItems);
    return mapDocument(row, savedLines);
  });
}

export async function findInvoiceBySourceProformaNeon(
  proformaId: string,
): Promise<InvoiceDocument | null> {
  const rows = await queryDocuments(
    `
      SELECT to_jsonb(d) AS row
      FROM public.documents d
      WHERE d.converted_from_document_id = $1::uuid
        AND d.document_type = 'invoice'::public.document_type
      LIMIT 1
    `,
    [proformaId],
  );
  const row = rows[0];
  if (!row) return null;
  return mapDocument(row, await fetchLineItems([row.id]));
}

async function updateAndLoad(
  id: string,
  setSql: string,
  values: readonly unknown[] = [],
): Promise<InvoiceDocument> {
  const result = await neonQuery<NeonDocumentJsonRow>(
    `
      WITH saved AS (
        UPDATE public.documents
        SET ${setSql}
        WHERE id = $1::uuid
        RETURNING *
      )
      SELECT to_jsonb(saved) AS row FROM saved
    `,
    [id, ...values],
  );
  const row = result.rows[0]?.row;
  if (!row) throw new Error("Documento não encontrado.");
  return mapDocument(row, await fetchLineItems([row.id]));
}

export function markEmailSentNeon(id: string): Promise<InvoiceDocument> {
  return updateAndLoad(id, "email_sent_at = now()");
}

export function markWhatsAppSharedNeon(id: string): Promise<InvoiceDocument> {
  return updateAndLoad(id, "whatsapp_shared_at = now()");
}

export function markClientApprovalPendingNeon(id: string): Promise<InvoiceDocument> {
  return updateAndLoad(
    id,
    "client_approval_status = 'pending', client_approved_at = NULL, client_approval_note = NULL",
  );
}

export function recordClientApprovalNeon(
  id: string,
  status: "approved" | "changes_requested",
  note?: string,
): Promise<InvoiceDocument> {
  return updateAndLoad(
    id,
    "client_approval_status = $2, client_approved_at = now(), client_approval_note = $3",
    [status, note?.trim() || null],
  );
}

export async function countPortalApprovalsPendingNeon(): Promise<number> {
  const result = await neonQuery<CountRow>(`
    SELECT count(*)::int AS count
    FROM public.documents
    WHERE document_type = 'proforma'::public.document_type
      AND status = 'sent'::public.document_status
      AND client_approval_status = 'pending'
  `);
  return result.rows[0]?.count ?? 0;
}

export async function countPortalClientResponsesNeon(): Promise<number> {
  const result = await neonQuery<CountRow>(`
    SELECT count(*)::int AS count
    FROM public.documents
    WHERE document_type = 'proforma'::public.document_type
      AND status = 'sent'::public.document_status
      AND client_approval_status IN ('approved', 'changes_requested')
  `);
  return result.rows[0]?.count ?? 0;
}

export function updateDocumentStatusNeon(
  id: string,
  status: InvoiceDocument["status"],
): Promise<InvoiceDocument> {
  return updateAndLoad(id, "status = $2::public.document_status", [status]);
}

export function markPdfGeneratedNeon(id: string): Promise<InvoiceDocument> {
  return updateAndLoad(id, "pdf_generated_at = now()");
}

export async function deleteDocumentNeon(id: string): Promise<void> {
  await neonQuery("DELETE FROM public.documents WHERE id = $1::uuid", [id]);
}

export async function getDashboardStatsNeon(): Promise<DashboardStats> {
  const result = await neonQuery<{
    total_proformas: number;
    total_invoices: number;
    total_receipts: number;
    total_draft: number;
    total_paid: number;
  }>(`
    SELECT
      count(*) FILTER (WHERE document_type = 'proforma'::public.document_type)::int AS total_proformas,
      count(*) FILTER (WHERE document_type = 'invoice'::public.document_type)::int AS total_invoices,
      count(*) FILTER (WHERE document_type = 'receipt'::public.document_type)::int AS total_receipts,
      count(*) FILTER (WHERE status = 'draft'::public.document_status)::int AS total_draft,
      count(*) FILTER (WHERE status = 'paid'::public.document_status)::int AS total_paid
    FROM public.documents
  `);
  const counts = result.rows[0];
  const recentDocuments = await listDocumentsNeon({ limit: 8 });

  return {
    totalProformas: counts?.total_proformas ?? 0,
    totalInvoices: counts?.total_invoices ?? 0,
    totalReceipts: counts?.total_receipts ?? 0,
    totalDraft: counts?.total_draft ?? 0,
    totalPaid: counts?.total_paid ?? 0,
    recentDocuments,
  };
}
