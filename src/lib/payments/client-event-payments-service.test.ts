import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { handleClientEventPaymentsRequest } from "@/lib/payments/client-event-payments-api";
import {
  buildBudgetModuleContext,
  getClientEventPaymentsData,
  mapRpcPayloadToBudgetModuleData,
  type ClientEventPaymentsAuthClient,
} from "@/lib/payments/client-event-payments-service";
import {
  GET_CLIENT_EVENT_PAYMENTS_RPC,
  parseClientEventPaymentsRpcPayload,
  type ClientEventPaymentsRpcClient,
  type ClientEventPaymentsRpcPayload,
} from "@/lib/payments/client-event-payments-rpc";
import type { ClientEventRow } from "@/lib/events/client-app-database.types";

const EVENT_ID = "f51ce8b2-6b5c-4692-852e-fb1dad1842e1";
const OPERATIONAL_EVENT_ID = "1251bc6e-fac7-46cd-981d-bb3e4c066ce8";
const OWNER_ID = "acd1d7b7-b679-4c8b-94e1-4d4552f1d8ee";
const OTHER_USER_ID = "00000000-0000-4000-8000-000000000099";

const baseEvent: ClientEventRow = {
  id: EVENT_ID,
  owner_user_id: OWNER_ID,
  slug: "staging-a",
  event_name: "Staging A Event",
  event_type: "wedding",
  bride_name: "Staging",
  groom_name: "A",
  event_date: "2026-12-20",
  event_location: "Maputo",
  estimated_guests: 150,
  budget_min: 100_000,
  budget_max: 250_000,
  status: "planning",
  source: "onboarding",
  services_interested: [],
  phone: "+258840000000",
  operational_event_id: OPERATIONAL_EVENT_ID,
  is_active: true,
  onboarding_fingerprint: "fp-001",
  created_at: "2026-07-09T12:00:00.000Z",
  updated_at: "2026-07-09T12:00:00.000Z",
};

const sampleRpcPayload: ClientEventPaymentsRpcPayload = {
  payments: [
    {
      id: "pay-1",
      amount: 25_000,
      currency: "MZN",
      payment_method: "mpesa",
      reference: "REF-001",
      notes: "Sinal decoração",
      paid_at: "2026-07-01T10:00:00.000Z",
      created_at: "2026-07-01T10:00:00.000Z",
      document: { number: "FT-001", client_name: "Elegance Decor" },
    },
    {
      id: "pay-2",
      amount: 15_000,
      currency: "MZN",
      payment_method: "bank_transfer",
      reference: "REF-002",
      notes: null,
      paid_at: "2026-06-15T08:00:00.000Z",
      created_at: "2026-06-15T08:00:00.000Z",
      document: null,
    },
  ],
  summary: {
    paymentCount: 2,
    totalPayments: 40_000,
    totalPaid: 40_000,
    pendingAmount: 210_000,
    currency: "MZN",
    budgetMin: 100_000,
    budgetMax: 250_000,
    budgetRange: "100000-250000",
    lastPayment: {
      id: "pay-1",
      amount: 25_000,
      currency: "MZN",
      payment_method: "mpesa",
      reference: "REF-001",
      paid_at: "2026-07-01T10:00:00.000Z",
    },
  },
};

function createAuthClient(input: {
  event?: ClientEventRow | null;
  memberUserIds?: string[];
}): ClientEventPaymentsAuthClient {
  return {
    from(table: "client_events" | "event_members") {
      if (table === "client_events") {
        return {
          select() {
            return {
              eq(column: string, value: string | boolean) {
                if (column === "id" && value === EVENT_ID) {
                  return {
                    async maybeSingle() {
                      return { data: input.event ?? null, error: null };
                    },
                  };
                }
                return {
                  async maybeSingle() {
                    return { data: null, error: null };
                  },
                };
              },
            };
          },
        };
      }

      return {
        select() {
          return {
            eq(column: string, value: string) {
              const filters: Record<string, string> = { [column]: value };
              return {
                eq(nextColumn: string, nextValue: string) {
                  filters[nextColumn] = nextValue;
                  return {
                    async maybeSingle() {
                      const isMember =
                        filters.client_event_id === EVENT_ID &&
                        input.memberUserIds?.includes(filters.user_id ?? "");
                      return {
                        data: isMember ? { id: "member-1" } : null,
                        error: null,
                      };
                    },
                  };
                },
              };
            },
          };
        },
      };
    },
  };
}

function createRpcClient(payload: ClientEventPaymentsRpcPayload | null, errorMessage?: string) {
  return {
    async rpc(fn: typeof GET_CLIENT_EVENT_PAYMENTS_RPC, args: { p_client_event_id: string }) {
      assert.equal(fn, GET_CLIENT_EVENT_PAYMENTS_RPC);
      assert.equal(args.p_client_event_id, EVENT_ID);
      if (errorMessage) {
        return { data: null, error: { message: errorMessage } };
      }
      return { data: payload, error: null };
    },
  } satisfies ClientEventPaymentsRpcClient;
}

describe("client-event-payments-rpc", () => {
  it("parseClientEventPaymentsRpcPayload normalizes payments and summary", () => {
    const parsed = parseClientEventPaymentsRpcPayload(sampleRpcPayload);
    assert.ok(parsed);
    assert.equal(parsed.payments.length, 2);
    assert.equal(parsed.summary.paymentCount, 2);
    assert.equal(parsed.summary.totalPaid, 40_000);
    assert.equal(parsed.summary.pendingAmount, 210_000);
    assert.equal(parsed.summary.budgetMax, 250_000);
  });
});

describe("client-event-payments-service", () => {
  it("buildBudgetModuleContext maps event overview", () => {
    const context = buildBudgetModuleContext(baseEvent);
    assert.equal(context.eventId, EVENT_ID);
    assert.equal(context.eventOverview.name, "Staging A Event");
  });

  it("mapRpcPayloadToBudgetModuleData builds financial summary", () => {
    const data = mapRpcPayloadToBudgetModuleData(baseEvent, sampleRpcPayload);
    assert.equal(data.summary.estimated, 250_000);
    assert.equal(data.summary.paid, 40_000);
    assert.equal(data.summary.pending, 210_000);
    assert.equal(data.recentPayments.length, 2);
    assert.equal(data.recentPayments[0]?.vendorOrItem, "Sinal decoração");
    assert.equal(data.categories.length, 0);
    assert.equal(data.items.length, 0);
  });

  it("getClientEventPaymentsData returns not_found for missing event", async () => {
    const result = await getClientEventPaymentsData({
      authClient: createAuthClient({ event: null }),
      rpcClient: createRpcClient(sampleRpcPayload),
      userId: OWNER_ID,
      eventId: EVENT_ID,
    });
    assert.equal(result.kind, "not_found");
  });

  it("getClientEventPaymentsData returns forbidden for non-owner non-member", async () => {
    const result = await getClientEventPaymentsData({
      authClient: createAuthClient({ event: baseEvent }),
      rpcClient: createRpcClient(sampleRpcPayload),
      userId: OTHER_USER_ID,
      eventId: EVENT_ID,
    });
    assert.equal(result.kind, "forbidden");
  });

  it("getClientEventPaymentsData returns operational_not_linked without operational_event_id", async () => {
    const result = await getClientEventPaymentsData({
      authClient: createAuthClient({ event: { ...baseEvent, operational_event_id: null } }),
      rpcClient: createRpcClient(sampleRpcPayload),
      userId: OWNER_ID,
      eventId: EVENT_ID,
    });
    assert.equal(result.kind, "operational_not_linked");
  });

  it("getClientEventPaymentsData calls RPC when operational_event_id exists", async () => {
    let rpcCalled = false;
    const rpcClient = {
      async rpc(fn: typeof GET_CLIENT_EVENT_PAYMENTS_RPC) {
        assert.equal(fn, GET_CLIENT_EVENT_PAYMENTS_RPC);
        rpcCalled = true;
        return { data: sampleRpcPayload, error: null };
      },
    } satisfies ClientEventPaymentsRpcClient;

    const result = await getClientEventPaymentsData({
      authClient: createAuthClient({ event: baseEvent }),
      rpcClient,
      userId: OWNER_ID,
      eventId: EVENT_ID,
    });

    assert.equal(rpcCalled, true);
    assert.equal(result.kind, "ok");
    if (result.kind === "ok") {
      assert.equal(result.data.recentPayments.length, 2);
    }
  });

  it("getClientEventPaymentsData returns empty list when RPC has no payments", async () => {
    const emptyPayload: ClientEventPaymentsRpcPayload = {
      payments: [],
      summary: {
        paymentCount: 0,
        totalPayments: 0,
        totalPaid: 0,
        pendingAmount: 250_000,
        currency: "MZN",
        budgetMin: 100_000,
        budgetMax: 250_000,
        budgetRange: "100000-250000",
        lastPayment: null,
      },
    };

    const result = await getClientEventPaymentsData({
      authClient: createAuthClient({ event: baseEvent }),
      rpcClient: createRpcClient(emptyPayload),
      userId: OWNER_ID,
      eventId: EVENT_ID,
    });

    assert.equal(result.kind, "ok");
    if (result.kind === "ok") {
      assert.equal(result.data.recentPayments.length, 0);
      assert.equal(result.data.summary.paid, 0);
    }
  });

  it("getClientEventPaymentsData returns unavailable when RPC fails", async () => {
    const result = await getClientEventPaymentsData({
      authClient: createAuthClient({ event: baseEvent }),
      rpcClient: createRpcClient(null, "permission denied for table payments"),
      userId: OWNER_ID,
      eventId: EVENT_ID,
    });
    assert.equal(result.kind, "unavailable");
  });
});

describe("client-event-payments-api", () => {
  const okEnv = { ok: true as const, message: "" };
  const authClient = createAuthClient({ event: baseEvent });

  it("returns 401 without session", async () => {
    const result = await handleClientEventPaymentsRequest({
      envCheck: okEnv,
      serviceRoleCheck: okEnv,
      user: null,
      eventId: EVENT_ID,
      authClient,
      rpcClient: createRpcClient(sampleRpcPayload),
    });
    assert.equal(result.status, 401);
    assert.equal(result.body.error, "unauthorized");
  });

  it("returns 404 for missing event", async () => {
    const result = await handleClientEventPaymentsRequest({
      envCheck: okEnv,
      serviceRoleCheck: okEnv,
      user: { id: OWNER_ID },
      eventId: EVENT_ID,
      authClient: createAuthClient({ event: null }),
      rpcClient: createRpcClient(sampleRpcPayload),
    });
    assert.equal(result.status, 404);
    assert.equal(result.body.error, "not_found");
  });

  it("returns 403 for foreign event", async () => {
    const result = await handleClientEventPaymentsRequest({
      envCheck: okEnv,
      serviceRoleCheck: okEnv,
      user: { id: OTHER_USER_ID },
      eventId: EVENT_ID,
      authClient,
      rpcClient: createRpcClient(sampleRpcPayload),
    });
    assert.equal(result.status, 403);
    assert.equal(result.body.error, "forbidden");
  });

  it("returns 409 when operational event is not linked", async () => {
    const result = await handleClientEventPaymentsRequest({
      envCheck: okEnv,
      serviceRoleCheck: okEnv,
      user: { id: OWNER_ID },
      eventId: EVENT_ID,
      authClient: createAuthClient({ event: { ...baseEvent, operational_event_id: null } }),
      rpcClient: createRpcClient(sampleRpcPayload),
    });
    assert.equal(result.status, 409);
    assert.equal(result.body.error, "operational_not_linked");
  });

  it("returns 200 with payments for owner", async () => {
    const result = await handleClientEventPaymentsRequest({
      envCheck: okEnv,
      serviceRoleCheck: okEnv,
      user: { id: OWNER_ID },
      eventId: EVENT_ID,
      authClient,
      rpcClient: createRpcClient(sampleRpcPayload),
    });
    assert.equal(result.status, 200);
    assert.equal(result.body.ok, true);
    if (result.body.ok) {
      assert.equal(result.body.data.recentPayments.length, 2);
      assert.equal(result.body.data.summary.paid, 40_000);
    }
  });

  it("returns 503 when RPC fails", async () => {
    const result = await handleClientEventPaymentsRequest({
      envCheck: okEnv,
      serviceRoleCheck: okEnv,
      user: { id: OWNER_ID },
      eventId: EVENT_ID,
      authClient,
      rpcClient: createRpcClient(null, "permission denied for table payments"),
    });
    assert.equal(result.status, 503);
    assert.equal(result.body.error, "unavailable");
  });
});
