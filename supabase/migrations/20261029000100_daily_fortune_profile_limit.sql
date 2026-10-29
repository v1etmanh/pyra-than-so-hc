-- Daily Fortune is limited by distinct profile/day, not by a monthly verse
-- bucket.  The claim RPC serializes all new profiles for one account/day so
-- two devices cannot both pass the "three profiles" check.

create or replace function public.claim_numina_daily_content(
  p_user_id uuid,
  p_profile_key text,
  p_local_date date,
  p_content_type text,
  p_locale text,
  p_claim_id text,
  p_daily_profile_limit integer default null
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_existing public.numina_daily_content%rowtype;
  v_used integer;
  v_row_id uuid;
  v_localization jsonb;
  v_locale_claim jsonb;
begin
  if length(trim(coalesce(p_profile_key,''))) < 1
    or length(p_profile_key) > 160
    or p_content_type not in ('daily_ca_dao','daily_insight_back')
    or p_locale not in ('vi','en')
    or length(trim(coalesce(p_claim_id,''))) < 8 then
    raise exception 'Invalid daily content claim';
  end if;
  if p_daily_profile_limit is not null and p_daily_profile_limit < 1 then
    raise exception 'Invalid daily profile limit';
  end if;

  -- One transaction at a time may allocate a new profile slot for this
  -- account/date/content type. Existing profile reads use the same lock so a
  -- fourth request cannot slip through while another insert is uncommitted.
  perform pg_advisory_xact_lock(hashtextextended(
    p_user_id::text || ':' || p_local_date::text || ':' || p_content_type,
    0
  ));

  select * into v_existing
  from public.numina_daily_content
  where user_id=p_user_id and profile_key=p_profile_key
    and local_date=p_local_date and content_type=p_content_type
  for update;

  if not found then
    if p_daily_profile_limit is not null then
      select count(distinct profile_key) into v_used
      from public.numina_daily_content
      where user_id=p_user_id and local_date=p_local_date
        and content_type=p_content_type;
      if v_used >= p_daily_profile_limit then
        return jsonb_build_object(
          'state','limit_reached','used',v_used,'limit',p_daily_profile_limit
        );
      end if;
    end if;

    insert into public.numina_daily_content(
      user_id,profile_key,local_date,content_type,locale,content,updated_at
    ) values (
      p_user_id,p_profile_key,p_local_date,p_content_type,p_locale,
      jsonb_build_object('_state','generating','_claimId',p_claim_id),now()
    ) returning id into v_row_id;
    return jsonb_build_object(
      'state','claimed','claim_kind','base','row_id',v_row_id,'claim_id',p_claim_id
    );
  end if;

  if v_existing.content->>'_state'='generating' then
    if v_existing.updated_at <= now() - interval '10 minutes' then
      update public.numina_daily_content set
        locale=p_locale,
        content=jsonb_build_object('_state','generating','_claimId',p_claim_id),
        updated_at=now()
      where id=v_existing.id;
      return jsonb_build_object(
        'state','claimed','claim_kind','base','row_id',v_existing.id,'claim_id',p_claim_id
      );
    end if;
    return jsonb_build_object('state','pending');
  end if;

  v_localization:=v_existing.content->'localizations'->p_locale;
  if v_localization is not null then
    return jsonb_build_object('state','cached','content',v_localization);
  end if;

  -- Backward compatibility for rows written before localizations were added.
  if v_existing.locale=p_locale and v_existing.content ? 'fortune' then
    return jsonb_build_object('state','cached','content',v_existing.content);
  end if;

  v_locale_claim:=v_existing.content->'_localizationClaims'->p_locale;
  if v_locale_claim is not null
    and coalesce((v_locale_claim->>'claimedAt')::timestamptz, '-infinity'::timestamptz)
      > now() - interval '10 minutes' then
    return jsonb_build_object('state','pending');
  end if;

  update public.numina_daily_content set
    content=jsonb_set(
      jsonb_set(
        coalesce(content,'{}'::jsonb),
        '{_localizationClaims}',
        coalesce(content->'_localizationClaims','{}'::jsonb),
        true
      ),
      array['_localizationClaims',p_locale],
      jsonb_build_object('claimId',p_claim_id,'claimedAt',now()),
      true
    ),
    updated_at=now()
  where id=v_existing.id;

  return jsonb_build_object(
    'state','claimed','claim_kind','localization','row_id',v_existing.id,
    'claim_id',p_claim_id,'anchor',v_existing.content->'sampleAnchor'
  );
end; $$;

create or replace function public.complete_numina_daily_content(
  p_user_id uuid,
  p_content_row_id uuid,
  p_claim_id text,
  p_claim_kind text,
  p_locale text,
  p_content jsonb
) returns boolean language plpgsql security definer set search_path = public as $$
declare v_localizations jsonb;
begin
  if p_claim_kind='base' then
    update public.numina_daily_content set
      locale=p_locale,
      content=coalesce(p_content,'{}'::jsonb) || jsonb_build_object(
        'localizations',jsonb_build_object(p_locale,coalesce(p_content,'{}'::jsonb))
      ),
      updated_at=now()
    where id=p_content_row_id and user_id=p_user_id
      and content->>'_claimId'=p_claim_id;
    return found;
  end if;

  if p_claim_kind<>'localization' then
    raise exception 'Invalid daily content claim kind';
  end if;

  update public.numina_daily_content set
    content=(jsonb_set(
      jsonb_set(
        coalesce(content,'{}'::jsonb),
        '{localizations}',
        coalesce(content->'localizations','{}'::jsonb),
        true
      ),
      array['localizations',p_locale],
      coalesce(p_content,'{}'::jsonb),
      true
    ) #- array['_localizationClaims',p_locale]),
    updated_at=now()
  where id=p_content_row_id and user_id=p_user_id
    and content->'_localizationClaims'->p_locale->>'claimId'=p_claim_id;
  return found;
end; $$;

create or replace function public.release_numina_daily_content_claim(
  p_user_id uuid,
  p_content_row_id uuid,
  p_claim_id text,
  p_claim_kind text,
  p_locale text
) returns boolean language plpgsql security definer set search_path = public as $$
begin
  if p_claim_kind='base' then
    delete from public.numina_daily_content
    where id=p_content_row_id and user_id=p_user_id
      and content->>'_claimId'=p_claim_id;
    return found;
  end if;
  if p_claim_kind='localization' then
    update public.numina_daily_content set
      content=content #- array['_localizationClaims',p_locale],updated_at=now()
    where id=p_content_row_id and user_id=p_user_id
      and content->'_localizationClaims'->p_locale->>'claimId'=p_claim_id;
    return found;
  end if;
  return false;
end; $$;

revoke all on function public.claim_numina_daily_content(uuid,text,date,text,text,text,integer) from public,anon,authenticated;
revoke all on function public.complete_numina_daily_content(uuid,uuid,text,text,text,jsonb) from public,anon,authenticated;
revoke all on function public.release_numina_daily_content_claim(uuid,uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.claim_numina_daily_content(uuid,text,date,text,text,text,integer) to service_role;
grant execute on function public.complete_numina_daily_content(uuid,uuid,text,text,text,jsonb) to service_role;
grant execute on function public.release_numina_daily_content_claim(uuid,uuid,text,text,text) to service_role;
