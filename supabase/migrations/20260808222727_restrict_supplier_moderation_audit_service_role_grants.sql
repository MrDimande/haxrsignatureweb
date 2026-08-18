-- Normalise grants inherited from project-level default privileges.
-- RLS remains enabled and no client role receives access to this audit table.
revoke all privileges on table public.supplier_moderation_events
  from public, anon, authenticated, service_role;

grant select, insert on table public.supplier_moderation_events
  to service_role;
