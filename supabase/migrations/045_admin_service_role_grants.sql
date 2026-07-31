-- HAXR Signature — service_role grants for admin / operational tables
-- Migration 045 — aplicar em preview/staging antes de usar o painel admin local.
--
-- Contexto: após restore parcial ou ambientes sem grants por defeito, o admin client
-- (service_role) pode falhar com "permission denied for table businesses" mesmo
-- com SUPABASE_SERVICE_ROLE_KEY correcta.

GRANT SELECT, INSERT, UPDATE, DELETE ON public.businesses TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_bank_accounts TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_mobile_payments TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_signatures TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_catalog TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_sequences TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_line_items TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.finance_expenses TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.finance_monthly_targets TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_inquiries TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.seats TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.guests TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.checkins TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_contacts TO service_role;

GRANT SELECT ON public.document_analytics TO service_role;
