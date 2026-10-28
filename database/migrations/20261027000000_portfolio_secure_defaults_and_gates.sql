-- HAXR Signature — Portfolio Secure Defaults & Publication Gates
--
-- Canonical transport: database/migrations (Neon PostgreSQL).
-- Migration version: 20261027000000_portfolio_secure_defaults_and_gates.sql

BEGIN;

-- 1. Alter column defaults to secure default values
ALTER TABLE public.portfolio_projects
  ALTER COLUMN status SET DEFAULT 'draft',
  ALTER COLUMN editorial_review_status SET DEFAULT 'pending_review',
  ALTER COLUMN publication_authorized SET DEFAULT false,
  ALTER COLUMN client_consent_status SET DEFAULT 'CONFIRMATION_PENDING';

-- 2. Add Database-Level Publication Gate Constraint:
-- Prohibits setting status = 'published' unless ALL authorization requirements are met:
-- - editorial_review_status = 'approved'
-- - publication_authorized = true
-- - client_consent_status = 'AUTHORIZED'
DO $$
BEGIN
  ALTER TABLE public.portfolio_projects
    DROP CONSTRAINT IF EXISTS portfolio_publication_gate_check;

  ALTER TABLE public.portfolio_projects
    ADD CONSTRAINT portfolio_publication_gate_check
    CHECK (
      (
        (status != 'published') OR (
          editorial_review_status = 'approved' AND
          publication_authorized = true AND
          client_consent_status = 'AUTHORIZED'
        )
      ) IS TRUE
    );
END $$;

COMMIT;
