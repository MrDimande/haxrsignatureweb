import { VAT_RATE } from "@/lib/admin/constants";
import { mapDocument } from "@/lib/admin/db/mappers";
import type { TablesInsert } from "@/lib/supabase/database.types";
import { createAdminClient } from "@/lib/supabase/server";
import { asTableRow, asTableRows } from "@/lib/supabase/helpers";
import { calculateLineItems, calculateTotals } from "@/lib/calculations";
import type {
  BusinessId,
  DashboardStats,
  DocumentType,
  InvoiceDocument,
  InvoiceFormData,
} from "@/lib/admin/types";

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

export async function listDocuments(filters?: {
  documentType?: DocumentType;
  businessId?: BusinessId;
  status?: InvoiceDocument["status"];
  clientId?: string;
  eventId?: string;
  limit?: number;
}): Promise<InvoiceDocument[]> {
  const supabase = createAdminClient();
  let query = supabase
    .from("documents")
    .select("*")
    .order("updated_at", { ascending: false });

  if (filters?.documentType) {
    query = query.eq("document_type", filters.documentType);
  }
  if (filters?.businessId) {
    query = query.eq("business_id", filters.businessId);
  }
  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.clientId) {
    query = query.eq("client_id", filters.clientId);
  }
  if (filters?.eventId) {
    query = query.eq("event_id", filters.eventId);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data: docs, error } = await query;
  if (error) throw new Error(error.message);

  const rows = asTableRows<"documents">(docs);
  if (rows.length === 0) return [];

  const lineItems = await fetchLineItems(rows.map((d) => d.id));
  return rows.map((doc) =>
    mapDocument(
      doc,
      lineItems.filter((li) => li.document_id === doc.id)
    )
  );
}

export async function getDocumentById(id: string): Promise<InvoiceDocument | null> {
  const supabase = createAdminClient();
  const { data: docRow, error } = await supabase
    .from("documents")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  const doc = asTableRow<"documents">(docRow);
  if (!doc) return null;

  const lineItems = await fetchLineItems([doc.id]);
  return mapDocument(doc, lineItems.filter((li) => li.document_id === doc.id));
}

export async function peekDocumentNumber(
  businessId: BusinessId,
  documentType: DocumentType
): Promise<string> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("peek_document_number", {
    p_business_id: businessId,
    p_document_type: documentType,
  } as never);

  if (error) throw new Error(error.message);
  return data as string;
}

export async function reserveDocumentNumber(
  businessId: BusinessId,
  documentType: DocumentType
): Promise<string> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("next_document_number", {
    p_business_id: businessId,
    p_document_type: documentType,
  } as never);

  if (error) throw new Error(error.message);
  return data as string;
}

export async function saveDocument(
  form: InvoiceFormData,
  existingId?: string
): Promise<InvoiceDocument> {
  const supabase = createAdminClient();
  const lineItems = calculateLineItems(form.lineItems);
  const totals = calculateTotals(lineItems, form.includeVat, form.currency, VAT_RATE);

  let documentNumber = form.documentNumber;

  if (!existingId) {
    documentNumber = await reserveDocumentNumber(form.businessId, form.documentType);
  }

  const docPayload: TablesInsert<"documents"> = {
    business_id: form.businessId,
    document_type: form.documentType,
    document_number: documentNumber,
    status: form.status,
    currency: form.currency,
    client_id: form.clientId,
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
  };

  let doc;

  if (existingId) {
    const { data, error: docError } = await supabase
      .from("documents")
      .update(docPayload as never)
      .eq("id", existingId)
      .select("*")
      .single();
    if (docError) throw new Error(docError.message);
    doc = asTableRow<"documents">(data);
  } else {
    const { data, error: docError } = await supabase
      .from("documents")
      .insert(docPayload as never)
      .select("*")
      .single();
    if (docError) throw new Error(docError.message);
    doc = asTableRow<"documents">(data);
  }

  if (!doc) throw new Error("Falha ao guardar documento.");

  if (existingId) {
    const { error: deleteError } = await supabase
      .from("document_line_items")
      .delete()
      .eq("document_id", existingId);
    if (deleteError) throw new Error(deleteError.message);
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

  const savedLines = asTableRows<"document_line_items">(savedLinesData);

  return mapDocument(doc, savedLines);
}

export async function updateDocumentStatus(
  id: string,
  status: InvoiceDocument["status"]
): Promise<InvoiceDocument> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("documents")
    .update({ status } as never)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  const doc = asTableRow<"documents">(data);
  if (!doc) throw new Error("Documento não encontrado.");

  const lineItems = await fetchLineItems([doc.id]);
  return mapDocument(doc, lineItems.filter((li) => li.document_id === doc.id));
}

export async function markPdfGenerated(id: string): Promise<InvoiceDocument> {
  const supabase = createAdminClient();
  const { data: docRow, error } = await supabase
    .from("documents")
    .update({ pdf_generated_at: new Date().toISOString() } as never)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  const doc = asTableRow<"documents">(docRow);
  if (!doc) throw new Error("Documento não encontrado.");

  const lineItems = await fetchLineItems([doc.id]);
  return mapDocument(doc, lineItems.filter((li) => li.document_id === doc.id));
}

export async function deleteDocument(id: string): Promise<void> {
  const supabase = createAdminClient();

  const { error: linesError } = await supabase
    .from("document_line_items")
    .delete()
    .eq("document_id", id);

  if (linesError) throw new Error(linesError.message);

  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = createAdminClient();

  const [
    { count: totalProformas },
    { count: totalInvoices },
    { count: totalReceipts },
    { count: totalDraft },
    { count: totalPaid },
  ] = await Promise.all([
    supabase
      .from("documents")
      .select("*", { count: "exact", head: true })
      .eq("document_type", "proforma"),
    supabase
      .from("documents")
      .select("*", { count: "exact", head: true })
      .eq("document_type", "invoice"),
    supabase
      .from("documents")
      .select("*", { count: "exact", head: true })
      .eq("document_type", "receipt"),
    supabase
      .from("documents")
      .select("*", { count: "exact", head: true })
      .eq("status", "draft"),
    supabase
      .from("documents")
      .select("*", { count: "exact", head: true })
      .eq("status", "paid"),
  ]);

  const recentDocuments = await listDocuments({ limit: 8 });

  return {
    totalProformas: totalProformas ?? 0,
    totalInvoices: totalInvoices ?? 0,
    totalReceipts: totalReceipts ?? 0,
    totalDraft: totalDraft ?? 0,
    totalPaid: totalPaid ?? 0,
    recentDocuments,
  };
}
