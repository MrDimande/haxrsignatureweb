import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ClientEventRow } from "@/lib/events/client-app-database.types";
import {
  buildOperationalEventProvisioningNote,
  OperationalEventProvisioningError,
  PROVISION_CLIENT_OPERATIONAL_EVENT_RPC,
  provisionOperationalEventForClientEvent,
  type OperationalEventProvisioningClient,
  type ProvisionOperationalEventRpcRow,
} from "@/lib/events/operational-event-provisioning";

const clientEvent: ClientEventRow = {
  id: "f51ce8b2-6b5c-4692-852e-fb1dad1842e1",
  owner_user_id: "acd1d7b7-b679-4c8b-94e1-4d4552f1d8ee",
  slug: "staging-a",
  event_name: "Evento Teste Staging A",
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
  onboarding_fingerprint: "fp-001",
  created_at: "2026-07-09T12:00:00.000Z",
  updated_at: "2026-07-09T12:00:00.000Z",
};

const operationalEventId = "11111111-1111-4111-8111-111111111111";

function createRpcMock(
  handler: (clientEventId: string) => {
    data?: ProvisionOperationalEventRpcRow[];
    error?: { message: string };
  },
): OperationalEventProvisioningClient {
  return {
    async rpc(fn, args) {
      assert.equal(fn, PROVISION_CLIENT_OPERATIONAL_EVENT_RPC);
      const result = handler(args.p_client_event_id);
      return {
        data: result.data ?? null,
        error: result.error ?? null,
      };
    },
  };
}

describe("operational-event-provisioning", () => {
  it("builds the idempotent provisioning note", () => {
    assert.equal(
      buildOperationalEventProvisioningNote(clientEvent.id),
      `Provisioned from client_events:${clientEvent.id}`,
    );
  });

  it("returns existing operational_event_id from RPC without creating", async () => {
    const linked = { ...clientEvent, operational_event_id: operationalEventId };
    const client = createRpcMock(() => ({
      data: [
        {
          client_event_id: linked.id,
          operational_event_id: operationalEventId,
          created: false,
          reused: false,
        },
      ],
    }));

    const result = await provisionOperationalEventForClientEvent(linked, client);

    assert.equal(result.operationalEventId, operationalEventId);
    assert.equal(result.createdOperationalEvent, false);
    assert.equal(result.reusedOperationalEvent, false);
    assert.equal(result.clientEvent.operational_event_id, operationalEventId);
  });

  it("reuses operational event found by notes via RPC", async () => {
    const client = createRpcMock(() => ({
      data: [
        {
          client_event_id: clientEvent.id,
          operational_event_id: operationalEventId,
          created: false,
          reused: true,
        },
      ],
    }));

    const result = await provisionOperationalEventForClientEvent(clientEvent, client);

    assert.equal(result.operationalEventId, operationalEventId);
    assert.equal(result.createdOperationalEvent, false);
    assert.equal(result.reusedOperationalEvent, true);
    assert.equal(result.clientEvent.operational_event_id, operationalEventId);
  });

  it("creates operational event and links client_event via RPC", async () => {
    const client = createRpcMock(() => ({
      data: [
        {
          client_event_id: clientEvent.id,
          operational_event_id: operationalEventId,
          created: true,
          reused: false,
        },
      ],
    }));

    const result = await provisionOperationalEventForClientEvent(clientEvent, client);

    assert.equal(result.operationalEventId, operationalEventId);
    assert.equal(result.createdOperationalEvent, true);
    assert.equal(result.reusedOperationalEvent, false);
    assert.equal(result.clientEvent.operational_event_id, operationalEventId);
  });

  it("replay does not duplicate when RPC returns existing link", async () => {
    let calls = 0;
    const client = createRpcMock(() => {
      calls += 1;
      return {
        data: [
          {
            client_event_id: clientEvent.id,
            operational_event_id: operationalEventId,
            created: false,
            reused: false,
          },
        ],
      };
    });

    const first = await provisionOperationalEventForClientEvent(clientEvent, client);
    const second = await provisionOperationalEventForClientEvent(
      first.clientEvent,
      client,
    );

    assert.equal(calls, 2);
    assert.equal(first.operationalEventId, operationalEventId);
    assert.equal(second.operationalEventId, operationalEventId);
    assert.equal(second.createdOperationalEvent, false);
  });

  it("throws when RPC reports missing business haxr-signature", async () => {
    const client = createRpcMock(() => ({
      error: {
        message: "operational_business_not_found: haxr-signature",
      },
    }));

    await assert.rejects(
      () => provisionOperationalEventForClientEvent(clientEvent, client),
      (error: unknown) => {
        assert.ok(error instanceof OperationalEventProvisioningError);
        assert.match(error.message, /operational_business_not_found/);
        return true;
      },
    );
  });

  it("throws when RPC returns no row", async () => {
    const client = createRpcMock(() => ({ data: [] }));

    await assert.rejects(
      () => provisionOperationalEventForClientEvent(clientEvent, client),
      /returned no row/,
    );
  });
});
