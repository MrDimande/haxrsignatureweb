-- PR.4 — rollback controlado 043 → 036 (clone descartável).
-- NÃO executar em produção. NÃO executar db reset.
-- Preserva public.events/guests/payments/documents operacionais legados.

BEGIN;

DROP FUNCTION IF EXISTS public.get_client_event_documents(uuid);
DROP FUNCTION IF EXISTS public.get_client_event_checklist(uuid);
DROP FUNCTION IF EXISTS public.get_client_event_vendors(uuid);
DROP FUNCTION IF EXISTS public.get_client_event_payments(uuid);
DROP FUNCTION IF EXISTS public.get_client_event_guests(uuid);
DROP FUNCTION IF EXISTS public.provision_client_operational_event(uuid);

REVOKE ALL ON public.event_onboarding_snapshots FROM service_role;
REVOKE ALL ON public.event_members FROM service_role;
REVOKE ALL ON public.profiles FROM service_role;
REVOKE ALL ON public.client_events FROM service_role;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

DROP POLICY IF EXISTS onboarding_snapshots_select_owner ON public.event_onboarding_snapshots;
DROP POLICY IF EXISTS event_members_update_by_owner ON public.event_members;
DROP POLICY IF EXISTS event_members_insert_by_owner ON public.event_members;
DROP POLICY IF EXISTS event_members_select_same_event ON public.event_members;
DROP POLICY IF EXISTS client_events_update_owner ON public.client_events;
DROP POLICY IF EXISTS client_events_insert_owner ON public.client_events;
DROP POLICY IF EXISTS client_events_select_member ON public.client_events;
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;
DROP POLICY IF EXISTS profiles_select_own ON public.profiles;

-- Classificação: destrutivo para dados da app cliente (036+).
-- Só executar se client_events/profiles forem exclusivamente de ensaio.
DROP TABLE IF EXISTS public.event_onboarding_snapshots CASCADE;
DROP TABLE IF EXISTS public.event_members CASCADE;
DROP TABLE IF EXISTS public.client_events CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

DROP FUNCTION IF EXISTS public.is_client_event_member(uuid, client_event_member_role[]);
DROP FUNCTION IF EXISTS public.is_client_event_owner(uuid);

DROP TYPE IF EXISTS public.app_user_role;
DROP TYPE IF EXISTS public.client_event_status;
DROP TYPE IF EXISTS public.client_event_member_role;

COMMIT;
