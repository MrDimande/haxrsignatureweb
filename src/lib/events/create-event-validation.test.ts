import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  parseCreateClientEventPayload,
  type CreateClientEventInput,
} from "@/lib/events/create-event-validation";

const validPayload: CreateClientEventInput = {
  eventType: "wedding",
  eventName: "Jessica & Samuel",
  brideName: "Jessica",
  groomName: "Samuel",
  eventDate: "2026-12-20",
  eventLocation: "Maputo",
  estimatedGuests: 150,
  budgetMin: 80000,
  budgetMax: 150000,
  servicesInterested: ["convites_digitais", "rsvp", "assessoria"],
  phone: "+258840000000",
  source: "onboarding",
  localFingerprint: "staging-a-evento-teste-001",
};

describe("create-event-validation", () => {
  it("accepts a valid onboarding payload", () => {
    const result = parseCreateClientEventPayload(validPayload);
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.data.eventName, "Jessica & Samuel");
      assert.equal(result.data.localFingerprint, "staging-a-evento-teste-001");
    }
  });

  it("rejects invalid event type", () => {
    const result = parseCreateClientEventPayload({
      ...validPayload,
      eventType: "casamento",
    });
    assert.equal(result.ok, false);
  });

  it("rejects invalid phone format", () => {
    const result = parseCreateClientEventPayload({
      ...validPayload,
      phone: "840000000",
    });
    assert.equal(result.ok, false);
  });

  it("rejects budgetMin greater than budgetMax", () => {
    const result = parseCreateClientEventPayload({
      ...validPayload,
      budgetMin: 200000,
      budgetMax: 100000,
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.ok(result.errors.some((e) => e.field === "budgetMin"));
    }
  });

  it("rejects unknown services", () => {
    const result = parseCreateClientEventPayload({
      ...validPayload,
      servicesInterested: ["servico_inventado"],
    });
    assert.equal(result.ok, false);
  });
});
