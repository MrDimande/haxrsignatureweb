import type { PoolClient } from "pg";
import { VAT_RATE } from "@/lib/admin/constants";
import { mapDocument } from "@/lib/admin/db/mappers";
import { parseSignatureDataUrl } from "@/lib/admin/signatures";
import { calculateLineItems, calculateTotals } from "@/lib/calculations";
import type { InvoiceDocument, InvoiceFormData } from "@/lib/admin/types";
import type { Tables } from "@/lib/supabase/database.types";
import { withNeonTransaction } from "@/lib/neon/server-db";

type DocumentRow = Tables<"documents"> & {
  pdf_template?: string;
  contact_channel?: string;
};
type LineItemRow = Tables<"document_line_items">;
type NeonDocumentJsonRow = { row: DocumentRow };
type NeonLineJsonRow = { row: LineItemRow };
type NumberRow = { number: string };
type ClientIdRow = { id: string };

export type NeonSaveDocumentOptions = {
  convertedFromDocumentId?: string;
  createClientIfMissing?: boolean;
};

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
  const totals = calculateTotals(
    lineItems,
    form.includeVat,
    form.currency,
    VAT_RATE,
  );

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
        SELECT *
        FROM jsonb_to_record($1::jsonb) AS x(${DOCUMENT_RECORD_DEFINITION})
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
      SELECT to_jsonb(saved) AS row
      FROM saved
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
        SELECT *
        FROM jsonb_to_record($2::jsonb) AS x(${DOCUMENT_RECORD_DEFINITION})
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
      SELECT to_jsonb(saved) AS row
      FROM saved
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
  await client.query(
    "DELETE FROM public.document_line_items WHERE document_id = $1::uuid",
    [documentId],
  );

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
          document_id,
          description,
          quantity,
          unit_price,
          total,
          sort_order,
          catalog_service_id,
          item_source
        )
        SELECT
          $1::uuid,
          description,
          quantity,
          unit_price,
          total,
          sort_order,
          catalog_service_id,
          item_source
        FROM input
        ORDER BY sort_order
        RETURNING *
      )
      SELECT to_jsonb(saved) AS row
      FROM saved
      ORDER BY saved.sort_order
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
