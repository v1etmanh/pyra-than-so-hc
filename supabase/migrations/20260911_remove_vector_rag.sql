-- Run only after the application version that no longer references vector RAG
-- has been deployed and numerology_chunks has been backed up if rollback data
-- is required. This migration intentionally leaves numerology_knowledge intact.

begin;

do $$
declare
  rag_function regprocedure;
begin
  for rag_function in
    select p.oid::regprocedure
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'match_numerology_chunks'
  loop
    execute format('drop function if exists %s', rag_function);
  end loop;
end
$$;

drop table if exists public.numerology_chunks;

-- Never cascade extension removal. If another object still uses pgvector, keep
-- the extension and report a notice instead of deleting unrelated data.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'vector') then
    begin
      drop extension vector;
    exception
      when dependent_objects_still_exist then
        raise notice 'Keeping vector extension because other database objects still depend on it.';
    end;
  end if;
end
$$;

commit;
