import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildClientEventSlug,
  buildStableOnboardingFingerprint,
  normalizeMozambiquePhone,
  resolveOnboardingFingerprint,
} from "@/lib/events/create-event-helpers";

const basePayload = {
  eventType: "wedding" as const,
  eventName: "Jessica & Samuel",
  brideName: "Jessica",
  groomName: "Samuel",
  eventDate: "2026-12-20",
  eventLocation: "Maputo",
  estimatedGuests: 150,
  budgetMin: 80000,
  budgetMax: 150000,
  servicesInterested: ["convites_digitais", "rsvp"] as const,
  phone: "+258840000000",
  source: "onboarding" as const,
};

describe("create-event-helpers", () => {
  it("buildClientEventSlug normalizes accents and spaces", () => {
    assert.equal(
      buildClientEventSlug({ brideName: "Jéssica", groomName: "Samuel" }),
      "jessica-samuel",
    );
  });

  it("buildStableOnboardingFingerprint is deterministic", () => {
    const a = buildStableOnboardingFingerprint(basePayload);
    const b = buildStableOnboardingFingerprint({
      ...basePayload,
      brideName: "  Jessica  ",
    });
    assert.equal(a, b);
    assert.match(a, /^[a-f0-9]{64}$/);
  });

  it("resolveOnboardingFingerprint prefers localFingerprint", () => {
    assert.equal(
      resolveOnboardingFingerprint({
        ...basePayload,
        localFingerprint: "staging-a-evento-teste-001",
      }),
      "staging-a-evento-teste-001",
    );
  });

  it("normalizeMozambiquePhone accepts 9-digit local numbers", () => {
    assert.equal(normalizeMozambiquePhone("840000000"), "+258840000000");
  });
});
