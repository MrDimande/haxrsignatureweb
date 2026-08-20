import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildAdminDashboardSnapshot,
  buildAdminAttentionItems,
  buildAdminDocumentSummary,
  getMaputoFiscalYear,
  type AdminDashboardSourceData,
} from "./admin-dashboard.service";
import type { Business, AdminOperationalDocument } from "@/lib/admin/types";
import type { ManagedEvent } from "@/lib/events/types";
import type { ContactInquiry } from "@/lib/contact/types";
import type { AdminAlert } from "@/lib/admin/services/admin-alerts.service";
import type { EventPortfolioOperationalSnapshot } from "@/lib/admin/services/event-portfolio.service";
import type {
  PortalCreativeApproval,
  PortalPaymentProof,
  PortalTimelineItem,
} from "@/lib/portal/portal-premium.types";
import type { PaymentRecord } from "@/lib/finance/types";

export function createAdminAlert(overrides?: Partial<AdminAlert>): AdminAlert {
  return {
    id: "lead-inq-1",
    text: "Novo lead: Ana Silva",
    time: "Há 5 min",
    read: false,
    href: "/admin/leads",
    priority: "high",
    source: "commercial",
    requiresAction: true,
    ...overrides,
  };
}

export function createOperationalDocument(
  overrides?: Partial<AdminOperationalDocument>
): AdminOperationalDocument {
  return {
    id: "doc-1",
    documentType: "proforma",
    documentNumber: "PF-2026-001",
    businessId: "haxr-signature",
    status: "sent",
    currency: "MZN",
    clientId: "cli-1",
    clientName: "Ana Silva",
    event: {
      eventId: "evt-1",
      eventType: "wedding",
      eventName: "Casamento Vânia & Fabião",
      eventDate: "2026-12-20",
      eventLocation: "Polana Serena Hotel",
    },
    issueDate: "2026-08-19",
    expiryDate: "2026-08-25",
    totals: {
      subtotal: 100000,
      vatRate: 0.16,
      vatAmount: 16000,
      grandTotal: 116000,
      includeVat: true,
      currency: "MZN",
    },
    convertedFromDocumentId: null,
    clientApprovalStatus: "approved",
    clientApprovedAt: "2026-08-19T11:00:00Z",
    clientApprovalNote: null,
    createdAt: "2026-08-19T10:00:00Z",
    updatedAt: "2026-08-19T10:00:00Z",
    emailSentAt: "2026-08-19T10:05:00Z",
    ...overrides,
  };
}

export function createBusiness(overrides?: Partial<Business>): Business {
  return {
    id: "haxr-signature",
    name: "HAXR Signature",
    logo: "/images/brand/logo.svg",
    nuit: "123456789",
    phone: "+258840000000",
    email: "info@haxrsignature.com",
    whatsapp: "+258840000000",
    address: "Av. Julius Nyerere, Maputo",
    bankAccounts: [
      {
        bankName: "BCI",
        accountName: "HAXR Signature Lda",
        accountNumber: "1234567890",
        nib: "000800001234567890123",
      },
    ],
    mobilePayments: [
      {
        provider: "M-Pesa",
        number: "840000000",
        accountName: "HAXR Signature",
      },
    ],
    invoicePrefix: "HAXR",
    theme: {
      primaryColor: "#D4AF37",
      accentColor: "#111111",
    },
    termsAndConditions: ["Pagamento a 30 dias"],
    defaultCurrency: "MZN",
    ...overrides,
  };
}

export function createEvent(overrides?: Partial<ManagedEvent>): ManagedEvent {
  return {
    id: "evt-1",
    businessId: "haxr-signature",
    clientId: "cli-1",
    clientName: "Vânia & Fabião",
    name: "Casamento Vânia & Fabião",
    type: "wedding",
    date: "2026-12-20",
    location: "Polana Serena Hotel",
    notes: "Casamento completo",
    isActive: true,
    googleSheetUrl: "https://docs.google.com/spreadsheets/d/abc",
    googleSheetGid: "0",
    sheetsLastSyncedAt: "2026-08-19T10:00:00Z",
    sheetsSyncSummary: "Sincronizado",
    sheetsSyncMode: "master",
    findSeatCode: "VF2026",
    editionRegistryKey: "edition-vf-2026",
    postEventReportSentAt: null,
    dateHoldUntil: null,
    createdAt: "2026-01-10T00:00:00Z",
    updatedAt: "2026-01-10T00:00:00Z",
    ...overrides,
  };
}

export function createInquiry(overrides?: Partial<ContactInquiry>): ContactInquiry {
  return {
    id: "inq-1",
    name: "Ana Silva",
    email: "ana@example.com",
    projectType: "Casamento",
    packageLabel: "Silver",
    intent: "Convites e website",
    message: "Gostaria de saber mais sobre convites",
    status: "new",
    marketingOptIn: true,
    source: "website_contact_form",
    createdAt: "2026-08-19T10:00:00Z",
    updatedAt: "2026-08-19T10:00:00Z",
    brevoLeadWelcomeAt: null,
    brevoPortfolioSentAt: null,
    brevoExperiencesSentAt: null,
    brevoMeetingSentAt: null,
    brevoLastCallSentAt: null,
    brevoNewsletterWelcomeAt: null,
    ...overrides,
  };
}

export function createOperationalSnapshot(
  id: string,
  overrides?: Partial<EventPortfolioOperationalSnapshot>
): EventPortfolioOperationalSnapshot {
  return {
    event: {
      id,
      businessId: "haxr-signature",
      type: "wedding",
      name: `Evento ${id}`,
      clientName: `Cliente ${id}`,
      date: "2026-12-20",
      pipeline: "active",
    },
    guests: {
      totalGuests: 250,
      confirmed: 200,
      checkedIn: 0,
      unassigned: 0,
    },
    concierge: {
      available: true,
      pendingReviewCount: 0,
    },
    paymentProofs: {
      available: true,
      pendingCount: 0,
    },
    documents: {
      openCount: 0,
      overdueCount: 0,
    },
    dateHold: {
      active: false,
      dateHoldUntil: null,
    },
    sheets: {
      configured: true,
      lastSyncedAt: "2026-08-19T10:00:00Z",
    },
    ...overrides,
  };
}

export function createTimelineItem(
  id: string,
  eventId: string,
  overrides?: Partial<PortalTimelineItem>
): PortalTimelineItem {
  return {
    id,
    eventId,
    clientId: `cli-${eventId}`,
    title: `Marco ${id}`,
    description: null,
    startsAt: "2026-08-22T10:00:00.000Z",
    endsAt: null,
    category: "milestone",
    visibility: "client",
    status: "scheduled",
    sortOrder: 10,
    createdAt: "2026-08-01T00:00:00Z",
    ...overrides,
  };
}

function createFixtureSourceData(
  overrides?: Partial<AdminDashboardSourceData>
): AdminDashboardSourceData {
  const operationalDocuments = [
    createOperationalDocument({
      id: "doc-1",
      documentType: "proforma",
      documentNumber: "PF-2026-001",
      clientApprovalStatus: "approved",
      clientApprovedAt: "2026-08-19T11:00:00Z",
    }),
    createOperationalDocument({
      id: "doc-2",
      documentType: "invoice",
      documentNumber: "INV-014",
      status: "sent",
      issueDate: "2026-07-01",
      expiryDate: "2026-08-13",
    }),
    createOperationalDocument({
      id: "doc-3",
      documentType: "receipt",
      documentNumber: "REC-001",
      status: "paid",
      issueDate: "2026-08-10",
    }),
  ];
  const businesses = [createBusiness()];
  const events = [
    createEvent({
      id: "evt-1",
      name: "Casamento Vânia & Fabião",
      type: "wedding",
      date: "2026-12-20",
    }),
    createEvent({
      id: "evt-2",
      name: "Gala Corporativa",
      type: "corporate",
      date: null,
    }),
    createEvent({
      id: "evt-3",
      name: "Evento Realizado",
      type: "other",
      date: "2025-05-10",
    }),
  ];
  const portfolioSnapshots = [
    createOperationalSnapshot("evt-1", {
      event: {
        id: "evt-1",
        businessId: "haxr-signature",
        type: "wedding",
        name: "Casamento Vânia & Fabião",
        clientName: "Vânia & Fabião",
        date: "2026-12-20",
        pipeline: "active",
      },
    }),
  ];
  const timelineBatch = {
    available: true,
    items: [
      createTimelineItem("t-1", "evt-1", {
        startsAt: "2026-08-22T10:00:00.000Z",
        title: "Revisão de Proposta",
      }),
    ],
  };
  const paymentProofsBatch = {
    available: true,
    items: [] as PortalPaymentProof[],
  };
  const creativeApprovalsBatch = {
    available: true,
    items: [] as PortalCreativeApproval[],
  };
  const paymentsBatch = {
    available: true,
    items: [
      {
        id: "pay-1",
        businessId: "haxr-signature" as const,
        clientId: "cli-1",
        clientName: "Vânia & Fabião",
        eventId: "evt-1",
        eventName: "Casamento Vânia & Fabião",
        documentId: "doc-3",
        documentNumber: "REC-001",
        sourceDocumentId: null,
        sourceDocumentNumber: null,
        amount: 50000,
        currency: "MZN" as const,
        paymentMethod: "bank_transfer" as const,
        reference: "REF-01",
        notes: "",
        paidAt: "2026-08-10T10:00:00Z",
        createdAt: "2026-08-10T10:00:00Z",
      },
    ] as PaymentRecord[],
  };
  const inquiries = [
    createInquiry({
      id: "inq-1",
      name: "Ana Silva",
      status: "new",
      createdAt: "2026-08-19T10:00:00Z",
    }),
    createInquiry({
      id: "inq-2",
      name: "Carlos Santos",
      status: "contacted",
      createdAt: "2026-08-18T15:00:00Z",
    }),
    createInquiry({
      id: "inq-3",
      name: "Mariana Costa",
      status: "new",
      createdAt: "2026-08-17T09:00:00Z",
    }),
    createInquiry({
      id: "inq-4",
      name: "João Pereira",
      status: "new",
      createdAt: "2026-08-16T12:00:00Z",
    }),
  ];

  return {
    operationalDocuments,
    inquiries,
    conciergePending: 2,
    paymentProofsBatch,
    creativeApprovalsBatch,
    portfolioSnapshots,
    timelineBatch,
    paymentsBatch,
    businesses,
    events,
    ...overrides,
  };
}

describe("admin-dashboard.service", () => {
  describe("getMaputoFiscalYear", () => {
    it("correctly extracts year from UTC/Maputo dates", () => {
      const date = new Date("2026-12-31T23:30:00Z"); // In Maputo (UTC+2), this is 2027-01-01 01:30
      assert.equal(getMaputoFiscalYear(date), 2027);

      const midYear = new Date("2026-08-19T12:00:00Z");
      assert.equal(getMaputoFiscalYear(midYear), 2026);
    });
  });

  describe("buildAdminDocumentSummary (Test U)", () => {
    it("derives totalProformas, totalInvoices, totalReceipts, totalDraft, and totalPaid accurately from operationalDocuments", () => {
      const docs = [
        createOperationalDocument({ id: "1", documentType: "proforma", status: "sent" }),
        createOperationalDocument({ id: "2", documentType: "proforma", status: "draft" }),
        createOperationalDocument({ id: "3", documentType: "invoice", status: "sent" }),
        createOperationalDocument({ id: "4", documentType: "invoice", status: "paid" }),
        createOperationalDocument({ id: "5", documentType: "receipt", status: "paid" }),
      ];

      const summary = buildAdminDocumentSummary(docs);
      assert.equal(summary.totalProformas, 2);
      assert.equal(summary.totalInvoices, 2);
      assert.equal(summary.totalReceipts, 1);
      assert.equal(summary.totalDraft, 1);
      assert.equal(summary.totalPaid, 2);
    });
  });

  describe("buildAdminAttentionItems", () => {
    it("includes only actionable alerts (requiresAction === true) and excludes informational ones", () => {
      const alerts: AdminAlert[] = [
        createAdminAlert({ id: "actionable-1", requiresAction: true, priority: "high" }),
        createAdminAlert({ id: "informational-1", requiresAction: false, priority: "high" }),
        createAdminAlert({ id: "actionable-2", requiresAction: true, priority: "normal" }),
      ];
      const items = buildAdminAttentionItems(alerts);

      assert.equal(items.length, 2);
      assert.equal(items[0].id, "actionable-1");
      assert.equal(items[1].id, "actionable-2");
    });
  });

  describe("buildAdminDashboardSnapshot", () => {
    it("integrates canonical financialPosition into the snapshot", () => {
      const source = createFixtureSourceData();
      const snapshot = buildAdminDashboardSnapshot(source, {
        now: new Date("2026-08-19T12:00:00Z"),
      });

      assert.ok(snapshot.financialPosition);
      assert.equal(snapshot.financialPosition.coverage.payments, true);
      assert.equal(snapshot.financialPosition.coverage.receivedComplete, true);
      assert.equal(snapshot.financialPosition.received.total.length, 1);
      assert.equal(snapshot.financialPosition.received.total[0].amount, 50000);
      assert.equal(snapshot.financialPosition.receivables.openInvoiceCount, 1);
      assert.equal(snapshot.financialPosition.proposals.sentProformaCount, 1);
    });

    it("groups events using canonical pipeline semantics with injected now consistently", () => {
      const source = createFixtureSourceData();
      const snapshot = buildAdminDashboardSnapshot(source, {
        now: new Date("2026-08-19T12:00:00Z"),
      });

      assert.equal(snapshot.eventGroups.active.length, 1);
      assert.equal(snapshot.eventGroups.active[0].id, "evt-1");

      assert.equal(snapshot.eventGroups.planning.length, 1);
      assert.equal(snapshot.eventGroups.planning[0].id, "evt-2");

      assert.equal(snapshot.eventGroups.completed.length, 1);
      assert.equal(snapshot.eventGroups.completed[0].id, "evt-3");
    });

    it("derives commercial pipeline summary accurately from inquiries", () => {
      const source = createFixtureSourceData();
      const snapshot = buildAdminDashboardSnapshot(source);

      // Inquiries: 3 'new' (inq-1, inq-3, inq-4) and 1 'contacted' (inq-2)
      assert.equal(snapshot.commercial.summary.total, 4);
      assert.equal(snapshot.commercial.summary.new, 3);
      assert.equal(snapshot.commercial.summary.contacted, 1);
      assert.equal(snapshot.commercial.summary.active, 4);
      assert.equal(snapshot.commercial.summary.converted, 0);
      assert.equal(snapshot.commercial.summary.archived, 0);
    });

    it("forwards the single injected now clock across Attention, Client Decisions, Upcoming, Pipeline, and Financial Position", () => {
      const testDate = new Date("2026-08-19T14:30:00.000Z");
      const doc = createOperationalDocument({
        id: "doc-overdue",
        documentType: "invoice",
        status: "sent",
        expiryDate: "2026-08-10",
      });
      const inq: ContactInquiry = {
        id: "inq-single-clock",
        name: "Lead Relativo",
        email: "lead@example.com",
        projectType: "Casamento",
        packageLabel: null,
        intent: "Info",
        message: "Ola",
        status: "new",
        marketingOptIn: false,
        source: "website_contact_form",
        createdAt: "2026-08-19T14:00:00.000Z", // 30 min before testDate
        updatedAt: "2026-08-19T14:00:00.000Z",
        brevoLeadWelcomeAt: null,
        brevoPortfolioSentAt: null,
        brevoExperiencesSentAt: null,
        brevoMeetingSentAt: null,
        brevoLastCallSentAt: null,
        brevoNewsletterWelcomeAt: null,
      };
      const source = createFixtureSourceData({
        operationalDocuments: [doc],
        inquiries: [inq],
      });

      const snapshot = buildAdminDashboardSnapshot(source, { now: testDate });

      // Check Attention has deterministic relative time driven by testDate
      const leadAttention = snapshot.attention.items.find((i) => i.id === "lead-inq-single-clock");
      assert.ok(leadAttention);
      assert.equal(leadAttention.context, "Há 30 min");

      const overdueAttention = snapshot.attention.items.find((i) => i.id === "overdue-doc-overdue");
      assert.ok(overdueAttention);
      assert.match(overdueAttention.label, /9 dias/);

      // Check Financial Position overdue items match testDate
      assert.equal(snapshot.financialPosition.receivables.overdueInvoiceCount, 1);
      assert.equal(snapshot.financialPosition.receivables.overdueItems[0].daysOverdue, 9);
    });
  });
});
