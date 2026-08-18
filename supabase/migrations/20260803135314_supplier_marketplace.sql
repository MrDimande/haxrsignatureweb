-- HAXR Signature - supplier marketplace and couple saves
-- No supplier is published automatically. Applications remain private until reviewed.

do $$ begin
  create type public.supplier_application_status as enum (
    'pending',
    'in_review',
    'approved',
    'rejected',
    'withdrawn'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.supplier_publication_status as enum (
    'draft',
    'pending_review',
    'published',
    'suspended'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.supplier_applications (
  id uuid primary key default gen_random_uuid(),
  applicant_user_id uuid references auth.users(id) on delete set null,
  supplier_name text not null,
  responsible_name text not null,
  email text not null,
  phone text not null,
  category text not null,
  city text not null,
  portfolio_url text,
  message text,
  status public.supplier_application_status not null default 'pending',
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint supplier_applications_supplier_name_len
    check (char_length(btrim(supplier_name)) between 2 and 120),
  constraint supplier_applications_responsible_name_len
    check (char_length(btrim(responsible_name)) between 2 and 120),
  constraint supplier_applications_email_len
    check (char_length(btrim(email)) between 3 and 254),
  constraint supplier_applications_phone_len
    check (char_length(btrim(phone)) between 8 and 40),
  constraint supplier_applications_category_len
    check (char_length(btrim(category)) between 2 and 80),
  constraint supplier_applications_city_len
    check (char_length(btrim(city)) between 2 and 80),
  constraint supplier_applications_portfolio_url
    check (portfolio_url is null or portfolio_url ~* '^https?://'),
  constraint supplier_applications_review_consistency
    check (
      (status = 'pending' and reviewed_at is null and reviewed_by is null)
      or (status = 'in_review' and reviewed_at is null and reviewed_by is not null)
      or (status in ('approved', 'rejected') and reviewed_at is not null and reviewed_by is not null)
      or status = 'withdrawn'
    )
);

create unique index if not exists supplier_applications_open_unique
  on public.supplier_applications (lower(email), lower(supplier_name))
  where status in ('pending', 'in_review');

create index if not exists supplier_applications_status_created_idx
  on public.supplier_applications (status, created_at desc);

drop trigger if exists supplier_applications_updated_at on public.supplier_applications;
create trigger supplier_applications_updated_at
  before update on public.supplier_applications
  for each row execute function public.set_updated_at();

create table if not exists public.supplier_profiles (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users(id) on delete set null,
  application_id uuid unique references public.supplier_applications(id) on delete set null,
  slug text not null unique,
  business_name text not null,
  category text not null,
  city text not null,
  short_description text not null default '',
  about text not null default '',
  public_email text,
  public_phone text,
  website_url text,
  instagram_url text,
  service_level text,
  services text[] not null default '{}',
  publication_status public.supplier_publication_status not null default 'draft',
  is_verified boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint supplier_profiles_slug_format
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint supplier_profiles_business_name_len
    check (char_length(btrim(business_name)) between 2 and 120),
  constraint supplier_profiles_category_len
    check (char_length(btrim(category)) between 2 and 80),
  constraint supplier_profiles_city_len
    check (char_length(btrim(city)) between 2 and 80),
  constraint supplier_profiles_website_url
    check (website_url is null or website_url ~* '^https?://'),
  constraint supplier_profiles_instagram_url
    check (instagram_url is null or instagram_url ~* '^https?://'),
  constraint supplier_profiles_publication_consistency
    check (
      (publication_status = 'published' and published_at is not null)
      or publication_status <> 'published'
    )
);

create index if not exists supplier_profiles_public_directory_idx
  on public.supplier_profiles (category, city, published_at desc)
  where publication_status = 'published';

drop trigger if exists supplier_profiles_updated_at on public.supplier_profiles;
create trigger supplier_profiles_updated_at
  before update on public.supplier_profiles
  for each row execute function public.set_updated_at();

create table if not exists public.saved_supplier_profiles (
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  supplier_profile_id uuid not null references public.supplier_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (owner_user_id, supplier_profile_id)
);

create index if not exists saved_supplier_profiles_recent_idx
  on public.saved_supplier_profiles (owner_user_id, created_at desc);

create table if not exists public.client_supplier_recommendations (
  id uuid primary key default gen_random_uuid(),
  client_event_id uuid not null references public.client_events(id) on delete cascade,
  supplier_profile_id uuid not null references public.supplier_profiles(id) on delete cascade,
  reason text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (client_event_id, supplier_profile_id)
);

alter table public.supplier_applications enable row level security;
alter table public.supplier_profiles enable row level security;
alter table public.saved_supplier_profiles enable row level security;
alter table public.client_supplier_recommendations enable row level security;

drop policy if exists supplier_applications_select_own on public.supplier_applications;
create policy supplier_applications_select_own
  on public.supplier_applications for select to authenticated
  using (applicant_user_id = (select auth.uid()));

drop policy if exists supplier_profiles_select_public_or_own on public.supplier_profiles;
create policy supplier_profiles_select_public_or_own
  on public.supplier_profiles for select to authenticated
  using (
    publication_status = 'published'
    or owner_user_id = (select auth.uid())
  );

drop policy if exists supplier_profiles_select_public on public.supplier_profiles;
create policy supplier_profiles_select_public
  on public.supplier_profiles for select to anon
  using (publication_status = 'published');

drop policy if exists saved_supplier_profiles_select_own on public.saved_supplier_profiles;
create policy saved_supplier_profiles_select_own
  on public.saved_supplier_profiles for select to authenticated
  using (owner_user_id = (select auth.uid()));

drop policy if exists saved_supplier_profiles_insert_own on public.saved_supplier_profiles;
create policy saved_supplier_profiles_insert_own
  on public.saved_supplier_profiles for insert to authenticated
  with check (
    owner_user_id = (select auth.uid())
    and exists (
      select 1
      from public.supplier_profiles profile
      where profile.id = supplier_profile_id
        and profile.publication_status = 'published'
    )
  );

drop policy if exists saved_supplier_profiles_delete_own on public.saved_supplier_profiles;
create policy saved_supplier_profiles_delete_own
  on public.saved_supplier_profiles for delete to authenticated
  using (owner_user_id = (select auth.uid()));

drop policy if exists client_supplier_recommendations_select_member
  on public.client_supplier_recommendations;
create policy client_supplier_recommendations_select_member
  on public.client_supplier_recommendations for select to authenticated
  using (
    public.is_client_event_owner(client_event_id)
    or public.is_client_event_member(client_event_id)
  );

revoke all on public.supplier_applications from anon, authenticated;
revoke all on public.supplier_profiles from anon, authenticated;
revoke all on public.saved_supplier_profiles from anon, authenticated;
revoke all on public.client_supplier_recommendations from anon, authenticated;

grant select on public.supplier_applications to authenticated;
grant select (
  id,
  slug,
  business_name,
  category,
  city,
  short_description,
  about,
  public_email,
  public_phone,
  website_url,
  instagram_url,
  service_level,
  services,
  is_verified,
  published_at
) on public.supplier_profiles to anon, authenticated;
grant select, insert, delete on public.saved_supplier_profiles to authenticated;
grant select on public.client_supplier_recommendations to authenticated;

grant select, insert, update, delete on public.supplier_applications to service_role;
grant select, insert, update, delete on public.supplier_profiles to service_role;
grant select, insert, update, delete on public.saved_supplier_profiles to service_role;
grant select, insert, update, delete on public.client_supplier_recommendations to service_role;

-- Prevent client-controlled privilege escalation through public.profiles.app_role.
revoke update on public.profiles from authenticated;
grant update (full_name, phone, planner_role, active_client_event_id)
  on public.profiles to authenticated;

comment on table public.supplier_applications is
  'Private supplier applications. A submission never becomes public automatically.';
comment on table public.supplier_profiles is
  'Reviewed supplier directory. Only publication_status=published is public.';
comment on table public.saved_supplier_profiles is
  'Suppliers saved by an authenticated user; protected by owner RLS.';
comment on table public.client_supplier_recommendations is
  'Event-specific supplier recommendations visible only to event members.';
