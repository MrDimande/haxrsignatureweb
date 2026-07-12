import assert from "node:assert/strict";
import { describe, it, beforeEach, afterEach } from "node:test";
import { processEditionRsvpSubmission } from "./service";

describe("processEditionRsvpSubmission - Notification Switch", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("1. RSVP proceeds and tries to send notifications when EDITION_RSVP_NOTIFICATIONS_ENABLED is true or absent", async () => {
    delete process.env.EDITION_RSVP_NOTIFICATIONS_ENABLED;

    const submission = {
      slug: "jessicakulaya",
      name: "Maria Silva",
      attending: true,
      guests: 2,
      email: "maria@example.com",
      phone: "+258841234567",
      messageForBride: "Parabéns!",
      size: "M",
      dressCodeConfirmed: true,
      honeypot: "",
    };

    const res = await processEditionRsvpSubmission(submission);
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    // Since notifications are enabled by default, keys emailSent and guestEmailSent must be present in body
    assert.ok("emailSent" in res.body);
    assert.ok("guestEmailSent" in res.body);
  });

  it("2. notifications are suppressed and keys are completely omitted when EDITION_RSVP_NOTIFICATIONS_ENABLED is false", async () => {
    process.env.EDITION_RSVP_NOTIFICATIONS_ENABLED = "false";

    const submission = {
      slug: "jessicakulaya",
      name: "Maria Silva",
      attending: true,
      guests: 2,
      email: "maria@example.com",
      phone: "+258841234567",
      messageForBride: "Parabéns!",
      size: "M",
      dressCodeConfirmed: true,
      honeypot: "",
    };

    const res = await processEditionRsvpSubmission(submission);
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);

    // When notifications are suppressed, emailSent and guestEmailSent must be completely omitted from the response
    assert.equal("emailSent" in res.body, false);
    assert.equal("guestEmailSent" in res.body, false);
  });

  it("3. unknown slug fails before persistence or notification paths", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://invalid.supabase.local";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "invalid-service-role";
    process.env.RESEND_API_KEY = "invalid-resend-key";
    delete process.env.EDITION_RSVP_NOTIFICATIONS_ENABLED;

    const res = await processEditionRsvpSubmission({
      slug: "unknown-slug",
      name: "Maria Silva",
      attending: true,
      guests: 1,
      email: "maria@example.com",
      honeypot: "",
    });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error, "Convite inválido.");
  });
});
