import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { describe, it } from "node:test";
import {
  ONBOARDING_KEYS,
  type OnboardingRawData,
} from "@/lib/auth/onboarding-storage";
import { ONBOARDING_COMPLETE_KEY } from "@/lib/auth/onboarding-status";
import {
  ONBOARDING_SYNC_KEYS,
  buildOnboardingEventPayload,
  hydrateOnboardingSyncFromUrlEventId,
  performOnboardingSync,
  readOnboardingSyncState,
  resolveOrCreateLocalFingerprint,
  resolvePostOnboardingCompletionRedirect,
  shouldAttemptOnboardingSync,
} from "@/lib/auth/onboarding-sync";
import { buildStableOnboardingFingerprintMaterial } from "@/lib/events/onboarding-payload-shared";

class MemoryStorage implements Storage {
  private readonly data = new Map<string, string>();

  get length(): number {
    return this.data.size;
  }

  clear(): void {
    this.data.clear();
  }

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.data.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
}

function nodeSha256(material: string): string {
  return createHash("sha256").update(material, "utf8").digest("hex");
}

function seedCompleteOnboarding(store: MemoryStorage): OnboardingRawData {
  const data: OnboardingRawData = {
    role: "noiva",
    brideName: "Ana",
    groomName: "Carlos",
    eventDateIso: "2026-09-12",
    location: "Maputo",
    guestsCount: 180,
    estimatedBudget: 500000,
    phone: "841234567",
  };

  store.setItem(ONBOARDING_KEYS.role, data.role);
  store.setItem(ONBOARDING_KEYS.bride, data.brideName);
  store.setItem(ONBOARDING_KEYS.groom, data.groomName);
  store.setItem(ONBOARDING_KEYS.date, data.eventDateIso);
  store.setItem(ONBOARDING_KEYS.location, data.location);
  store.setItem(ONBOARDING_KEYS.guests, String(data.guestsCount));
  store.setItem(ONBOARDING_KEYS.budget, String(data.estimatedBudget));
  store.setItem(ONBOARDING_KEYS.phone, data.phone);
  store.setItem(ONBOARDING_COMPLETE_KEY, "true");

  return data;
}

function buildPayload(data: OnboardingRawData, fingerprint = "fp-test") {
  return buildOnboardingEventPayload(data, fingerprint);
}

describe("onboarding-sync", () => {
  it("shouldAttemptOnboardingSync skips incomplete onboarding", () => {
    const store = new MemoryStorage();
    const gate = shouldAttemptOnboardingSync({ store });
    assert.equal(gate.attempt, false);
    if (!gate.attempt) {
      assert.equal(gate.reason, "incomplete_onboarding");
    }
  });

  it("buildOnboardingEventPayload maps onboarding data to API payload", () => {
    const data = seedCompleteOnboarding(new MemoryStorage());
    const payload = buildOnboardingEventPayload(data, "fp-001");

    assert.equal(payload.eventType, "wedding");
    assert.equal(payload.eventName, "Ana & Carlos");
    assert.equal(payload.phone, "+258841234567");
    assert.equal(payload.localFingerprint, "fp-001");
    assert.equal(payload.source, "onboarding");
    assert.equal(payload.budgetMax, 500000);
  });

  it("resolveOrCreateLocalFingerprint is stable across calls", async () => {
    const store = new MemoryStorage();
    const data = seedCompleteOnboarding(store);
    const payload = buildPayload(data, "pending");

    const first = await resolveOrCreateLocalFingerprint(store, payload, nodeSha256);
    const second = await resolveOrCreateLocalFingerprint(store, payload, nodeSha256);

    assert.equal(first, second);
    assert.equal(store.getItem(ONBOARDING_SYNC_KEYS.localFingerprint), first);

    const material = buildStableOnboardingFingerprintMaterial(payload);
    assert.equal(first, nodeSha256(material));
  });

  it("performOnboardingSync returns skipped for incomplete onboarding", async () => {
    const store = new MemoryStorage();
    const result = await performOnboardingSync({
      store,
      hashFingerprint: nodeSha256,
      fetchFn: async () => {
        throw new Error("fetch should not be called");
      },
    });

    assert.deepEqual(result, { action: "skipped", reason: "incomplete_onboarding" });
  });

  it("performOnboardingSync stores eventId on 201 created", async () => {
    const store = new MemoryStorage();
    seedCompleteOnboarding(store);

    let fetchCalls = 0;
    const redirects: string[] = [];

    const result = await performOnboardingSync({
      store,
      hashFingerprint: nodeSha256,
      redirect: (url) => redirects.push(url),
      fetchFn: async () => {
        fetchCalls += 1;
        return new Response(
          JSON.stringify({
            ok: true,
            created: true,
            data: {
              eventId: "evt-created-1",
              slug: "ana-carlos",
              status: "planning",
              eventName: "Ana & Carlos",
              eventType: "wedding",
              eventDate: "2026-09-12",
              isActive: true,
              createdAt: "2026-07-09T12:00:00.000Z",
              redirectTo: "/app/dashboard?eventId=evt-created-1",
            },
          }),
          { status: 201 },
        );
      },
    });

    assert.equal(fetchCalls, 1);
    assert.deepEqual(result, {
      action: "success",
      eventId: "evt-created-1",
      created: true,
    });
    assert.equal(store.getItem(ONBOARDING_SYNC_KEYS.syncedEventId), "evt-created-1");
    assert.equal(store.getItem(ONBOARDING_SYNC_KEYS.syncStatus), "synced");
    assert.ok(store.getItem(ONBOARDING_SYNC_KEYS.syncedAt));
    assert.deepEqual(redirects, ["/app/dashboard?eventId=evt-created-1"]);
  });

  it("performOnboardingSync stores eventId on 200 idempotent replay", async () => {
    const store = new MemoryStorage();
    seedCompleteOnboarding(store);

    const result = await performOnboardingSync({
      store,
      hashFingerprint: nodeSha256,
      fetchFn: async () =>
        new Response(
          JSON.stringify({
            ok: true,
            created: false,
            data: {
              eventId: "evt-existing-1",
              slug: "ana-carlos",
              status: "planning",
              eventName: "Ana & Carlos",
              eventType: "wedding",
              eventDate: "2026-09-12",
              isActive: true,
              createdAt: "2026-07-09T12:00:00.000Z",
              redirectTo: "/app/dashboard?eventId=evt-existing-1",
            },
          }),
          { status: 200 },
        ),
    });

    assert.deepEqual(result, {
      action: "success",
      eventId: "evt-existing-1",
      created: false,
    });
    assert.equal(store.getItem(ONBOARDING_SYNC_KEYS.syncedEventId), "evt-existing-1");
    assert.equal(store.getItem(ONBOARDING_SYNC_KEYS.syncStatus), "synced");
  });

  it("performOnboardingSync handles 409 active_event_exists", async () => {
    const store = new MemoryStorage();
    seedCompleteOnboarding(store);

    const redirects: string[] = [];
    const result = await performOnboardingSync({
      store,
      hashFingerprint: nodeSha256,
      redirect: (url) => redirects.push(url),
      fetchFn: async () =>
        new Response(
          JSON.stringify({
            ok: false,
            error: "active_event_exists",
            message: "Já existe um evento activo.",
            existingEventId: "evt-active-1",
            redirectTo: "/app/dashboard?eventId=evt-active-1",
          }),
          { status: 409 },
        ),
    });

    assert.deepEqual(result, {
      action: "redirect",
      url: "/app/dashboard?eventId=evt-active-1",
    });
    assert.equal(store.getItem(ONBOARDING_SYNC_KEYS.syncedEventId), "evt-active-1");
    assert.equal(store.getItem(ONBOARDING_SYNC_KEYS.syncStatus), "existing_active_event");
    assert.deepEqual(redirects, ["/app/dashboard?eventId=evt-active-1"]);
  });

  it("performOnboardingSync marks validation_error on 400 without retry loop", async () => {
    const store = new MemoryStorage();
    seedCompleteOnboarding(store);

    const result = await performOnboardingSync({
      store,
      hashFingerprint: nodeSha256,
      fetchFn: async () =>
        new Response(
          JSON.stringify({
            ok: false,
            error: "validation_error",
            message: "Dados do evento inválidos.",
          }),
          { status: 400 },
        ),
    });

    assert.equal(result.action, "error");
    if (result.action === "error") {
      assert.equal(result.status, "validation_error");
      assert.equal(result.retryable, false);
    }
    assert.equal(store.getItem(ONBOARDING_SYNC_KEYS.syncStatus), "validation_error");

    const gate = shouldAttemptOnboardingSync({ store });
    assert.equal(gate.attempt, false);
    if (!gate.attempt) {
      assert.equal(gate.reason, "sync_requires_retry");
    }
  });

  it("performOnboardingSync redirects to sign-in on 401", async () => {
    const store = new MemoryStorage();
    seedCompleteOnboarding(store);

    const redirects: string[] = [];
    const result = await performOnboardingSync({
      store,
      hashFingerprint: nodeSha256,
      redirect: (url) => redirects.push(url),
      fetchFn: async () =>
        new Response(
          JSON.stringify({
            ok: false,
            error: "unauthorized",
            message: "Sessão inválida ou expirada.",
          }),
          { status: 401 },
        ),
    });

    assert.deepEqual(result, {
      action: "redirect",
      url: "/sign-in?from=%2Fapp%2Fdashboard",
    });
    assert.equal(store.getItem(ONBOARDING_SYNC_KEYS.syncStatus), "unauthorized");
    assert.deepEqual(redirects, ["/sign-in?from=%2Fapp%2Fdashboard"]);
  });

  it("performOnboardingSync marks failed on 503 without auto retry", async () => {
    const store = new MemoryStorage();
    seedCompleteOnboarding(store);

    const result = await performOnboardingSync({
      store,
      hashFingerprint: nodeSha256,
      fetchFn: async () =>
        new Response(
          JSON.stringify({
            ok: false,
            error: "service_role_unavailable",
            message: "Service role indisponível.",
          }),
          { status: 503 },
        ),
    });

    assert.equal(result.action, "error");
    if (result.action === "error") {
      assert.equal(result.status, "failed");
      assert.equal(result.retryable, false);
    }
    assert.equal(store.getItem(ONBOARDING_SYNC_KEYS.syncStatus), "failed");

    const gate = shouldAttemptOnboardingSync({ store });
    assert.equal(gate.attempt, false);
  });

  it("performOnboardingSync does not duplicate POST when already synced", async () => {
    const store = new MemoryStorage();
    seedCompleteOnboarding(store);
    store.setItem(ONBOARDING_SYNC_KEYS.syncedEventId, "evt-synced");
    store.setItem(ONBOARDING_SYNC_KEYS.syncStatus, "synced");

    let fetchCalls = 0;
    const result = await performOnboardingSync({
      store,
      hashFingerprint: nodeSha256,
      fetchFn: async () => {
        fetchCalls += 1;
        return new Response("{}", { status: 500 });
      },
    });

    assert.equal(fetchCalls, 0);
    assert.deepEqual(result, { action: "skipped", reason: "already_synced" });
  });

  it("hydrateOnboardingSyncFromUrlEventId persists eventId without POST", () => {
    const store = new MemoryStorage();
    seedCompleteOnboarding(store);

    const hydrated = hydrateOnboardingSyncFromUrlEventId(
      store,
      new URLSearchParams("eventId=evt-from-url"),
    );

    assert.deepEqual(hydrated, { hydrated: true, eventId: "evt-from-url" });
    assert.equal(readOnboardingSyncState(store).syncedEventId, "evt-from-url");
    assert.equal(readOnboardingSyncState(store).syncStatus, "synced");
  });

  it("resolvePostOnboardingCompletionRedirect sends unauthenticated users to sign-in", () => {
    assert.equal(
      resolvePostOnboardingCompletionRedirect(false),
      "/sign-in?from=%2Fapp%2Fdashboard",
    );
    assert.equal(resolvePostOnboardingCompletionRedirect(true), "/app/dashboard");
  });
});
