import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ONBOARDING_SYNC_KEYS } from "@/lib/auth/onboarding-sync";
import {
  isRealClientEventId,
  resolveActiveEventId,
  resolveActiveEventIdFromLocalStorage,
  resolveActiveEventIdFromUrl,
  resolvePreferredRealClientEventId,
} from "@/lib/auth/resolve-active-event-id";

class MemoryStorage {
  private readonly data = new Map<string, string>();

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
}

describe("resolve-active-event-id", () => {
  it("resolveActiveEventIdFromUrl reads eventId query param", () => {
    const params = new URLSearchParams("eventId=evt-url-1");
    assert.equal(resolveActiveEventIdFromUrl(params), "evt-url-1");
  });

  it("resolveActiveEventIdFromLocalStorage reads synced event id", () => {
    const store = new MemoryStorage();
    store.setItem(ONBOARDING_SYNC_KEYS.syncedEventId, "evt-local-1");
    assert.equal(resolveActiveEventIdFromLocalStorage(store), "evt-local-1");
  });

  it("resolveActiveEventId prefers URL over localStorage and profile", () => {
    const store = new MemoryStorage();
    store.setItem(ONBOARDING_SYNC_KEYS.syncedEventId, "evt-local-1");

    const resolved = resolveActiveEventId({
      searchParams: new URLSearchParams("eventId=evt-url-1"),
      store,
      profileActiveEventId: "evt-profile-1",
    });

    assert.deepEqual(resolved, { eventId: "evt-url-1", source: "url" });
  });

  it("resolveActiveEventId falls back to localStorage then profile", () => {
    const store = new MemoryStorage();
    store.setItem(ONBOARDING_SYNC_KEYS.syncedEventId, "evt-local-1");

    assert.deepEqual(
      resolveActiveEventId({ store, profileActiveEventId: "evt-profile-1" }),
      { eventId: "evt-local-1", source: "local_storage" },
    );

    assert.deepEqual(
      resolveActiveEventId({ profileActiveEventId: "evt-profile-1" }),
      { eventId: "evt-profile-1", source: "profile" },
    );
  });

  it("resolvePreferredRealClientEventId returns null for non-uuid ids", () => {
    const store = new MemoryStorage();
    store.setItem(ONBOARDING_SYNC_KEYS.syncedEventId, "ana-carlos");

    assert.equal(
      resolvePreferredRealClientEventId({
        store,
        profileActiveEventId: "slug-only",
      }),
      null,
    );
  });

  it("isRealClientEventId validates uuid format", () => {
    assert.equal(isRealClientEventId("f51ce8b2-6b5c-4692-852e-fb1dad1842e1"), true);
    assert.equal(isRealClientEventId("ana-carlos"), false);
  });
});
