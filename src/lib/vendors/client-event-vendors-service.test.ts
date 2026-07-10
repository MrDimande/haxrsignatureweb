import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  mapClientEventToDashboardData,
} from "@/lib/dashboard/client-event-dashboard-service";
import type { ClientEventRow } from "@/lib/events/client-app-database.types";
import { handleClientEventVendorsRequest } from "@/lib/vendors/client-event-vendors-api";
import { mapRpcPayloadToDashboardVendorMetrics } from "@/lib/vendors/client-event-vendors-dashboard";
import {
  buildVendorModuleContext,
  getClientEventVendorsData,
  mapDbVendorStatusToUiStatus,
  mapRpcPayloadToVendorModuleData,
  type ClientEventVendorsAuthClient,
} from "@/lib/vendors/client-event-vendors-service";
import {
  GET_CLIENT_EVENT_VENDORS_RPC,
  parseClientEventVendorsRpcPayload,
  type ClientEventVendorsRpcClient,
  type ClientEventVendorsRpcPayload,
} from "@/lib/vendors/client-event-vendors-rpc";

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
  budget_min: null,
  budget_max: 150000,
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

const sampleRpcPayload: ClientEventVendorsRpcPayload = {
  vendors: [
    {
      id: "vendor-1",
      name: "Royal Catering",
      service_category: "Catering",
      contact_email: "catering@example.com",
      contact_phone: "+258840000010",
      proposed_amount: 95000,
      currency: "MZN",
      payment_terms: "Maputo",
      deadline: "2026-09-01",
      notes: "Menu degustação agendado",
      status: "em_analise",
      created_at: "2026-07-09T10:00:00.000Z",
      updated_at: "2026-07-09T10:00:00.000Z",
    },
    {
      id: "vendor-2",
      name: "Lens Studio",
      service_category: "Fotografia",
      contact_email: "foto@example.com",
      contact_phone: "+258840000011",
      proposed_amount: 45000,
      currency: "MZN",
      payment_terms: "",
      deadline: null,
      notes: "",
      status: "contratado",
      created_at: "2026-07-09T11:00:00.000Z",
      updated_at: "2026-07-09T12:00:00.000Z",
    },
  ],
  summary: {
    vendorCount: 2,
    activeVendors: 2,
    pendingVendors: 1,
    approvedVendors: 1,
    totalEstimated: 140000,
    categories: ["Catering", "Fotografia"],
    latestVendor: {
      id: "vendor-2",
      name: "Lens Studio",
      service_category: "Fotografia",
      status: "contratado",
      proposed_amount: 45000,
      currency: "MZN",
      created_at: "2026-07-09T11:00:00.000Z",
    },
  },
};

function createAuthClient(input: {
  event?: ClientEventRow | null;
  memberUserIds?: string[];
}): ClientEventVendorsAuthClient {
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

function createRpcClient(payload: ClientEventVendorsRpcPayload | null, errorMessage?: string) {
  return {
    async rpc(fn: typeof GET_CLIENT_EVENT_VENDORS_RPC, args: { p_client_event_id: string }) {
      assert.equal(fn, GET_CLIENT_EVENT_VENDORS_RPC);
      assert.equal(args.p_client_event_id, EVENT_ID);
      if (errorMessage) {
        return { data: null, error: { message: errorMessage } };
      }
      return { data: payload, error: null };
    },
  } satisfies ClientEventVendorsRpcClient;
}

describe("client-event-vendors-rpc", () => {
  it("parseClientEventVendorsRpcPayload normalizes vendors and summary", () => {
    const parsed = parseClientEventVendorsRpcPayload(sampleRpcPayload);
    assert.ok(parsed);
    assert.equal(parsed.vendors.length, 2);
    assert.equal(parsed.summary.vendorCount, 2);
    assert.equal(parsed.summary.activeVendors, 2);
    assert.equal(parsed.summary.pendingVendors, 1);
    assert.equal(parsed.summary.approvedVendors, 1);
    assert.equal(parsed.summary.totalEstimated, 140000);
    assert.deepEqual(parsed.summary.categories, ["Catering", "Fotografia"]);
  });
});

describe("client-event-vendors-service", () => {
  it("buildVendorModuleContext maps event overview", () => {
    const context = buildVendorModuleContext(baseEvent);
    assert.equal(context.eventId, EVENT_ID);
    assert.equal(context.eventOverview.name, "Staging A Event");
  });

  it("mapDbVendorStatusToUiStatus maps operational statuses", () => {
    assert.equal(mapDbVendorStatusToUiStatus("em_analise"), "em_análise");
    assert.equal(mapDbVendorStatusToUiStatus("contratado"), "contratado");
    assert.equal(mapDbVendorStatusToUiStatus("rejeitado"), "rejeitado");
  });

  it("mapRpcPayloadToVendorModuleData builds vendor summary", () => {
    const data = mapRpcPayloadToVendorModuleData(baseEvent, sampleRpcPayload);
    assert.equal(data.summary.active, 2);
    assert.equal(data.summary.inReview, 1);
    assert.equal(data.summary.signedContracts, 1);
    assert.equal(data.vendors.length, 2);
    assert.equal(data.vendors[0]?.name, "Royal Catering");
    assert.equal(data.vendors[1]?.status, "contratado");
  });

  it("getClientEventVendorsData returns not_found for missing event", async () => {
    const result = await getClientEventVendorsData({
      authClient: createAuthClient({ event: null }),
      rpcClient: createRpcClient(sampleRpcPayload),
      userId: OWNER_ID,
      eventId: EVENT_ID,
    });
    assert.equal(result.kind, "not_found");
  });

  it("getClientEventVendorsData returns forbidden for non-owner non-member", async () => {
    const result = await getClientEventVendorsData({
      authClient: createAuthClient({ event: baseEvent }),
      rpcClient: createRpcClient(sampleRpcPayload),
      userId: OTHER_USER_ID,
      eventId: EVENT_ID,
    });
    assert.equal(result.kind, "forbidden");
  });

  it("getClientEventVendorsData returns operational_not_linked without operational_event_id", async () => {
    const result = await getClientEventVendorsData({
      authClient: createAuthClient({ event: { ...baseEvent, operational_event_id: null } }),
      rpcClient: createRpcClient(sampleRpcPayload),
      userId: OWNER_ID,
      eventId: EVENT_ID,
    });
    assert.equal(result.kind, "operational_not_linked");
  });

  it("getClientEventVendorsData calls RPC when operational_event_id exists", async () => {
    let rpcCalled = false;
    const rpcClient = {
      async rpc(fn: typeof GET_CLIENT_EVENT_VENDORS_RPC) {
        assert.equal(fn, GET_CLIENT_EVENT_VENDORS_RPC);
        rpcCalled = true;
        return { data: sampleRpcPayload, error: null };
      },
    } satisfies ClientEventVendorsRpcClient;

    const result = await getClientEventVendorsData({
      authClient: createAuthClient({ event: baseEvent }),
      rpcClient,
      userId: OWNER_ID,
      eventId: EVENT_ID,
    });

    assert.equal(rpcCalled, true);
    assert.equal(result.kind, "ok");
    if (result.kind === "ok") {
      assert.equal(result.data.vendors.length, 2);
    }
  });

  it("getClientEventVendorsData returns empty list when RPC has no vendors", async () => {
    const emptyPayload: ClientEventVendorsRpcPayload = {
      vendors: [],
      summary: {
        vendorCount: 0,
        activeVendors: 0,
        pendingVendors: 0,
        approvedVendors: 0,
        totalEstimated: 0,
        categories: [],
        latestVendor: null,
      },
    };

    const result = await getClientEventVendorsData({
      authClient: createAuthClient({ event: baseEvent }),
      rpcClient: createRpcClient(emptyPayload),
      userId: OWNER_ID,
      eventId: EVENT_ID,
    });

    assert.equal(result.kind, "ok");
    if (result.kind === "ok") {
      assert.equal(result.data.vendors.length, 0);
      assert.equal(result.data.summary.active, 0);
    }
  });

  it("getClientEventVendorsData returns unavailable when RPC fails", async () => {
    const result = await getClientEventVendorsData({
      authClient: createAuthClient({ event: baseEvent }),
      rpcClient: createRpcClient(null, "permission denied for table event_vendors"),
      userId: OWNER_ID,
      eventId: EVENT_ID,
    });
    assert.equal(result.kind, "unavailable");
  });
});

describe("client-event-vendors-dashboard", () => {
  it("mapRpcPayloadToDashboardVendorMetrics maps vendor KPIs", () => {
    const metrics = mapRpcPayloadToDashboardVendorMetrics(sampleRpcPayload);
    assert.equal(metrics.vendorCount, 2);
    assert.equal(metrics.activeVendors, 2);
    assert.equal(metrics.vendorSnapshot.length, 2);
    assert.equal(metrics.vendorSnapshot[0]?.name, "Royal Catering");
  });

  it("dashboard uses vendor metrics for vendors-active stat", () => {
    const metrics = mapRpcPayloadToDashboardVendorMetrics(sampleRpcPayload);
    const dashboard = mapClientEventToDashboardData(
      baseEvent,
      null,
      null,
      null,
      metrics,
    );

    assert.equal(dashboard.stats.find((s) => s.id === "vendors-active")?.value, 2);
  });
});

describe("client-event-vendors-api", () => {
  const okEnv = { ok: true as const, message: "" };
  const authClient = createAuthClient({ event: baseEvent });

  it("returns 401 without session", async () => {
    const result = await handleClientEventVendorsRequest({
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
    const result = await handleClientEventVendorsRequest({
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
    const result = await handleClientEventVendorsRequest({
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
    const result = await handleClientEventVendorsRequest({
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

  it("returns 200 with vendors for owner", async () => {
    const result = await handleClientEventVendorsRequest({
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
      assert.equal(result.body.data.vendors.length, 2);
      assert.equal(result.body.data.summary.active, 2);
    }
  });

  it("returns 503 when RPC fails", async () => {
    const result = await handleClientEventVendorsRequest({
      envCheck: okEnv,
      serviceRoleCheck: okEnv,
      user: { id: OWNER_ID },
      eventId: EVENT_ID,
      authClient,
      rpcClient: createRpcClient(null, "permission denied for table event_vendors"),
    });
    assert.equal(result.status, 503);
    assert.equal(result.body.error, "unavailable");
  });
});
