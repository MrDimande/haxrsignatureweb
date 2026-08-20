import type {
  AdminOperationalDocument,
  Currency,
  DocumentType,
} from "@/lib/admin/types";
import type { PaymentMethod, PaymentRecord } from "@/lib/finance/types";
import type { PaymentsBatchResult } from "@/lib/finance/repositories/payments.repository";
import { buildOverdueAlerts } from "@/lib/finance/extended-analytics";

export type AdminFinancialCoverage = {
  payments: boolean;
  receivedComplete: boolean;
  receivablesComplete: boolean;
};

export type AdminMoneyBucket = {
  currency: Currency;
  amount: number;
  count: number;
};

export type AdminFinancialExposureItem = {
  id: string;
  documentId: string;
  documentNumber: string;
  clientName: string | null;
  eventId: string | null;
  eventName: string | null;
  currency: Currency;
  amount: number;
  dueAt: string | null;
  daysOverdue: number | null;
  href: string;
};

export type AdminFinancialMovement = {
  id: string;
  source: "payment" | "legacy_paid_document";
  clientName: string | null;
  eventId: string | null;
  eventName: string | null;
  documentId: string | null;
  documentNumber: string | null;
  currency: Currency;
  amount: number;
  occurredAt: string;
  paymentMethod: PaymentMethod | null;
  occurredAtBasis: "payment_paid_at" | "document_issue_date";
  href: string;
};

export type AdminFinancialPosition = {
  coverage: AdminFinancialCoverage;

  received: {
    total: AdminMoneyBucket[];
    thisMonth: AdminMoneyBucket[];
  };

  receivables: {
    openInvoiceCount: number;
    overdueInvoiceCount: number;
    openInvoices: AdminMoneyBucket[];
    overdueInvoices: AdminMoneyBucket[];
    overdueItems: AdminFinancialExposureItem[];
  };

  proposals: {
    sentProformaCount: number;
    expiredProformaCount: number;
    sentProformas: AdminMoneyBucket[];
    expiredProformas: AdminMoneyBucket[];
    expiredItems: AdminFinancialExposureItem[];
  };

  recentMovements: AdminFinancialMovement[];
};

export type BuildAdminFinancialPositionInput = {
  documents: readonly AdminOperationalDocument[];
  paymentsBatch: PaymentsBatchResult;
};

const CURRENCY_ORDER: Record<Currency, number> = {
  MZN: 0,
  USD: 1,
  ZAR: 2,
};

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Extracts the calendar year and month in Africa/Maputo timezone.
 */
export function getMaputoYearMonth(
  dateInput: string | Date
): { year: number; month: number } | null {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (Number.isNaN(date.getTime())) return null;

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Maputo",
    year: "numeric",
    month: "numeric",
  }).formatToParts(date);

  const yearStr = parts.find((p) => p.type === "year")?.value;
  const monthStr = parts.find((p) => p.type === "month")?.value;

  if (!yearStr || !monthStr) return null;
  return { year: Number(yearStr), month: Number(monthStr) };
}

/**
 * Checks if a given ISO/date string belongs to the same calendar month as `now` in Africa/Maputo.
 */
export function isMaputoCurrentMonth(dateStr: string, now: Date): boolean {
  const target = getMaputoYearMonth(dateStr);
  const current = getMaputoYearMonth(now);
  if (!target || !current) return false;
  return target.year === current.year && target.month === current.month;
}

/**
 * Groups monetary entries by currency without combining different currencies.
 * Deterministically orders currencies (MZN, USD, ZAR).
 */
export function aggregateMoneyBuckets(
  items: readonly { currency: Currency; amount: number }[]
): AdminMoneyBucket[] {
  const map = new Map<Currency, { amount: number; count: number }>();

  for (const item of items) {
    const existing = map.get(item.currency) ?? { amount: 0, count: 0 };
    existing.amount += item.amount;
    existing.count += 1;
    map.set(item.currency, existing);
  }

  return Array.from(map.entries())
    .map(([currency, data]) => ({
      currency,
      amount: round(data.amount),
      count: data.count,
    }))
    .sort(
      (a, b) =>
        (CURRENCY_ORDER[a.currency] ?? 99) - (CURRENCY_ORDER[b.currency] ?? 99)
    );
}

/**
 * Pure builder that compiles raw documents and payments batch into canonical AdminFinancialPosition.
 */
export function buildAdminFinancialPosition(
  input: BuildAdminFinancialPositionInput,
  options?: { now?: Date }
): AdminFinancialPosition {
  const now = options?.now ?? new Date();
  const { documents, paymentsBatch } = input;

  const docMap = new Map(documents.map((d) => [d.id, d]));

  // If payments source is unavailable, we must not produce false certainty
  if (!paymentsBatch.available) {
    const sentInvoices = documents.filter(
      (d) => d.documentType === "invoice" && d.status === "sent"
    );
    const overdueAlerts = buildOverdueAlerts(documents, now);
    const overdueInvoiceAlerts = overdueAlerts.filter(
      (a) => a.documentType === "invoice"
    );

    const sentProformas = documents.filter(
      (d) => d.documentType === "proforma" && d.status === "sent"
    );
    const expiredProformaAlerts = overdueAlerts.filter(
      (a) => a.documentType === "proforma"
    );

    const sentProformasBuckets = aggregateMoneyBuckets(
      sentProformas.map((d) => ({
        currency: d.totals.currency,
        amount: d.totals.grandTotal,
      }))
    );

    const expiredProformasBuckets = aggregateMoneyBuckets(
      expiredProformaAlerts.map((a) => ({
        currency: a.currency,
        amount: a.amount,
      }))
    );

    const expiredItems: AdminFinancialExposureItem[] = expiredProformaAlerts
      .map((alert) => {
        const doc = docMap.get(alert.documentId);
        return {
          id: alert.documentId,
          documentId: alert.documentId,
          documentNumber: alert.documentNumber,
          clientName: doc?.clientName || alert.clientName || null,
          eventId: doc?.event.eventId ?? null,
          eventName: doc?.event.eventName || null,
          currency: alert.currency,
          amount: alert.amount,
          dueAt: alert.dueDate,
          daysOverdue: alert.daysOverdue,
          href: `/admin/documents/${alert.documentId}`,
        };
      })
      .sort(
        (a, b) =>
          (b.daysOverdue ?? 0) - (a.daysOverdue ?? 0) ||
          a.documentNumber.localeCompare(b.documentNumber)
      );

    return {
      coverage: {
        payments: false,
        receivedComplete: false,
        receivablesComplete: false,
      },
      received: {
        total: [],
        thisMonth: [],
      },
      receivables: {
        openInvoiceCount: sentInvoices.length,
        overdueInvoiceCount: overdueInvoiceAlerts.length,
        openInvoices: [],
        overdueInvoices: [],
        overdueItems: [],
      },
      proposals: {
        sentProformaCount: sentProformas.length,
        expiredProformaCount: expiredProformaAlerts.length,
        sentProformas: sentProformasBuckets,
        expiredProformas: expiredProformasBuckets,
        expiredItems,
      },
      recentMovements: [],
    };
  }

  // --- Payments Batch is Available ---
  const payments = paymentsBatch.items;

  // Group payments by linked document IDs
  const paymentsByDocId = new Map<string, PaymentRecord[]>();
  for (const payment of payments) {
    const docIds = new Set<string>();
    if (payment.documentId) docIds.add(payment.documentId);
    if (payment.sourceDocumentId) docIds.add(payment.sourceDocumentId);

    for (const docId of docIds) {
      const list = paymentsByDocId.get(docId) ?? [];
      list.push(payment);
      paymentsByDocId.set(docId, list);
    }
  }

  let crossCurrencyLinkedPaymentDetected = false;

  // Helper to compute residual outstanding balance for an invoice
  function getInvoiceOutstanding(doc: AdminOperationalDocument): {
    outstandingAmount: number;
    hasCrossCurrency: boolean;
  } {
    const linkedPayments = paymentsByDocId.get(doc.id) ?? [];
    // Deduplicate payments by id
    const uniquePaymentsMap = new Map<string, PaymentRecord>();
    for (const p of linkedPayments) {
      uniquePaymentsMap.set(p.id, p);
    }
    const uniquePayments = Array.from(uniquePaymentsMap.values());

    let sameCurrencyPaid = 0;
    let hasCrossCurrency = false;

    for (const p of uniquePayments) {
      if (p.currency === doc.totals.currency) {
        sameCurrencyPaid += p.amount;
      } else {
        hasCrossCurrency = true;
        crossCurrencyLinkedPaymentDetected = true;
      }
    }

    const outstandingAmount = round(
      Math.max(doc.totals.grandTotal - sameCurrencyPaid, 0)
    );

    return { outstandingAmount, hasCrossCurrency };
  }

  // --- 1. Received Movements & Aggregates ---
  const allReceivedMovements: AdminFinancialMovement[] = [];

  // A. Payments
  for (const payment of payments) {
    const linkedDoc =
      (payment.documentId ? docMap.get(payment.documentId) : null) ??
      (payment.sourceDocumentId
        ? docMap.get(payment.sourceDocumentId)
        : null);

    const clientName =
      payment.clientName.trim() || linkedDoc?.clientName || null;
    const eventId = payment.eventId || linkedDoc?.event.eventId || null;
    const eventName = payment.eventName.trim() || linkedDoc?.event.eventName || null;
    const documentId = payment.documentId || payment.sourceDocumentId || null;
    const documentNumber =
      payment.documentNumber ||
      payment.sourceDocumentNumber ||
      linkedDoc?.documentNumber ||
      null;

    let href = "/admin/cash";
    if (documentId) {
      href = `/admin/documents/${documentId}`;
    } else if (eventId) {
      href = `/admin/events/${eventId}`;
    }

    allReceivedMovements.push({
      id: payment.id,
      source: "payment",
      clientName,
      eventId,
      eventName,
      documentId,
      documentNumber,
      currency: payment.currency,
      amount: payment.amount,
      occurredAt: payment.paidAt,
      paymentMethod: payment.paymentMethod,
      occurredAtBasis: "payment_paid_at",
      href,
    });
  }

  // B. Legacy Paid Documents (not linked to any payment record)
  for (const doc of documents) {
    if (doc.status !== "paid") continue;

    const isLinkedToPayment = payments.some(
      (p) => p.documentId === doc.id || p.sourceDocumentId === doc.id
    );

    if (!isLinkedToPayment) {
      allReceivedMovements.push({
        id: doc.id,
        source: "legacy_paid_document",
        clientName: doc.clientName || null,
        eventId: doc.event.eventId ?? null,
        eventName: doc.event.eventName || null,
        documentId: doc.id,
        documentNumber: doc.documentNumber,
        currency: doc.totals.currency,
        amount: doc.totals.grandTotal,
        occurredAt: doc.issueDate,
        paymentMethod: null,
        occurredAtBasis: "document_issue_date",
        href: `/admin/documents/${doc.id}`,
      });
    }
  }

  // Aggregate received totals
  const receivedTotalBuckets = aggregateMoneyBuckets(
    allReceivedMovements.map((m) => ({
      currency: m.currency,
      amount: m.amount,
    }))
  );

  // Aggregate this month received
  const thisMonthMovements = allReceivedMovements.filter((m) =>
    isMaputoCurrentMonth(m.occurredAt, now)
  );
  const receivedThisMonthBuckets = aggregateMoneyBuckets(
    thisMonthMovements.map((m) => ({
      currency: m.currency,
      amount: m.amount,
    }))
  );

  // Sort recent movements by occurredAt DESC, id DESC, max 5
  const sortedMovements = [...allReceivedMovements].sort((a, b) => {
    const timeDiff =
      new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime();
    if (timeDiff !== 0) return timeDiff;
    return b.id.localeCompare(a.id);
  });
  const recentMovements = sortedMovements.slice(0, 5);

  // --- 2. Receivables (Invoices) ---
  const sentInvoices = documents.filter(
    (d) => d.documentType === "invoice" && d.status === "sent"
  );

  type EvaluatedInvoice = {
    doc: AdminOperationalDocument;
    outstandingAmount: number;
    hasCrossCurrency: boolean;
  };

  const evaluatedSentInvoices: EvaluatedInvoice[] = [];
  for (const inv of sentInvoices) {
    const { outstandingAmount, hasCrossCurrency } = getInvoiceOutstanding(inv);
    if (outstandingAmount > 0) {
      evaluatedSentInvoices.push({
        doc: inv,
        outstandingAmount,
        hasCrossCurrency,
      });
    }
  }

  // Overdue Invoices
  const overdueAlerts = buildOverdueAlerts(documents, now);
  const overdueInvoiceAlerts = overdueAlerts.filter(
    (a) => a.documentType === "invoice"
  );

  const evaluatedOverdueInvoices: {
    alert: (typeof overdueInvoiceAlerts)[number];
    doc: AdminOperationalDocument | undefined;
    outstandingAmount: number;
    hasCrossCurrency: boolean;
  }[] = [];

  for (const alert of overdueInvoiceAlerts) {
    const doc = docMap.get(alert.documentId);
    if (doc) {
      const { outstandingAmount, hasCrossCurrency } = getInvoiceOutstanding(doc);
      if (outstandingAmount > 0) {
        evaluatedOverdueInvoices.push({
          alert,
          doc,
          outstandingAmount,
          hasCrossCurrency,
        });
      }
    } else {
      // Fallback if doc is not in operational documents map
      evaluatedOverdueInvoices.push({
        alert,
        doc: undefined,
        outstandingAmount: alert.amount,
        hasCrossCurrency: false,
      });
    }
  }

  const receivablesComplete = !crossCurrencyLinkedPaymentDetected;

  let openInvoicesBuckets: AdminMoneyBucket[] = [];
  let overdueInvoicesBuckets: AdminMoneyBucket[] = [];
  let overdueItems: AdminFinancialExposureItem[] = [];

  if (receivablesComplete) {
    openInvoicesBuckets = aggregateMoneyBuckets(
      evaluatedSentInvoices.map((item) => ({
        currency: item.doc.totals.currency,
        amount: item.outstandingAmount,
      }))
    );

    overdueInvoicesBuckets = aggregateMoneyBuckets(
      evaluatedOverdueInvoices.map((item) => ({
        currency: item.doc?.totals.currency ?? item.alert.currency,
        amount: item.outstandingAmount,
      }))
    );

    overdueItems = evaluatedOverdueInvoices
      .map(({ alert, doc, outstandingAmount }) => ({
        id: alert.documentId,
        documentId: alert.documentId,
        documentNumber: alert.documentNumber,
        clientName: doc?.clientName || alert.clientName || null,
        eventId: doc?.event.eventId ?? null,
        eventName: doc?.event.eventName || null,
        currency: doc?.totals.currency ?? alert.currency,
        amount: outstandingAmount,
        dueAt: alert.dueDate,
        daysOverdue: alert.daysOverdue,
        href: `/admin/documents/${alert.documentId}`,
      }))
      .sort(
        (a, b) =>
          (b.daysOverdue ?? 0) - (a.daysOverdue ?? 0) ||
          a.documentNumber.localeCompare(b.documentNumber)
      );
  }

  // --- 3. Proposals (Proformas) ---
  const sentProformas = documents.filter(
    (d) => d.documentType === "proforma" && d.status === "sent"
  );
  const expiredProformaAlerts = overdueAlerts.filter(
    (a) => a.documentType === "proforma"
  );

  const sentProformasBuckets = aggregateMoneyBuckets(
    sentProformas.map((d) => ({
      currency: d.totals.currency,
      amount: d.totals.grandTotal,
    }))
  );

  const expiredProformasBuckets = aggregateMoneyBuckets(
    expiredProformaAlerts.map((a) => ({
      currency: a.currency,
      amount: a.amount,
    }))
  );

  const expiredItems: AdminFinancialExposureItem[] = expiredProformaAlerts
    .map((alert) => {
      const doc = docMap.get(alert.documentId);
      return {
        id: alert.documentId,
        documentId: alert.documentId,
        documentNumber: alert.documentNumber,
        clientName: doc?.clientName || alert.clientName || null,
        eventId: doc?.event.eventId ?? null,
        eventName: doc?.event.eventName || null,
        currency: alert.currency,
        amount: alert.amount,
        dueAt: alert.dueDate,
        daysOverdue: alert.daysOverdue,
        href: `/admin/documents/${alert.documentId}`,
      };
    })
    .sort(
      (a, b) =>
        (b.daysOverdue ?? 0) - (a.daysOverdue ?? 0) ||
        a.documentNumber.localeCompare(b.documentNumber)
    );

  return {
    coverage: {
      payments: true,
      receivedComplete: true,
      receivablesComplete,
    },
    received: {
      total: receivedTotalBuckets,
      thisMonth: receivedThisMonthBuckets,
    },
    receivables: {
      openInvoiceCount: evaluatedSentInvoices.length,
      overdueInvoiceCount: evaluatedOverdueInvoices.length,
      openInvoices: openInvoicesBuckets,
      overdueInvoices: overdueInvoicesBuckets,
      overdueItems,
    },
    proposals: {
      sentProformaCount: sentProformas.length,
      expiredProformaCount: expiredProformaAlerts.length,
      sentProformas: sentProformasBuckets,
      expiredProformas: expiredProformasBuckets,
      expiredItems,
    },
    recentMovements,
  };
}
