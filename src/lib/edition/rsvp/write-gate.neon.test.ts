import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  evaluateEditionRsvpWriteGate,
  resolveEditionRsvpWriteMode,
} from "./write-gate";

const MIGRATION_BRANCH = "migration/supabase-to-neon";
const CLONE = "rkkxfrwtmsqzpnbkshnd";

function cloneUrl(ref: string) {
  return `https://${ref}.supabase.co`;
}

describe("Edition RSVP Neon Preview write gate", () => {
  it("recognizes explicit preview_neon mode", () => {
    assert.equal(resolveEditionRsvpWriteMode("preview_neon"), "preview_neon");
  });

  it("promotes existing preview_clone intent on the exact migration Preview branch", () => {
    const decision = evaluateEditionRsvpWriteGate({
      writeMode: "preview_clone",
      vercelEnv: "preview",
      vercelGitCommitRef: MIGRATION_BRANCH,
      neonDatabaseEnabled: true,
      // These legacy clone values are deliberately wrong: the Neon gate must
      // not depend on them once the migration branch is selected.
      supabaseUrl: "https://wrong-ref.supabase.co",
      allowedRef: CLONE,
    });

    assert.deepEqual(decision, { allowed: true, mode: "preview_neon" });
  });

  it("fails closed when Neon database connectivity is unavailable", () => {
    const decision = evaluateEditionRsvpWriteGate({
      writeMode: "preview_clone",
      vercelEnv: "preview",
      vercelGitCommitRef: MIGRATION_BRANCH,
      neonDatabaseEnabled: false,
      supabaseUrl: cloneUrl(CLONE),
      allowedRef: CLONE,
    });

    assert.deepEqual(decision, {
      allowed: false,
      mode: "preview_neon",
      reason: "neon_database_unavailable",
    });
  });

  it("rejects explicit preview_neon mode on any other Preview branch", () => {
    const decision = evaluateEditionRsvpWriteGate({
      writeMode: "preview_neon",
      vercelEnv: "preview",
      vercelGitCommitRef: "feature/other-preview",
      neonDatabaseEnabled: true,
    });

    assert.deepEqual(decision, {
      allowed: false,
      mode: "preview_neon",
      reason: "migration_branch_required",
    });
  });

  it("rejects preview_neon in Vercel Production even with Neon available", () => {
    const decision = evaluateEditionRsvpWriteGate({
      writeMode: "preview_neon",
      vercelEnv: "production",
      vercelGitCommitRef: "main",
      neonDatabaseEnabled: true,
    });

    assert.deepEqual(decision, {
      allowed: false,
      mode: "preview_neon",
      reason: "production_runtime",
    });
  });

  it("keeps Supabase clone rehearsal behavior on other Preview branches", () => {
    const decision = evaluateEditionRsvpWriteGate({
      writeMode: "preview_clone",
      vercelEnv: "preview",
      vercelGitCommitRef: "rehearsal/supabase-clone",
      neonDatabaseEnabled: false,
      supabaseUrl: cloneUrl(CLONE),
      allowedRef: CLONE,
    });

    assert.deepEqual(decision, { allowed: true, mode: "preview_clone" });
  });
});
