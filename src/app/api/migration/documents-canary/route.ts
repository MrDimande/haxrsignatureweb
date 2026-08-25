import { NextResponse } from "next/server";
import {
  countPortalApprovalsPending,
  countPortalClientResponses,
  deleteDocument,
  findInvoiceBySourceProforma,
  getDashboardStats,
  getDocumentById,
  listDocuments,
  listDocumentsForClient,
  listOperationalDocuments,
  listPortalDocumentsForClient,
  markClientApprovalPending,
  markEmailSent,
  markPdfGenerated,
  markWhatsAppShared,
  peekDocumentNumber,
  recordClientApproval,
  reserveDocumentNumber,
  saveDocument,
  updateDocumentStatus,
} from "@/lib/admin/repositories/documents.repository";
import type { InvoiceFormData } from "@/lib/admin/types";
import { neonQuery } from "@/lib/neon/server-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SequenceSnapshot = {
  document_type: "proforma" | "invoice" | "receipt";
  year: number;
  last_sequence: number;
};

function isMigrationPreview(): boolean {
  return (
    process.env.VERCEL_ENV === "preview" &&
    process.env.VERCEL_GIT_COMMIT_REF === "migration/supabase-to-neon"
  );
}

function makeForm(
  suffix: string,
  overrides: Partial<InvoiceFormData> = {},
): InvoiceFormData {
  return {
    documentType: "proforma",
    documentNumber: "",
    businessId: "haxr-signature",
    status: "draft",
    currency: "MZN",
    clientId: null,
    clientType: "individual",
    clientName: `Migration Document Canary ${suffix}`,
    companyName: "",
    clientNuit: "",
    clientEmail: `migration-${suffix}@example.invalid`,
    clientPhone: "+258840000000",
    clientAddress: "Maputo",
    eventId: null,
    eventType: "other",
    eventName: `Migration Canary Event ${suffix}`,
    eventDate: "2026-12-31",
    eventLocation: "Maputo",
    issueDate: "2026-08-25",
    expiryDate: "2026-09-25",
    notes: "Temporary Neon migration canary",
    lineItems: [
      {
        id: `migration-line-a-${suffix}`,
        description: "Migration Canary Service A",
        quantity: 2,
        unitPrice: 500,
        total: 1000,
        source: "manual",
        catalogServiceId: null,
      },
      {
        id: `migration-line-b-${suffix}`,
        description: "Migration Canary Service B",
        quantity: 1,
        unitPrice: 250,
        total: 250,
        source: "manual",
        catalogServiceId: null,
      },
    ],
    includeVat: true,
    issuerSignatureId: null,
    issuerName: "HAXR Migration QA",
    issuerRole: "QA",
    issuerSignatureImage: "",
    pdfTemplate: "maison_signature",
    contactChannel: "info",
    ...overrides,
  };
}

async function restoreSequences(snapshot: SequenceSnapshot[]) {
  const types = ["proforma", "invoice", "receipt"] as const;
  const currentYear = new Date().getUTCFullYear();

  for (const documentType of types) {
    const previous = snapshot.find(
      (row) => row.document_type === documentType && row.year === currentYear,
    );

    if (previous) {
      await neonQuery(
        `
          INSERT INTO public.document_sequences (
            business_id, document_type, year, last_sequence
          )
          VALUES ($1, $2::public.document_type, $3, $4)
          ON CONFLICT (business_id, document_type, year)
          DO UPDATE SET last_sequence = EXCLUDED.last_sequence
        `,
        ["haxr-signature", documentType, previous.year, previous.last_sequence],
      );
    } else {
      await neonQuery(
        `
          DELETE FROM public.document_sequences
          WHERE business_id = $1
            AND document_type = $2::public.document_type
            AND year = $3
        `,
        ["haxr-signature", documentType, currentYear],
      );
    }
  }
}

export async function GET() {
  if (!isMigrationPreview()) {
    return new NextResponse(null, { status: 404 });
  }

  const initialDocuments = await listDocuments();
  const initialOperational = await listOperationalDocuments();
  const initialDashboard = await getDashboardStats();
  const sequenceSnapshotResult = await neonQuery<SequenceSnapshot>(`
    SELECT document_type::text AS document_type, year, last_sequence
    FROM public.document_sequences
    WHERE business_id = 'haxr-signature'
      AND document_type IN ('proforma', 'invoice', 'receipt')
  `);
  const sequenceSnapshot = sequenceSnapshotResult.rows;

  const suffix = Date.now().toString(36);
  const createdDocumentIds: string[] = [];
  let createdClientId: string | null = null;

  try {
    const peekBefore = await peekDocumentNumber("haxr-signature", "proforma");

    const proforma = await saveDocument(makeForm(suffix), undefined, {
      createClientIfMissing: true,
    });
    createdDocumentIds.push(proforma.id);
    createdClientId = proforma.clientId;

    const fetched = await getDocumentById(proforma.id);
    const filtered = await listDocuments({
      documentType: "proforma",
      businessId: "haxr-signature",
      clientId: proforma.clientId ?? undefined,
    });
    const forClient = proforma.clientId
      ? await listDocumentsForClient({
          id: proforma.clientId,
          fullName: proforma.clientName,
        })
      : [];

    const updated = await saveDocument(
      makeForm(suffix, {
        documentNumber: proforma.documentNumber,
        clientId: proforma.clientId,
        notes: "Updated Neon migration canary",
        pdfTemplate: "executive",
        contactChannel: "financeiro",
        lineItems: [
          {
            id: `migration-line-updated-${suffix}`,
            description: "Migration Canary Updated Service",
            quantity: 3,
            unitPrice: 700,
            total: 2100,
            source: "manual",
            catalogServiceId: null,
          },
        ],
      }),
      proforma.id,
    );

    const emailed = await markEmailSent(proforma.id);
    const whatsapped = await markWhatsAppShared(proforma.id);
    const pending = await markClientApprovalPending(proforma.id);
    const approvalsPendingDuring = await countPortalApprovalsPending();
    const approved = await recordClientApproval(
      proforma.id,
      "approved",
      "migration-canary-approved",
    );
    const sent = await updateDocumentStatus(proforma.id, "sent");
    const responsesDuring = await countPortalClientResponses();
    const pdf = await markPdfGenerated(proforma.id);

    const portalDocuments = proforma.clientId
      ? await listPortalDocumentsForClient({
          id: proforma.clientId,
          fullName: proforma.clientName,
        })
      : [];

    const invoice = await saveDocument(
      makeForm(suffix, {
        documentType: "invoice",
        clientId: proforma.clientId,
        clientName: proforma.clientName,
        clientEmail: proforma.clientEmail,
        documentNumber: "",
        status: "draft",
        pdfTemplate: "atelier_blanc",
        contactChannel: "convites",
      }),
      undefined,
      { convertedFromDocumentId: proforma.id },
    );
    createdDocumentIds.push(invoice.id);

    const convertedInvoice = await findInvoiceBySourceProforma(proforma.id);

    const receiptPeekBefore = await peekDocumentNumber(
      "haxr-signature",
      "receipt",
    );
    const [receiptA, receiptB] = await Promise.all([
      reserveDocumentNumber("haxr-signature", "receipt"),
      reserveDocumentNumber("haxr-signature", "receipt"),
    ]);
    const receiptPeekAfter = await peekDocumentNumber(
      "haxr-signature",
      "receipt",
    );

    const dashboardDuring = await getDashboardStats();
    const operationalDuring = await listOperationalDocuments();

    const operations = {
      createAtomic:
        proforma.documentNumber === peekBefore &&
        Boolean(proforma.clientId) &&
        proforma.lineItems.length === 2 &&
        proforma.pdfTemplate === "maison_signature" &&
        proforma.contactChannel === "info",
      readById:
        fetched?.id === proforma.id &&
        fetched.lineItems.length === 2 &&
        fetched.clientId === proforma.clientId,
      filteredList: filtered.some((doc) => doc.id === proforma.id),
      clientList: forClient.some((doc) => doc.id === proforma.id),
      updateAtomic:
        updated.id === proforma.id &&
        updated.documentNumber === proforma.documentNumber &&
        updated.lineItems.length === 1 &&
        updated.lineItems[0]?.quantity === 3 &&
        updated.pdfTemplate === "executive" &&
        updated.contactChannel === "financeiro",
      email: Boolean(emailed.emailSentAt),
      whatsapp: Boolean(whatsapped.whatsappSharedAt),
      approvalPending:
        pending.clientApprovalStatus === "pending" &&
        approvalsPendingDuring >= initialDashboard.totalProformas,
      approvalResponse:
        approved.clientApprovalStatus === "approved" &&
        approved.clientApprovalNote === "migration-canary-approved" &&
        responsesDuring >= 1,
      status: sent.status === "sent",
      pdf: Boolean(pdf.pdfGeneratedAt),
      portalVisibility: portalDocuments.some((doc) => doc.id === proforma.id),
      conversion:
        invoice.convertedFromDocumentId === proforma.id &&
        convertedInvoice?.id === invoice.id,
      concurrentNumbering:
        receiptA !== receiptB &&
        receiptA !== receiptPeekBefore &&
        receiptB !== receiptPeekBefore &&
        receiptPeekAfter !== receiptA &&
        receiptPeekAfter !== receiptB,
      dashboard:
        dashboardDuring.totalProformas >= initialDashboard.totalProformas + 1 &&
        dashboardDuring.totalInvoices >= initialDashboard.totalInvoices + 1,
      operationalList:
        operationalDuring.length >= initialOperational.length + 2 &&
        operationalDuring.some((doc) => doc.id === proforma.id) &&
        operationalDuring.some((doc) => doc.id === invoice.id),
    };

    await deleteDocument(invoice.id);
    createdDocumentIds.splice(createdDocumentIds.indexOf(invoice.id), 1);
    await deleteDocument(proforma.id);
    createdDocumentIds.splice(createdDocumentIds.indexOf(proforma.id), 1);

    if (createdClientId) {
      await neonQuery("DELETE FROM public.clients WHERE id = $1::uuid", [
        createdClientId,
      ]);
      createdClientId = null;
    }

    await restoreSequences(sequenceSnapshot);

    const finalDocuments = await listDocuments();
    const finalOperational = await listOperationalDocuments();
    const finalDashboard = await getDashboardStats();

    const cleanup =
      finalDocuments.length === initialDocuments.length &&
      finalOperational.length === initialOperational.length &&
      finalDashboard.totalProformas === initialDashboard.totalProformas &&
      finalDashboard.totalInvoices === initialDashboard.totalInvoices &&
      finalDashboard.totalReceipts === initialDashboard.totalReceipts;

    const ok = Object.values(operations).every(Boolean) && cleanup;

    return NextResponse.json(
      {
        ok,
        operations: { ...operations, cleanup },
        initialDocumentCount: initialDocuments.length,
        finalDocumentCount: finalDocuments.length,
      },
      { status: ok ? 200 : 503 },
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "documents_neon_canary_failed" },
      { status: 503 },
    );
  } finally {
    if (createdDocumentIds.length) {
      await neonQuery(
        "DELETE FROM public.documents WHERE id = ANY($1::uuid[])",
        [createdDocumentIds],
      ).catch(() => undefined);
    }

    if (createdClientId) {
      await neonQuery("DELETE FROM public.clients WHERE id = $1::uuid", [
        createdClientId,
      ]).catch(() => undefined);
    }

    await restoreSequences(sequenceSnapshot).catch(() => undefined);
  }
}
