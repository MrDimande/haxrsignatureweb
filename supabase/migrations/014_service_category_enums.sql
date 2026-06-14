-- Novas categorias do catálogo comercial HAXR
-- IMPORTANTE: executar este ficheiro SOZINHO e confirmar sucesso
-- antes de correr 015_catalog_commercial_seed.sql
-- (PostgreSQL exige commit dos novos valores enum antes de os usar)

ALTER TYPE service_category ADD VALUE IF NOT EXISTS 'websites';
ALTER TYPE service_category ADD VALUE IF NOT EXISTS 'assessoria';
ALTER TYPE service_category ADD VALUE IF NOT EXISTS 'branding';
ALTER TYPE service_category ADD VALUE IF NOT EXISTS 'experiences';
