-- Rollback embed SELECTs (clone only)
BEGIN;
REVOKE SELECT ON TABLE public.seats FROM service_role;
REVOKE SELECT ON TABLE public.checkins FROM service_role;
REVOKE SELECT ON TABLE public.guest_groups FROM service_role;
COMMIT;
