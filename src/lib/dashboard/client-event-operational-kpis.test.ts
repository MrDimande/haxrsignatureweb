import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  aggregateGuestMetrics,
  fetchOperationalKpis,
  mapVendorStatusLabel,
  type OperationalKpisAdminClient,
} from "@/lib/dashboard/client-event-operational-kpis";
import {
  mapClientEventToDashboardData,
} from "@/lib/dashboard/client-event-dashboard-service";
import type { ClientEventRow } from "@/lib/events/client-app-database.types";
import { mapRpcPayloadToDashboardFinanceMetrics } from "@/lib/payments/client-event-payments-finance";
import type { ClientEventPaymentsRpcPayload } from "@/lib/payments/client-event-payments-rpc";
import { mapRpcPayloadToDashboardGuestMetrics } from "@/lib/guests/client-event-guests-dashboard";
import type { ClientEventGuestsRpcPayload } from "@/lib/guests/client-event-guests-rpc";

const OPERATIONAL_EVENT_ID = "11111111-1111-4111-8111-111111111111";

function createOperationalAdminClient(input: {
  guests?: Array<{ status: string; plus_ones: number; seat_id: string | null }>;
  payments?: Array<{ amount: number }>;
  vendors?: Array<{ id: string; name: string; service_category: string; status: string }>;
  checklist?: Array<{ status: string }>;
  counts?: Partial<Record<string, number>>;
}): OperationalKpisAdminClient {
  const counts = input.counts ?? {};

  return {
    from(table: string) {
      return {
        select(columns: string, options?: { count: "exact"; head: boolean }) {
          if (options?.head) {
            return {
              async eq(column: string, value: string) {
                void column;
                void value;
                return { count: counts[table] ?? 0, error: null };
              },
              async in(column: string, values: string[]) {
                void column;
                void values;
                return { count: counts["concierge_portal_items"] ?? 0, error: null };
              },
            };
          }

          return {
            async eq(column: string, value: string) {
              void column;
              void value;
              if (table === "guests") {
                return { data: input.guests ?? [], error: null };
              }
              if (table === "payments") {
                return { data: input.payments ?? [], error: null };
              }
              if (table === "event_vendors") {
                const vendors = input.vendors ?? [];
                return Promise.resolve({ data: vendors, error: null });
              }
              if (table === "event_checklist_items") {
                return { data: input.checklist ?? [], error: null };
              }
              return { data: [], error: null };
            },
            async in() {
              return { data: [], error: null };
            },
          };
        },
      };
    },
  } as OperationalKpisAdminClient;
}

const baseEvent: ClientEventRow = {
  id: "f51ce8b2-6b5c-4692-852e-fb1dad1842e1",
  owner_user_id: "acd1d7b7-b679-4c8b-94e1-4d4552f1d8ee",
  slug: "staging-a",
  event_name: "Staging A Event",
  event_type: "wedding",
  bride_name: "Staging",
  groom_name: "A",
  event_date: "2026-12-20",
  event_location: "Maputo",
  estimated_guests: 150,
  budget_min: null,
  budget_max: 150000,
  status: "planning",
  source: "onboarding",
  services_interested: [],
  phone: "+258840000000",
  operational_event_id: null,
  is_active: true,
  onboarding_fingerprint: "fp-001",
  created_at: "2026-07-09T12:00:00.000Z",
  updated_at: "2026-07-09T12:00:00.000Z",
};

describe("client-event-operational-kpis", () => {
  it("aggregateGuestMetrics counts confirmed, pending, declined and plus ones", () => {
    const metrics = aggregateGuestMetrics([
      { status: "confirmed", plus_ones: 1, seat_id: "seat-1" },
      { status: "invited", plus_ones: 0, seat_id: null },
      { status: "declined", plus_ones: 0, seat_id: null },
      { status: "checked_in", plus_ones: 2, seat_id: "seat-2" },
    ]);

    assert.equal(metrics.guestsTotal, 4);
    assert.equal(metrics.guestsConfirmed, 2);
    assert.equal(metrics.guestsPending, 1);
    assert.equal(metrics.guestsDeclined, 1);
    assert.equal(metrics.guestsPlusOnes, 3);
    assert.equal(metrics.tablesAssigned, 2);
  });

  it("fetchOperationalKpis aggregates payments, checklist and counts", async () => {
    const kpis = await fetchOperationalKpis(
      OPERATIONAL_EVENT_ID,
      { clientEventId: baseEvent.id, slug: baseEvent.slug },
      createOperationalAdminClient({
        guests: [
          { status: "confirmed", plus_ones: 0, seat_id: null },
          { status: "invited", plus_ones: 1, seat_id: null },
        ],
        payments: [{ amount: 25000 }, { amount: 15000.5 }],
        vendors: [
          {
            id: "vendor-1",
            name: "Foto Studio",
            service_category: "Fotografia",
            status: "em_analise",
          },
        ],
        checklist: [{ status: "pending" }, { status: "completed" }],
        counts: {
          documents: 2,
          event_moodboard_items: 3,
          concierge_uploads: 4,
          concierge_review_items: 1,
          event_contact_profiles: 5,
          seats: 10,
          concierge_portal_items: 2,
        },
      }),
    );

    assert.equal(kpis.guestsTotal, 0);
    assert.equal(kpis.guestsConfirmed, 0);
    assert.equal(kpis.guestsPending, 0);
    assert.equal(kpis.paymentsCount, 2);
    assert.equal(kpis.paymentsTotal, 40000.5);
    assert.equal(kpis.vendorsCount, 1);
    assert.equal(kpis.checklistTotal, 2);
    assert.equal(kpis.checklistCompleted, 1);
    assert.equal(kpis.moodboardCount, 3);
    assert.equal(kpis.conciergeUploadsCount, 4);
    assert.equal(kpis.documentsCount, 2);
    assert.equal(kpis.tablesTotal, 10);
    assert.equal(kpis.conciergePortalItemsCount, 2);
  });

  it("mapVendorStatusLabel maps known vendor statuses", () => {
    assert.equal(mapVendorStatusLabel("em_analise"), "Em revisão");
    assert.equal(mapVendorStatusLabel("assinado"), "Assinado");
  });
});

describe("mapClientEventToDashboardData operational KPIs", () => {
  it("without operational_event_id keeps estimated guests and zero operational KPIs", () => {
    const dashboard = mapClientEventToDashboardData(baseEvent, {
      full_name: "Staging A",
      app_role: "client",
    });

    assert.equal(dashboard.meta.operationalLinked, false);
    assert.equal(dashboard.guestSnapshot.total, 150);
    assert.equal(dashboard.guestSnapshot.confirmed, 0);
    assert.equal(dashboard.guestSnapshot.pending, 150);
    assert.equal(dashboard.financeSnapshot.paidAmount, 0);
    assert.equal(dashboard.stats.find((s) => s.id === "tasks-open")?.value, 0);
  });

  it("with operational_event_id uses RPC guest and payment KPIs", () => {
    const guestMetrics = mapRpcPayloadToDashboardGuestMetrics({
      guests: [],
      summary: {
        total: 12,
        confirmed: 7,
        pending: 4,
        declined: 1,
        plusOnes: 3,
        tablesAssigned: 5,
        tablesTotal: 8,
      },
    });
    const dashboard = mapClientEventToDashboardData(
      { ...baseEvent, operational_event_id: OPERATIONAL_EVENT_ID },
      { full_name: "Staging A", app_role: "client" },
      {
        guestsTotal: 0,
        guestsConfirmed: 0,
        guestsPending: 0,
        guestsDeclined: 0,
        guestsPlusOnes: 0,
        tablesAssigned: 0,
        tablesTotal: 8,
        paymentsCount: 0,
        paymentsTotal: 0,
        documentsCount: 1,
        vendorsCount: 2,
        checklistTotal: 6,
        checklistCompleted: 3,
        moodboardCount: 4,
        conciergeUploadsCount: 2,
        conciergeReviewItemsCount: 1,
        conciergePortalItemsCount: 0,
        contactProfilesCount: 9,
      },
      guestMetrics,
      {
        paymentCount: 2,
        paidAmount: 50000,
        pendingAmount: 100000,
        budgetEstimated: 150000,
        nextPayment: {
          vendorName: "Sinal decoração",
          dueDate: "9 jul. 2026",
          amount: 25000,
        },
      },
    );

    assert.equal(dashboard.meta.operationalLinked, true);
    assert.equal(dashboard.meta.operationalEventId, OPERATIONAL_EVENT_ID);
    assert.equal(dashboard.guestSnapshot.total, 12);
    assert.equal(dashboard.guestSnapshot.confirmed, 7);
    assert.equal(dashboard.guestSnapshot.pending, 4);
    assert.equal(dashboard.financeSnapshot.paidAmount, 50000);
    assert.equal(dashboard.financeSnapshot.pendingAmount, 100000);
    assert.equal(dashboard.financeSnapshot.budgetEstimated, 150000);
    assert.equal(dashboard.financeSnapshot.nextPayment.vendorName, "Sinal decoração");
    assert.equal(dashboard.stats.find((s) => s.id === "vendors-active")?.value, 2);
    assert.equal(dashboard.stats.find((s) => s.id === "tasks-open")?.value, 3);
    assert.equal(dashboard.modules.find((m) => m.id === "checklist")?.metric, "3/6 tarefas");
  });

  it("RPC finance metrics map staging-a payment totals for dashboard", () => {
    const rpcPayload: ClientEventPaymentsRpcPayload = {
      payments: [
        {
          id: "pay-1",
          amount: 25000,
          currency: "MZN",
          payment_method: "mpesa",
          reference: "MPESA-001",
          notes: "Sinal",
          paid_at: "2026-07-09T10:00:00.000Z",
          created_at: "2026-07-09T10:00:00.000Z",
          document: null,
        },
        {
          id: "pay-2",
          amount: 15000,
          currency: "MZN",
          payment_method: "bank_transfer",
          reference: "TRF-002",
          notes: "Transferência",
          paid_at: "2026-07-09T11:00:00.000Z",
          created_at: "2026-07-09T11:00:00.000Z",
          document: null,
        },
      ],
      summary: {
        paymentCount: 2,
        totalPayments: 40000,
        totalPaid: 40000,
        pendingAmount: 110000,
        currency: "MZN",
        budgetMin: null,
        budgetMax: 150000,
        budgetRange: null,
        lastPayment: {
          id: "pay-2",
          amount: 15000,
          currency: "MZN",
          payment_method: "bank_transfer",
          reference: "TRF-002",
          paid_at: "2026-07-09T11:00:00.000Z",
        },
      },
    };

    const finance = mapRpcPayloadToDashboardFinanceMetrics(
      { ...baseEvent, operational_event_id: OPERATIONAL_EVENT_ID, budget_max: 150000 },
      rpcPayload,
    );
    const dashboard = mapClientEventToDashboardData(
      { ...baseEvent, operational_event_id: OPERATIONAL_EVENT_ID, budget_max: 150000 },
      null,
      null,
      null,
      finance,
    );

    assert.equal(finance.paymentCount, 2);
    assert.equal(finance.paidAmount, 40000);
    assert.equal(finance.pendingAmount, 110000);
    assert.equal(finance.budgetEstimated, 150000);
    assert.equal(dashboard.financeSnapshot.paidAmount, 40000);
    assert.equal(dashboard.financeSnapshot.pendingAmount, 110000);
  });

  it("RPC guest metrics map staging-a guest totals for dashboard", () => {
    const rpcPayload: ClientEventGuestsRpcPayload = {
      guests: [],
      summary: {
        total: 2,
        confirmed: 1,
        pending: 1,
        declined: 0,
        plusOnes: 1,
        tablesAssigned: 0,
        tablesTotal: 0,
      },
    };

    const guestMetrics = mapRpcPayloadToDashboardGuestMetrics(rpcPayload);
    const dashboard = mapClientEventToDashboardData(
      { ...baseEvent, operational_event_id: OPERATIONAL_EVENT_ID },
      null,
      null,
      guestMetrics,
    );

    assert.equal(guestMetrics.guestsTotal, 2);
    assert.equal(guestMetrics.guestsConfirmed, 1);
    assert.equal(guestMetrics.guestsPending, 1);
    assert.equal(guestMetrics.guestsPlusOnes, 1);
    assert.equal(dashboard.guestSnapshot.total, 2);
    assert.equal(dashboard.guestSnapshot.confirmed, 1);
    assert.equal(dashboard.guestSnapshot.pending, 1);
    assert.equal(dashboard.guestSnapshot.plusOnes, 1);
  });

  it("operational event without guest RPC returns safe zeros", () => {
    const dashboard = mapClientEventToDashboardData(
      { ...baseEvent, operational_event_id: OPERATIONAL_EVENT_ID },
      null,
      {
        guestsTotal: 0,
        guestsConfirmed: 0,
        guestsPending: 0,
        guestsDeclined: 0,
        guestsPlusOnes: 0,
        tablesAssigned: 0,
        tablesTotal: 0,
        paymentsCount: 0,
        paymentsTotal: 0,
        documentsCount: 0,
        vendorsCount: 0,
        checklistTotal: 0,
        checklistCompleted: 0,
        moodboardCount: 0,
        conciergeUploadsCount: 0,
        conciergeReviewItemsCount: 0,
        conciergePortalItemsCount: 0,
        contactProfilesCount: 0,
      },
    );

    assert.equal(dashboard.guestSnapshot.total, 0);
    assert.equal(dashboard.guestSnapshot.confirmed, 0);
    assert.equal(dashboard.financeSnapshot.paidAmount, 0);
  });
});
