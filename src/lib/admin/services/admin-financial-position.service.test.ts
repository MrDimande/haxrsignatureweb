import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildAdminFinancialPosition,
  aggregateMoneyBuckets,
  getMaputoYearMonth,
  isMaputoCurrentMonth,
  type BuildAdminFinancialPositionInput,
} from "./admin-financial-position.service";
import type {
  AdminOperationalDocument,
  Currency,
  DocumentType,
} from "@/lib/admin/types";
import type { PaymentRecord } from "@/lib/finance/types";
import type { PaymentsBatchResult } from "@/lib/finance/repositories/payments.repository";

function createMockDocument(
  overrides?: Partial<AdminOperationalDocument>
): AdminOperationalDocument {
  return {
    id: "doc-1",
    documentType: "invoice",
    documentNumber: "INV-2026-001",
    businessId: "haxr-signature",
    status: "sent",
    currency: "MZN",
    clientId: "cli-1",
    clientName: "Cliente Teste",
    event: {
      eventId: "evt-1",
      eventType: "wedding",
      eventName: "Casamento Teste",
      eventDate: "2026-10-10",
      eventLocation: "Maputo",
    },
    issueDate: "2026-08-01",
    expiryDate: "2026-08-30",
    totals: {
      subtotal: 100000,
      vatRate: 0.16,
      vatAmount: 16000,
      grandTotal: 116000,
      includeVat: true,
      currency: "MZN",
    },
    convertedFromDocumentId: null,
    clientApprovalStatus: null,
    clientApprovedAt: null,
    clientApprovalNote: null,
    createdAt: "2026-08-01T08:00:00Z",
    updatedAt: "2026-08-01T08:00:00Z",
    emailSentAt: "2026-08-01T08:00:00Z",
    ...overrides,
  };
}

function createMockPayment(overrides?: Partial<PaymentRecord>): PaymentRecord {
  return {
    id: "pay-1",
    businessId: "haxr-signature",
    clientId: "cli-1",
    clientName: "Cliente Teste",
    eventId: "evt-1",
    eventName: "Casamento Teste",
    documentId: "rec-1",
    documentNumber: "REC-2026-001",
    sourceDocumentId: "doc-1",
    sourceDocumentNumber: "INV-2026-001",
    amount: 116000,
    currency: "MZN",
    paymentMethod: "bank_transfer",
    reference: "REF123",
    notes: "Pagamento integral",
    paidAt: "2026-08-15T10:00:00Z",
    createdAt: "2026-08-15T10:00:00Z",
    ...overrides,
  };
}

describe("admin-financial-position.service", () => {
  const baseNow = new Date("2026-08-20T12:00:00Z");

  describe("Maputo time helpers", () => {
    it("getMaputoYearMonth extracts Maputo calendar year and month", () => {
      const ym = getMaputoYearMonth("2026-08-20T12:00:00Z");
      assert.deepEqual(ym, { year: 2026, month: 8 });

      // In UTC, this is 2026-12-31 23:00, but in Maputo (UTC+2), this is 2027-01-01 01:00
      const newYearMaputo = getMaputoYearMonth("2026-12-31T23:00:00Z");
      assert.deepEqual(newYearMaputo, { year: 2027, month: 1 });
    });

    it("isMaputoCurrentMonth compares dates relative to injected now in Maputo", () => {
      assert.equal(isMaputoCurrentMonth("2026-08-01", baseNow), true);
      assert.equal(isMaputoCurrentMonth("2026-07-31T20:00:00Z", baseNow), false);
      assert.equal(isMaputoCurrentMonth("2026-08-31T21:59:00Z", baseNow), true);
    });
  });

  describe("aggregateMoneyBuckets", () => {
    it("groups amounts by currency and orders deterministically", () => {
      const items = [
        { currency: "USD" as Currency, amount: 500 },
        { currency: "MZN" as Currency, amount: 20000 },
        { currency: "USD" as Currency, amount: 700 },
        { currency: "MZN" as Currency, amount: 15000 },
        { currency: "ZAR" as Currency, amount: 3000 },
      ];

      const buckets = aggregateMoneyBuckets(items);
      assert.equal(buckets.length, 3);
      assert.equal(buckets[0].currency, "MZN");
      assert.equal(buckets[0].amount, 35000);
      assert.equal(buckets[0].count, 2);

      assert.equal(buckets[1].currency, "USD");
      assert.equal(buckets[1].amount, 1200);
      assert.equal(buckets[1].count, 2);

      assert.equal(buckets[2].currency, "ZAR");
      assert.equal(buckets[2].amount, 3000);
      assert.equal(buckets[2].count, 1);
    });
  });

  describe("A. Deduplication: PaymentRecord linked to receipt and source invoice", () => {
    it("counts payment ONCE and does not double count with paid source invoice or paid receipt", () => {
      const invoice = createMockDocument({
        id: "inv-1",
        documentType: "invoice",
        status: "paid",
        totals: { ...createMockDocument().totals, grandTotal: 100000 },
      });
      const receipt = createMockDocument({
        id: "rec-1",
        documentType: "receipt",
        status: "paid",
        totals: { ...createMockDocument().totals, grandTotal: 100000 },
      });
      const payment = createMockPayment({
        id: "pay-1",
        documentId: "rec-1",
        sourceDocumentId: "inv-1",
        amount: 100000,
      });

      const position = buildAdminFinancialPosition(
        {
          documents: [invoice, receipt],
          paymentsBatch: { available: true, items: [payment] },
        },
        { now: baseNow }
      );

      assert.equal(position.coverage.receivedComplete, true);
      assert.equal(position.received.total.length, 1);
      assert.equal(position.received.total[0].amount, 100000);
      assert.equal(position.received.total[0].count, 1);
      assert.equal(position.recentMovements.length, 1);
      assert.equal(position.recentMovements[0].source, "payment");
      assert.equal(position.recentMovements[0].amount, 100000);
    });
  });

  describe("B. Partial payments for one invoice", () => {
    it("counts both payments and does not double count paid source document", () => {
      const invoice = createMockDocument({
        id: "inv-1",
        documentType: "invoice",
        status: "paid",
        totals: { ...createMockDocument().totals, grandTotal: 100000 },
      });
      const pay1 = createMockPayment({
        id: "pay-1",
        sourceDocumentId: "inv-1",
        documentId: "rec-1",
        amount: 40000,
        paidAt: "2026-08-10T10:00:00Z",
      });
      const pay2 = createMockPayment({
        id: "pay-2",
        sourceDocumentId: "inv-1",
        documentId: "rec-2",
        amount: 60000,
        paidAt: "2026-08-15T10:00:00Z",
      });

      const position = buildAdminFinancialPosition(
        {
          documents: [invoice],
          paymentsBatch: { available: true, items: [pay1, pay2] },
        },
        { now: baseNow }
      );

      assert.equal(position.received.total.length, 1);
      assert.equal(position.received.total[0].amount, 100000);
      assert.equal(position.received.total[0].count, 2);
      assert.equal(position.recentMovements.length, 2);
    });
  });

  describe("C. Legacy paid document without PaymentRecord", () => {
    it("includes legacy paid document once as legacy received movement", () => {
      const legacyDoc = createMockDocument({
        id: "legacy-doc-1",
        documentType: "receipt",
        status: "paid",
        issueDate: "2026-08-05",
        totals: { ...createMockDocument().totals, grandTotal: 50000 },
      });

      const position = buildAdminFinancialPosition(
        {
          documents: [legacyDoc],
          paymentsBatch: { available: true, items: [] },
        },
        { now: baseNow }
      );

      assert.equal(position.received.total.length, 1);
      assert.equal(position.received.total[0].amount, 50000);
      assert.equal(position.recentMovements.length, 1);
      assert.equal(position.recentMovements[0].source, "legacy_paid_document");
      assert.equal(position.recentMovements[0].occurredAtBasis, "document_issue_date");
      assert.equal(position.recentMovements[0].paymentMethod, null);
    });
  });

  describe("D & E. Sent invoice vs Sent proforma separation", () => {
    it("classifies sent invoice as openInvoices and sent proforma as sentProformas (never in openInvoices)", () => {
      const invoice = createMockDocument({
        id: "inv-sent-1",
        documentType: "invoice",
        status: "sent",
        totals: { ...createMockDocument().totals, grandTotal: 80000 },
      });
      const proforma = createMockDocument({
        id: "pf-sent-1",
        documentType: "proforma",
        status: "sent",
        totals: { ...createMockDocument().totals, grandTotal: 120000 },
      });

      const position = buildAdminFinancialPosition(
        {
          documents: [invoice, proforma],
          paymentsBatch: { available: true, items: [] },
        },
        { now: baseNow }
      );

      // Open invoices
      assert.equal(position.receivables.openInvoiceCount, 1);
      assert.equal(position.receivables.openInvoices.length, 1);
      assert.equal(position.receivables.openInvoices[0].amount, 80000);

      // Sent proformas
      assert.equal(position.proposals.sentProformaCount, 1);
      assert.equal(position.proposals.sentProformas.length, 1);
      assert.equal(position.proposals.sentProformas[0].amount, 120000);
    });
  });

  describe("F & G. Overdue invoice vs Expired proforma separation", () => {
    it("separates overdue invoices from expired proformas and does not call proformas debt", () => {
      const overdueInvoice = createMockDocument({
        id: "inv-overdue",
        documentType: "invoice",
        status: "sent",
        issueDate: "2026-07-01",
        expiryDate: "2026-08-01", // Overdue relative to 2026-08-20
        totals: { ...createMockDocument().totals, grandTotal: 65000 },
      });
      const expiredProforma = createMockDocument({
        id: "pf-expired",
        documentType: "proforma",
        status: "sent",
        issueDate: "2026-07-01",
        expiryDate: "2026-08-01", // Expired relative to 2026-08-20
        totals: { ...createMockDocument().totals, grandTotal: 95000 },
      });

      const position = buildAdminFinancialPosition(
        {
          documents: [overdueInvoice, expiredProforma],
          paymentsBatch: { available: true, items: [] },
        },
        { now: baseNow }
      );

      // Overdue invoices
      assert.equal(position.receivables.overdueInvoiceCount, 1);
      assert.equal(position.receivables.overdueInvoices.length, 1);
      assert.equal(position.receivables.overdueInvoices[0].amount, 65000);
      assert.equal(position.receivables.overdueItems.length, 1);
      assert.equal(position.receivables.overdueItems[0].documentId, "inv-overdue");

      // Expired proformas
      assert.equal(position.proposals.expiredProformaCount, 1);
      assert.equal(position.proposals.expiredProformas.length, 1);
      assert.equal(position.proposals.expiredProformas[0].amount, 95000);
      assert.equal(position.proposals.expiredItems.length, 1);
      assert.equal(position.proposals.expiredItems[0].documentId, "pf-expired");
    });
  });

  describe("H. Currency Safety (Multi-currency)", () => {
    it("groups MZN and USD movements into separate buckets without arithmetic mixing", () => {
      const payMzn = createMockPayment({
        id: "pay-mzn",
        currency: "MZN",
        amount: 250000,
      });
      const payUsd = createMockPayment({
        id: "pay-usd",
        currency: "USD",
        amount: 1500,
      });

      const position = buildAdminFinancialPosition(
        {
          documents: [],
          paymentsBatch: { available: true, items: [payMzn, payUsd] },
        },
        { now: baseNow }
      );

      assert.equal(position.received.total.length, 2);
      assert.equal(position.received.total[0].currency, "MZN");
      assert.equal(position.received.total[0].amount, 250000);

      assert.equal(position.received.total[1].currency, "USD");
      assert.equal(position.received.total[1].amount, 1500);
    });
  });

  describe("I. Injected Maputo Clock for This Month", () => {
    it("computes received this month using injected Maputo clock", () => {
      const payThisMonth = createMockPayment({
        id: "pay-this-month",
        amount: 50000,
        paidAt: "2026-08-10T10:00:00Z",
      });
      const payLastMonth = createMockPayment({
        id: "pay-last-month",
        amount: 80000,
        paidAt: "2026-07-25T10:00:00Z",
      });

      const position = buildAdminFinancialPosition(
        {
          documents: [],
          paymentsBatch: { available: true, items: [payThisMonth, payLastMonth] },
        },
        { now: baseNow }
      );

      assert.equal(position.received.total[0].amount, 130000);
      assert.equal(position.received.thisMonth.length, 1);
      assert.equal(position.received.thisMonth[0].amount, 50000);
    });
  });

  describe("J & T & H(Guard). Payment batch unavailable", () => {
    it("reports coverage incomplete and sets empty received totals and empty recent movements", () => {
      const invoice = createMockDocument({
        id: "inv-1",
        status: "sent",
        totals: { ...createMockDocument().totals, grandTotal: 50000 },
      });
      const legacyPaid = createMockDocument({
        id: "doc-paid",
        status: "paid",
        totals: { ...createMockDocument().totals, grandTotal: 70000 },
      });

      const position = buildAdminFinancialPosition(
        {
          documents: [invoice, legacyPaid],
          paymentsBatch: { available: false, items: [] },
        },
        { now: baseNow }
      );

      assert.equal(position.coverage.payments, false);
      assert.equal(position.coverage.receivedComplete, false);
      assert.equal(position.coverage.receivablesComplete, false);
      assert.deepEqual(position.received.total, []);
      assert.deepEqual(position.received.thisMonth, []);
      assert.deepEqual(position.recentMovements, []);
      assert.deepEqual(position.receivables.openInvoices, []);
      assert.equal(position.receivables.openInvoiceCount, 1);
    });
  });

  describe("K. Full summary built before recent/display slicing", () => {
    it("aggregates full total before slicing recent movements to 5", () => {
      const payments: PaymentRecord[] = [];
      for (let i = 1; i <= 10; i++) {
        payments.push(
          createMockPayment({
            id: `pay-${i}`,
            amount: 10000,
            paidAt: `2026-08-${String(i).padStart(2, "0")}T10:00:00Z`,
          })
        );
      }

      const position = buildAdminFinancialPosition(
        {
          documents: [],
          paymentsBatch: { available: true, items: payments },
        },
        { now: baseNow }
      );

      assert.equal(position.received.total[0].amount, 100000);
      assert.equal(position.received.total[0].count, 10);
      assert.equal(position.recentMovements.length, 5);
      // Most recent first
      assert.equal(position.recentMovements[0].id, "pay-10");
    });
  });

  describe("L. Recent movements deterministic ordering", () => {
    it("sorts by occurredAt DESC, with tie-breaker by id", () => {
      const payA = createMockPayment({
        id: "pay-a",
        paidAt: "2026-08-10T10:00:00Z",
      });
      const payB = createMockPayment({
        id: "pay-b",
        paidAt: "2026-08-10T10:00:00Z",
      });
      const payC = createMockPayment({
        id: "pay-c",
        paidAt: "2026-08-12T10:00:00Z",
      });

      const position = buildAdminFinancialPosition(
        {
          documents: [],
          paymentsBatch: { available: true, items: [payA, payB, payC] },
        },
        { now: baseNow }
      );

      assert.equal(position.recentMovements[0].id, "pay-c");
      assert.equal(position.recentMovements[1].id, "pay-b");
      assert.equal(position.recentMovements[2].id, "pay-a");
    });
  });

  describe("M & N. Event resolution from factual linkage without guessing from clientId", () => {
    it("links payment to event via factual eventId or document link, never from clientId alone", () => {
      const invoice = createMockDocument({
        id: "inv-with-event",
        event: {
          eventId: "evt-factual",
          eventType: "wedding",
          eventName: "Casamento Real",
          eventDate: "2026-11-11",
          eventLocation: "Maputo",
        },
      });

      // Payment with explicit document link
      const payLinked = createMockPayment({
        id: "pay-linked",
        sourceDocumentId: "inv-with-event",
        eventId: null,
        eventName: "",
      });

      // Standalone payment with same clientId but NO event link
      const payStandalone = createMockPayment({
        id: "pay-standalone",
        clientId: "cli-1",
        eventId: null,
        eventName: "",
        documentId: null,
        sourceDocumentId: null,
      });

      const position = buildAdminFinancialPosition(
        {
          documents: [invoice],
          paymentsBatch: { available: true, items: [payLinked, payStandalone] },
        },
        { now: baseNow }
      );

      const mLinked = position.recentMovements.find((m) => m.id === "pay-linked");
      const mStandalone = position.recentMovements.find((m) => m.id === "pay-standalone");

      assert.equal(mLinked?.eventId, "evt-factual");
      assert.equal(mLinked?.eventName, "Casamento Real");
      assert.equal(mStandalone?.eventId, null);
      assert.equal(mStandalone?.eventName, null);
    });
  });

  describe("O. Input immutability", () => {
    it("does not mutate input documents or payments arrays", () => {
      const doc = createMockDocument();
      const docClone = JSON.parse(JSON.stringify(doc));
      const pay = createMockPayment();
      const payClone = JSON.parse(JSON.stringify(pay));

      const input: BuildAdminFinancialPositionInput = {
        documents: [doc],
        paymentsBatch: { available: true, items: [pay] },
      };

      buildAdminFinancialPosition(input, { now: baseNow });

      assert.deepEqual(doc, docClone);
      assert.deepEqual(pay, payClone);
      assert.equal(input.documents.length, 1);
      assert.equal(input.paymentsBatch.items.length, 1);
    });
  });

  describe("Q. Partial payment reduces open invoice exposure", () => {
    it("reduces sent invoice outstanding amount by linked same-currency payments", () => {
      const invoice = createMockDocument({
        id: "inv-partial-1",
        documentType: "invoice",
        status: "sent",
        totals: { ...createMockDocument().totals, grandTotal: 100000 },
      });
      const partialPayment = createMockPayment({
        id: "pay-part-1",
        sourceDocumentId: "inv-partial-1",
        amount: 35000,
        currency: "MZN",
      });

      const position = buildAdminFinancialPosition(
        {
          documents: [invoice],
          paymentsBatch: { available: true, items: [partialPayment] },
        },
        { now: baseNow }
      );

      assert.equal(position.receivables.openInvoiceCount, 1);
      assert.equal(position.receivables.openInvoices.length, 1);
      assert.equal(position.receivables.openInvoices[0].amount, 65000);
    });

    it("excludes sent invoice from active receivables if fully paid via payments even if status is sent", () => {
      const invoice = createMockDocument({
        id: "inv-full-paid",
        documentType: "invoice",
        status: "sent",
        totals: { ...createMockDocument().totals, grandTotal: 100000 },
      });
      const fullPayment = createMockPayment({
        id: "pay-full",
        sourceDocumentId: "inv-full-paid",
        amount: 100000,
        currency: "MZN",
      });

      const position = buildAdminFinancialPosition(
        {
          documents: [invoice],
          paymentsBatch: { available: true, items: [fullPayment] },
        },
        { now: baseNow }
      );

      assert.equal(position.receivables.openInvoiceCount, 0);
      assert.deepEqual(position.receivables.openInvoices, []);
    });
  });

  describe("R. Partial payment reduces overdue invoice exposure", () => {
    it("reduces overdue invoice amount by linked same-currency payment", () => {
      const overdueInvoice = createMockDocument({
        id: "inv-overdue-part",
        documentType: "invoice",
        status: "sent",
        issueDate: "2026-07-01",
        expiryDate: "2026-08-01",
        totals: { ...createMockDocument().totals, grandTotal: 80000 },
      });
      const partialPayment = createMockPayment({
        id: "pay-overdue-part",
        sourceDocumentId: "inv-overdue-part",
        amount: 30000,
        currency: "MZN",
      });

      const position = buildAdminFinancialPosition(
        {
          documents: [overdueInvoice],
          paymentsBatch: { available: true, items: [partialPayment] },
        },
        { now: baseNow }
      );

      assert.equal(position.receivables.overdueInvoiceCount, 1);
      assert.equal(position.receivables.overdueInvoices[0].amount, 50000);
      assert.equal(position.receivables.overdueItems[0].amount, 50000);
    });
  });

  describe("S. Cross-currency linked payment safety", () => {
    it("never raw-subtracts USD payment from MZN invoice and flags receivablesComplete = false", () => {
      const invoiceMzn = createMockDocument({
        id: "inv-mzn",
        documentType: "invoice",
        status: "sent",
        totals: {
          subtotal: 100000,
          vatRate: 0,
          vatAmount: 0,
          grandTotal: 100000,
          includeVat: false,
          currency: "MZN",
        },
      });
      const paymentUsd = createMockPayment({
        id: "pay-usd-cross",
        sourceDocumentId: "inv-mzn",
        amount: 500,
        currency: "USD",
      });

      const position = buildAdminFinancialPosition(
        {
          documents: [invoiceMzn],
          paymentsBatch: { available: true, items: [paymentUsd] },
        },
        { now: baseNow }
      );

      assert.equal(position.coverage.receivablesComplete, false);
      assert.deepEqual(position.receivables.openInvoices, []);
      assert.equal(position.receivables.openInvoiceCount, 1);
    });
  });
});
