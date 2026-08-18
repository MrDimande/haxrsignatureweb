-- CLONE ONLY: rkkxfrwtmsqzpnbkshnd
-- Addendum: SELECT on public.seats required by getGuestById(guestSelect embeds seats)
-- after RSVP persist (seen in Core 500: permission denied for table seats).
-- No INSERT/UPDATE/DELETE on seats.

BEGIN;

GRANT SELECT ON TABLE public.seats TO service_role;

COMMIT;
