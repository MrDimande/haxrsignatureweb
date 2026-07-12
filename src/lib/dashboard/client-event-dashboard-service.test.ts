import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { handleClientEventDashboardRequest } from "@/lib/dashboard/client-event-dashboard-api";
import {
  getClientEventDashboardData,
  mapClientEventToDashboardData,
  resolveClientEventDashboardAccess,
  type ClientEventDashboardAuthClient,
} from "@/lib/dashboard/client-event-dashboard-service";
import { resolveDashboardLoadPlan } from "@/lib/dashboard/dashboard-load-plan";
import type { ClientEventRow } from "@/lib/events/client-app-database.types";

const EVENT_ID = "f51ce8b2-6b5c-4692-852e-fb1dad1842e1";
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
  operational_event_id: null,
  is_active: true,
  onboarding_fingerprint: "fp-001",
  created_at: "2026-07-09T12:00:00.000Z",
  updated_at: "2026-07-09T12:00:00.000Z",
};

function createAuthClient(input: {
  event?: ClientEventRow | null;
  memberUserIds?: string[];
}): ClientEventDashboardAuthClient {
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

describe("client-event-dashboard-service", () => {
  it("mapClientEventToDashboardData maps core event fields", () => {
    const dashboard = mapClientEventToDashboardData(baseEvent, {
      full_name: "Staging A",
      app_role: "client",
    });

    assert.equal(dashboard.eventOverview.eventId, EVENT_ID);
    assert.equal(dashboard.eventOverview.name, "Staging A Event");
    assert.equal(dashboard.eventOverview.location, "Maputo");
    assert.equal(dashboard.financeSnapshot.budgetEstimated, 150000);
    assert.equal(dashboard.guestSnapshot.total, 150);
    assert.equal(dashboard.guestSnapshot.confirmed, 0);
  });

  it("resolveClientEventDashboardAccess allows owner", async () => {
    const result = await resolveClientEventDashboardAccess(
      createAuthClient({ event: baseEvent }),
      OWNER_ID,
      EVENT_ID,
    );
    assert.equal(result.kind, "ok");
  });

  it("resolveClientEventDashboardAccess allows members", async () => {
    const result = await resolveClientEventDashboardAccess(
      createAuthClient({ event: baseEvent, memberUserIds: [OTHER_USER_ID] }),
      OTHER_USER_ID,
      EVENT_ID,
    );
    assert.equal(result.kind, "ok");
  });

  it("resolveClientEventDashboardAccess returns forbidden for other users", async () => {
    const result = await resolveClientEventDashboardAccess(
      createAuthClient({ event: baseEvent }),
      OTHER_USER_ID,
      EVENT_ID,
    );
    assert.equal(result.kind, "forbidden");
  });

  it("resolveClientEventDashboardAccess returns not_found when event is missing", async () => {
    const result = await resolveClientEventDashboardAccess(
      createAuthClient({ event: null }),
      OWNER_ID,
      EVENT_ID,
    );
    assert.equal(result.kind, "not_found");
  });

  it("getClientEventDashboardData returns dashboard for owner", async () => {
    const result = await getClientEventDashboardData({
      authClient: createAuthClient({ event: baseEvent }),
      userId: OWNER_ID,
      eventId: EVENT_ID,
      profile: { full_name: "Staging A", app_role: "client" },
    });

    assert.equal(result.kind, "ok");
    if (result.kind === "ok") {
      assert.equal(result.dashboard?.eventOverview.eventId, EVENT_ID);
    }
  });
});

describe("client-event-dashboard-api", () => {
  it("returns 401 without session", async () => {
    const result = await handleClientEventDashboardRequest({
      envCheck: { ok: true, projectRef: "uxleigndoomoezwsxlan" },
      user: null,
      eventId: EVENT_ID,
      authClient: createAuthClient({ event: baseEvent }),
    });

    assert.equal(result.status, 401);
    assert.equal(result.body.ok, false);
    if (!result.body.ok) {
      assert.equal(result.body.error, "unauthorized");
    }
  });

  it("returns 403 for foreign event", async () => {
    const result = await handleClientEventDashboardRequest({
      envCheck: { ok: true, projectRef: "uxleigndoomoezwsxlan" },
      user: { id: OTHER_USER_ID },
      eventId: EVENT_ID,
      authClient: createAuthClient({ event: baseEvent }),
    });

    assert.equal(result.status, 403);
    assert.equal(result.body.ok, false);
    if (!result.body.ok) {
      assert.equal(result.body.error, "forbidden");
    }
  });

  it("returns 404 for missing event", async () => {
    const result = await handleClientEventDashboardRequest({
      envCheck: { ok: true, projectRef: "uxleigndoomoezwsxlan" },
      user: { id: OWNER_ID },
      eventId: EVENT_ID,
      authClient: createAuthClient({ event: null }),
    });

    assert.equal(result.status, 404);
    assert.equal(result.body.ok, false);
    if (!result.body.ok) {
      assert.equal(result.body.error, "not_found");
    }
  });

  it("returns DashboardData for owner event", async () => {
    const result = await handleClientEventDashboardRequest({
      envCheck: { ok: true, projectRef: "uxleigndoomoezwsxlan" },
      user: { id: OWNER_ID },
      eventId: EVENT_ID,
      authClient: createAuthClient({ event: baseEvent }),
      profile: { full_name: "Staging A", app_role: "client" },
    });

    assert.equal(result.status, 200);
    assert.equal(result.body.ok, true);
    if (result.body.ok) {
      assert.equal(result.body.data.eventOverview.eventId, EVENT_ID);
      assert.equal(result.body.data.eventOverview.name, "Staging A Event");
    }
  });
});

describe("dashboard-load-plan", () => {
  it("uses api source when real eventId exists", () => {
    assert.deepEqual(
      resolveDashboardLoadPlan({
        demoMode: false,
        onboardingRedirect: null,
        realEventId: EVENT_ID,
      }),
      { source: "api", eventId: EVENT_ID },
    );
  });

  it("uses local source when no real eventId exists", () => {
    assert.deepEqual(
      resolveDashboardLoadPlan({
        demoMode: false,
        onboardingRedirect: null,
        realEventId: null,
      }),
      { source: "local" },
    );
  });
});
