import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { handleCreateEventRequest } from "@/lib/events/create-event-api";
import type { CreateClientEventInput } from "@/lib/events/create-event-validation";

const validPayload: CreateClientEventInput = {
  eventType: "wedding",
  eventName: "Evento Teste",
  brideName: "Staging",
  groomName: "A",
  eventDate: "2026-12-20",
  eventLocation: "Maputo",
  estimatedGuests: 150,
  servicesInterested: ["convites_digitais"],
  phone: "+258840000000",
  source: "onboarding",
  localFingerprint: "fp-001",
};

describe("create-event-api", () => {
  it("returns 401 when user is missing", async () => {
    const result = await handleCreateEventRequest({
      envCheck: { ok: true, projectRef: "uxleigndoomoezwsxlan" },
      serviceRoleCheck: { ok: true, projectRef: "uxleigndoomoezwsxlan" },
      user: null,
      rawBody: validPayload,
      idempotencyKey: null,
      createDeps: null,
    });

    assert.equal(result.status, 401);
    assert.equal(result.body.ok, false);
    if (!result.body.ok) {
      assert.equal(result.body.error, "unauthorized");
    }
  });

  it("returns 400 for invalid payload", async () => {
    const result = await handleCreateEventRequest({
      envCheck: { ok: true, projectRef: "uxleigndoomoezwsxlan" },
      serviceRoleCheck: { ok: true, projectRef: "uxleigndoomoezwsxlan" },
      user: { id: "user-1" },
      rawBody: { eventType: "wedding" },
      idempotencyKey: null,
      createDeps: null,
    });

    assert.equal(result.status, 400);
    assert.equal(result.body.ok, false);
    if (!result.body.ok) {
      assert.equal(result.body.error, "validation_error");
      assert.ok(result.body.details && result.body.details.length > 0);
    }
  });
});
