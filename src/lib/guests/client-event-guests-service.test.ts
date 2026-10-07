import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { handleClientEventGuestsRequest } from "@/lib/guests/client-event-guests-api";
import {
  buildGuestGroups,
  getClientEventGuestsData,
  mapOperationalGuestRow,
  mapOperationalGuestsToModuleData,
  mapRpcPayloadToModuleData,
  type ClientEventGuestsAuthClient,
  type OperationalGuestRow,
} from "@/lib/guests/client-event-guests-service";
import {
  parseClientEventGuestsRpcPayload,
  type ClientEventGuestsRpcPayload,
} from "@/lib/guests/client-event-guests-rpc";
import { mapRpcPayloadToDashboardGuestMetrics } from "@/lib/guests/client-event-guests-dashboard";
import type { ClientEventRow } from "@/lib/events/client-app-database.types";
import type { ClientEventOperationalReader } from "@/lib/portal/client-event-operational.neon.repository";

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

const sampleGuestRows: OperationalGuestRow[] = [
  {
    id: "guest-1",
    name: "Ana Silva",
    email: "ana@example.com",
    phone: "+258840000001",
    status: "confirmed",
    plus_ones: 1,
    seat_id: "seat-1",
    invite_sent: true,
    updated_at: "2026-07-09T12:00:00.000Z",
    seats: { table_name: "A", seat_number: 1, label: "Mesa A · Lugar 1" },
    guest_groups: { name: "Família noiva" },
    checkins: null,
  },
  {
    id: "guest-2",
    name: "Bruno Costa",
    email: null,
    phone: null,
    status: "invited",
    plus_ones: 0,
    seat_id: null,
    invite_sent: false,
    updated_at: "2026-07-09T12:00:00.000Z",
    guest_groups: { name: "Amigos" },
    checkins: null,
  },
  {
    id: "guest-3",
    name: "Carla Mendes",
    email: "carla@example.com",
    phone: "+258840000003",
    status: "declined",
    plus_ones: 0,
    seat_id: null,
    invite_sent: true,
    updated_at: "2026-07-09T12:00:00.000Z",
    guest_groups: { name: "Trabalho" },
    checkins: null,
  },
];

function buildRpcPayload(
  guests: OperationalGuestRow[],
  tablesTotal = 8,
): ClientEventGuestsRpcPayload {
  return {
    guests,
    summary: {
      total: guests.length,
      confirmed: guests.filter((row) =>
        ["confirmed", "checked_in"].includes(row.status),
      ).length,
      pending: guests.filter((row) => row.status === "invited").length,
      declined: guests.filter((row) => row.status === "declined").length,
      plusOnes: guests.reduce((sum, row) => sum + (row.plus_ones ?? 0), 0),
      tablesAssigned: guests.filter((row) => row.seat_id).length,
      tablesTotal,
    },
  };
}

function createAuthClient(input: {
  event?: ClientEventRow | null;
  memberUserIds?: string[];
}): ClientEventGuestsAuthClient {
  const client = {
    from(table: "client_events" | "event_members") {
      if (table === "client_events") {
        return {
          select(_columns: string) {
            const filters: Record<string, string | boolean> = {};
            const chain = {
              eq(column: string, value: string | boolean) {
                filters[column] = value;
                return chain;
              },
              async maybeSingle() {
                if (filters.id === EVENT_ID) {
                  return { data: input.event ?? null, error: null };
                }
                return { data: null, error: null };
              },
            };
            return chain;
          },
        };
      }

      return {
        select(_columns: string) {
          const filters: Record<string, string | boolean> = {};
          const chain = {
            eq(column: string, value: string | boolean) {
              filters[column] = value;
              return chain;
            },
            async maybeSingle() {
              const isMember =
                filters.client_event_id === EVENT_ID &&
                input.memberUserIds?.includes(String(filters.user_id ?? ""));
              return {
                data: isMember ? { id: "member-1" } : null,
                error: null,
              };
            },
          };
          return chain;
        },
      };
    },
  };

  return client as ClientEventGuestsAuthClient;
}

function createOperationalReader(input: {
  guests?: OperationalGuestRow[];
  tablesTotal?: number;
  error?: Error;
  calls?: string[];
}): ClientEventOperationalReader {
  return {
    async listGuests(operationalEventId) {
      input.calls?.push(operationalEventId);
      if (input.error) {
        throw input.error;
      }
      if (operationalEventId !== OPERATIONAL_EVENT_ID) {
        throw new Error(`operational_event_not_found: ${operationalEventId}`);
      }
      return { guests: input.guests ?? [], tablesTotal: input.tablesTotal ?? 0 };
    },
  } as ClientEventOperationalReader;
}

const okEnv = { ok: true as const, projectRef: "uxleigndoomoezwsxlan" };

describe("client-event-guests-rpc", () => {
  it("parseClientEventGuestsRpcPayload normalizes guests and summary", () => {
    const parsed = parseClientEventGuestsRpcPayload({
      guests: sampleGuestRows,
      summary: {
        total: 3,
        confirmed: 1,
        pending: 1,
        declined: 1,
        plusOnes: 1,
        tablesAssigned: 1,
        tablesTotal: 8,
      },
    });

    assert.ok(parsed);
    assert.equal(parsed?.guests.length, 3);
    assert.equal(parsed?.summary.total, 3);
    assert.equal(parsed?.summary.tablesTotal, 8);
  });
});

describe("client-event-guests-service", () => {
  it("mapOperationalGuestRow maps RSVP, seat and invite flags", () => {
    const mapped = mapOperationalGuestRow(sampleGuestRows[0]);
    assert.equal(mapped.rsvpStatus, "confirmado");
    assert.equal(mapped.plusOnes, 1);
    assert.equal(mapped.table, "Mesa A · Lugar 1");
    assert.equal(mapped.inviteSent, true);
    assert.equal(mapped.group, "Família noiva");
  });

  it("buildGuestGroups aggregates guest counts", () => {
    const guests = sampleGuestRows.map(mapOperationalGuestRow);
    const groups = buildGuestGroups(guests);
    assert.equal(groups.length, 3);
    assert.equal(groups[0]?.guestCount, 1);
  });

  it("mapOperationalGuestsToModuleData builds summary", () => {
    const data = mapOperationalGuestsToModuleData(baseEvent, sampleGuestRows, 12);
    assert.equal(data.summary.total, 3);
    assert.equal(data.summary.confirmed, 1);
    assert.equal(data.summary.pending, 1);
    assert.equal(data.summary.declined, 1);
    assert.equal(data.summary.plusOnes, 1);
    assert.equal(data.summary.tablesAssigned, 1);
    assert.equal(data.summary.tablesTotal, 12);
    assert.equal(data.guests.length, 3);
  });

  it("mapRpcPayloadToModuleData uses RPC summary", () => {
    const data = mapRpcPayloadToModuleData(
      baseEvent,
      buildRpcPayload(sampleGuestRows, 5),
    );
    assert.equal(data.summary.total, 3);
    assert.equal(data.summary.tablesTotal, 5);
    assert.equal(data.guests[0]?.name, "Ana Silva");
  });

  it("getClientEventGuestsData returns not_found for missing event", async () => {
    const result = await getClientEventGuestsData({
      authClient: createAuthClient({ event: null }),
      operationalReader: createOperationalReader({}),
      userId: OWNER_ID,
      eventId: EVENT_ID,
    });
    assert.equal(result.kind, "not_found");
  });

  it("getClientEventGuestsData returns forbidden for non-owner non-member", async () => {
    const result = await getClientEventGuestsData({
      authClient: createAuthClient({ event: baseEvent }),
      operationalReader: createOperationalReader({}),
      userId: OTHER_USER_ID,
      eventId: EVENT_ID,
    });
    assert.equal(result.kind, "forbidden");
  });

  it("getClientEventGuestsData returns operational_not_linked without operational_event_id", async () => {
    const result = await getClientEventGuestsData({
      authClient: createAuthClient({
        event: { ...baseEvent, operational_event_id: null },
      }),
      operationalReader: createOperationalReader({}),
      userId: OWNER_ID,
      eventId: EVENT_ID,
    });
    assert.equal(result.kind, "operational_not_linked");
  });

  it("getClientEventGuestsData reads only the authorized operational event", async () => {
    const calls: string[] = [];
    const result = await getClientEventGuestsData({
      authClient: createAuthClient({ event: baseEvent }),
      operationalReader: createOperationalReader({
        guests: sampleGuestRows,
        tablesTotal: 8,
        calls,
      }),
      userId: OWNER_ID,
      eventId: EVENT_ID,
    });

    assert.equal(result.kind, "ok");
    assert.deepEqual(calls, [OPERATIONAL_EVENT_ID]);
    if (result.kind !== "ok") return;
    assert.equal(result.data.summary.total, 3);
    assert.equal(result.data.guests[0]?.name, "Ana Silva");
  });

  it("getClientEventGuestsData returns empty list when the operational event has no guests", async () => {
    const result = await getClientEventGuestsData({
      authClient: createAuthClient({ event: baseEvent }),
      operationalReader: createOperationalReader({ guests: [], tablesTotal: 0 }),
      userId: OWNER_ID,
      eventId: EVENT_ID,
    });
    assert.equal(result.kind, "ok");
    if (result.kind !== "ok") return;
    assert.equal(result.data.summary.total, 0);
    assert.deepEqual(result.data.guests, []);
  });

  it("getClientEventGuestsData returns unavailable when the operational reader fails", async () => {
    const result = await getClientEventGuestsData({
      authClient: createAuthClient({ event: baseEvent }),
      operationalReader: createOperationalReader({
        error: new Error("permission denied for table guests"),
      }),
      userId: OWNER_ID,
      eventId: EVENT_ID,
    });

    assert.equal(result.kind, "unavailable");
  });
});

describe("client-event-guests-api", () => {
  it("returns 401 without session", async () => {
    const result = await handleClientEventGuestsRequest({
      envCheck: okEnv,
      serviceRoleCheck: okEnv,
      user: null,
      eventId: EVENT_ID,
      authClient: createAuthClient({ event: baseEvent }),
      operationalReader: createOperationalReader({}),
    });
    assert.equal(result.status, 401);
    assert.equal(result.body.ok, false);
    if (result.body.ok) return;
    assert.equal(result.body.error, "unauthorized");
  });

  it("returns 404 for missing event", async () => {
    const result = await handleClientEventGuestsRequest({
      envCheck: okEnv,
      serviceRoleCheck: okEnv,
      user: { id: OWNER_ID },
      eventId: EVENT_ID,
      authClient: createAuthClient({ event: null }),
      operationalReader: createOperationalReader({}),
    });
    assert.equal(result.status, 404);
    if (result.body.ok) return;
    assert.equal(result.body.error, "not_found");
  });

  it("returns 403 for foreign event", async () => {
    const result = await handleClientEventGuestsRequest({
      envCheck: okEnv,
      serviceRoleCheck: okEnv,
      user: { id: OTHER_USER_ID },
      eventId: EVENT_ID,
      authClient: createAuthClient({ event: baseEvent }),
      operationalReader: createOperationalReader({}),
    });
    assert.equal(result.status, 403);
    if (result.body.ok) return;
    assert.equal(result.body.error, "forbidden");
  });

  it("returns 409 when operational event is not linked", async () => {
    const result = await handleClientEventGuestsRequest({
      envCheck: okEnv,
      serviceRoleCheck: okEnv,
      user: { id: OWNER_ID },
      eventId: EVENT_ID,
      authClient: createAuthClient({
        event: { ...baseEvent, operational_event_id: null },
      }),
      operationalReader: createOperationalReader({}),
    });
    assert.equal(result.status, 409);
    if (result.body.ok) return;
    assert.equal(result.body.error, "operational_not_linked");
  });

  it("returns 200 with guests for owner", async () => {
    const result = await handleClientEventGuestsRequest({
      envCheck: okEnv,
      serviceRoleCheck: okEnv,
      user: { id: OWNER_ID },
      eventId: EVENT_ID,
      authClient: createAuthClient({ event: baseEvent }),
      operationalReader: createOperationalReader({
        guests: sampleGuestRows,
        tablesTotal: 5,
      }),
    });
    assert.equal(result.status, 200);
    assert.equal(result.body.ok, true);
    if (!result.body.ok) return;
    assert.equal(result.body.data.summary.total, 3);
  });

  it("returns 503 when the operational reader fails", async () => {
    const result = await handleClientEventGuestsRequest({
      envCheck: okEnv,
      serviceRoleCheck: okEnv,
      user: { id: OWNER_ID },
      eventId: EVENT_ID,
      authClient: createAuthClient({ event: baseEvent }),
      operationalReader: createOperationalReader({
        error: new Error("permission denied for table guests"),
      }),
    });
    assert.equal(result.status, 503);
    if (result.body.ok) return;
    assert.equal(result.body.error, "unavailable");
  });
});

describe("client-event-guests-dashboard", () => {
  it("mapRpcPayloadToDashboardGuestMetrics maps summary to guestSnapshot", () => {
    const payload: ClientEventGuestsRpcPayload = {
      guests: sampleGuestRows,
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

    const metrics = mapRpcPayloadToDashboardGuestMetrics(payload);
    assert.equal(metrics.guestsTotal, 2);
    assert.equal(metrics.guestSnapshot.confirmed, 1);
    assert.equal(metrics.guestSnapshot.pending, 1);
    assert.equal(metrics.guestSnapshot.plusOnes, 1);
  });
});
