import { VAT_RATE } from "@/lib/admin/constants";
import { parseSignatureDataUrl } from "@/lib/admin/signatures";
import { upsertClient } from "@/lib/admin/repositories/clients.repository";
import { mapDocument } from "@/lib/admin/db/mappers";
import type { Tables, TablesInsert } from "@/lib/supabase/database.types";
import { createAdminClient } from "@/lib/supabase/server";
import { asTableRow, asTableRows } from "@/lib/supabase/helpers";
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
import { documentBelongsToPortalClient } from "@/lib/portal/services/portal-client-match";

export type SupabaseSaveDocumentOptions = {
  convertedFromDocumentId?: string;
  createClientIfMissing?: boolean;
};

function mapOperationalDocument(row: Tables<"documents">): AdminOperationalDocument {
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
      "converted_from_document_id" in row &&
      typeof row.converted_from_document_id === "string"
        ? row.converted_from_document_id
        : null,
    clientApprovalStatus:
      "client_approval_status" in row &&
      typeof row.client_approval_status === "string"
        ? (row.client_approval_status as InvoiceDocument["clientApprovalStatus"])
        : null,
    clientApprovedAt:
      "client_approved_at" in row && typeof row.client_approved_at === "string"
        ? row.client_approved_at
        : null,
    clientApprovalNote:
      "client_approval_note" in row && typeof row.client_approval_note === "string"
        ? row.client_approval_note
        : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    emailSentAt:
      "email_sent_at" in row && typeof row.email_sent_at === "string"
        ? row.email_sent_at
        : null,
  };
}

const OPERATIONAL_DOCUMENT_FIELDS = `
  id,
  document_type,
  document_number,
  business_id,
  status,
  currency,
  client_id,
  client_name,
  event_id,
  event_type,
  event_name,
  event_date,
  event_location,
  issue_date,
  expiry_date,
  subtotal,
  vat_rate,
  vat_amount,
  grand_total,
  include_vat,
  converted_from_document_id,
  client_approval_status,
  client_approved_at,
  client_approval_note,
  created_at,
  updated_at,
  email_sent_at
` as const;

export async function listOperationalDocumentsSupabase(): Promise<AdminOperationalDocument[]> {
  const supabase = createAdminClient();
  const { data: docs, error } = await supabase
    .from("documents")
    .select(OPERATIONAL_DOCUMENT_FIELDS)
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return asTableRows<"documents">(docs).map(mapOperationalDocument);
}

async function fetchLineItems(documentIds: string[]) {
  if (!documentIds.length) return [];
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("document_line_items")
    .select("*")
    .in("document_id", documentIds)
    .order("sort_order");
  if (error) throw new Error(error.message);
  return asTableRows<"document_line_items">(data);
}

export async function listDocumentsSupabase(filters?: {
  documentType?: DocumentType;
  businessId?: BusinessId;
  status?: InvoiceDocument["status"];
  clientId?: string;
  eventId?: string;
  limit?: number;
}): Promise<InvoiceDocument[]> {
  const supabase = createAdminClient();
  let query = supabase.from("documents").select("*").order("updated_at", { ascending: false });
  if (filters?.documentType) query = query.eq("document_type", filters.documentType);
  if (filters?.businessId) query = query.eq("business_id", filters.businessId);
  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.clientId) query = query.eq("client_id", filters.clientId);
  if (filters?.eventId) query = query.eq("event_id", filters.eventId);
  if (filters?.limit) query = query.limit(filters.limit);
  const { data: docs, error } = await query;
  if (error) throw new Error(error.message);
  const rows = asTableRows<"documents">(docs);
  if (!rows.length) return [];
  const lineItems = await fetchLineItems(rows.map((row) => row.id));
  return rows.map((row) =>
    mapDocument(row, lineItems.filter((item) => item.document_id === row.id)),
  );
}

export async function listDocumentsByEventIdsSupabase(eventIds: string[]): Promise<InvoiceDocument[]> {
  if (!eventIds.length) return [];
  const supabase = createAdminClient();
  const { data: docs, error } = await supabase
    .from("documents")
    .select("*")
    .in("event_id", eventIds)
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  const rows = asTableRows<"documents">(docs);
  if (!rows.length) return [];
  const lineItems = await fetchLineItems(rows.map((row) => row.id));
  return rows.map((row) =>
    mapDocument(row, lineItems.filter((item) => item.document_id === row.id)),
  );
}

export async function listPortalDocumentsForClientSupabase(
  client: Pick<Client, "id" | "fullName">,
): Promise<InvoiceDocument[]> {
  const documents = await listDocumentsForClientSupabase(client);
  return documents.filter((doc) => doc.status === "sent" || doc.status === "paid");
}

export async function listDocumentsForClientSupabase(
  client: Pick<Client, "id" | "fullName">,
): Promise<InvoiceDocument[]> {
  const supabase = createAdminClient();
  const { data: docs, error } = await supabase
    .from("documents")
    .select("*")
    .or(`client_id.eq.${client.id},client_id.is.null`)
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  const rows = asTableRows<"documents">(docs).filter((row) =>
    documentBelongsToPortalClient(mapDocument(row, []), client),
  );
  if (!rows.length) return [];
  const lineItems = await fetchLineItems(rows.map((row) => row.id));
  return rows.map((row) =>
    mapDocument(row, lineItems.filter((item) => item.document_id === row.id)),
  );
}

export async function getDocumentByIdSupabase(id: string): Promise<InvoiceDocument | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("documents").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  const row = asTableRow<"documents">(data);
  if (!row) return null;
  return mapDocument(row, await fetchLineItems([row.id]));
}

export async function peekDocumentNumberSupabase(
  businessId: BusinessId,
  documentType: DocumentType,
): Promise<string> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("peek_document_number", {
    p_business_id: businessId,
    p_document_type: documentType,
  } as never);
  if (error) throw new Error(error.message);
  return data as string;
}

export async function reserveDocumentNumberSupabase(
  businessId: BusinessId,
  documentType: DocumentType,
): Promise<string> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("next_document_number", {
    p_business_id: businessId,
    p_document_type: documentType,
  } as never);
  if (error) throw new Error(error.message);
  return data as string;
}

export async function saveDocumentSupabase(
  form: InvoiceFormData,
  existingId?: string,
  options?: SupabaseSaveDocumentOptions,
): Promise<InvoiceDocument> {
  const supabase = createAdminClient();
  if (form.issuerSignatureImage.trim()) parseSignatureDataUrl(form.issuerSignatureImage);

  let clientId = form.clientId;
  if (!clientId && options?.createClientIfMissing && form.clientName.trim()) {
    const client = await upsertClient({
      fullName: form.clientName.trim(),
      clientType: form.clientType,
      companyName: form.companyName.trim(),
      nuit: form.clientNuit.trim(),
      email: form.clientEmail.trim(),
      phone: form.clientPhone.trim(),
      address: form.clientAddress.trim(),
    });
    clientId = client.id;
  }

  const lineItems = calculateLineItems(form.lineItems);
  const totals = calculateTotals(lineItems, form.includeVat, form.currency, VAT_RATE);
  let documentNumber = form.documentNumber;
  if (!existingId) {
    documentNumber = await reserveDocumentNumberSupabase(form.businessId, form.documentType);
  }

  const docPayload: TablesInsert<"documents"> = {
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
    ...(options?.convertedFromDocumentId
      ? { converted_from_document_id: options.convertedFromDocumentId }
      : {}),
  } as TablesInsert<"documents">;

  let doc: Tables<"documents"> | null;
  if (existingId) {
    const { data, error } = await supabase
      .from("documents")
      .update(docPayload as never)
      .eq("id", existingId)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    doc = asTableRow<"documents">(data);
  } else {
    const { data, error } = await supabase
      .from("documents")
      .insert(docPayload as never)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    doc = asTableRow<"documents">(data);
  }
  if (!doc) throw new Error("Falha ao guardar documento.");

  if (existingId) {
    const { error } = await supabase.from("document_line_items").delete().eq("document_id", existingId);
    if (error) throw new Error(error.message);
  }

  const linePayload: TablesInsert<"document_line_items">[] = lineItems.map((item, index) => ({
    document_id: doc.id,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    total: item.total,
    sort_order: index,
    catalog_service_id: item.catalogServiceId ?? null,
    item_source: item.source,
  }));

  const { data: savedLinesData, error: linesError } = await supabase
    .from("document_line_items")
    .insert(linePayload as never)
    .select("*");
  if (linesError) throw new Error(linesError.message);
  return mapDocument(doc, asTableRows<"document_line_items">(savedLinesData));
}

export async function findInvoiceBySourceProformaSupabase(
  proformaId: string,
): Promise<InvoiceDocument | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("converted_from_document_id", proformaId)
    .eq("document_type", "invoice")
    .maybeSingle();
  if (error) throw new Error(error.message);
  const row = asTableRow<"documents">(data);
  if (!row) return null;
  return mapDocument(row, await fetchLineItems([row.id]));
}

async function updateAndLoad(
  id: string,
  payload: Record<string, unknown>,
): Promise<InvoiceDocument> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("documents")
    .update(payload as never)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  const row = asTableRow<"documents">(data);
  if (!row) throw new Error("Documento não encontrado.");
  return mapDocument(row, await fetchLineItems([row.id]));
}

export function markEmailSentSupabase(id: string): Promise<InvoiceDocument> {
  return updateAndLoad(id, { email_sent_at: new Date().toISOString() });
}

export function markWhatsAppSharedSupabase(id: string): Promise<InvoiceDocument> {
  return updateAndLoad(id, { whatsapp_shared_at: new Date().toISOString() });
}

export function markClientApprovalPendingSupabase(id: string): Promise<InvoiceDocument> {
  return updateAndLoad(id, {
    client_approval_status: "pending",
    client_approved_at: null,
    client_approval_note: null,
  });
}

export function recordClientApprovalSupabase(
  id: string,
  status: "approved" | "changes_requested",
  note?: string,
): Promise<InvoiceDocument> {
  return updateAndLoad(id, {
    client_approval_status: status,
    client_approved_at: new Date().toISOString(),
    client_approval_note: note?.trim() || null,
  });
}

export async function countPortalApprovalsPendingSupabase(): Promise<number> {
  const supabase = createAdminClient();
  const { count, error } = await supabase
    .from("documents")
    .select("*", { count: "exact", head: true })
    .eq("document_type", "proforma")
    .eq("status", "sent")
    .eq("client_approval_status", "pending");
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function countPortalClientResponsesSupabase(): Promise<number> {
  const supabase = createAdminClient();
  const { count, error } = await supabase
    .from("documents")
    .select("*", { count: "exact", head: true })
    .eq("document_type", "proforma")
    .eq("status", "sent")
    .in("client_approval_status", ["approved", "changes_requested"]);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export function updateDocumentStatusSupabase(
  id: string,
  status: InvoiceDocument["status"],
): Promise<InvoiceDocument> {
  return updateAndLoad(id, { status });
}

export function markPdfGeneratedSupabase(id: string): Promise<InvoiceDocument> {
  return updateAndLoad(id, { pdf_generated_at: new Date().toISOString() });
}

export async function deleteDocumentSupabase(id: string): Promise<void> {
  const supabase = createAdminClient();
  const { error: linesError } = await supabase
    .from("document_line_items")
    .delete()
    .eq("document_id", id);
  if (linesError) throw new Error(linesError.message);
  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function getDashboardStatsSupabase(): Promise<DashboardStats> {
  const supabase = createAdminClient();
  const [
    { count: totalProformas },
    { count: totalInvoices },
    { count: totalReceipts },
    { count: totalDraft },
    { count: totalPaid },
  ] = await Promise.all([
    supabase.from("documents").select("*", { count: "exact", head: true }).eq("document_type", "proforma"),
    supabase.from("documents").select("*", { count: "exact", head: true }).eq("document_type", "invoice"),
    supabase.from("documents").select("*", { count: "exact", head: true }).eq("document_type", "receipt"),
    supabase.from("documents").select("*", { count: "exact", head: true }).eq("status", "draft"),
    supabase.from("documents").select("*", { count: "exact", head: true }).eq("status", "paid"),
  ]);
  return {
    totalProformas: totalProformas ?? 0,
    totalInvoices: totalInvoices ?? 0,
    totalReceipts: totalReceipts ?? 0,
    totalDraft: totalDraft ?? 0,
    totalPaid: totalPaid ?? 0,
    recentDocuments: await listDocumentsSupabase({ limit: 8 }),
  };
}
