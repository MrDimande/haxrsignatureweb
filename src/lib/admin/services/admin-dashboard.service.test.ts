import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildAdminDashboardSnapshot,
  getMaputoFiscalYear,
  type AdminDashboardSourceData,
} from "./admin-dashboard.service";
import type { DashboardStats, Business } from "@/lib/admin/types";
import type { ManagedEvent } from "@/lib/events/types";
import type { FinanceOverview } from "@/lib/finance/types";
import type { ContactInquiry } from "@/lib/contact/types";

function createFixtureSourceData(overrides?: Partial<AdminDashboardSourceData>): AdminDashboardSourceData {
  const documents: DashboardStats = {
    totalDraft: 2,
    totalProformas: 5,
    totalInvoices: 10,
    totalReceipts: 8,
    totalPaid: 8,
    totalCancelled: 1,
    totalOverdue: 0,
    draftDocuments: [],
    recentDocuments: [],
  };

  const businesses: Business[] = [
    {
      id: "biz-1",
      name: "HAXR Signature",
      legalName: "HAXR Signature Lda",
      nuit: "123456789",
      email: "info@haxrsignature.com",
      phone: "+258840000000",
      address: "Maputo",
      city: "Maputo",
      country: "Moçambique",
      currency: "MZN",
      invoicePrefix: "HAXR",
      nextInvoiceNumber: 100,
      bankDetails: { bankName: "BCI", accountNumber: "123", iban: "", swift: "" },
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    },
  ];

  const events: ManagedEvent[] = [
    {
      id: "evt-1",
      name: "Casamento Vânia & Fabião",
      type: "wedding",
      businessId: "biz-1",
      date: "2026-12-20",
      location: "Polana Serena Hotel",
      estimatedGuests: 250,
      budget: 500000,
      currency: "MZN",
      isActive: true,
      createdAt: "2026-01-10T00:00:00Z",
      updatedAt: "2026-01-10T00:00:00Z",
    },
    {
      id: "evt-2",
      name: "Gala de Fim de Ano",
      type: "corporate",
      businessId: "biz-1",
      date: null,
      location: "Maputo",
      estimatedGuests: 100,
      budget: 150000,
      currency: "MZN",
      isActive: true,
      createdAt: "2026-01-15T00:00:00Z",
      updatedAt: "2026-01-15T00:00:00Z",
    },
    {
      id: "evt-3",
      name: "Evento Passado",
      type: "private",
      businessId: "biz-1",
      date: "2025-05-10",
      location: "Matola",
      estimatedGuests: 50,
      budget: 50000,
      currency: "MZN",
      isActive: true,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
    },
  ];

  const finance: FinanceOverview = {
    totalInvoiced: 1000000,
    totalReceived: 750000,
    totalPending: 250000,
    thisMonthReceived: 80000,
    recentPayments: [],
  };

  const inquiries: ContactInquiry[] = [
    {
      id: "inq-1",
      name: "Ana Silva",
      email: "ana@example.com",
      projectType: "Casamento",
      intent: "Convites e website",
      status: "new",
      marketingOptIn: true,
      createdAt: "2026-08-19T10:00:00Z",
      updatedAt: "2026-08-19T10:00:00Z",
    },
    {
      id: "inq-2",
      name: "Carlos Santos",
      email: "carlos@example.com",
      projectType: "Corporativo",
      intent: "RSVP platform",
      status: "replied",
      marketingOptIn: false,
      createdAt: "2026-08-18T15:00:00Z",
      updatedAt: "2026-08-18T16:00:00Z",
    },
    {
      id: "inq-3",
      name: "Mariana Costa",
      email: "mariana@example.com",
      projectType: "Casamento",
      intent: "Identidade visual",
      status: "new",
      marketingOptIn: true,
      createdAt: "2026-08-17T09:00:00Z",
      updatedAt: "2026-08-17T09:00:00Z",
    },
    {
      id: "inq-4",
      name: "João Pereira",
      email: "joao@example.com",
      projectType: "Privado",
      intent: "Aniversário",
      status: "new",
      marketingOptIn: false,
      createdAt: "2026-08-16T12:00:00Z",
      updatedAt: "2026-08-16T12:00:00Z",
    },
  ];

  return {
    fiscalYear: 2026,
    documents,
    businesses,
    events,
    guestStats: {
      "evt-1": { totalGuests: 250, confirmed: 200, declined: 20, pending: 30, checkedIn: 0, seated: 250, unassigned: 0 },
    },
    finance,
    inquiries,
    revenueByBusiness: [{ businessId: "biz-1", businessName: "HAXR Signature", total: 750000 }],
    revenueByMonth: [{ month: 8, total: 80000, count: 2 }],
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

      // Inquiries: 3 'new' (inq-1, inq-3, inq-4) and 1 'replied' (inq-2)
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
