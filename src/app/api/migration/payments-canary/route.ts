import { NextResponse } from "next/server";
import {
  deleteDocument,
  getDocumentById,
  saveDocument,
} from "@/lib/admin/repositories/documents.repository";
import type { InvoiceFormData } from "@/lib/admin/types";
import {
  createPayment,
  listPayments,
  listPaymentsBatch,
  listPaymentsByClientId,
  listPaymentsByEventId,
  sumPaymentsForSourceDocument,
} from "@/lib/finance/repositories/payments.repository";
import { registerPayment } from "@/lib/finance/services/register-payment.service";
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

function sourceForm(suffix: string): InvoiceFormData {
  return {
    documentType: "proforma",
    documentNumber: "",
    businessId: "haxr-signature",
    status: "sent",
    currency: "MZN",
    clientId: null,
    clientType: "individual",
    clientName: `Migration Payment Canary ${suffix}`,
    companyName: "",
    clientNuit: "",
    clientEmail: `payment-${suffix}@example.invalid`,
    clientPhone: "+258840000001",
    clientAddress: "Maputo",
    eventId: "1251bc6e-fac7-46cd-981d-bb3e4c066ce8",
    eventType: "other",
    eventName: "Evento Teste Staging A",
    eventDate: "2026-12-31",
    eventLocation: "Maputo",
    issueDate: "2026-08-25",
    expiryDate: "2026-09-25",
    notes: "Temporary integrated payments migration canary",
    lineItems: [
      {
        id: `payment-source-${suffix}`,
        description: "Migration Payment Canary Source",
        quantity: 1,
        unitPrice: 1000,
        total: 1000,
        source: "manual",
        catalogServiceId: null,
      },
    ],
    includeVat: false,
    issuerSignatureId: null,
    issuerName: "HAXR Migration QA",
    issuerRole: "QA",
    issuerSignatureImage: "",
    pdfTemplate: "editorial_ivory",
    contactChannel: "financeiro",
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

  const suffix = Date.now().toString(36);
  const directReference = `PAY-DIRECT-${suffix}`;
  const serviceReference = `PAY-SERVICE-${suffix}`;
  let stage = "initial_state";

  const initialPayments = await listPayments(500);
  const initialBatch = await listPaymentsBatch();
  const initialDocumentsResult = await neonQuery<{ count: number }>(
    "SELECT count(*)::int AS count FROM public.documents",
  );
  const initialDocuments = initialDocumentsResult.rows[0]?.count ?? 0;
  const sequenceSnapshotResult = await neonQuery<SequenceSnapshot>(`
    SELECT document_type::text AS document_type, year, last_sequence
    FROM public.document_sequences
    WHERE business_id = 'haxr-signature'
      AND document_type IN ('proforma', 'invoice', 'receipt')
  `);
  const sequenceSnapshot = sequenceSnapshotResult.rows;

  let sourceDocumentId: string | null = null;
  let receiptDocumentId: string | null = null;
  let clientId: string | null = null;

  try {
    stage = "create_source_document";
    const source = await saveDocument(sourceForm(suffix), undefined, {
      createClientIfMissing: true,
    });
    sourceDocumentId = source.id;
    clientId = source.clientId;

    stage = "direct_payment";
    const direct = await createPayment({
      businessId: "haxr-signature",
      clientId: source.clientId,
      clientName: source.clientName,
      eventId: source.event.eventId,
      sourceDocumentId: source.id,
      sourceDocumentNumber: source.documentNumber,
      amount: 100,
      currency: "MZN",
      paymentMethod: "mpesa",
      reference: directReference,
      notes: "Direct repository payment canary",
      paidAt: "2026-08-25T12:00:00.000Z",
    });

    const partialTotal = await sumPaymentsForSourceDocument(source.id);

    stage = "register_payment_service";
    const registered = await registerPayment({
      businessId: "haxr-signature",
      clientId: source.clientId,
      clientName: source.clientName,
      eventId: source.event.eventId,
      sourceDocumentId: source.id,
      amount: 900,
      currency: "MZN",
      paymentMethod: "bank_transfer",
      reference: serviceReference,
      notes: "Integrated registerPayment canary",
      paidAt: "2026-08-25T12:05:00.000Z",
      generateReceipt: true,
    });
    receiptDocumentId = registered.receipt?.id ?? null;

    stage = "validate_repository_reads";
    const all = await listPayments(500);
    const batch = await listPaymentsBatch();
    const byClient = source.clientId
      ? await listPaymentsByClientId(source.clientId, 100)
      : [];
    const byEvent = source.event.eventId
      ? await listPaymentsByEventId(source.event.eventId, 100)
      : [];
    const totalPaid = await sumPaymentsForSourceDocument(source.id);
    const paidSource = await getDocumentById(source.id);

    const operations = {
      baselineAvailable: initialBatch.available === true,
      sourceDocument:
        source.totals.grandTotal === 1000 &&
        source.status === "sent" &&
        Boolean(source.clientId),
      directCreate:
        direct.amount === 100 &&
        direct.paymentMethod === "mpesa" &&
        direct.sourceDocumentId === source.id &&
        direct.reference === directReference,
      partialSum: partialTotal === 100,
      servicePayment:
        registered.payment.amount === 900 &&
        registered.payment.sourceDocumentId === source.id &&
        registered.payment.reference === serviceReference,
      receipt:
        registered.receipt?.documentType === "receipt" &&
        registered.receipt.status === "paid" &&
        registered.receipt.totals.grandTotal === 900 &&
        registered.payment.documentId === registered.receipt.id,
      fullyPaid:
        registered.sourceFullyPaid === true && paidSource?.status === "paid",
      fullSum: totalPaid === 1000,
      listAll:
        all.length >= initialPayments.length + 2 &&
        all.some((item) => item.id === direct.id) &&
        all.some((item) => item.id === registered.payment.id),
      batch:
        batch.available === true &&
        batch.items.some((item) => item.id === direct.id) &&
        batch.items.some((item) => item.id === registered.payment.id),
      byClient:
        Boolean(source.clientId) &&
        byClient.some((item) => item.id === direct.id) &&
        byClient.some((item) => item.id === registered.payment.id),
      byEvent:
        Boolean(source.event.eventId) &&
        byEvent.some((item) => item.id === direct.id) &&
        byEvent.some((item) => item.id === registered.payment.id),
    };

    stage = "cleanup";
    await neonQuery(
      "DELETE FROM public.payments WHERE reference = ANY($1::text[])",
      [[directReference, serviceReference]],
    );

    if (receiptDocumentId) {
      await deleteDocument(receiptDocumentId);
      receiptDocumentId = null;
    }
    await deleteDocument(source.id);
    sourceDocumentId = null;

    if (clientId) {
      await neonQuery("DELETE FROM public.clients WHERE id = $1::uuid", [clientId]);
      clientId = null;
    }

    await restoreSequences(sequenceSnapshot);

    const finalPayments = await listPayments(500);
    const finalDocumentsResult = await neonQuery<{ count: number }>(
      "SELECT count(*)::int AS count FROM public.documents",
    );
    const finalDocuments = finalDocumentsResult.rows[0]?.count ?? 0;
    const residualCanaryResult = await neonQuery<{ count: number }>(
      `
        SELECT count(*)::int AS count
        FROM public.payments
        WHERE reference = ANY($1::text[])
      `,
      [[directReference, serviceReference]],
    );

    const cleanup =
      finalPayments.length === initialPayments.length &&
      finalDocuments === initialDocuments &&
      (residualCanaryResult.rows[0]?.count ?? 0) === 0;

    const ok = Object.values(operations).every(Boolean) && cleanup;

    return NextResponse.json(
      {
        ok,
        operations: { ...operations, cleanup },
        initialPaymentCount: initialPayments.length,
        finalPaymentCount: finalPayments.length,
      },
      { status: ok ? 200 : 503 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_error";
    console.error("[payments-neon-canary]", stage, message);
    return NextResponse.json(
      {
        ok: false,
        error: "payments_neon_canary_failed",
        stage,
        message,
      },
      { status: 503 },
    );
  } finally {
    await neonQuery(
      "DELETE FROM public.payments WHERE reference = ANY($1::text[])",
      [[directReference, serviceReference]],
    ).catch(() => undefined);

    if (receiptDocumentId) {
      await deleteDocument(receiptDocumentId).catch(() => undefined);
    }
    if (sourceDocumentId) {
      await deleteDocument(sourceDocumentId).catch(() => undefined);
    }

    await neonQuery(
      "DELETE FROM public.documents WHERE client_name = $1",
      [`Migration Payment Canary ${suffix}`],
    ).catch(() => undefined);

    if (clientId) {
      await neonQuery("DELETE FROM public.clients WHERE id = $1::uuid", [clientId]).catch(
        () => undefined,
      );
    }
    await neonQuery(
      "DELETE FROM public.clients WHERE client_name = $1",
      [`Migration Payment Canary ${suffix}`],
    ).catch(() => undefined);

    await restoreSequences(sequenceSnapshot).catch(() => undefined);
  }
}
