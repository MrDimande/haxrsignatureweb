import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import {
  ensureEditionInviteBootstrap,
  resetEditionPublishConfigStore,
  type EditionInvitePublishConfig,
} from "./publish-config";
import {
  getEditionPublishHealthReport,
  getEditionRsvpHealth,
  detectCircularAliases,
} from "./registry-health";
import {
  isEditionInvitePubliclyPublished,
  resetEditionPublishLedger,
} from "./publish-store";
import {
  publishEditionInvite,
  type AdminEventForPublish,
  type PublishEditionInviteDeps,
} from "./publish-edition-invite";

const WEDDING_ENV = "EDITION_EVENT_JESSICA_WEDDING_ID";
const WEDDING_UUID = "7cec4447-de0d-40a5-8f03-8d7c87acb3f5";
const originalWeddingId = process.env[WEDDING_ENV];
const originalEditionUrl = process.env.NEXT_PUBLIC_EDITION_SITE_URL;

function baseConfig(
  overrides: Partial<EditionInvitePublishConfig> = {}
): EditionInvitePublishConfig {
  const now = new Date().toISOString();
  return {
    registryKey: "jessica-samuel-wedding",
    canonicalSlug: "jessicasamuelwedding",
    themeId: "jessica-samuel-wedding",
    backendStrategy: "proxy",
    notificationMode: "disabled",
    status: "active",
    scheduleRequired: true,
    scheduleValue: "2026-12-20",
    guestListRequired: false,
    aliases: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function makeDeps(
  event: AdminEventForPublish | null,
  guestCount = 2,
  afterLedgerWrite?: PublishEditionInviteDeps["afterLedgerWrite"]
): PublishEditionInviteDeps {
  return {
    loadAdminEvent: async () => event,
    countGuests: async () => guestCount,
    afterLedgerWrite,
  };
}

const healthyEvent: AdminEventForPublish = {
  id: "admin-event-1",
  editionRegistryKey: "jessica-samuel-wedding",
  isActive: true,
  date: "2026-12-20",
  name: "Jessica & Samuel",
};

beforeEach(() => {
  resetEditionPublishConfigStore();
  resetEditionPublishLedger();
  process.env[WEDDING_ENV] = WEDDING_UUID;
  delete process.env.NEXT_PUBLIC_EDITION_SITE_URL;
});

afterEach(() => {
  if (originalWeddingId === undefined) {
    delete process.env[WEDDING_ENV];
  } else {
    process.env[WEDDING_ENV] = originalWeddingId;
  }
  if (originalEditionUrl === undefined) {
    delete process.env.NEXT_PUBLIC_EDITION_SITE_URL;
  } else {
    process.env.NEXT_PUBLIC_EDITION_SITE_URL = originalEditionUrl;
  }
  resetEditionPublishConfigStore();
  resetEditionPublishLedger();
});

describe("Edition RSVP publish health (legacy)", () => {
  it("blocks unknown registry", () => {
    assert.deepEqual(getEditionRsvpHealth("unknown"), {
      healthy: false,
      registryKey: "unknown",
      reason: "unknown_registry",
    });
  });

  it("blocks publishing when binding env is missing", () => {
    delete process.env[WEDDING_ENV];
    assert.deepEqual(getEditionRsvpHealth("jessica-samuel-wedding"), {
      healthy: false,
      registryKey: "jessica-samuel-wedding",
      reason: "binding_missing",
    });
  });

  it("resolves canonical registry, public slug and server binding", () => {
    const health = getEditionRsvpHealth("jessica-samuel-wedding");
    assert.equal(health.healthy, true);
    if (health.healthy) {
      assert.equal(health.publicSlug, "jessicasamuelwedding");
      assert.equal(health.bindingEnvVar, WEDDING_ENV);
      assert.equal(
        health.inviteUrl,
        "https://edition.haxrsignature.com/jessicasamuelwedding"
      );
    }
  });
});

describe("Edition publish health gate", () => {
  it("complete invite is publishable (healthy or warning only)", () => {
    const report = getEditionPublishHealthReport({
      registryKey: "jessica-samuel-wedding",
      config: baseConfig(),
      guestCount: 5,
    });
    assert.equal(report.canPublish, true);
    assert.notEqual(report.overall, "blocked");
    assert.ok(report.checks.every((c) => c.severity !== "blocked"));
    assert.equal(report.version.length > 0, true);
    assert.ok(report.evaluatedAt);
    // event_id stays server-only
    assert.equal(report._server?.eventId, WEDDING_UUID);
  });

  it("missing binding blocks", () => {
    delete process.env[WEDDING_ENV];
    const report = getEditionPublishHealthReport({
      registryKey: "jessica-samuel-wedding",
      config: baseConfig(),
      guestCount: 1,
    });
    assert.equal(report.canPublish, false);
    assert.equal(
      report.checks.find((c) => c.id === "event_binding")?.severity,
      "blocked"
    );
  });

  it("missing registry blocks", () => {
    const report = getEditionPublishHealthReport({
      registryKey: "does-not-exist",
      config: null,
      guestCount: 0,
    });
    assert.equal(report.canPublish, false);
    assert.equal(
      report.checks.find((c) => c.id === "registry")?.severity,
      "blocked"
    );
  });

  it("duplicate slug with conflicting bindings blocks", () => {
    const claimed = new Map<string, string[]>([
      ["jessicasamuelwedding", ["jessica-samuel-wedding", "traditional-wedding"]],
    ]);
    // Force traditional-wedding catalog entry to claim wedding public slug
    const report = getEditionPublishHealthReport({
      registryKey: "jessica-samuel-wedding",
      config: baseConfig(),
      guestCount: 1,
      claimedSlugs: claimed,
    });
    // traditional-wedding resolves to different binding than jessica-samuel-wedding
    assert.equal(
      report.checks.find((c) => c.id === "registry_uniqueness")?.severity,
      "blocked"
    );
    assert.equal(report.canPublish, false);
  });

  it("missing theme blocks", () => {
    const report = getEditionPublishHealthReport({
      registryKey: "jessica-samuel-wedding",
      config: baseConfig({ themeId: "unknown-theme-xyz" }),
      guestCount: 1,
    });
    assert.equal(
      report.checks.find((c) => c.id === "theme")?.severity,
      "blocked"
    );
    assert.equal(report.canPublish, false);
  });

  it("missing RSVP schema blocks", () => {
    const report = getEditionPublishHealthReport({
      registryKey: "jessica-samuel-wedding",
      config: baseConfig(),
      guestCount: 1,
      rsvpSchemaSlugs: new Set(),
    });
    assert.equal(
      report.checks.find((c) => c.id === "rsvp_schema")?.severity,
      "blocked"
    );
    assert.equal(report.canPublish, false);
  });

  it("circular alias blocks", () => {
    const report = getEditionPublishHealthReport({
      registryKey: "jessica-samuel-wedding",
      config: baseConfig(),
      guestCount: 1,
      aliasMaps: [{ a: "b", b: "a" }],
    });
    assert.equal(
      report.checks.find((c) => c.id === "aliases")?.severity,
      "blocked"
    );
    assert.equal(report.canPublish, false);
    assert.ok(detectCircularAliases([{ x: "y", y: "x" }]).length > 0);
  });

  it("invalid event_id blocks", () => {
    process.env[WEDDING_ENV] = "not-a-uuid";
    const report = getEditionPublishHealthReport({
      registryKey: "jessica-samuel-wedding",
      config: baseConfig(),
      guestCount: 1,
    });
    assert.equal(
      report.checks.find((c) => c.id === "event_id")?.severity,
      "blocked"
    );
    assert.equal(report.canPublish, false);
  });

  it("missing backend blocks", () => {
    const report = getEditionPublishHealthReport({
      registryKey: "jessica-samuel-wedding",
      config: baseConfig({ backendStrategy: null }),
      guestCount: 1,
    });
    assert.equal(
      report.checks.find((c) => c.id === "backend_strategy")?.severity,
      "blocked"
    );
    assert.equal(report.canPublish, false);
  });

  it("invalid notification mode blocks", () => {
    const report = getEditionPublishHealthReport({
      registryKey: "jessica-samuel-wedding",
      config: baseConfig({
        notificationMode: "email" as unknown as "disabled",
      }),
      guestCount: 1,
    });
    assert.equal(
      report.checks.find((c) => c.id === "notification_mode")?.severity,
      "blocked"
    );
    assert.equal(report.canPublish, false);
  });

  it("required schedule missing blocks", () => {
    const report = getEditionPublishHealthReport({
      registryKey: "jessica-samuel-wedding",
      config: baseConfig({ scheduleRequired: true, scheduleValue: null }),
      guestCount: 1,
    });
    assert.equal(
      report.checks.find((c) => c.id === "schedule")?.severity,
      "blocked"
    );
    assert.equal(report.canPublish, false);
  });

  it("draft stays non-public after blocked publish", async () => {
    const result = await publishEditionInvite(
      "admin-event-1",
      makeDeps(healthyEvent),
      baseConfig({ status: "draft", scheduleValue: "2026-12-20" })
    );
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.code, "health_blocked");
    }
    assert.equal(
      isEditionInvitePubliclyPublished("jessica-samuel-wedding"),
      false
    );
  });

  it("complete invite publishes and records date/version", async () => {
    const result = await publishEditionInvite(
      "admin-event-1",
      makeDeps(healthyEvent, 3),
      baseConfig()
    );
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.ok(result.publishedAt);
      assert.ok(result.version);
      assert.equal(result.record.status, "published");
      assert.equal(
        result.report.inviteUrl,
        "https://edition.haxrsignature.com/jessicasamuelwedding"
      );
      // Never leak event_id to client report
      assert.equal("_server" in result.report, false);
    }
    assert.equal(
      isEditionInvitePubliclyPublished("jessica-samuel-wedding"),
      true
    );
  });

  it("rollback when publish fails after ledger write", async () => {
    const result = await publishEditionInvite(
      "admin-event-1",
      makeDeps(healthyEvent, 2, () => {
        throw new Error("simulated publish failure");
      }),
      baseConfig()
    );
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.code, "publish_failed_rolled_back");
    }
    assert.equal(
      isEditionInvitePubliclyPublished("jessica-samuel-wedding"),
      false
    );
  });

  it("bootstrap creates initial config for catalogued invites", () => {
    const config = ensureEditionInviteBootstrap("jessica-samuel-wedding");
    assert.ok(config);
    assert.equal(config?.themeId, "jessica-samuel-wedding");
    assert.equal(config?.backendStrategy, "proxy");
    assert.equal(config?.notificationMode, "disabled");
  });
});
