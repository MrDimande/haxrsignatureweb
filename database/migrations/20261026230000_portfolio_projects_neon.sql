-- HAXR Signature — Portfolio Projects (The Signature Collection)
--
-- Canonical transport: database/migrations (Neon PostgreSQL).
-- Additive migration for editorial portfolio persistence.

BEGIN;

CREATE TABLE IF NOT EXISTS public.portfolio_projects (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL,
  category_label TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  year TEXT NOT NULL DEFAULT '',
  guest_count TEXT,
  is_real BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('published', 'draft', 'archived')),
  is_featured BOOLEAN NOT NULL DEFAULT false,
  cover_image TEXT NOT NULL,
  cover_aspect TEXT NOT NULL DEFAULT 'landscape' CHECK (cover_aspect IN ('portrait', 'landscape', 'square')),
  services JSONB NOT NULL DEFAULT '[]'::jsonb,
  summary TEXT NOT NULL DEFAULT '',
  narrative JSONB NOT NULL DEFAULT '{}'::jsonb,
  gallery JSONB NOT NULL DEFAULT '[]'::jsonb,
  details JSONB NOT NULL DEFAULT '[]'::jsonb,
  credits JSONB NOT NULL DEFAULT '[]'::jsonb,
  demo_url TEXT,
  demo_label TEXT,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  seo JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS portfolio_projects_slug_key
  ON public.portfolio_projects (slug);

CREATE INDEX IF NOT EXISTS portfolio_projects_category_status_idx
  ON public.portfolio_projects (category, status, published_at DESC);

CREATE INDEX IF NOT EXISTS portfolio_projects_featured_idx
  ON public.portfolio_projects (is_featured)
  WHERE is_featured = true;

COMMIT;
