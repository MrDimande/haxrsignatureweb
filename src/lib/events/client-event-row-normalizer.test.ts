import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ClientEventRowNormalizationError,
  normalizeClientEventRow,
} from "@/lib/events/client-event-row-normalizer";

const EVENT_ID = "f51ce8b2-6b5c-4692-852e-fb1dad1842e1";
const OWNER_ID = "acd1d7b7-b679-4c8b-94e1-4d4552f1d8ee";

function createRawClientEvent(
  overrides: Partial<Record<string, unknown>> = {},
): Record<string, unknown> {
  return {
    id: EVENT_ID,
    owner_user_id: OWNER_ID,
    slug: "neon-runtime-event",
    event_name: "Neon Runtime Event",
    event_type: "wedding",
    bride_name: "Neon",
    groom_name: "Runtime",
    event_date: "2026-12-20",
    event_location: "Maputo",
    estimated_guests: 150,
    budget_min: "120000",
    budget_max: "150000",
    status: "planning",
    source: "onboarding",
    services_interested: ["photography"],
    phone: null,
    operational_event_id: null,
    is_active: true,
    onboarding_fingerprint: "fp-neon-runtime",
    created_at: "2026-07-09T12:00:00.000Z",
    updated_at: "2026-07-10T12:30:00.000Z",
    ...overrides,
  };
}

describe("normalizeClientEventRow", () => {
  it("normalizes node-postgres timestamp Date values to ISO strings", () => {
    const event = normalizeClientEventRow(
      createRawClientEvent({
        created_at: new Date("2026-07-09T12:00:00.000Z"),
        updated_at: new Date("2026-07-10T12:30:00.000Z"),
      }),
    );

    assert.equal(event.created_at, "2026-07-09T12:00:00.000Z");
    assert.equal(event.updated_at, "2026-07-10T12:30:00.000Z");
  });

  it("normalizes PostgreSQL bigint budget strings only when they are safe integers", () => {
    const event = normalizeClientEventRow(
      createRawClientEvent({ budget_min: "120000", budget_max: "150000" }),
    );

    assert.equal(event.budget_min, 120000);
    assert.equal(event.budget_max, 150000);
  });

  it("rejects bigint values that cannot be represented safely by the dashboard number contract", () => {
    assert.throws(
      () => normalizeClientEventRow(createRawClientEvent({ budget_max: "9007199254740992" })),
      (error: unknown) =>
        error instanceof ClientEventRowNormalizationError &&
        error.message === "client_event_row_invalid:budget_max:unsafe_integer",
    );
  });

  it("normalizes PostgreSQL DATE Date values to canonical date-only strings", () => {
    const event = normalizeClientEventRow(
      createRawClientEvent({ event_date: new Date("2026-12-20T00:00:00.000Z") }),
    );

    assert.equal(event.event_date, "2026-12-20");
  });

  it("preserves null budget and date values", () => {
    const event = normalizeClientEventRow(
      createRawClientEvent({ event_date: null, budget_min: null, budget_max: null }),
    );

    assert.equal(event.event_date, null);
    assert.equal(event.budget_min, null);
    assert.equal(event.budget_max, null);
  });

  it("rejects malformed UUIDs and negative guest estimates", () => {
    assert.throws(
      () => normalizeClientEventRow(createRawClientEvent({ id: "not-a-uuid" })),
      (error: unknown) =>
        error instanceof ClientEventRowNormalizationError &&
        error.message === "client_event_row_invalid:id:expected_uuid",
    );
    assert.throws(
      () =>
        normalizeClientEventRow(
          createRawClientEvent({ operational_event_id: "not-a-uuid" }),
        ),
      (error: unknown) =>
        error instanceof ClientEventRowNormalizationError &&
        error.message ===
          "client_event_row_invalid:operational_event_id:expected_nullable_uuid",
    );
    assert.throws(
      () => normalizeClientEventRow(createRawClientEvent({ estimated_guests: -1 })),
      (error: unknown) =>
        error instanceof ClientEventRowNormalizationError &&
        error.message === "client_event_row_invalid:estimated_guests:expected_non_negative_integer",
    );
  });

  it("remains compatible with PostgREST-style string fixtures", () => {
    const event = normalizeClientEventRow(createRawClientEvent());

    assert.equal(event.event_date, "2026-12-20");
    assert.equal(event.created_at, "2026-07-09T12:00:00.000Z");
    assert.equal(event.updated_at, "2026-07-10T12:30:00.000Z");
  });
});
