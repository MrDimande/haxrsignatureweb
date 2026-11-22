import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";

const root = resolve(process.cwd(), "database/migrations");
const migration = readFileSync(resolve(root, "20261122120000_baby_aylla_gift_registry_phase_c3.sql"), "utf8");
const fixtures = readFileSync(resolve(root, "20261122120000_baby_aylla_gift_registry_fixtures_synthetic.sql"), "utf8");

describe("Baby Aylla Gift Registry migration hardening", () => {
  it("does not grant the internal reservation RPC to an operational role", () => {
    assert.doesNotMatch(migration, /GRANT EXECUTE ON FUNCTION public\.reserve_baby_aylla_gift\([^\n]+\) TO haxrweb_runtime/);
    assert.match(migration, /REVOKE ALL ON FUNCTION public\.reserve_baby_aylla_gift\([^\n]+\) FROM haxrweb_runtime, edition_runtime/);
  });

  it("does not use unrestricted runtime RLS policies", () => {
    assert.doesNotMatch(migration, /TO edition_runtime\s+USING \(true\)/);
    assert.doesNotMatch(migration, /TO haxrweb_runtime\s+USING \(true\)/);
  });

  it("guards synthetic fixture identities and QR token collisions", () => {
    assert.match(fixtures, /Fixture incompatível/);
    assert.match(fixtures, /qr_token/);
    assert.match(fixtures, /2027-01-23/);
  });
});
