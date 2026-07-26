-- HAXR Signature — service_role grants (complemento operacional)
-- Migration 046 — guest_groups, audit, portal, concierge, sheets, edition, etc.
--
-- Contexto: 045 cobriu o núcleo admin; o painel de eventos usa mais tabelas
-- relacionadas (joins PostgREST em guests → guest_groups, etc.).

GRANT SELECT, INSERT, UPDATE, DELETE ON public.guest_groups TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.guest_audit_log TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.guest_party_members TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.guest_duplicate_resolutions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_contact_profiles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_sheet_import_rows TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_sheet_sync_ledger TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.edition_gift_reservations TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.edition_rsvp_reminder_log TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.portal_timeline_items TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.portal_approvals TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.portal_messages TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.portal_payment_proofs TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.portal_contracts TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.concierge_uploads TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.concierge_review_items TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_vendors TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_checklist_items TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_moodboard_items TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.concierge_ai_audit_logs TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.concierge_portal_items TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.concierge_portal_classifications TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.concierge_portal_suggestions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.concierge_portal_activities TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_events TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_members TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_onboarding_snapshots TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_rate_limits TO service_role;
