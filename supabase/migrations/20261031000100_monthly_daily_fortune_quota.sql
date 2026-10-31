-- Completes localized Daily Fortune content and commits its monthly quota in
-- one transaction. The existing quota schema already permits daily_ca_dao.

create or replace function public.commit_numina_localized_daily_content(
  p_user_id uuid,
  p_reservation_id uuid,
  p_content_row_id uuid,
  p_claim_id text,
  p_claim_kind text,
  p_locale text,
  p_content jsonb,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_completed boolean; v_result jsonb;
begin
  v_completed:=public.complete_numina_daily_content(
    p_user_id,p_content_row_id,p_claim_id,p_claim_kind,p_locale,p_content
  );
  if not v_completed then
    raise exception 'Localized Daily Fortune claim not found';
  end if;
  v_result:=public.commit_numina_quota(p_user_id,p_reservation_id,p_metadata);
  if not coalesce((v_result->>'committed')::boolean,false) then
    raise exception 'Daily Fortune quota reservation could not be committed';
  end if;
  return v_result;
end; $$;

revoke all on function public.commit_numina_localized_daily_content(uuid,uuid,uuid,text,text,text,jsonb,jsonb)
  from public,anon,authenticated;
grant execute on function public.commit_numina_localized_daily_content(uuid,uuid,uuid,text,text,text,jsonb,jsonb)
  to service_role;
