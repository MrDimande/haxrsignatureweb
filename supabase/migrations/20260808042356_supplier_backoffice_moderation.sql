-- HAXR Signature - internal supplier moderation backoffice
-- Administrative operations run with the server-side service role. Public and
-- authenticated clients cannot execute the moderation functions or read the
-- immutable audit trail.

alter table public.supplier_applications
  add column if not exists reviewed_by_email text,
  add column if not exists review_notes text,
  add column if not exists is_test_record boolean not null default false;

alter table public.supplier_applications
  drop constraint if exists supplier_applications_review_consistency;

alter table public.supplier_applications
  add constraint supplier_applications_reviewer_email_format
    check (
      reviewed_by_email is null
      or (
        reviewed_by_email = lower(btrim(reviewed_by_email))
        and char_length(reviewed_by_email) between 3 and 254
        and reviewed_by_email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
      )
    ),
  add constraint supplier_applications_review_notes_len
    check (review_notes is null or char_length(review_notes) <= 2000),
  add constraint supplier_applications_review_consistency
    check (
      (
        status = 'pending'
        and reviewed_at is null
        and reviewed_by is null
        and reviewed_by_email is null
      )
      or (
        status = 'in_review'
        and reviewed_at is null
        and (reviewed_by is not null or reviewed_by_email is not null)
      )
      or (
        status in ('approved', 'rejected')
        and reviewed_at is not null
        and (reviewed_by is not null or reviewed_by_email is not null)
      )
      or status = 'withdrawn'
    );

alter table public.supplier_profiles
  add column if not exists is_test_record boolean not null default false;

create table if not exists public.supplier_moderation_events (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references public.supplier_applications(id) on delete set null,
  supplier_profile_id uuid references public.supplier_profiles(id) on delete set null,
  actor_email text not null,
  action text not null,
  previous_status text,
  next_status text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint supplier_moderation_events_actor_email_format
    check (
      actor_email = lower(btrim(actor_email))
      and char_length(actor_email) between 3 and 254
      and actor_email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
    ),
  constraint supplier_moderation_events_action_allowed
    check (
      action in (
        'review_started',
        'application_approved',
        'application_rejected',
        'profile_saved',
        'profile_published',
        'profile_suspended',
        'profile_moved_to_review',
        'profile_unpublished',
        'uat_removed'
      )
    ),
  constraint supplier_moderation_events_details_object
    check (jsonb_typeof(details) = 'object')
);

create index if not exists supplier_moderation_events_application_idx
  on public.supplier_moderation_events (application_id, created_at desc);

create index if not exists supplier_moderation_events_profile_idx
  on public.supplier_moderation_events (supplier_profile_id, created_at desc);

alter table public.supplier_moderation_events enable row level security;

revoke all on public.supplier_moderation_events from public, anon, authenticated;
grant select, insert on public.supplier_moderation_events to service_role;

-- Keep internal reviewer identity and notes outside the applicant-facing API.
revoke select on public.supplier_applications from authenticated;
grant select (
  id,
  applicant_user_id,
  supplier_name,
  responsible_name,
  email,
  phone,
  category,
  city,
  portfolio_url,
  message,
  status,
  created_at,
  updated_at
) on public.supplier_applications to authenticated;

create or replace function public.admin_review_supplier_application_atomic(
  p_application_id uuid,
  p_actor_email text,
  p_status public.supplier_application_status,
  p_review_notes text default null,
  p_slug text default null,
  p_is_test_record boolean default false
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_application public.supplier_applications%rowtype;
  v_profile_id uuid;
  v_actor_email text := lower(btrim(coalesce(p_actor_email, '')));
  v_action text;
begin
  if v_actor_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'invalid_admin_actor';
  end if;

  if p_status not in ('in_review', 'approved', 'rejected') then
    raise exception 'unsupported_application_status';
  end if;

  if p_review_notes is not null and char_length(p_review_notes) > 2000 then
    raise exception 'review_notes_too_long';
  end if;

  select *
    into v_application
    from public.supplier_applications
   where id = p_application_id
   for update;

  if not found then
    raise exception 'supplier_application_not_found';
  end if;

  if v_application.status not in ('pending', 'in_review') then
    raise exception 'supplier_application_transition_not_allowed';
  end if;

  if p_status = 'approved' then
    if p_slug is null or btrim(p_slug) !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
      raise exception 'valid_slug_required_for_approval';
    end if;

    insert into public.supplier_profiles (
      owner_user_id,
      application_id,
      slug,
      business_name,
      category,
      city,
      publication_status,
      is_test_record
    ) values (
      v_application.applicant_user_id,
      v_application.id,
      btrim(p_slug),
      v_application.supplier_name,
      v_application.category,
      v_application.city,
      'draft',
      p_is_test_record
    )
    returning id into v_profile_id;
  end if;

  update public.supplier_applications
     set status = p_status,
         reviewed_at = case
           when p_status in ('approved', 'rejected') then now()
           else null
         end,
         reviewed_by = null,
         reviewed_by_email = v_actor_email,
         review_notes = nullif(btrim(coalesce(p_review_notes, '')), ''),
         is_test_record = p_is_test_record
   where id = p_application_id;

  v_action := case p_status
    when 'in_review' then 'review_started'
    when 'approved' then 'application_approved'
    else 'application_rejected'
  end;

  insert into public.supplier_moderation_events (
    application_id,
    supplier_profile_id,
    actor_email,
    action,
    previous_status,
    next_status,
    details
  ) values (
    p_application_id,
    v_profile_id,
    v_actor_email,
    v_action,
    v_application.status::text,
    p_status::text,
    jsonb_build_object('is_test_record', p_is_test_record)
  );

  return p_application_id;
end;
$$;

create or replace function public.admin_save_supplier_profile_atomic(
  p_profile_id uuid,
  p_actor_email text,
  p_slug text,
  p_business_name text,
  p_category text,
  p_city text,
  p_short_description text default '',
  p_about text default '',
  p_public_email text default null,
  p_public_phone text default null,
  p_website_url text default null,
  p_instagram_url text default null,
  p_service_level text default null,
  p_services text[] default '{}',
  p_publication_status public.supplier_publication_status default 'draft',
  p_is_verified boolean default false
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_profile public.supplier_profiles%rowtype;
  v_actor_email text := lower(btrim(coalesce(p_actor_email, '')));
  v_action text;
begin
  if v_actor_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'invalid_admin_actor';
  end if;

  if btrim(p_slug) !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    raise exception 'invalid_supplier_slug';
  end if;

  if char_length(btrim(p_business_name)) not between 2 and 120
     or char_length(btrim(p_category)) not between 2 and 80
     or char_length(btrim(p_city)) not between 2 and 80 then
    raise exception 'invalid_supplier_profile_fields';
  end if;

  if nullif(btrim(coalesce(p_website_url, '')), '') is not null
     and btrim(p_website_url) !~* '^https?://' then
    raise exception 'invalid_supplier_website_url';
  end if;

  if nullif(btrim(coalesce(p_instagram_url, '')), '') is not null
     and btrim(p_instagram_url) !~* '^https?://' then
    raise exception 'invalid_supplier_instagram_url';
  end if;

  if nullif(btrim(coalesce(p_public_email, '')), '') is not null
     and lower(btrim(p_public_email)) !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'invalid_supplier_public_email';
  end if;

  if p_publication_status = 'published'
     and (
       char_length(btrim(coalesce(p_short_description, ''))) < 20
       or char_length(btrim(coalesce(p_about, ''))) < 40
     ) then
    raise exception 'published_supplier_profile_requires_complete_content';
  end if;

  select *
    into v_profile
    from public.supplier_profiles
   where id = p_profile_id
   for update;

  if not found then
    raise exception 'supplier_profile_not_found';
  end if;

  update public.supplier_profiles
     set slug = btrim(p_slug),
         business_name = btrim(p_business_name),
         category = btrim(p_category),
         city = btrim(p_city),
         short_description = btrim(coalesce(p_short_description, '')),
         about = btrim(coalesce(p_about, '')),
         public_email = nullif(lower(btrim(coalesce(p_public_email, ''))), ''),
         public_phone = nullif(btrim(coalesce(p_public_phone, '')), ''),
         website_url = nullif(btrim(coalesce(p_website_url, '')), ''),
         instagram_url = nullif(btrim(coalesce(p_instagram_url, '')), ''),
         service_level = nullif(btrim(coalesce(p_service_level, '')), ''),
         services = coalesce(
           array(
             select distinct btrim(service)
               from unnest(coalesce(p_services, '{}'::text[])) as service
              where btrim(service) <> ''
           ),
           '{}'::text[]
         ),
         publication_status = p_publication_status,
         is_verified = p_is_verified,
         published_at = case
           when p_publication_status = 'published' then coalesce(v_profile.published_at, now())
           else null
         end
   where id = p_profile_id;

  v_action := case
    when p_publication_status = v_profile.publication_status then 'profile_saved'
    when p_publication_status = 'published' then 'profile_published'
    when p_publication_status = 'suspended' then 'profile_suspended'
    when p_publication_status = 'pending_review' then 'profile_moved_to_review'
    else 'profile_unpublished'
  end;

  insert into public.supplier_moderation_events (
    application_id,
    supplier_profile_id,
    actor_email,
    action,
    previous_status,
    next_status
  ) values (
    v_profile.application_id,
    p_profile_id,
    v_actor_email,
    v_action,
    v_profile.publication_status::text,
    p_publication_status::text
  );

  return p_profile_id;
end;
$$;

create or replace function public.admin_remove_supplier_uat_atomic(
  p_application_id uuid,
  p_actor_email text,
  p_expected_supplier_name text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_application public.supplier_applications%rowtype;
  v_profile public.supplier_profiles%rowtype;
  v_actor_email text := lower(btrim(coalesce(p_actor_email, '')));
begin
  if v_actor_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'invalid_admin_actor';
  end if;

  select *
    into v_application
    from public.supplier_applications
   where id = p_application_id
   for update;

  if not found then
    raise exception 'supplier_application_not_found';
  end if;

  if not v_application.is_test_record then
    raise exception 'only_uat_supplier_records_can_be_removed';
  end if;

  if lower(btrim(coalesce(p_expected_supplier_name, '')))
     <> lower(btrim(v_application.supplier_name)) then
    raise exception 'supplier_name_confirmation_mismatch';
  end if;

  select *
    into v_profile
    from public.supplier_profiles
   where application_id = p_application_id
   for update;

  if found and not v_profile.is_test_record then
    raise exception 'supplier_profile_is_not_a_uat_record';
  end if;

  insert into public.supplier_moderation_events (
    application_id,
    supplier_profile_id,
    actor_email,
    action,
    previous_status,
    details
  ) values (
    p_application_id,
    v_profile.id,
    v_actor_email,
    'uat_removed',
    v_application.status::text,
    jsonb_build_object('supplier_name', v_application.supplier_name)
  );

  if v_profile.id is not null then
    delete from public.supplier_profiles where id = v_profile.id;
  end if;

  delete from public.supplier_applications where id = p_application_id;
  return p_application_id;
end;
$$;

revoke all on function public.admin_review_supplier_application_atomic(
  uuid,
  text,
  public.supplier_application_status,
  text,
  text,
  boolean
) from public, anon, authenticated;
grant execute on function public.admin_review_supplier_application_atomic(
  uuid,
  text,
  public.supplier_application_status,
  text,
  text,
  boolean
) to service_role;

revoke all on function public.admin_save_supplier_profile_atomic(
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text[],
  public.supplier_publication_status,
  boolean
) from public, anon, authenticated;
grant execute on function public.admin_save_supplier_profile_atomic(
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text[],
  public.supplier_publication_status,
  boolean
) to service_role;

revoke all on function public.admin_remove_supplier_uat_atomic(uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.admin_remove_supplier_uat_atomic(uuid, text, text)
  to service_role;

comment on column public.supplier_applications.reviewed_by_email is
  'Internal HAXR admin actor. Not granted to authenticated applicants.';
comment on column public.supplier_applications.review_notes is
  'Internal moderation notes. Not granted to authenticated applicants.';
comment on column public.supplier_applications.is_test_record is
  'Explicit UAT marker required before guarded permanent removal.';
comment on column public.supplier_profiles.is_test_record is
  'Copied from the approved application and immutable through profile editing.';
comment on table public.supplier_moderation_events is
  'Append-only internal audit trail for supplier review and publication actions.';
