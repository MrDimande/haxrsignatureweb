import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  mapClientEventToDashboardData,
} from "@/lib/dashboard/client-event-dashboard-service";
import type { ClientEventRow } from "@/lib/events/client-app-database.types";
import { handleClientEventChecklistRequest } from "@/lib/checklist/client-event-checklist-api";
import { mapRpcPayloadToDashboardChecklistMetrics } from "@/lib/checklist/client-event-checklist-dashboard";
import {
  buildChecklistModuleContext,
  getClientEventChecklistData,
  isDbChecklistCompleted,
  mapDbChecklistPriorityToUiPriority,
  mapDbChecklistStatusToUiStatus,
  mapRpcPayloadToChecklistModuleData,
  type ClientEventChecklistAuthClient,
} from "@/lib/checklist/client-event-checklist-service";
import {
  GET_CLIENT_EVENT_CHECKLIST_RPC,
  parseClientEventChecklistRpcPayload,
  type ClientEventChecklistRpcClient,
  type ClientEventChecklistRpcPayload,
} from "@/lib/checklist/client-event-checklist-rpc";

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

const sampleRpcPayload: ClientEventChecklistRpcPayload = {
  items: [
    {
      id: "task-1",
      title: "Confirmar local da cerimónia",
      due_date: "2026-08-01",
      priority: "alta",
      status: "completed",
      created_at: "2026-07-09T10:00:00.000Z",
      updated_at: "2026-07-09T11:00:00.000Z",
    },
    {
      id: "task-2",
      title: "Validar menu do catering",
      due_date: "2026-07-01",
      priority: "normal",
      status: "pending",
      created_at: "2026-07-09T10:30:00.000Z",
      updated_at: "2026-07-09T10:30:00.000Z",
    },
    {
      id: "task-3",
      title: "Rever lista de convidados",
      due_date: "2026-09-15",
      priority: "baixa",
      status: "pending",
      created_at: "2026-07-09T11:00:00.000Z",
      updated_at: "2026-07-09T11:00:00.000Z",
    },
  ],
  summary: {
    totalTasks: 3,
    completedTasks: 1,
    pendingTasks: 2,
    overdueTasks: 1,
    completionRate: 33.33,
    categories: ["alta", "normal", "baixa"],
    nextTask: {
      id: "task-2",
      title: "Validar menu do catering",
      due_date: "2026-07-01",
      priority: "normal",
      status: "pending",
      created_at: "2026-07-09T10:30:00.000Z",
    },
    urgentTasks: [
      {
        id: "task-2",
        title: "Validar menu do catering",
        due_date: "2026-07-01",
        priority: "normal",
        status: "pending",
        created_at: "2026-07-09T10:30:00.000Z",
      },
    ],
  },
};

function createAuthClient(input: {
  event?: ClientEventRow | null;
  memberUserIds?: string[];
}): ClientEventChecklistAuthClient {
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

function createRpcClient(payload: ClientEventChecklistRpcPayload | null, errorMessage?: string) {
  return {
    async rpc(fn: typeof GET_CLIENT_EVENT_CHECKLIST_RPC, args: { p_client_event_id: string }) {
      assert.equal(fn, GET_CLIENT_EVENT_CHECKLIST_RPC);
      assert.equal(args.p_client_event_id, EVENT_ID);
      if (errorMessage) {
        return { data: null, error: { message: errorMessage } };
      }
      return { data: payload, error: null };
    },
  } satisfies ClientEventChecklistRpcClient;
}

describe("client-event-checklist-rpc", () => {
  it("parseClientEventChecklistRpcPayload normalizes items and summary", () => {
    const parsed = parseClientEventChecklistRpcPayload(sampleRpcPayload);
    assert.ok(parsed);
    assert.equal(parsed.items.length, 3);
    assert.equal(parsed.summary.totalTasks, 3);
    assert.equal(parsed.summary.completedTasks, 1);
    assert.equal(parsed.summary.pendingTasks, 2);
    assert.equal(parsed.summary.overdueTasks, 1);
    assert.equal(parsed.summary.nextTask?.id, "task-2");
    assert.equal(parsed.summary.urgentTasks.length, 1);
  });
});

describe("client-event-checklist-service", () => {
  it("buildChecklistModuleContext maps event overview", () => {
    const context = buildChecklistModuleContext(baseEvent);
    assert.equal(context.eventId, EVENT_ID);
    assert.equal(context.eventOverview.name, "Staging A Event");
  });

  it("isDbChecklistCompleted maps completed statuses", () => {
    assert.equal(isDbChecklistCompleted("completed"), true);
    assert.equal(isDbChecklistCompleted("concluída"), true);
    assert.equal(isDbChecklistCompleted("pending"), false);
  });

  it("mapDbChecklistStatusToUiStatus maps operational statuses", () => {
    assert.equal(mapDbChecklistStatusToUiStatus("completed", null), "concluída");
    assert.equal(mapDbChecklistStatusToUiStatus("pending", "2020-01-01"), "atrasada");
    assert.equal(mapDbChecklistStatusToUiStatus("pending", "2099-12-31"), "aberta");
  });

  it("mapDbChecklistPriorityToUiPriority maps priority tokens", () => {
    assert.equal(mapDbChecklistPriorityToUiPriority("alta"), "alta");
    assert.equal(mapDbChecklistPriorityToUiPriority("normal"), "média");
    assert.equal(mapDbChecklistPriorityToUiPriority("low"), "baixa");
  });

  it("mapRpcPayloadToChecklistModuleData builds checklist summary", () => {
    const data = mapRpcPayloadToChecklistModuleData(baseEvent, sampleRpcPayload);
    assert.equal(data.summary.total, 3);
    assert.equal(data.summary.completed, 1);
    assert.equal(data.summary.overdue, 1);
    assert.equal(data.tasks.length, 3);
    assert.equal(data.tasks[0]?.status, "concluída");
  });

  it("getClientEventChecklistData returns not_found for missing event", async () => {
    const result = await getClientEventChecklistData({
      authClient: createAuthClient({ event: null }),
      rpcClient: createRpcClient(sampleRpcPayload),
      userId: OWNER_ID,
      eventId: EVENT_ID,
    });
    assert.equal(result.kind, "not_found");
  });

  it("getClientEventChecklistData returns forbidden for non-owner non-member", async () => {
    const result = await getClientEventChecklistData({
      authClient: createAuthClient({ event: baseEvent }),
      rpcClient: createRpcClient(sampleRpcPayload),
      userId: OTHER_USER_ID,
      eventId: EVENT_ID,
    });
    assert.equal(result.kind, "forbidden");
  });

  it("getClientEventChecklistData returns operational_not_linked without operational_event_id", async () => {
    const result = await getClientEventChecklistData({
      authClient: createAuthClient({ event: { ...baseEvent, operational_event_id: null } }),
      rpcClient: createRpcClient(sampleRpcPayload),
      userId: OWNER_ID,
      eventId: EVENT_ID,
    });
    assert.equal(result.kind, "operational_not_linked");
  });

  it("getClientEventChecklistData calls RPC when operational_event_id exists", async () => {
    let rpcCalled = false;
    const rpcClient = {
      async rpc(fn: typeof GET_CLIENT_EVENT_CHECKLIST_RPC) {
        assert.equal(fn, GET_CLIENT_EVENT_CHECKLIST_RPC);
        rpcCalled = true;
        return { data: sampleRpcPayload, error: null };
      },
    } satisfies ClientEventChecklistRpcClient;

    const result = await getClientEventChecklistData({
      authClient: createAuthClient({ event: baseEvent }),
      rpcClient,
      userId: OWNER_ID,
      eventId: EVENT_ID,
    });

    assert.equal(rpcCalled, true);
    assert.equal(result.kind, "ok");
    if (result.kind === "ok") {
      assert.equal(result.data.tasks.length, 3);
    }
  });

  it("getClientEventChecklistData returns empty list when RPC has no tasks", async () => {
    const emptyPayload: ClientEventChecklistRpcPayload = {
      items: [],
      summary: {
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        overdueTasks: 0,
        completionRate: 0,
        categories: [],
        nextTask: null,
        urgentTasks: [],
      },
    };

    const result = await getClientEventChecklistData({
      authClient: createAuthClient({ event: baseEvent }),
      rpcClient: createRpcClient(emptyPayload),
      userId: OWNER_ID,
      eventId: EVENT_ID,
    });

    assert.equal(result.kind, "ok");
    if (result.kind === "ok") {
      assert.equal(result.data.tasks.length, 0);
      assert.equal(result.data.summary.total, 0);
    }
  });

  it("getClientEventChecklistData returns unavailable when RPC fails", async () => {
    const result = await getClientEventChecklistData({
      authClient: createAuthClient({ event: baseEvent }),
      rpcClient: createRpcClient(null, "permission denied for table event_checklist_items"),
      userId: OWNER_ID,
      eventId: EVENT_ID,
    });
    assert.equal(result.kind, "unavailable");
  });
});

describe("client-event-checklist-dashboard", () => {
  it("mapRpcPayloadToDashboardChecklistMetrics maps checklist KPIs", () => {
    const metrics = mapRpcPayloadToDashboardChecklistMetrics(sampleRpcPayload);
    assert.equal(metrics.checklistTotal, 3);
    assert.equal(metrics.checklistCompleted, 1);
    assert.equal(metrics.checklistSnapshot.length, 1);
    assert.equal(metrics.checklistSnapshot[0]?.title, "Validar menu do catering");
  });

  it("dashboard uses checklist metrics for tasks-open stat", () => {
    const metrics = mapRpcPayloadToDashboardChecklistMetrics(sampleRpcPayload);
    const dashboard = mapClientEventToDashboardData(
      baseEvent,
      null,
      null,
      null,
      null,
      null,
      metrics,
    );

    const tasksOpen = dashboard.stats.find((s) => s.id === "tasks-open");
    assert.equal(tasksOpen?.value, 2);
    assert.equal(dashboard.checklistSnapshot.length, 1);
  });
});

describe("client-event-checklist-api", () => {
  const okEnv = { ok: true as const, message: "" };
  const authClient = createAuthClient({ event: baseEvent });

  it("returns 401 without session", async () => {
    const result = await handleClientEventChecklistRequest({
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
    const result = await handleClientEventChecklistRequest({
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
    const result = await handleClientEventChecklistRequest({
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
    const result = await handleClientEventChecklistRequest({
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

  it("returns 200 with checklist for owner", async () => {
    const result = await handleClientEventChecklistRequest({
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
      assert.equal(result.body.data.tasks.length, 3);
      assert.equal(result.body.data.summary.completed, 1);
    }
  });

  it("returns 503 when RPC fails", async () => {
    const result = await handleClientEventChecklistRequest({
      envCheck: okEnv,
      serviceRoleCheck: okEnv,
      user: { id: OWNER_ID },
      eventId: EVENT_ID,
      authClient,
      rpcClient: createRpcClient(null, "permission denied for table event_checklist_items"),
    });
    assert.equal(result.status, 503);
    assert.equal(result.body.error, "unavailable");
  });
});
