import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase",
    "migrations",
    "20260803135314_supplier_marketplace.sql",
  ),
  "utf8",
);

const clientAuthMigration = readFileSync(
  join(process.cwd(), "supabase", "migrations", "036_client_app_auth.sql"),
  "utf8",
);

const favoritePolicyGrantMigration = readFileSync(
  join(
    process.cwd(),
    "supabase",
    "migrations",
    "20260803152608_supplier_marketplace_favorite_policy_grant.sql",
  ),
  "utf8",
);

describe("supplier marketplace migration security contract", () => {
  it("never seeds or automatically publishes a supplier profile", () => {
    assert.doesNotMatch(migration, /insert\s+into\s+public\.supplier_profiles/i);
    assert.match(
      migration,
      /publication_status\s*=\s*'published'\s+and\s+published_at\s+is\s+not\s+null/i,
    );
  });

  it("uses RLS and exposes only published profiles to anonymous visitors", () => {
    assert.match(
      migration,
      /alter\s+table\s+public\.supplier_profiles\s+enable\s+row\s+level\s+security/i,
    );
    assert.match(
      migration,
      /for\s+select\s+to\s+anon[\s\S]*publication_status\s*=\s*'published'/i,
    );
  });

  it("does not grant private ownership columns to the public directory", () => {
    const publicGrant = migration.match(
      /grant\s+select\s*\(([\s\S]*?)\)\s+on\s+public\.supplier_profiles\s+to\s+anon,\s*authenticated/i,
    );
    assert.ok(publicGrant);
    assert.doesNotMatch(publicGrant[1], /owner_user_id|application_id/i);
  });

  it("removes authenticated access to the privileged app_role column", () => {
    assert.match(migration, /revoke\s+update\s+on\s+public\.profiles\s+from\s+authenticated/i);
    const safeUpdateGrant = migration.match(
      /grant\s+update\s*\(([\s\S]*?)\)\s+on\s+public\.profiles\s+to\s+authenticated/i,
    );
    assert.ok(safeUpdateGrant);
    assert.doesNotMatch(safeUpdateGrant[1], /app_role|onboarding_synced_at/i);
  });

  it("uses the existing event-member helper through its default role filter", () => {
    assert.match(
      migration,
      /public\.is_client_event_member\(client_event_id\)/i,
    );
    assert.match(
      clientAuthMigration,
      /create\s+or\s+replace\s+function\s+public\.is_client_event_member\s*\([\s\S]*?p_roles\s+client_event_member_role\[\]\s+default\s+null/i,
    );
  });

  it("grants the publication filter column required by directory and favorite policies", () => {
    assert.match(
      favoritePolicyGrantMigration,
      /grant\s+select\s*\(\s*publication_status\s*\)\s+on\s+public\.supplier_profiles\s+to\s+anon,\s*authenticated/i,
    );
    assert.doesNotMatch(
      favoritePolicyGrantMigration,
      /owner_user_id|application_id|insert|update|delete/i,
    );
  });
});
