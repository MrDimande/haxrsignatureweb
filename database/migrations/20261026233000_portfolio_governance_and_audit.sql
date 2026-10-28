-- HAXR Signature — Portfolio Governance, Audit Logging and Editorial Controls
--
-- Canonical transport: database/migrations (Neon PostgreSQL).
-- Additive migration for editorial audit and authenticity governance.

BEGIN;

-- 1. Add governance and authenticity columns to portfolio_projects if not present
ALTER TABLE public.portfolio_projects
  ADD COLUMN IF NOT EXISTS project_type TEXT NOT NULL DEFAULT 'real'
    CHECK (project_type IN ('real', 'conceptual', 'demonstracao')),
  ADD COLUMN IF NOT EXISTS editorial_review_status TEXT NOT NULL DEFAULT 'pending_review'
    CHECK (editorial_review_status IN ('draft', 'pending_review', 'approved')),
  ADD COLUMN IF NOT EXISTS publication_authorized BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS client_consent_status TEXT NOT NULL DEFAULT 'CONFIRMATION_PENDING'
    CHECK (client_consent_status IN ('AUTHORIZED', 'CONFIRMATION_PENDING', 'INTERNAL_ONLY')),
  ADD COLUMN IF NOT EXISTS authorization_notes TEXT,
  ADD COLUMN IF NOT EXISTS material_source TEXT,
  ADD COLUMN IF NOT EXISTS display_order INT NOT NULL DEFAULT 0;

-- 2. Create Audit Log table for portfolio revisions
CREATE TABLE IF NOT EXISTS public.portfolio_project_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT NOT NULL REFERENCES public.portfolio_projects(id) ON DELETE CASCADE,
  actor_email TEXT NOT NULL,
  action TEXT NOT NULL CHECK (
    action IN ('create', 'update', 'publish', 'unpublish', 'archive', 'delete')
  ),
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT portfolio_audit_log_details_object CHECK (jsonb_typeof(details) = 'object')
);

CREATE INDEX IF NOT EXISTS portfolio_audit_log_project_created_idx
  ON public.portfolio_project_audit_log (project_id, created_at DESC);

-- 3. Compatibility View for audit log synonyms
CREATE OR REPLACE VIEW public.portfolio_audit_log AS
  SELECT * FROM public.portfolio_project_audit_log;

-- 4. Restrict browser access
REVOKE ALL ON TABLE public.portfolio_project_audit_log FROM PUBLIC;
REVOKE ALL ON TABLE public.portfolio_audit_log FROM PUBLIC;

COMMIT;
