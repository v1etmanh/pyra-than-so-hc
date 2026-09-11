-- Read-only preflight. Run after deploying the non-vector application build
-- and before 20260911_remove_vector_rag.sql.

-- Record this notice in the deployment ticket as the rollback row count.
do $$
declare
  legacy_row_count bigint;
begin
  if to_regclass('public.numerology_chunks') is null then
    raise notice 'public.numerology_chunks does not exist';
  else
    execute 'select count(*) from public.numerology_chunks' into legacy_row_count;
    raise notice 'public.numerology_chunks rows: %', legacy_row_count;
  end if;
end
$$;

-- Save these definitions alongside the database backup.
select
  p.oid::regprocedure as function_signature,
  pg_get_functiondef(p.oid) as function_definition
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'match_numerology_chunks';

-- Normal dependencies outside the extension mean `drop extension vector`
-- must remain blocked. The cleanup migration also enforces this without CASCADE.
select
  pg_describe_object(d.classid, d.objid, d.objsubid) as dependent_object,
  d.deptype
from pg_depend d
where d.refobjid in (
  select dep.objid
  from pg_depend dep
  join pg_extension ext on ext.oid = dep.refobjid
  where ext.extname = 'vector'
    and dep.deptype = 'e'
)
  and d.deptype = 'n'
order by dependent_object;

-- Create a recoverable backup outside this migration, for example:
-- pg_dump "$DATABASE_URL" --schema-only --table=public.numerology_chunks > numerology_chunks_schema.sql
-- pg_dump "$DATABASE_URL" --data-only --table=public.numerology_chunks > numerology_chunks_data.sql
