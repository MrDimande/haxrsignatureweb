import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { handleClientEventRsvpRequest } from "@/lib/rsvp/client-event-rsvp-api";
import { getClientEventRsvpData } from "@/lib/rsvp/client-event-rsvp-service";
import type { ClientEventRow } from "@/lib/events/client-app-database.types";
import type { ClientEventRsvpAuthClient } from "@/lib/rsvp/client-event-rsvp-service";
import type {
  ClientEventOperationalReader,
  OperationalGuestRow,
} from "@/lib/portal/client-event-operational.neon.repository";

const EVENT_ID = "f51ce8b2-6b5c-4692-852e-fb1dad1842e1";
const OPERATIONAL_EVENT_ID = "1251bc6e-fac7-46cd-981d-bb3e4c066ce8";
const OWNER_ID = "acd1d7b7-b679-4c8b-94e1-4d4552f1d8ee";
const OTHER_USER_ID = "00000000-0000-4000-8000-000000000099";

const baseEvent: ClientEventRow = {
  id: EVENT_ID,
  owner_user_id: OWNER_ID,
  slug: "evento-operacional-real",
  event_name: "Evento Operacional Real",
  event_type: "wedding",
  bride_name: "Staging",
  groom_name: "A",
  event_date: "2026-12-20",
  event_location: "Maputo",
  estimated_guests: 3,
  budget_min: null,
  budget_max: 150000,
  status: "planning",
  source: "onboarding",
  services_interested: [],
  phone: "+258840000000",
  operational_event_id: OPERATIONAL_EVENT_ID,
  is_active: true,
  onboarding_fingerprint: "fp-rsvp-001",
  created_at: "2026-07-09T12:00:00.000Z",
  updated_at: "2026-07-09T12:00:00.000Z",
};

const guestRows: OperationalGuestRow[] = [
  {
    id: "guest-confirmed",
    name: "Ana Confirmada",
    email: "ana@example.com",
    phone: "+258840000001",
    status: "confirmed",
    plus_ones: 1,
    seat_id: null,
    invite_sent: true,
    updated_at: "2026-10-06T10:00:00.000Z",
  },
  {
    id: "guest-pending",
    name: "Bruno Pendente",
    email: null,
    phone: null,
    status: "invited",
    plus_ones: 0,
    seat_id: null,
    invite_sent: true,
    updated_at: "2026-10-05T10:00:00.000Z",
  },
  {
    id: "guest-declined",
    name: "Carla Recusou",
    email: "carla@example.com",
    phone: null,
    status: "declined",
    plus_ones: 0,
    seat_id: null,
    invite_sent: false,
    updated_at: "2026-10-04T10:00:00.000Z",
  },
];

function createAuthClient(input: {
  event?: ClientEventRow | null;
  memberUserIds?: string[];
}): ClientEventRsvpAuthClient {
  const client = {
    from(table: "client_events" | "event_members") {
      if (table === "client_events") {
        return {
          select() {
            const filters: Record<string, string | boolean> = {};
            const chain = {
              eq(column: string, value: string | boolean) {
                filters[column] = value;
                return chain;
              },
              async maybeSingle() {
                return filters.id === EVENT_ID
                  ? { data: input.event ?? null, error: null }
                  : { data: null, error: null };
              },
            };
            return chain;
          },
        };
      }

      return {
        select() {
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
              return { data: isMember ? { id: "member-1" } : null, error: null };
            },
          };
          return chain;
        },
      };
    },
  };

  return client as ClientEventRsvpAuthClient;
}

function createOperationalReader(input: {
  guests?: OperationalGuestRow[];
  calls?: string[];
}): ClientEventOperationalReader {
  return {
    async listGuests(operationalEventId) {
      input.calls?.push(operationalEventId);
      assert.equal(operationalEventId, OPERATIONAL_EVENT_ID);
      return { guests: input.guests ?? [], tablesTotal: 0 };
    },
  } as ClientEventOperationalReader;
}

describe("client-event-rsvp-service", () => {
  it("derives RSVP data from guests in the authorized operational event", async () => {
    const calls: string[] = [];
    const result = await getClientEventRsvpData({
      authClient: createAuthClient({ event: baseEvent }),
      operationalReader: createOperationalReader({ guests: guestRows, calls }),
      userId: OWNER_ID,
      eventId: EVENT_ID,
    });

    assert.equal(result.kind, "ok");
    assert.deepEqual(calls, [OPERATIONAL_EVENT_ID]);
    if (result.kind !== "ok") return;
    assert.equal(result.data.context.eventOverview.name, "Evento Operacional Real");
    assert.equal(result.data.stats.activeInvites, 2);
    assert.equal(result.data.stats.confirmed, 1);
    assert.equal(result.data.stats.pending, 1);
    assert.equal(result.data.stats.declined, 1);
    assert.equal(result.data.stats.responseRate, 67);
    assert.deepEqual(
      result.data.recentResponses.map((response) => response.guestName),
      ["Ana Confirmada", "Carla Recusou"],
    );
  });

  it("returns an empty real RSVP module for a linked event with no guests", async () => {
    const result = await getClientEventRsvpData({
      authClient: createAuthClient({ event: baseEvent }),
      operationalReader: createOperationalReader({ guests: [] }),
      userId: OWNER_ID,
      eventId: EVENT_ID,
    });

    assert.equal(result.kind, "ok");
    if (result.kind !== "ok") return;
    assert.equal(result.data.stats.confirmed, 0);
    assert.equal(result.data.stats.pending, 0);
    assert.equal(result.data.stats.declined, 0);
    assert.equal(result.data.stats.responseRate, 0);
    assert.deepEqual(result.data.recentResponses, []);
  });

  it("rejects a caller without owner or membership access before operational reads", async () => {
    const calls: string[] = [];
    const result = await getClientEventRsvpData({
      authClient: createAuthClient({ event: baseEvent }),
      operationalReader: createOperationalReader({ guests: guestRows, calls }),
      userId: OTHER_USER_ID,
      eventId: EVENT_ID,
    });

    assert.equal(result.kind, "forbidden");
    assert.deepEqual(calls, []);
  });
});

describe("client-event-rsvp-api", () => {
  const okEnv = { ok: true as const, projectRef: "preview-project" };

  it("returns live RSVP data through the authenticated API boundary", async () => {
    const result = await handleClientEventRsvpRequest({
      envCheck: okEnv,
      serviceRoleCheck: okEnv,
      user: { id: OWNER_ID },
      eventId: EVENT_ID,
      authClient: createAuthClient({ event: baseEvent }),
      operationalReader: createOperationalReader({ guests: guestRows }),
    });

    assert.equal(result.status, 200);
    assert.equal(result.body.ok, true);
    if (!result.body.ok) return;
    assert.equal(result.body.data.context.eventOverview.name, "Evento Operacional Real");
    assert.equal(result.body.data.stats.confirmed, 1);
  });
});
