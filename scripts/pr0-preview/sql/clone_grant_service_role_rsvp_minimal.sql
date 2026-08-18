-- CLONE ONLY: rkkxfrwtmsqzpnbkshnd
-- Purpose: fix service_role "permission denied for schema public" on Edition RSVP persist
-- Scope: minimal table privileges proven by Core PR #7 callers (persist.ts)
-- FORBIDDEN: production oxsrdmydlqyvnueedgtl
--
-- Code evidence (do not expand without new proof):
--   - ALWAYS before RPC: SELECT public.guests (loadEventGuestCandidates)
--   - Match update path: UPDATE public.guests
--   - Direct insert fallback: INSERT public.guests
--   - RPC path: EXECUTE submit_edition_rsvp 11-arg only (already granted; SECURITY DEFINER)
--   - public.events NOT queried by persist (event_id from env binding)
--   - DELETE never used by RSVP persist
--
-- Explicitly NOT granted here (fail-soft / out of critical SELECT path):
--   - guest_audit_log (insert errors currently ignored)
--   - event_contact_profiles (safeSync swallows errors)
--   - api_rate_limits (falls back to in-memory; logged warning only)

BEGIN;

GRANT USAGE ON SCHEMA public TO service_role;

GRANT SELECT, INSERT, UPDATE
  ON TABLE public.guests
  TO service_role;

COMMIT;
