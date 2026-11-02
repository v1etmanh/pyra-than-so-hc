-- Recreate the curated numerology knowledge store after accidental deletion.
-- This migration intentionally refuses to run when the table already exists so
-- a recovered or manually recreated table is never overwritten silently.

begin;

do $$
begin
  if to_regclass('public.numerology_knowledge') is not null then
    raise exception 'public.numerology_knowledge already exists; inspect it before restoring';
  end if;
end
$$;

create table public.numerology_knowledge (
  id uuid primary key default gen_random_uuid(),
  source_id text,
  indicator_key text not null,
  number_value text not null,
  locale text not null check (locale in ('vi', 'en')),
  indicator_name text not null,
  title text not null,
  category text not null,
  content text not null check (length(btrim(content)) > 0),
  keywords text[] not null default '{}'::text[],
  source text not null,
  review_status text not null check (review_status = 'approved'),
  source_revision text not null,
  reviewed_by text not null,
  created_at timestamptz,
  constraint numerology_knowledge_lookup_key
    unique (indicator_key, number_value, locale)
);

create index numerology_knowledge_indicator_locale_idx
  on public.numerology_knowledge (indicator_key, locale);

alter table public.numerology_knowledge enable row level security;

revoke all on table public.numerology_knowledge from public, anon, authenticated;
grant select, insert, update, delete on table public.numerology_knowledge to service_role;

comment on table public.numerology_knowledge is
  'Curated bilingual numerology knowledge. Backend/service-role access only.';

commit;

notify pgrst, 'reload schema';
