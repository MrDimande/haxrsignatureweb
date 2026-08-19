import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildAdminDashboardSnapshot,
  getMaputoFiscalYear,
  type AdminDashboardSourceData,
} from "./admin-dashboard.service";
import type { DashboardStats, Business } from "@/lib/admin/types";
import type { ManagedEvent, EventListGuestStats } from "@/lib/events/types";
import type { FinanceOverview } from "@/lib/finance/types";
import type { ContactInquiry } from "@/lib/contact/types";

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

export function createEventListGuestStats(
  overrides?: Partial<EventListGuestStats>
): EventListGuestStats {
  return {
    totalGuests: 250,
    confirmed: 200,
    checkedIn: 0,
    unassigned: 0,
    ...overrides,
  };
}

function createFixtureSourceData(overrides?: Partial<AdminDashboardSourceData>): AdminDashboardSourceData {
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
    documents,
    businesses,
    events,
    guestStats: {
      "evt-1": createEventListGuestStats(),
    },
    finance,
    inquiries,
    revenueByBusiness: [{ businessId: "haxr-signature", businessName: "HAXR Signature", total: 750000 }],
    revenueByMonth: [{ month: 8, total: 80000, count: 2 }],
    ...overrides,
  };
}

describe("admin-dashboard.service (type-safe tests)", () => {
  describe("getMaputoFiscalYear", () => {
    it("correctly extracts year from UTC/Maputo dates", () => {
      const date = new Date("2026-12-31T23:30:00Z"); // In Maputo (UTC+2), this is 2027-01-01 01:30
      assert.equal(getMaputoFiscalYear(date), 2027);

      const midYear = new Date("2026-08-19T12:00:00Z");
      assert.equal(getMaputoFiscalYear(midYear), 2026);
    });
  });

  describe("buildAdminDashboardSnapshot", () => {
    it("groups events using canonical pipeline semantics (active, planning, completed)", () => {
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
      const source = createFixtureSourceData({ events: [], guestStats: {} });
      const snapshot = buildAdminDashboardSnapshot(source);

      assert.deepEqual(snapshot.events, []);
      assert.deepEqual(snapshot.eventGroups.active, []);
      assert.deepEqual(snapshot.eventGroups.planning, []);
      assert.deepEqual(snapshot.eventGroups.completed, []);
      assert.deepEqual(snapshot.guestStats, {});
    });

    it("passes through documents, finance and analytics data without mutation", () => {
      const source = createFixtureSourceData();
      const snapshot = buildAdminDashboardSnapshot(source);

      assert.deepEqual(snapshot.documents, source.documents);
      assert.deepEqual(snapshot.businesses, source.businesses);
      assert.deepEqual(snapshot.finance, source.finance);
      assert.deepEqual(snapshot.analytics.revenueByBusiness, source.revenueByBusiness);
      assert.deepEqual(snapshot.analytics.revenueByMonth, source.revenueByMonth);
      assert.equal(snapshot.fiscalYear, 2026);
    });

    it("generates deterministic snapshot structure with injected now timestamp", () => {
      const source = createFixtureSourceData();
      const testDate = new Date("2026-08-19T14:30:00.000Z");
      const snapshot = buildAdminDashboardSnapshot(source, { now: testDate });

      assert.equal(snapshot.generatedAt, "2026-08-19T14:30:00.000Z");
    });
  });
});
