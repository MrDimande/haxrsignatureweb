-- The public directory and favorite RLS policy filter on publication_status.
-- RLS still limits anon to published rows and authenticated users to published
-- or owned rows; exposing this enum does not reveal ownership/private fields.
grant select (publication_status)
  on public.supplier_profiles to anon, authenticated;
