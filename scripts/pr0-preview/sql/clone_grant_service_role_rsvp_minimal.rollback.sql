-- CLONE ONLY rollback — restore pre-patch privilege posture for this change.
-- Apply ONLY on rkkxfrwtmsqzpnbkshnd after confirmed precheck showed:
--   schema USAGE = false
--   guests SELECT/INSERT/UPDATE = false for service_role
-- Does NOT revoke RPC EXECUTE (unchanged by forward patch).

BEGIN;

REVOKE SELECT, INSERT, UPDATE
  ON TABLE public.guests
  FROM service_role;

REVOKE USAGE ON SCHEMA public FROM service_role;

COMMIT;
