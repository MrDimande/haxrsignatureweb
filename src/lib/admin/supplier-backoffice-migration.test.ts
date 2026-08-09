import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase",
    "migrations",
    "20260808042356_supplier_backoffice_moderation.sql",
  ),
  "utf8",
);

const correctiveGrantMigration = readFileSync(
  join(
    process.cwd(),
    "supabase",
    "migrations",
    "20260808222727_restrict_supplier_moderation_audit_service_role_grants.sql",
  ),
  "utf8",
);

describe("supplier backoffice migration security contract", () => {
  it("uses invoker functions and removes every public execution path", () => {
    assert.doesNotMatch(migration, /security\s+definer/i);
    assert.equal((migration.match(/security\s+invoker/gi) ?? []).length, 3);
    assert.equal((migration.match(/set\s+search_path\s*=\s*''/gi) ?? []).length, 3);
    assert.equal(
      (migration.match(/from\s+public,\s*anon,\s*authenticated/gi) ?? []).length,
      4,
    );
  });

  it("protects the internal audit trail with RLS and service-role-only grants", () => {
    assert.match(
      migration,
      /alter\s+table\s+public\.supplier_moderation_events\s+enable\s+row\s+level\s+security/i,
    );
    assert.match(
      migration,
      /revoke\s+all\s+on\s+public\.supplier_moderation_events\s+from\s+public,\s*anon,\s*authenticated/i,
    );
    assert.match(
      migration,
      /grant\s+select,\s*insert\s+on\s+public\.supplier_moderation_events\s+to\s+service_role/i,
    );
  });

  it("normalises the audit table grants to service-role SELECT and INSERT only", () => {
    assert.match(
      correctiveGrantMigration,
      /revoke\s+all\s+privileges\s+on\s+table\s+public\.supplier_moderation_events\s+from\s+public,\s*anon,\s*authenticated,\s*service_role/i,
    );
    assert.match(
      correctiveGrantMigration,
      /grant\s+select,\s*insert\s+on\s+table\s+public\.supplier_moderation_events\s+to\s+service_role/i,
    );
    assert.doesNotMatch(
      correctiveGrantMigration,
      /grant\s+(?:all|delete|references|trigger|truncate|update)\b/i,
    );
    assert.doesNotMatch(
      correctiveGrantMigration,
      /\b(?:alter|create|drop|insert\s+into|update|delete\s+from|truncate)\b/i,
    );
  });

  it("does not expose reviewer identity or internal notes to applicants", () => {
    const applicantGrant = migration.match(
      /grant\s+select\s*\(([\s\S]*?)\)\s+on\s+public\.supplier_applications\s+to\s+authenticated/i,
    );
    assert.ok(applicantGrant);
    assert.doesNotMatch(
      applicantGrant[1],
      /reviewed_by|reviewed_by_email|review_notes|is_test_record/i,
    );
  });

  it("publishes only through an explicit status with complete content", () => {
    assert.match(
      migration,
      /p_publication_status\s*=\s*'published'[\s\S]*published_supplier_profile_requires_complete_content/i,
    );
    assert.match(
      migration,
      /when\s+p_publication_status\s*=\s*'published'\s+then\s+coalesce\(v_profile\.published_at,\s*now\(\)\)/i,
    );
  });

  it("permits hard deletion only when both records are marked UAT", () => {
    assert.match(migration, /if\s+not\s+v_application\.is_test_record/i);
    assert.match(migration, /if\s+found\s+and\s+not\s+v_profile\.is_test_record/i);
    assert.match(migration, /supplier_name_confirmation_mismatch/i);
    assert.doesNotMatch(
      migration,
      /grant\s+delete\s+on\s+public\.supplier_(applications|profiles)/i,
    );
  });
});
