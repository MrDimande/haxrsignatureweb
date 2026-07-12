import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ONBOARDING_KEYS } from "@/lib/auth/onboarding-storage";
import {
  adaptOnboardingToDashboardData,
  buildDashboardFromOnboardingStore,
} from "@/lib/dashboard/onboarding-dashboard-adapter";

class MemoryStore {
  private readonly data = new Map<string, string>();

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }
}

describe("onboarding-dashboard-adapter", () => {
  it("builds personalized dashboard data from onboarding storage", () => {
    const store = new MemoryStore();
    store.setItem(ONBOARDING_KEYS.role, "noiva");
    store.setItem(ONBOARDING_KEYS.bride, "Maria");
    store.setItem(ONBOARDING_KEYS.groom, "João");
    store.setItem(ONBOARDING_KEYS.date, "2026-11-20");
    store.setItem(ONBOARDING_KEYS.location, "Beira, Moçambique");
    store.setItem(ONBOARDING_KEYS.guests, "220");
    store.setItem(ONBOARDING_KEYS.budget, "900000");
    store.setItem(ONBOARDING_KEYS.phone, "849998877");

    const dashboard = buildDashboardFromOnboardingStore(store);
    assert.ok(dashboard);

    assert.equal(dashboard.eventOverview.name, "Maria & João");
    assert.equal(dashboard.eventOverview.type, "Casamento");
    assert.equal(dashboard.eventOverview.dateIso, "2026-11-20");
    assert.equal(dashboard.eventOverview.location, "Beira, Moçambique");
    assert.equal(dashboard.guestSnapshot.total, 220);
    assert.equal(dashboard.financeSnapshot.budgetEstimated, 900000);
    assert.equal(dashboard.stats[0]?.value, 220);
  });

  it("returns null when onboarding storage is incomplete", () => {
    const store = new MemoryStore();
    store.setItem(ONBOARDING_KEYS.bride, "Maria");
    assert.equal(buildDashboardFromOnboardingStore(store), null);
  });

  it("adapts onboarding without budget", () => {
    const dashboard = adaptOnboardingToDashboardData({
      role: "consultor",
      brideName: "Sofia",
      groomName: "Miguel",
      eventDateIso: "2026-07-04",
      location: "Nampula",
      guestsCount: 120,
      phone: "841112233",
    });

    assert.equal(dashboard.eventOverview.name, "Sofia & Miguel");
    assert.equal(dashboard.eventOverview.type, "Evento · Consultor");
    assert.equal(dashboard.financeSnapshot.budgetEstimated, 0);
    assert.match(dashboard.stats[2]?.detail ?? "", /ainda por definir/);
  });

  it("does not use Jessica & Samuel defaults", () => {
    const dashboard = adaptOnboardingToDashboardData({
      role: "noiva",
      brideName: "Teresa",
      groomName: "Paulo",
      eventDateIso: "2026-05-01",
      location: "Quelimane",
      guestsCount: 90,
      estimatedBudget: 300000,
      phone: "840000111",
    });

    assert.notEqual(dashboard.eventOverview.name, "Jessica & Samuel");
    assert.equal(dashboard.eventOverview.slug, "teresa-paulo");
  });
});
