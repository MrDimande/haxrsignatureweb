import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import {
  ONBOARDING_ENTRY_PATH,
  ONBOARDING_FIRST_STEP_PATH,
  resolveOnboardingFirstStepPath,
} from "./onboarding-entry";
import {
  POST_LOGIN_ONBOARDING,
  resolveDashboardEntryRedirect,
  resolvePostLoginRedirect,
} from "./onboarding-status";
import { ONBOARDING_KEYS } from "./onboarding-storage";

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

describe("onboarding-entry", () => {
  it("maps entry path to the first real wizard step", () => {
    assert.equal(ONBOARDING_ENTRY_PATH, POST_LOGIN_ONBOARDING);
    assert.equal(ONBOARDING_ENTRY_PATH, "/onboarding");
    assert.equal(resolveOnboardingFirstStepPath(), "/onboarding/profile/1");
    assert.notEqual(ONBOARDING_ENTRY_PATH, ONBOARDING_FIRST_STEP_PATH);
  });

  it("keeps incomplete onboarding redirects on entry path, not a dead route", () => {
    const store = new MemoryStorage();
    assert.equal(resolvePostLoginRedirect(store), ONBOARDING_ENTRY_PATH);
    assert.equal(resolveDashboardEntryRedirect(store), ONBOARDING_ENTRY_PATH);
    assert.match(resolveOnboardingFirstStepPath(), /^\/onboarding\/profile\/\d+$/);
  });

  it("keeps onboarding entry and first step in the private auth layout", () => {
    const root = process.cwd();
    assert.equal(
      existsSync(resolve(root, "src/app/(auth)/onboarding/page.tsx")),
      true,
      "missing onboarding entry route",
    );
    assert.equal(
      existsSync(resolve(root, "src/app/(auth)/onboarding/profile/1/page.tsx")),
      true,
      "missing first onboarding wizard step route",
    );
  });

  it("documents the wizard step chain through profile/4", () => {
    const root = process.cwd();
    for (const step of ["1", "2", "3", "4"]) {
      assert.equal(
        existsSync(resolve(root, `src/app/(auth)/onboarding/profile/${step}/page.tsx`)),
        true,
        `missing onboarding profile step ${step}`,
      );
    }
  });

  it("does not treat empty storage as complete onboarding", () => {
    const store = new MemoryStorage();
    assert.equal(store.getItem(ONBOARDING_KEYS.role), null);
    assert.equal(resolvePostLoginRedirect(store), ONBOARDING_ENTRY_PATH);
  });
});
