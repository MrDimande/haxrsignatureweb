import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildAdminDashboardSnapshot,
  buildAdminAttentionItems,
  getMaputoFiscalYear,
  type AdminDashboardSourceData,
} from "./admin-dashboard.service";
import type { DashboardStats, Business } from "@/lib/admin/types";
import type { ManagedEvent } from "@/lib/events/types";
import type { FinanceOverview } from "@/lib/finance/types";
import type { ContactInquiry } from "@/lib/contact/types";
import type { AdminAlert } from "@/lib/admin/services/admin-alerts.service";
import type { EventPortfolioOperationalSnapshot } from "@/lib/admin/services/event-portfolio.service";
import type { PortalTimelineItem } from "@/lib/portal/portal-premium.types";

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

export function createFinanceOverview(overrides?: Partial<FinanceOverview>): FinanceOverview {
  return {
    totalReceived: 750000,
    totalReceiptsAmount: 750000,
    pendingInvoicesCount: 2,
    pendingInvoicesAmount: 250000,
    sentProformasCount: 3,
    pendingProformasAmount: 400000,
    thisMonthReceived: 80000,
    thisMonthReceiptsCount: 2,
    recentReceipts: [],
    pendingCollection: [],
    ...overrides,
  };
}

export function createDashboardStats(overrides?: Partial<DashboardStats>): DashboardStats {
  return {
    totalProformas: 5,
    totalInvoices: 10,
    totalReceipts: 8,
    totalDraft: 2,
    totalPaid: 8,
    recentDocuments: [],
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

function createFixtureSourceData(overrides?: Partial<AdminDashboardSourceData>): AdminDashboardSourceData {
  const alerts: AdminAlert[] = [
    createAdminAlert({
      id: "lead-inq-1",
      text: "Novo lead: Ana Silva",
      time: "Há 5 min",
      href: "/admin/leads",
      priority: "high",
      source: "commercial",
      requiresAction: true,
    }),
    createAdminAlert({
      id: "portal-approved-doc-1",
      text: "Ana Silva aprovou a proposta PF-2026-001",
      time: "Há 1 h",
      href: "/admin/documents/doc-1",
      priority: "high",
      source: "portal",
      requiresAction: true,
    }),
    createAdminAlert({
      id: "overdue-doc-2",
      text: "INV-014 em atraso (6 dias)",
      time: "Há 6 dias",
      href: "/admin/documents/doc-2",
      priority: "high",
      source: "finance",
      requiresAction: true,
    }),
    createAdminAlert({
      id: "concierge-pending",
      text: "2 documento(s) Concierge por rever",
      time: "Operações",
      href: "/admin/events",
      priority: "normal",
      source: "operations",
      requiresAction: true,
    }),
  ];
  const documents = createDashboardStats();
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
  const finance = createFinanceOverview();
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
    fiscalYear: 2026,
    alerts,
    portfolioSnapshots,
    timelineBatch,
    documents,
    businesses,
    events,
    finance,
    inquiries,
    revenueByBusiness: [{ businessId: "haxr-signature", businessName: "HAXR Signature", total: 750000 }],
    revenueByMonth: [{ month: 8, total: 80000, count: 2 }],
    ...overrides,
  };
}

describe("admin-dashboard.service (actionability semantics)", () => {
  describe("getMaputoFiscalYear", () => {
    it("correctly extracts year from UTC/Maputo dates", () => {
      const date = new Date("2026-12-31T23:30:00Z"); // In Maputo (UTC+2), this is 2027-01-01 01:30
      assert.equal(getMaputoFiscalYear(date), 2027);

      const midYear = new Date("2026-08-19T12:00:00Z");
      assert.equal(getMaputoFiscalYear(midYear), 2026);
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

    it("passes through high and normal priorities correctly for actionable items", () => {
      const alerts: AdminAlert[] = [
        createAdminAlert({ id: "1", priority: "high", requiresAction: true }),
        createAdminAlert({ id: "2", priority: "normal", requiresAction: true }),
      ];
      const items = buildAdminAttentionItems(alerts);

      assert.equal(items[0].priority, "high");
      assert.equal(items[1].priority, "normal");
    });

    it("does not let read=true or read=false affect operational existence", () => {
      const alerts: AdminAlert[] = [
        createAdminAlert({ id: "1", read: true, requiresAction: true }),
        createAdminAlert({ id: "2", read: false, requiresAction: true }),
      ];
      const items = buildAdminAttentionItems(alerts);

      assert.equal(items.length, 2);
    });

    it("maps sources directly from typed alert.source", () => {
      const alerts: AdminAlert[] = [
        createAdminAlert({ id: "1", source: "commercial", requiresAction: true }),
        createAdminAlert({ id: "2", source: "portal", requiresAction: true }),
        createAdminAlert({ id: "3", source: "finance", requiresAction: true }),
        createAdminAlert({ id: "4", source: "operations", requiresAction: true }),
      ];
      const items = buildAdminAttentionItems(alerts);

      assert.equal(items[0].source, "commercial");
      assert.equal(items[1].source, "portal");
      assert.equal(items[2].source, "finance");
      assert.equal(items[3].source, "operations");
    });

    it("preserves canonical href, label, and context exactly", () => {
      const alert = createAdminAlert({
        id: "portal-changes-1",
        text: "Cliente pediu alterações",
        time: "Há 2 h",
        href: "/admin/documents/doc-99",
        priority: "high",
        source: "portal",
        requiresAction: true,
      });
      const [item] = buildAdminAttentionItems([alert]);

      assert.equal(item.id, "portal-changes-1");
      assert.equal(item.label, "Cliente pediu alterações");
      assert.equal(item.context, "Há 2 h");
      assert.equal(item.href, "/admin/documents/doc-99");
      assert.equal(item.source, "portal");
      assert.equal(item.priority, "high");
    });

    it("handles empty alerts list safely", () => {
      const items = buildAdminAttentionItems([]);
      assert.deepEqual(items, []);
    });

    it("does not mutate original alert objects", () => {
      const original: AdminAlert = createAdminAlert();
      const clone = { ...original };
      buildAdminAttentionItems([original]);

      assert.deepEqual(original, clone);
    });
  });

  describe("buildAdminDashboardSnapshot", () => {
    it("groups events using canonical pipeline semantics with injected now consistently", () => {
      const source = createFixtureSourceData();
      const snapshot = buildAdminDashboardSnapshot(source, { now: new Date("2026-08-19T12:00:00Z") });

      assert.equal(snapshot.eventGroups.active.length, 1);
      assert.equal(snapshot.eventGroups.active[0].id, "evt-1");

      assert.equal(snapshot.eventGroups.planning.length, 1);
      assert.equal(snapshot.eventGroups.planning[0].id, "evt-2");

      assert.equal(snapshot.eventGroups.completed.length, 1);
      assert.equal(snapshot.eventGroups.completed[0].id, "evt-3");
    });

    it("derives newLeads count accurately from inquiries status", () => {
      const source = createFixtureSourceData();
      const snapshot = buildAdminDashboardSnapshot(source);

      // Inquiries: 3 'new' (inq-1, inq-3, inq-4) and 1 'contacted' (inq-2)
      assert.equal(snapshot.commercial.newLeads, 3);
    });

    it("slices recentInquiries to at most 3 items preserving order", () => {
      const source = createFixtureSourceData();
      const snapshot = buildAdminDashboardSnapshot(source);

      assert.equal(snapshot.commercial.recentInquiries.length, 3);
      assert.equal(snapshot.commercial.recentInquiries[0].id, "inq-1");
      assert.equal(snapshot.commercial.recentInquiries[1].id, "inq-2");
      assert.equal(snapshot.commercial.recentInquiries[2].id, "inq-3");
    });

    it("handles empty events safely without errors", () => {
      const source = createFixtureSourceData({ events: [], portfolioSnapshots: [], timelineBatch: { available: true, items: [] } });
      const snapshot = buildAdminDashboardSnapshot(source);

      assert.deepEqual(snapshot.events, []);
      assert.deepEqual(snapshot.eventGroups.active, []);
      assert.deepEqual(snapshot.eventGroups.planning, []);
      assert.deepEqual(snapshot.eventGroups.completed, []);
      assert.deepEqual(snapshot.portfolio.items, []);
      assert.equal(snapshot.portfolio.summary.total, 0);
      assert.equal(snapshot.upcoming.available, true);
      assert.deepEqual(snapshot.upcoming.items, []);
    });

    it("passes through documents, finance, analytics, attention, portfolio and upcoming data without mutation", () => {
      const source = createFixtureSourceData();
      const snapshot = buildAdminDashboardSnapshot(source, { now: new Date("2026-08-19T12:00:00Z") });

      assert.deepEqual(snapshot.documents, source.documents);
      assert.deepEqual(snapshot.businesses, source.businesses);
      assert.deepEqual(snapshot.finance, source.finance);
      assert.deepEqual(snapshot.analytics.revenueByBusiness, source.revenueByBusiness);
      assert.deepEqual(snapshot.analytics.revenueByMonth, source.revenueByMonth);
      assert.equal(snapshot.fiscalYear, 2026);
      assert.equal(snapshot.attention.items.length, 4);
      assert.equal(snapshot.portfolio.items.length, 1);
      assert.equal(snapshot.portfolio.summary.total, 1);
      assert.equal(snapshot.upcoming.available, true);
      assert.equal(snapshot.upcoming.items.length, 1);
      assert.equal(snapshot.upcoming.items[0].title, "Revisão de Proposta");
    });

    it("generates deterministic snapshot structure with injected now timestamp", () => {
      const source = createFixtureSourceData();
      const testDate = new Date("2026-08-19T14:30:00.000Z");
      const snapshot = buildAdminDashboardSnapshot(source, { now: testDate });

      assert.equal(snapshot.generatedAt, "2026-08-19T14:30:00.000Z");
    });
  });
});
