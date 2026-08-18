-- Rollback seats SELECT for service_role (clone only)
BEGIN;
REVOKE SELECT ON TABLE public.seats FROM service_role;
COMMIT;
