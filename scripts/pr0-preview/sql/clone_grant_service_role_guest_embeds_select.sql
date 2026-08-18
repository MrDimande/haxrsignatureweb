-- CLONE ONLY: rkkxfrwtmsqzpnbkshnd
-- Addendum after APPLY_OK: getGuestById uses
--   guestSelect = "*, seats(*), checkins(checkin_time), guest_groups(name)"
-- Core 500 after RSVP persist: permission denied for table seats
-- SELECT-only on embed tables required to complete the same code path.
-- No INSERT/UPDATE/DELETE. No ALL.

BEGIN;

GRANT SELECT ON TABLE public.seats TO service_role;
GRANT SELECT ON TABLE public.checkins TO service_role;
GRANT SELECT ON TABLE public.guest_groups TO service_role;

COMMIT;
