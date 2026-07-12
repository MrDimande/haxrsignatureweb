import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import type { ClientEventRow } from "@/lib/events/client-app-database.types";
import type { CreateClientEventInput } from "@/lib/events/create-event-validation";
import {
  createClientEventFromPayload,
  type CreateClientEventDeps,
} from "@/lib/events/client-event-service";
import {
  SUPABASE_PREVIEW_URL,
  SUPABASE_PRODUCTION_PROJECT_REF,
  validateClientAppAuthEnvironment,
  validateClientAppServiceRoleEnvironment,
} from "@/lib/supabase/config";

const basePayload: CreateClientEventInput = {
  eventType: "wedding",
  eventName: "Evento Teste Staging A",
  brideName: "Staging",
  groomName: "A",
  eventDate: "2026-12-20",
  eventLocation: "Maputo",
  estimatedGuests: 150,
  budgetMin: 80000,
  budgetMax: 150000,
  servicesInterested: ["convites_digitais", "rsvp"],
  phone: "+258840000000",
  source: "onboarding",
  localFingerprint: "staging-a-evento-teste-001",
};

const ownerUserId = "acd1d7b7-b679-4c8b-94e1-4d4552f1d8ee";
const operationalEventId = "11111111-1111-4111-8111-111111111111";

function makeEventRow(overrides: Partial<ClientEventRow> = {}): ClientEventRow {
  return {
    id: "event-uuid-1",
    owner_user_id: ownerUserId,
    slug: "staging-a",
    event_name: basePayload.eventName,
    event_type: "wedding",
    bride_name: "Staging",
    groom_name: "A",
    event_date: "2026-12-20",
    event_location: "Maputo",
    estimated_guests: 150,
    budget_min: 80000,
    budget_max: 150000,
    status: "planning",
    source: "onboarding",
    services_interested: ["convites_digitais", "rsvp"],
    phone: "+258840000000",
    operational_event_id: null,
    is_active: true,
    onboarding_fingerprint: "staging-a-evento-teste-001",
    created_at: "2026-07-09T12:00:00.000Z",
    updated_at: "2026-07-09T12:00:00.000Z",
    ...overrides,
  };
}

type MockState = {
  activeByFingerprint: ClientEventRow | null;
  activeForOwner: ClientEventRow | null;
  insertedEvent: ClientEventRow | null;
  memberInserted: boolean;
  snapshotInserted: boolean;
  rpcProvisionCalls: number;
  rpcProvisionShouldFail: boolean;
  rpcReuseExisting: boolean;
  rpcExistingOperationalEventId: string | null;
  profileUpdated: boolean;
  deletedEventIds: string[];
  memberShouldFail: boolean;
  snapshotShouldFail: boolean;
  profileShouldFail: boolean;
};

function createMockDeps(state: MockState): CreateClientEventDeps {
  const authClient = {
    from(table: string) {
      if (table === "client_events") {
        return {
          select() {
            const filters: Record<string, string | boolean> = {};
            const query = {
              eq(column: string, value: string | boolean) {
                filters[column] = value;
                return query;
              },
              async maybeSingle() {
                if (filters.onboarding_fingerprint !== undefined) {
                  return { data: state.activeByFingerprint, error: null };
                }
                if (filters.is_active === true) {
                  return { data: state.activeForOwner, error: null };
                }
                return { data: null, error: null };
              },
            };
            return query;
          },
          insert() {
            return {
              select() {
                return {
                  async single() {
                    state.insertedEvent = makeEventRow();
                    return { data: state.insertedEvent, error: null };
                  },
                };
              },
            };
          },
        };
      }

      if (table === "event_members") {
        return {
          async insert() {
            if (state.memberShouldFail) {
              return { data: null, error: { message: "member failed" } };
            }
            state.memberInserted = true;
            return { data: null, error: null };
          },
        };
      }

      if (table === "profiles") {
        return {
          update() {
            return {
              async eq() {
                if (state.profileShouldFail) {
                  return { data: null, error: { message: "profile failed" } };
                }
                state.profileUpdated = true;
                return { data: null, error: null };
              },
            };
          },
        };
      }

      throw new Error(`Unexpected auth table ${table}`);
    },
  };

  const adminClient = {
    from(table: string) {
      if (table === "client_events") {
        return {
          delete() {
            return {
              async eq(_column: string, eventId: string) {
                state.deletedEventIds.push(eventId);
                return { data: null, error: null };
              },
            };
          },
        };
      }

      if (table === "event_onboarding_snapshots") {
        return {
          async insert() {
            if (state.snapshotShouldFail) {
              return { data: null, error: { message: "snapshot failed" } };
            }
            state.snapshotInserted = true;
            return { data: null, error: null };
          },
        };
      }

      throw new Error(`Unexpected admin table ${table}`);
    },
    async rpc(_fn: string, args: { p_client_event_id: string }) {
      state.rpcProvisionCalls += 1;

      if (state.rpcProvisionShouldFail) {
        return { data: null, error: { message: "operational failed" } };
      }

      const eventId = args.p_client_event_id;
      const source =
        state.insertedEvent ??
        state.activeByFingerprint ??
        makeEventRow({ id: eventId });
      const alreadyLinked = Boolean(source.operational_event_id);
      const reused =
        !alreadyLinked &&
        state.rpcReuseExisting &&
        state.rpcExistingOperationalEventId !== null;
      const created = !alreadyLinked && !reused;

      const linkedOperationalId =
        source.operational_event_id ??
        (reused ? state.rpcExistingOperationalEventId : operationalEventId);

      const linked = {
        ...source,
        operational_event_id: linkedOperationalId,
      };

      if (state.insertedEvent?.id === eventId) {
        state.insertedEvent = linked;
      }
      if (state.activeByFingerprint?.id === eventId) {
        state.activeByFingerprint = linked;
      }

      return {
        data: [
          {
            client_event_id: eventId,
            operational_event_id: linkedOperationalId,
            created,
            reused,
          },
        ],
        error: null,
      };
    },
  };

  return {
    authClient: authClient as CreateClientEventDeps["authClient"],
    adminClient: adminClient as CreateClientEventDeps["adminClient"],
    ownerUserId,
  };
}

const originalNodeEnv = process.env.NODE_ENV;
const originalSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const originalSupabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const originalServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

function restoreEnv(): void {
  if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = originalNodeEnv;

  if (originalSupabaseUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  else process.env.NEXT_PUBLIC_SUPABASE_URL = originalSupabaseUrl;

  if (originalSupabaseAnon === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalSupabaseAnon;

  if (originalServiceRole === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  else process.env.SUPABASE_SERVICE_ROLE_KEY = originalServiceRole;
}

function createFakeSupabaseJwt(payload: Record<string, unknown>): string {
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url",
  );
  return `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${encodedPayload}.x`;
}

describe("client-event-service", () => {
  afterEach(() => {
    restoreEnv();
  });

  it("creates event successfully with owner, snapshot and profile update", async () => {
    const state: MockState = {
      activeByFingerprint: null,
      activeForOwner: null,
      insertedEvent: null,
      memberInserted: false,
      snapshotInserted: false,
      rpcProvisionCalls: 0,
      rpcProvisionShouldFail: false,
      rpcReuseExisting: false,
      rpcExistingOperationalEventId: null,
      profileUpdated: false,
      deletedEventIds: [],
      memberShouldFail: false,
      snapshotShouldFail: false,
      profileShouldFail: false,
    };

    const result = await createClientEventFromPayload(
      basePayload,
      createMockDeps(state),
    );

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.created, true);
      assert.equal(result.data.slug, "staging-a");
      assert.equal(result.data.operationalEventId, operationalEventId);
      assert.equal(result.data.operationalLinked, true);
      assert.match(result.data.redirectTo, /^\/app\/dashboard\?eventId=/);
    }
    assert.equal(state.memberInserted, true);
    assert.equal(state.snapshotInserted, true);
    assert.equal(state.rpcProvisionCalls, 1);
    assert.equal(state.profileUpdated, true);
    assert.deepEqual(state.deletedEventIds, []);
  });

  it("returns existing event when fingerprint matches (idempotent)", async () => {
    const existing = makeEventRow({ operational_event_id: operationalEventId });
    const state: MockState = {
      activeByFingerprint: existing,
      activeForOwner: existing,
      insertedEvent: null,
      memberInserted: false,
      snapshotInserted: false,
      rpcProvisionCalls: 0,
      rpcProvisionShouldFail: false,
      rpcReuseExisting: false,
      rpcExistingOperationalEventId: null,
      profileUpdated: false,
      deletedEventIds: [],
      memberShouldFail: false,
      snapshotShouldFail: false,
      profileShouldFail: false,
    };

    const result = await createClientEventFromPayload(
      basePayload,
      createMockDeps(state),
    );

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.created, false);
      assert.equal(result.data.eventId, existing.id);
      assert.equal(result.data.operationalEventId, operationalEventId);
      assert.equal(result.data.operationalLinked, true);
    }
    assert.equal(state.memberInserted, false);
    assert.equal(state.rpcProvisionCalls, 1);
  });

  it("provisions old idempotent client_event when operational_event_id is missing", async () => {
    const existing = makeEventRow({ operational_event_id: null });
    const state: MockState = {
      activeByFingerprint: existing,
      activeForOwner: existing,
      insertedEvent: null,
      memberInserted: false,
      snapshotInserted: false,
      rpcProvisionCalls: 0,
      rpcProvisionShouldFail: false,
      rpcReuseExisting: false,
      rpcExistingOperationalEventId: null,
      profileUpdated: false,
      deletedEventIds: [],
      memberShouldFail: false,
      snapshotShouldFail: false,
      profileShouldFail: false,
    };

    const result = await createClientEventFromPayload(
      basePayload,
      createMockDeps(state),
    );

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.created, false);
      assert.equal(result.data.operationalEventId, operationalEventId);
      assert.equal(result.data.operationalLinked, true);
    }
    assert.equal(state.rpcProvisionCalls, 1);
  });

  it("reuses orphaned provisioned operational event instead of duplicating", async () => {
    const existing = makeEventRow({ operational_event_id: null });
    const state: MockState = {
      activeByFingerprint: existing,
      activeForOwner: existing,
      insertedEvent: null,
      memberInserted: false,
      snapshotInserted: false,
      rpcProvisionCalls: 0,
      rpcProvisionShouldFail: false,
      rpcReuseExisting: true,
      rpcExistingOperationalEventId: operationalEventId,
      profileUpdated: false,
      deletedEventIds: [],
      memberShouldFail: false,
      snapshotShouldFail: false,
      profileShouldFail: false,
    };

    const result = await createClientEventFromPayload(
      basePayload,
      createMockDeps(state),
    );

    assert.equal(result.ok, true);
    assert.equal(state.rpcProvisionCalls, 1);
    if (result.ok) {
      assert.equal(result.data.operationalEventId, operationalEventId);
    }
  });

  it("returns 409 when active event exists with different fingerprint", async () => {
    const active = makeEventRow({
      onboarding_fingerprint: "outro-fingerprint",
    });
    const state: MockState = {
      activeByFingerprint: null,
      activeForOwner: active,
      insertedEvent: null,
      memberInserted: false,
      snapshotInserted: false,
      rpcProvisionCalls: 0,
      rpcProvisionShouldFail: false,
      rpcReuseExisting: false,
      rpcExistingOperationalEventId: null,
      profileUpdated: false,
      deletedEventIds: [],
      memberShouldFail: false,
      snapshotShouldFail: false,
      profileShouldFail: false,
    };

    const result = await createClientEventFromPayload(
      basePayload,
      createMockDeps(state),
    );

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.status, 409);
      assert.equal(result.error, "active_event_exists");
      assert.equal(result.existingEventId, active.id);
    }
  });

  it("compensates when member insert fails", async () => {
    const state: MockState = {
      activeByFingerprint: null,
      activeForOwner: null,
      insertedEvent: null,
      memberInserted: false,
      snapshotInserted: false,
      rpcProvisionCalls: 0,
      rpcProvisionShouldFail: false,
      rpcReuseExisting: false,
      rpcExistingOperationalEventId: null,
      profileUpdated: false,
      deletedEventIds: [],
      memberShouldFail: true,
      snapshotShouldFail: false,
      profileShouldFail: false,
    };

    const result = await createClientEventFromPayload(
      basePayload,
      createMockDeps(state),
    );

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error, "member_insert_failed");
    }
    assert.deepEqual(state.deletedEventIds, ["event-uuid-1"]);
  });

  it("compensates when snapshot insert fails", async () => {
    const state: MockState = {
      activeByFingerprint: null,
      activeForOwner: null,
      insertedEvent: null,
      memberInserted: false,
      snapshotInserted: false,
      rpcProvisionCalls: 0,
      rpcProvisionShouldFail: false,
      rpcReuseExisting: false,
      rpcExistingOperationalEventId: null,
      profileUpdated: false,
      deletedEventIds: [],
      memberShouldFail: false,
      snapshotShouldFail: true,
      profileShouldFail: false,
    };

    const result = await createClientEventFromPayload(
      basePayload,
      createMockDeps(state),
    );

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error, "snapshot_insert_failed");
    }
    assert.deepEqual(state.deletedEventIds, ["event-uuid-1"]);
  });

  it("compensates when operational event provisioning fails", async () => {
    const state: MockState = {
      activeByFingerprint: null,
      activeForOwner: null,
      insertedEvent: null,
      memberInserted: false,
      snapshotInserted: false,
      rpcProvisionCalls: 0,
      rpcProvisionShouldFail: true,
      rpcReuseExisting: false,
      rpcExistingOperationalEventId: null,
      profileUpdated: false,
      deletedEventIds: [],
      memberShouldFail: false,
      snapshotShouldFail: false,
      profileShouldFail: false,
    };

    const result = await createClientEventFromPayload(
      basePayload,
      createMockDeps(state),
    );

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error, "operational_event_provision_failed");
    }
    assert.equal(state.snapshotInserted, true);
    assert.deepEqual(state.deletedEventIds, ["event-uuid-1"]);
    assert.equal(state.rpcProvisionCalls, 1);
  });

  it("compensates client_event when profile update fails after provisioning", async () => {
    const state: MockState = {
      activeByFingerprint: null,
      activeForOwner: null,
      insertedEvent: null,
      memberInserted: false,
      snapshotInserted: false,
      rpcProvisionCalls: 0,
      rpcProvisionShouldFail: false,
      rpcReuseExisting: false,
      rpcExistingOperationalEventId: null,
      profileUpdated: false,
      deletedEventIds: [],
      memberShouldFail: false,
      snapshotShouldFail: false,
      profileShouldFail: true,
    };

    const result = await createClientEventFromPayload(
      basePayload,
      createMockDeps(state),
    );

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error, "profile_update_failed");
    }
    assert.deepEqual(state.deletedEventIds, ["event-uuid-1"]);
    assert.equal(state.rpcProvisionCalls, 1);
  });

  it("returns service_role_unavailable without admin client", async () => {
    const deps = createMockDeps({
      activeByFingerprint: null,
      activeForOwner: null,
      insertedEvent: null,
      memberInserted: false,
      snapshotInserted: false,
      rpcProvisionCalls: 0,
      rpcProvisionShouldFail: false,
      rpcReuseExisting: false,
      rpcExistingOperationalEventId: null,
      profileUpdated: false,
      deletedEventIds: [],
      memberShouldFail: false,
      snapshotShouldFail: false,
      profileShouldFail: false,
    });
    deps.adminClient = null;

    const result = await createClientEventFromPayload(basePayload, deps);
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.status, 503);
      assert.equal(result.error, "service_role_unavailable");
    }
  });
});

describe("client-app env guards for POST /api/events", () => {
  afterEach(() => {
    restoreEnv();
  });

  it("blocks production Supabase URL in development", () => {
    process.env.NODE_ENV = "development";
    process.env.NEXT_PUBLIC_SUPABASE_URL = `https://${SUPABASE_PRODUCTION_PROJECT_REF}.supabase.co`;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";

    const result = validateClientAppAuthEnvironment();
    assert.equal(result.ok, false);
  });

  it("allows preview Supabase URL in development", () => {
    process.env.NODE_ENV = "development";
    process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_PREVIEW_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";

    const result = validateClientAppAuthEnvironment();
    assert.equal(result.ok, true);
  });

  it("requires service role key for snapshot writes", () => {
    process.env.NODE_ENV = "development";
    process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_PREVIEW_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const result = validateClientAppServiceRoleEnvironment();
    assert.equal(result.ok, false);
  });

  it("rejects production service role when URL points to preview", () => {
    process.env.NODE_ENV = "development";
    process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_PREVIEW_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    process.env.SUPABASE_SERVICE_ROLE_KEY =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94c3JkbXlkbHF5dm51ZWVkZ3RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY3MDAwMDAwMCwiZXhwIjoxOTg1NTc2MDAwfQ.x";

    const result = validateClientAppServiceRoleEnvironment();
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.match(result.message, /não corresponde|produção/i);
    }
  });

  it("rejects preview anon key in the service role slot", () => {
    process.env.NODE_ENV = "development";
    process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_PREVIEW_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    process.env.SUPABASE_SERVICE_ROLE_KEY = createFakeSupabaseJwt({
      iss: "supabase",
      ref: SUPABASE_PREVIEW_URL.split("//")[1]?.split(".")[0],
      role: "anon",
    });

    const result = validateClientAppServiceRoleEnvironment();
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.match(result.message, /service_role/i);
    }
  });
});
