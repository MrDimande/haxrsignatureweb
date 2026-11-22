import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";

const root = resolve(process.cwd(), "database/migrations");
const migration = readFileSync(resolve(root, "20261122120000_baby_aylla_gift_registry_phase_c3.sql"), "utf8");
const fixtures = readFileSync(resolve(root, "20261122120000_baby_aylla_gift_registry_fixtures_synthetic.sql"), "utf8");

describe("Baby Aylla Gift Registry migration hardening", () => {
  it("does not grant the internal reservation RPC to the dedicated operational role", () => {
    assert.doesNotMatch(migration, /GRANT EXECUTE ON FUNCTION public\.reserve_baby_aylla_gift\([^\n]+\) TO haxr_aylla_gift_runtime/);
    assert.match(migration, /REVOKE ALL ON FUNCTION public\.reserve_baby_aylla_gift\([^\n]+\) FROM haxr_aylla_gift_runtime/);
  });

  it("does not revoke or modify global permissions on canonical tables public.guests or public.events", () => {
    assert.doesNotMatch(migration, /REVOKE ALL ON public\.guests/);
    assert.doesNotMatch(migration, /REVOKE ALL ON public\.events/);
    assert.doesNotMatch(migration, /FROM haxrweb_runtime/);
  });

  it("requires the dedicated haxr_aylla_gift_runtime role with least privilege attributes", () => {
    assert.match(migration, /rolname = 'haxr_aylla_gift_runtime'/);
    assert.match(migration, /Prerequisite role haxr_aylla_gift_runtime must exist/);
  });

  it("does not use unrestricted runtime RLS policies and binds strictly to haxr_aylla_gift_runtime", () => {
    assert.doesNotMatch(migration, /TO haxr_aylla_gift_runtime\s+USING \(true\)/);
    assert.doesNotMatch(migration, /TO haxrweb_runtime/);
    assert.doesNotMatch(migration, /TO edition_runtime\s+USING \(true\)/);
    assert.match(migration, /TO haxr_aylla_gift_runtime/);
  });

  it("guards synthetic fixture identities and QR token collisions", () => {
    assert.match(fixtures, /Fixture incompatível/);
    assert.match(fixtures, /qr_token/);
    assert.match(fixtures, /2027-01-23/);
  });
});
