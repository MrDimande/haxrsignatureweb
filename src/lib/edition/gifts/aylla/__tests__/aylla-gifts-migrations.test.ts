import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";

const root = resolve(process.cwd(), "database/migrations");
const migration = readFileSync(resolve(root, "20261122120000_baby_aylla_gift_registry_phase_c3.sql"), "utf8");
const fixtures = readFileSync(resolve(root, "20261122120000_baby_aylla_gift_registry_fixtures_synthetic.sql"), "utf8");
const storeSource = readFileSync(resolve(process.cwd(), "src/lib/edition/gifts/aylla/store.ts"), "utf8");

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

  it("requires the dedicated haxr_aylla_gift_issuer, haxr_aylla_gift_runtime, and haxr_aylla_gift_admin roles with least privilege attributes", () => {
    assert.match(migration, /rolname = 'haxr_aylla_gift_issuer'/);
    assert.match(migration, /Prerequisite role haxr_aylla_gift_issuer must exist/);
    assert.match(migration, /rolname = 'haxr_aylla_gift_runtime'/);
    assert.match(migration, /Prerequisite role haxr_aylla_gift_runtime must exist/);
    assert.match(migration, /rolname = 'haxr_aylla_gift_admin'/);
    assert.match(migration, /Prerequisite role haxr_aylla_gift_admin must exist/);
  });

  it("enforces FORCE ROW LEVEL SECURITY on all 5 gift registry tables", () => {
    assert.match(migration, /ALTER TABLE public\.edition_gift_inventory FORCE ROW LEVEL SECURITY;/);
    assert.match(migration, /ALTER TABLE public\.edition_guest_verification_challenges FORCE ROW LEVEL SECURITY;/);
    assert.match(migration, /ALTER TABLE public\.edition_guest_sessions FORCE ROW LEVEL SECURITY;/);
    assert.match(migration, /ALTER TABLE public\.edition_gift_reservations_v2 FORCE ROW LEVEL SECURITY;/);
    assert.match(migration, /ALTER TABLE public\.edition_gift_reservation_audit_v2 FORCE ROW LEVEL SECURITY;/);
  });

  it("does not use unrestricted runtime RLS policies and binds strictly to haxr_aylla_gift_runtime", () => {
    assert.doesNotMatch(migration, /TO haxr_aylla_gift_runtime\s+USING \(true\)/);
    assert.doesNotMatch(migration, /TO haxrweb_runtime/);
    assert.doesNotMatch(migration, /TO edition_runtime\s+USING \(true\)/);
    assert.match(migration, /TO haxr_aylla_gift_runtime/);
  });

  it("enforces RPC-only architecture: SELECT on non-auth tables, ZERO SELECT on challenges/sessions, zero write grants", () => {
    // SELECT only on inventory, reservations, and audit
    assert.match(migration, /GRANT SELECT ON public\.edition_gift_inventory TO haxr_aylla_gift_runtime;/);
    assert.match(migration, /GRANT SELECT ON public\.edition_gift_reservations_v2 TO haxr_aylla_gift_runtime;/);
    assert.match(migration, /GRANT SELECT ON public\.edition_gift_reservation_audit_v2 TO haxr_aylla_gift_runtime;/);

    // Absolute ZERO SELECT grants on challenges and sessions to haxr_aylla_gift_runtime
    assert.doesNotMatch(migration, /GRANT SELECT ON public\.edition_guest_verification_challenges TO haxr_aylla_gift_runtime;/);
    assert.doesNotMatch(migration, /GRANT SELECT ON public\.edition_guest_sessions TO haxr_aylla_gift_runtime;/);

    // Absolute zero INSERT, UPDATE, DELETE grants to haxr_aylla_gift_runtime
    assert.doesNotMatch(
      migration,
      /GRANT\s+[^;]*\b(INSERT|UPDATE|DELETE)\b[^;]*\s+TO\s+haxr_aylla_gift_runtime/i
    );
  });

  it("grants EXECUTE exclusively on verified guest functions to haxr_aylla_gift_runtime and isolates issuer and admin RPCs", () => {
    // Challenge creation must be granted ONLY to haxr_aylla_gift_issuer and REVOKED from haxr_aylla_gift_runtime
    assert.match(migration, /GRANT EXECUTE ON FUNCTION public\.create_baby_aylla_verification_challenge\([^\n]+\) TO haxr_aylla_gift_issuer;/);
    assert.doesNotMatch(migration, /GRANT EXECUTE ON FUNCTION public\.create_baby_aylla_verification_challenge\([^\n]+\) TO haxr_aylla_gift_runtime;/);
    assert.match(migration, /REVOKE ALL ON FUNCTION public\.create_baby_aylla_verification_challenge\([^\n]+\) FROM haxr_aylla_gift_runtime, haxr_aylla_gift_admin;/);

    // Guest functions granted to haxr_aylla_gift_runtime
    assert.match(migration, /GRANT EXECUTE ON FUNCTION public\.resolve_baby_aylla_guest_by_contact\(text\) TO haxr_aylla_gift_runtime;/);
    assert.match(migration, /GRANT EXECUTE ON FUNCTION public\.resolve_baby_aylla_guest_by_id\(uuid\) TO haxr_aylla_gift_runtime;/);
    assert.match(migration, /GRANT EXECUTE ON FUNCTION public\.verify_and_consume_baby_aylla_challenge\([^\n]+\) TO haxr_aylla_gift_runtime;/);
    assert.match(migration, /GRANT EXECUTE ON FUNCTION public\.create_baby_aylla_guest_session\([^\n]+\) TO haxr_aylla_gift_runtime;/);
    assert.match(migration, /GRANT EXECUTE ON FUNCTION public\.resolve_baby_aylla_guest_session\([^\n]+\) TO haxr_aylla_gift_runtime;/);
    assert.match(migration, /GRANT EXECUTE ON FUNCTION public\.revoke_baby_aylla_guest_session\([^\n]+\) TO haxr_aylla_gift_runtime;/);
    assert.match(migration, /GRANT EXECUTE ON FUNCTION public\.reserve_baby_aylla_gift_verified\([^\n]+\) TO haxr_aylla_gift_runtime;/);
    assert.match(migration, /GRANT EXECUTE ON FUNCTION public\.cancel_baby_aylla_gift_verified\([^\n]+\) TO haxr_aylla_gift_runtime;/);

    // Admin transition RPC must be REVOKED from guest runtime and GRANTED to dedicated admin role
    assert.match(migration, /REVOKE ALL ON FUNCTION public\.transition_baby_aylla_gift_reservation_admin\([^\n]+\) FROM haxr_aylla_gift_issuer, haxr_aylla_gift_runtime;/);
    assert.match(migration, /GRANT EXECUTE ON FUNCTION public\.transition_baby_aylla_gift_reservation_admin\([^\n]+\) TO haxr_aylla_gift_admin;/);
  });

  it("enforces foreign key to admin_users and single-use challenge column session_issued_at", () => {
    assert.match(migration, /actor_admin_id uuid REFERENCES public\.admin_users\(id\)/);
    assert.match(migration, /session_issued_at timestamptz/);
  });

  it("revokes all execution permissions from PUBLIC on all registry functions", () => {
    assert.match(migration, /REVOKE ALL ON FUNCTION public\.reserve_baby_aylla_gift\([^\n]+\) FROM PUBLIC;/);
    assert.match(migration, /REVOKE ALL ON FUNCTION public\.reserve_baby_aylla_gift_verified\([^\n]+\) FROM PUBLIC;/);
    assert.match(migration, /REVOKE ALL ON FUNCTION public\.cancel_baby_aylla_gift_verified\([^\n]+\) FROM PUBLIC;/);
    assert.match(migration, /REVOKE ALL ON FUNCTION public\.resolve_baby_aylla_guest_by_contact\(text\) FROM PUBLIC;/);
    assert.match(migration, /REVOKE ALL ON FUNCTION public\.resolve_baby_aylla_guest_by_id\(uuid\) FROM PUBLIC;/);
    assert.match(migration, /REVOKE ALL ON FUNCTION public\.create_baby_aylla_verification_challenge\([^\n]+\) FROM PUBLIC;/);
    assert.match(migration, /REVOKE ALL ON FUNCTION public\.verify_and_consume_baby_aylla_challenge\([^\n]+\) FROM PUBLIC;/);
    assert.match(migration, /REVOKE ALL ON FUNCTION public\.create_baby_aylla_guest_session\([^\n]+\) FROM PUBLIC;/);
    assert.match(migration, /REVOKE ALL ON FUNCTION public\.resolve_baby_aylla_guest_session\([^\n]+\) FROM PUBLIC;/);
    assert.match(migration, /REVOKE ALL ON FUNCTION public\.revoke_baby_aylla_guest_session\([^\n]+\) FROM PUBLIC;/);
    assert.match(migration, /REVOKE ALL ON FUNCTION public\.transition_baby_aylla_gift_reservation_admin\([^\n]+\) FROM PUBLIC;/);
  });

  it("enforces PostgreSQL clock authority and eliminates caller timestamps from function signatures", () => {
    // Challenge creation has no p_expires_at parameter
    assert.match(migration, /FUNCTION public\.create_baby_aylla_verification_challenge\(\s*p_id uuid,\s*p_event_id uuid,\s*p_guest_id uuid,\s*p_verifier_hash text,\s*p_max_attempts integer DEFAULT 5\s*\)/);
    // Challenge verification has no p_consumed_at parameter
    assert.match(migration, /FUNCTION public\.verify_and_consume_baby_aylla_challenge\(\s*p_challenge_id uuid,\s*p_verifier_hash text\s*\)/);
    // Session creation has no p_expires_at or p_created_at parameters
    assert.match(migration, /FUNCTION public\.create_baby_aylla_guest_session\(\s*p_id uuid,\s*p_event_id uuid,\s*p_guest_id uuid,\s*p_secret_proof text,\s*p_challenge_id uuid\s*\)/);
    // No dummy check inside SECURITY DEFINER admin function
    assert.doesNotMatch(migration, /IF current_user = 'haxr_aylla_gift_runtime'/);
  });

  it("enforces zero table permissions for haxr_aylla_gift_issuer", () => {
    assert.doesNotMatch(
      migration,
      /GRANT\s+[^;]*\s+ON\s+public\.edition_[^;]+\s+TO\s+haxr_aylla_gift_issuer/i
    );
  });

  it("guards synthetic fixture identities and QR token collisions", () => {
    assert.match(fixtures, /Fixture incompatível/);
    assert.match(fixtures, /qr_token/);
    assert.match(fixtures, /2027-01-23/);
  });

  it("aligns resolveSessionVerified projection with resolve_baby_aylla_guest_session columns and avoids dead attempt-increment RPC", () => {
    assert.match(migration, /guest_archived boolean,\s*guest_deleted boolean,\s*guest_incorrect boolean/);
    assert.match(storeSource, /SELECT guest_id, event_id, guest_name, guest_contact, guest_status,\s*guest_source, guest_archived, guest_deleted, guest_incorrect\s*FROM public\.resolve_baby_aylla_guest_session\(\$1::uuid, \$2\);/);
    assert.doesNotMatch(storeSource, /increment_baby_aylla_challenge_attempts/);
  });

  it("captures previous_status before UPDATE in transition_baby_aylla_gift_reservation_admin", () => {
    assert.match(migration, /v_previous_status := v_reservation\.status;/);
    assert.match(
      migration,
      /\(p_reservation_id, p_event_id, NULL, p_admin_id, p_next_status, v_previous_status, p_next_status, p_reason, v_now\)/
    );
  });

  it("qualifies edition_guest_sessions columns in resolve_baby_aylla_guest_session to avoid RETURNS TABLE ambiguity", () => {
    const fnMatch = migration.match(
      /CREATE OR REPLACE FUNCTION public\.resolve_baby_aylla_guest_session\([\s\S]*?\$\$;/
    );
    assert.ok(fnMatch, "resolve_baby_aylla_guest_session definition must exist");
    const fnBody = fnMatch[0];
    assert.match(
      fnBody,
      /SELECT s\.\* INTO v_session\s+FROM public\.edition_guest_sessions AS s\s+WHERE s\.id = p_session_id\s+AND s\.secret_hash = encode\(sha256\(p_secret_proof::bytea\), 'hex'\)\s+AND s\.expires_at > v_now\s+AND s\.revoked_at IS NULL;/
    );
  });
});
