-- Store the complete portable profile payload so a fresh mobile installation
-- can rebuild every family profile after Supabase authentication.
alter table public.user_numerology_profiles
  add column if not exists gender text,
  add column if not exists is_primary boolean not null default false,
  add column if not exists birth_time text,
  add column if not exists birth_place text,
  add column if not exists birth_location jsonb,
  add column if not exists birth_time_accuracy text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'user_numerology_profiles_gender_check'
      and conrelid = 'public.user_numerology_profiles'::regclass
  ) then
    alter table public.user_numerology_profiles
      add constraint user_numerology_profiles_gender_check
      check (gender is null or gender in ('male', 'female'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'user_numerology_profiles_birth_time_accuracy_check'
      and conrelid = 'public.user_numerology_profiles'::regclass
  ) then
    alter table public.user_numerology_profiles
      add constraint user_numerology_profiles_birth_time_accuracy_check
      check (birth_time_accuracy is null or birth_time_accuracy in ('exact', 'unknown'));
  end if;
end
$$;

with ranked_existing_primaries as (
  select
    id,
    row_number() over (
      partition by user_id
      order by updated_at desc nulls last, created_at asc nulls last, id asc
    ) as primary_rank
  from public.user_numerology_profiles
  where is_primary = true
)
update public.user_numerology_profiles profile
set is_primary = false
from ranked_existing_primaries ranked
where profile.id = ranked.id
  and ranked.primary_rank > 1;

with ranked_profiles as (
  select
    id,
    user_id,
    row_number() over (
      partition by user_id
      order by created_at asc nulls last, id asc
    ) as profile_rank
  from public.user_numerology_profiles
), users_without_primary as (
  select distinct ranked.user_id
  from public.user_numerology_profiles ranked
  where not exists (
    select 1
    from public.user_numerology_profiles existing
    where existing.user_id = ranked.user_id
      and existing.is_primary = true
  )
)
update public.user_numerology_profiles profile
set is_primary = true
from ranked_profiles ranked
join users_without_primary missing on missing.user_id = ranked.user_id
where profile.id = ranked.id
  and ranked.profile_rank = 1;

create unique index if not exists user_numerology_profiles_one_primary_per_user
  on public.user_numerology_profiles (user_id)
  where is_primary = true;

create or replace function public.set_primary_numerology_profile(profile_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  requesting_user uuid := auth.uid();
begin
  if requesting_user is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1
    from public.user_numerology_profiles
    where id = profile_id
      and user_id = requesting_user
  ) then
    raise exception 'Profile not found';
  end if;

  update public.user_numerology_profiles
  set is_primary = (id = profile_id),
      updated_at = now()
  where user_id = requesting_user
    and (is_primary = true or id = profile_id);
end;
$$;

revoke all on function public.set_primary_numerology_profile(uuid) from public;
grant execute on function public.set_primary_numerology_profile(uuid) to authenticated;

comment on column public.user_numerology_profiles.birth_location is
  'Resolved mobile birth location payload used to rebuild astrology calculations on a new device.';

