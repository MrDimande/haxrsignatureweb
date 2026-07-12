import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ONBOARDING_KEYS,
} from "./onboarding-storage";
import {
  ONBOARDING_COMPLETE_KEY,
  isOnboardingComplete,
  resolveDashboardEntryRedirect,
  resolvePostLoginRedirect,
} from "./onboarding-status";

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

function seedCompleteOnboarding(store: MemoryStorage): void {
  store.setItem(ONBOARDING_KEYS.role, "noiva");
  store.setItem(ONBOARDING_KEYS.bride, "Ana");
  store.setItem(ONBOARDING_KEYS.groom, "Carlos");
  store.setItem(ONBOARDING_KEYS.date, "2026-09-12");
  store.setItem(ONBOARDING_KEYS.location, "Maputo");
  store.setItem(ONBOARDING_KEYS.guests, "180");
  store.setItem(ONBOARDING_KEYS.budget, "500000");
  store.setItem(ONBOARDING_KEYS.phone, "841234567");
  store.setItem(ONBOARDING_COMPLETE_KEY, "true");
}

describe("onboarding-status", () => {
  it("isOnboardingComplete returns false when storage is empty", () => {
    const store = new MemoryStorage();
    assert.equal(isOnboardingComplete(store), false);
  });

  it("isOnboardingComplete returns true when all mandatory fields exist", () => {
    const store = new MemoryStorage();
    seedCompleteOnboarding(store);
    assert.equal(isOnboardingComplete(store), true);
  });

  it("isOnboardingComplete returns false when complete flag exists but data is missing", () => {
    const store = new MemoryStorage();
    store.setItem(ONBOARDING_COMPLETE_KEY, "true");
    assert.equal(isOnboardingComplete(store), false);
    assert.equal(store.getItem(ONBOARDING_COMPLETE_KEY), null);
  });

  it("isOnboardingComplete accepts onboarding without budget", () => {
    const store = new MemoryStorage();
    seedCompleteOnboarding(store);
    store.removeItem(ONBOARDING_KEYS.budget);
    assert.equal(isOnboardingComplete(store), true);
  });

  it("resolvePostLoginRedirect sends incomplete users to onboarding", () => {
    const store = new MemoryStorage();
    assert.equal(resolvePostLoginRedirect(store), "/onboarding");
  });

  it("resolvePostLoginRedirect sends complete users to dashboard", () => {
    const store = new MemoryStorage();
    seedCompleteOnboarding(store);
    assert.equal(resolvePostLoginRedirect(store), "/app/dashboard");
  });

  it("resolveDashboardEntryRedirect returns onboarding when profile is incomplete", () => {
    const store = new MemoryStorage();
    assert.equal(resolveDashboardEntryRedirect(store), "/onboarding");
  });

  it("resolveDashboardEntryRedirect returns null when profile is complete", () => {
    const store = new MemoryStorage();
    seedCompleteOnboarding(store);
    assert.equal(resolveDashboardEntryRedirect(store), null);
  });
});
