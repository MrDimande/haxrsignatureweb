-- HAXR Signature — service_role grants for client app tables (Fase C.1 fix)
-- Migration 037 — aplicar em staging antes de testar POST /api/events snapshots.
--
-- Contexto: 036 criou RLS/políticas mas não concedeu INSERT/SELECT/UPDATE/DELETE
-- explícitos a service_role nas novas tabelas. Sem estes grants, o admin client
-- falha ao inserir event_onboarding_snapshots e ao compensar deletes.

GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_events TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_members TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO service_role;
GRANT SELECT, INSERT, DELETE ON public.event_onboarding_snapshots TO service_role;
