-- Monthly feature quotas, reservation ledger, cached daily content and Google Play metadata.

alter table public.numina_subscriptions
  drop constraint if exists numina_subscriptions_provider_check;
alter table public.numina_subscriptions
  add constraint numina_subscriptions_provider_check
  check (provider in ('paypal', 'payos', 'google_play'));
alter table public.numina_subscriptions
  add column if not exists current_period_start timestamptz,
  add column if not exists product_id text,
  add column if not exists purchase_token_hash text,
  add column if not exists linked_purchase_token_hash text,
  add column if not exists last_provider_event_id text;
create unique index if not exists numina_google_purchase_token_unique
  on public.numina_subscriptions(purchase_token_hash)
  where purchase_token_hash is not null;

alter table public.numina_payment_events
  drop constraint if exists numina_payment_events_provider_check;
alter table public.numina_payment_events
  add constraint numina_payment_events_provider_check
  check (provider in ('paypal', 'payos', 'google_play'));

-- One user may have only one active billing period. In particular, prevent a
-- second payOS purchase from stretching one quota bucket across 60+ days.
create or replace function public.reserve_numina_checkout(p_user_id uuid, p_provider text)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_existing public.numina_subscriptions%rowtype;
begin
  if p_provider not in ('paypal','payos') then raise exception 'Unsupported billing provider'; end if;
  perform pg_advisory_xact_lock(hashtext(p_user_id::text));
  update public.numina_payment_orders set status='expired',updated_at=now()
    where user_id=p_user_id and status='pending' and expires_at is not null and expires_at<=now();
  select * into v_existing from public.numina_subscriptions where user_id=p_user_id for update;
  if exists(select 1 from public.numina_payment_orders
    where user_id=p_user_id and status='pending' and (expires_at is null or expires_at>now())) then return false; end if;
  if v_existing.plan='pro' and v_existing.current_period_end>now() then return false; end if;
  if upper(coalesce(v_existing.status,''))='CREATING'
    and v_existing.updated_at>now()-interval '2 minutes' then return false; end if;
  if p_provider='paypal' and v_existing.provider='paypal'
    and upper(coalesce(v_existing.status,'')) in ('ACTIVE','SUSPENDED','PAST_DUE') then return false; end if;
  insert into public.numina_subscriptions(
    user_id,plan,provider,status,current_period_start,current_period_end,
    cancel_at_period_end,last_provider_event_at,updated_at
  ) values (
    p_user_id,'free',p_provider,'CREATING',null,null,false,null,now()
  ) on conflict(user_id) do update set
    plan='free',provider=excluded.provider,provider_customer_id=null,
    provider_subscription_id=null,status='CREATING',current_period_start=null,
    current_period_end=null,cancel_at_period_end=false,last_provider_event_at=null,updated_at=now();
  return true;
end; $$;

revoke all on function public.reserve_numina_checkout(uuid,text) from public,anon,authenticated;
grant execute on function public.reserve_numina_checkout(uuid,text) to service_role;

-- payOS has no automatic renewal. Each successful payment begins exactly one
-- atomic 30-day entitlement/quota period.
create or replace function public.apply_numina_payos_payment(
  p_order_code bigint,p_event_id text,p_transaction_id text,p_paid_at timestamptz
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_order public.numina_payment_orders%rowtype; v_existing public.numina_subscriptions%rowtype; v_period_end timestamptz;
begin
  if exists(select 1 from public.numina_payment_events where provider='payos' and provider_event_id=p_event_id) then
    return jsonb_build_object('applied',false,'duplicate',true);
  end if;
  select * into v_order from public.numina_payment_orders where provider='payos' and order_code=p_order_code for update;
  if not found then raise exception 'Payment order not found'; end if;
  if v_order.status='paid' then return jsonb_build_object('applied',false,'duplicate',true); end if;
  if v_order.status<>'pending' then raise exception 'Payment order is not payable'; end if;
  select * into v_existing from public.numina_subscriptions where user_id=v_order.user_id for update;
  if v_existing.plan='pro' and v_existing.current_period_end>now() then
    raise exception 'Another entitlement is already active';
  end if;
  v_period_end:=p_paid_at+interval '30 days';
  insert into public.numina_subscriptions(
    user_id,plan,provider,provider_subscription_id,status,current_period_start,current_period_end,
    cancel_at_period_end,last_provider_event_at,updated_at
  ) values (
    v_order.user_id,'pro','payos',null,'ACTIVE',p_paid_at,v_period_end,false,p_paid_at,now()
  ) on conflict(user_id) do update set
    plan='pro',provider='payos',provider_customer_id=null,provider_subscription_id=null,
    status='ACTIVE',current_period_start=p_paid_at,current_period_end=v_period_end,
    cancel_at_period_end=false,last_provider_event_at=p_paid_at,updated_at=now();
  update public.numina_payment_orders set status='paid',paid_at=p_paid_at,updated_at=now() where id=v_order.id;
  insert into public.numina_payment_events(
    user_id,provider,provider_event_id,provider_transaction_id,amount,currency,status,description,created_at
  ) values (
    v_order.user_id,'payos',p_event_id,p_transaction_id,v_order.amount,v_order.currency,
    'paid','NUMELYRA Pro 30 days via VietQR',p_paid_at
  );
  return jsonb_build_object('applied',true,'plan','pro','current_period_start',p_paid_at,'current_period_end',v_period_end);
end; $$;

revoke all on function public.apply_numina_payos_payment(bigint,text,text,timestamptz) from public,anon,authenticated;
grant execute on function public.apply_numina_payos_payment(bigint,text,text,timestamptz) to service_role;

-- PayPal period boundaries must be written in the same transaction as the
-- entitlement event so no request can observe a new renewal with an old quota
-- window between two separate updates.
create or replace function public.apply_numina_paypal_event_v2(
  p_user_id uuid,p_subscription_id text,p_status text,p_period_start timestamptz,p_period_end timestamptz,
  p_cancel_at_period_end boolean,p_event_id text,p_event_created_at timestamptz,
  p_amount integer,p_currency text,p_payment_status text,p_description text
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_existing public.numina_subscriptions%rowtype; v_plan text; v_period_start timestamptz;
begin
  if exists(select 1 from public.numina_payment_events where provider='paypal' and provider_event_id=p_event_id) then
    return jsonb_build_object('applied',false,'duplicate',true);
  end if;
  select * into v_existing from public.numina_subscriptions where user_id=p_user_id for update;
  if not found or v_existing.provider is distinct from 'paypal'
    or v_existing.provider_subscription_id is distinct from p_subscription_id then
    raise exception 'PayPal subscription not found';
  end if;
  if exists(select 1 from public.numina_payment_events where provider='paypal' and provider_event_id=p_event_id) then
    return jsonb_build_object('applied',false,'duplicate',true);
  end if;
  if v_existing.last_provider_event_at is not null and v_existing.last_provider_event_at>p_event_created_at then
    insert into public.numina_payment_events(user_id,provider,provider_event_id,amount,currency,status,description,created_at)
    values(p_user_id,'paypal',p_event_id,greatest(0,p_amount),lower(p_currency),p_payment_status,p_description,p_event_created_at)
    on conflict(provider,provider_event_id) do nothing;
    return jsonb_build_object('applied',false,'stale',true);
  end if;
  v_plan:=case when p_period_end is not null and p_period_end>now()
    and upper(p_status) not in ('EXPIRED','REVERSED') then 'pro' else 'free' end;
  v_period_start:=case
    when p_period_start is not null and p_period_end is not null and p_period_start<p_period_end then p_period_start
    else v_existing.current_period_start
  end;
  update public.numina_subscriptions set
    plan=v_plan,status=p_status,current_period_start=v_period_start,current_period_end=p_period_end,
    cancel_at_period_end=p_cancel_at_period_end,last_provider_event_at=p_event_created_at,updated_at=now()
    where user_id=p_user_id;
  insert into public.numina_payment_events(user_id,provider,provider_event_id,amount,currency,status,description,created_at)
  values(p_user_id,'paypal',p_event_id,greatest(0,p_amount),lower(p_currency),p_payment_status,p_description,p_event_created_at)
  on conflict(provider,provider_event_id) do nothing;
  return jsonb_build_object('applied',true,'plan',v_plan,'current_period_start',v_period_start,'current_period_end',p_period_end);
end; $$;

revoke all on function public.apply_numina_paypal_event_v2(uuid,text,text,timestamptz,timestamptz,boolean,text,timestamptz,integer,text,text,text) from public,anon,authenticated;
grant execute on function public.apply_numina_paypal_event_v2(uuid,text,text,timestamptz,timestamptz,boolean,text,timestamptz,integer,text,text,text) to service_role;

create table if not exists public.numina_usage_buckets (
  user_id uuid not null references auth.users(id) on delete cascade,
  period_start timestamptz not null,
  period_end timestamptz not null,
  plan text not null check (plan in ('free', 'pro')),
  plan_version text not null,
  feature text not null check (feature in ('ai_response', 'daily_ca_dao', 'daily_insight_back', 'wallpaper')),
  quota_limit integer not null check (quota_limit >= 0),
  used integer not null default 0 check (used >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, period_start, period_end, plan_version, feature)
);

create table if not exists public.numina_usage_reservations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  period_start timestamptz not null,
  period_end timestamptz not null,
  plan_version text not null,
  feature text not null check (feature in ('ai_response', 'daily_ca_dao', 'daily_insight_back', 'wallpaper')),
  idempotency_key text not null,
  status text not null default 'reserved' check (status in ('reserved', 'committed', 'released')),
  expires_at timestamptz not null,
  committed_at timestamptz,
  released_at timestamptz,
  release_reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, period_start, period_end, plan_version, feature, idempotency_key),
  foreign key (user_id, period_start, period_end, plan_version, feature)
    references public.numina_usage_buckets(user_id, period_start, period_end, plan_version, feature)
    on delete cascade
);
create index if not exists numina_usage_reservations_active_idx
  on public.numina_usage_reservations(user_id, period_start, feature, expires_at)
  where status = 'reserved';

create table if not exists public.numina_daily_content (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  profile_key text not null,
  local_date date not null,
  content_type text not null check (content_type in ('daily_ca_dao', 'daily_insight_back')),
  locale text not null default 'vi',
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, profile_key, local_date, content_type)
);

create table if not exists public.numina_ai_usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reservation_id uuid references public.numina_usage_reservations(id) on delete set null,
  feature text not null,
  route text not null,
  provider text,
  model text,
  input_tokens integer check (input_tokens is null or input_tokens >= 0),
  output_tokens integer check (output_tokens is null or output_tokens >= 0),
  cost_usd numeric(12, 8) check (cost_usd is null or cost_usd >= 0),
  retry_count integer not null default 0 check (retry_count >= 0),
  created_at timestamptz not null default now()
);
create index if not exists numina_ai_usage_events_user_created_idx
  on public.numina_ai_usage_events(user_id, created_at desc);

alter table public.numina_usage_buckets enable row level security;
alter table public.numina_usage_reservations enable row level security;
alter table public.numina_daily_content enable row level security;
alter table public.numina_ai_usage_events enable row level security;

drop policy if exists "Users can view own quota buckets" on public.numina_usage_buckets;
create policy "Users can view own quota buckets" on public.numina_usage_buckets
  for select using (auth.uid() = user_id);
drop policy if exists "Users can view own quota reservations" on public.numina_usage_reservations;
create policy "Users can view own quota reservations" on public.numina_usage_reservations
  for select using (auth.uid() = user_id);
drop policy if exists "Users can view own daily content" on public.numina_daily_content;
create policy "Users can view own daily content" on public.numina_daily_content
  for select using (auth.uid() = user_id);
drop policy if exists "Users can view own AI usage" on public.numina_ai_usage_events;
create policy "Users can view own AI usage" on public.numina_ai_usage_events
  for select using (auth.uid() = user_id);

create or replace function public.reserve_numina_quota(
  p_user_id uuid,
  p_feature text,
  p_plan text,
  p_plan_version text,
  p_quota_limit integer,
  p_period_start timestamptz,
  p_period_end timestamptz,
  p_idempotency_key text,
  p_ttl_seconds integer default 600
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_bucket public.numina_usage_buckets%rowtype;
  v_existing public.numina_usage_reservations%rowtype;
  v_reserved integer;
  v_reservation_id uuid;
begin
  if p_feature not in ('ai_response','daily_ca_dao','daily_insight_back','wallpaper') then
    raise exception 'Unsupported quota feature';
  end if;
  if p_plan not in ('free','pro') or p_quota_limit < 0 or p_period_end <= p_period_start then
    raise exception 'Invalid quota period';
  end if;
  if length(trim(coalesce(p_idempotency_key,''))) < 8 then
    raise exception 'Invalid idempotency key';
  end if;

  insert into public.numina_usage_buckets(
    user_id,period_start,period_end,plan,plan_version,feature,quota_limit
  ) values (
    p_user_id,p_period_start,p_period_end,p_plan,p_plan_version,p_feature,p_quota_limit
  ) on conflict (user_id,period_start,period_end,plan_version,feature)
  do update set plan=excluded.plan, quota_limit=excluded.quota_limit, updated_at=now();

  select * into v_bucket from public.numina_usage_buckets
  where user_id=p_user_id and period_start=p_period_start and period_end=p_period_end
    and plan_version=p_plan_version and feature=p_feature
  for update;

  update public.numina_usage_reservations
    set status='released', released_at=now(), release_reason='expired', updated_at=now()
  where user_id=p_user_id and period_start=p_period_start and period_end=p_period_end
    and plan_version=p_plan_version and feature=p_feature
    and status='reserved' and expires_at <= now();

  select * into v_existing from public.numina_usage_reservations
  where user_id=p_user_id and period_start=p_period_start and period_end=p_period_end and plan_version=p_plan_version
    and feature=p_feature and idempotency_key=p_idempotency_key;
  if found then
    if v_existing.status='released' then
      select count(*) into v_reserved from public.numina_usage_reservations r
      where r.user_id=p_user_id and r.period_start=p_period_start and r.period_end=p_period_end
        and r.plan_version=p_plan_version and r.feature=p_feature
        and r.status='reserved' and r.expires_at>now();
      if v_bucket.used + v_reserved >= v_bucket.quota_limit then
        return jsonb_build_object('allowed',false,'status','limit_reached','used',v_bucket.used,
          'limit',v_bucket.quota_limit,'remaining',0);
      end if;
      update public.numina_usage_reservations set
        status='reserved', expires_at=now()+make_interval(secs => greatest(30,least(p_ttl_seconds,1800))),
        committed_at=null, released_at=null, release_reason=null, metadata='{}'::jsonb, updated_at=now()
      where id=v_existing.id;
      return jsonb_build_object('allowed',true,'reservation_id',v_existing.id,'status','reserved',
        'used',v_bucket.used,'limit',v_bucket.quota_limit,
        'remaining',greatest(0,v_bucket.quota_limit-v_bucket.used-v_reserved-1));
    end if;
    return jsonb_build_object(
      'allowed', v_existing.status in ('reserved','committed'),
      'reservation_id', v_existing.id,
      'status', v_existing.status,
      'used', v_bucket.used,
      'limit', v_bucket.quota_limit,
      'remaining', greatest(0, v_bucket.quota_limit - v_bucket.used -
        (select count(*) from public.numina_usage_reservations r
         where r.user_id=p_user_id and r.period_start=p_period_start and r.period_end=p_period_end
           and r.plan_version=p_plan_version and r.feature=p_feature
           and r.status='reserved' and r.expires_at>now()))
    );
  end if;

  select count(*) into v_reserved from public.numina_usage_reservations r
  where r.user_id=p_user_id and r.period_start=p_period_start and r.period_end=p_period_end
    and r.plan_version=p_plan_version and r.feature=p_feature
    and r.status='reserved' and r.expires_at>now();

  if v_bucket.used + v_reserved >= v_bucket.quota_limit then
    return jsonb_build_object('allowed',false,'status','limit_reached','used',v_bucket.used,
      'limit',v_bucket.quota_limit,'remaining',0);
  end if;

  insert into public.numina_usage_reservations(
    user_id,period_start,period_end,plan_version,feature,idempotency_key,expires_at
  ) values (
    p_user_id,p_period_start,p_period_end,p_plan_version,p_feature,p_idempotency_key,
    now() + make_interval(secs => greatest(30, least(p_ttl_seconds, 1800)))
  ) returning id into v_reservation_id;

  return jsonb_build_object('allowed',true,'reservation_id',v_reservation_id,'status','reserved',
    'used',v_bucket.used,'limit',v_bucket.quota_limit,
    'remaining',greatest(0,v_bucket.quota_limit-v_bucket.used-v_reserved-1));
end; $$;

create or replace function public.commit_numina_quota(
  p_user_id uuid,
  p_reservation_id uuid,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_res public.numina_usage_reservations%rowtype; v_used integer; v_limit integer;
begin
  select * into v_res from public.numina_usage_reservations
    where id=p_reservation_id and user_id=p_user_id for update;
  if not found then raise exception 'Reservation not found'; end if;
  if v_res.status='committed' then
    select used,quota_limit into v_used,v_limit from public.numina_usage_buckets
      where user_id=v_res.user_id and period_start=v_res.period_start and period_end=v_res.period_end
        and plan_version=v_res.plan_version and feature=v_res.feature;
    return jsonb_build_object('committed',true,'duplicate',true,'used',v_used,'limit',v_limit,'remaining',greatest(0,v_limit-v_used));
  end if;
  if v_res.status<>'reserved' or v_res.expires_at<=now() then
    update public.numina_usage_reservations set status='released',released_at=coalesce(released_at,now()),
      release_reason=coalesce(release_reason,'expired'),updated_at=now() where id=v_res.id and status='reserved';
    return jsonb_build_object('committed',false,'status','released');
  end if;

  update public.numina_usage_buckets set used=used+1,updated_at=now()
    where user_id=v_res.user_id and period_start=v_res.period_start and period_end=v_res.period_end
      and plan_version=v_res.plan_version and feature=v_res.feature
    returning used,quota_limit into v_used,v_limit;
  update public.numina_usage_reservations set status='committed',committed_at=now(),
    metadata=coalesce(p_metadata,'{}'::jsonb),updated_at=now() where id=v_res.id;
  return jsonb_build_object('committed',true,'used',v_used,'limit',v_limit,'remaining',greatest(0,v_limit-v_used));
end; $$;

create or replace function public.release_numina_quota(
  p_user_id uuid,
  p_reservation_id uuid,
  p_reason text default 'request_failed'
) returns boolean language plpgsql security definer set search_path = public as $$
begin
  update public.numina_usage_reservations set status='released',released_at=now(),
    release_reason=left(coalesce(p_reason,'request_failed'),120),updated_at=now()
  where id=p_reservation_id and user_id=p_user_id and status='reserved';
  return found;
end; $$;

create or replace function public.commit_numina_daily_content(
  p_user_id uuid,
  p_reservation_id uuid,
  p_content_row_id uuid,
  p_claim_id text,
  p_content jsonb,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_result jsonb;
begin
  update public.numina_daily_content set content=coalesce(p_content,'{}'::jsonb),updated_at=now()
  where id=p_content_row_id and user_id=p_user_id and content->>'_claimId'=p_claim_id;
  if not found then raise exception 'Daily content claim not found'; end if;
  v_result:=public.commit_numina_quota(p_user_id,p_reservation_id,p_metadata);
  if not coalesce((v_result->>'committed')::boolean,false) then
    raise exception 'Quota reservation could not be committed';
  end if;
  return v_result;
end; $$;

revoke all on function public.reserve_numina_quota(uuid,text,text,text,integer,timestamptz,timestamptz,text,integer) from public,anon,authenticated;
revoke all on function public.commit_numina_quota(uuid,uuid,jsonb) from public,anon,authenticated;
revoke all on function public.release_numina_quota(uuid,uuid,text) from public,anon,authenticated;
revoke all on function public.commit_numina_daily_content(uuid,uuid,uuid,text,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.reserve_numina_quota(uuid,text,text,text,integer,timestamptz,timestamptz,text,integer) to service_role;
grant execute on function public.commit_numina_quota(uuid,uuid,jsonb) to service_role;
grant execute on function public.release_numina_quota(uuid,uuid,text) to service_role;
grant execute on function public.commit_numina_daily_content(uuid,uuid,uuid,text,jsonb,jsonb) to service_role;

create or replace function public.apply_numina_google_play_event(
  p_user_id uuid, p_event_id text, p_event_at timestamptz,
  p_purchase_token_hash text, p_linked_token_hash text, p_provider_subscription_id text,
  p_status text, p_plan text, p_period_start timestamptz, p_period_end timestamptz,
  p_cancel_at_period_end boolean
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_existing public.numina_subscriptions%rowtype;
begin
  if p_plan not in ('free','pro') then raise exception 'Invalid entitlement plan'; end if;
  if exists(select 1 from public.numina_payment_events where provider='google_play' and provider_event_id=p_event_id) then
    return jsonb_build_object('applied',false,'duplicate',true);
  end if;
  select * into v_existing from public.numina_subscriptions where user_id=p_user_id for update;
  if not found or v_existing.provider<>'google_play' then raise exception 'Google Play subscription not found'; end if;
  -- Re-check after taking the per-user lock so simultaneous delivery of the
  -- same Pub/Sub message cannot race the unique payment-event constraint.
  if exists(select 1 from public.numina_payment_events where provider='google_play' and provider_event_id=p_event_id) then
    return jsonb_build_object('applied',false,'duplicate',true);
  end if;
  -- Pub/Sub does not guarantee ordered delivery. Record an older event for
  -- idempotency/audit, but never let it roll back a newer entitlement state.
  if v_existing.last_provider_event_at is not null and v_existing.last_provider_event_at>p_event_at then
    insert into public.numina_payment_events(
      user_id,provider,provider_event_id,amount,currency,status,description,created_at
    ) values (
      p_user_id,'google_play',p_event_id,0,'usd',p_status,'Google Play RTDN (stale, ignored)',p_event_at
    ) on conflict(provider,provider_event_id) do nothing;
    return jsonb_build_object('applied',false,'stale',true);
  end if;
  update public.numina_subscriptions set
    plan=p_plan, status=p_status, provider_subscription_id=p_provider_subscription_id,
    purchase_token_hash=p_purchase_token_hash, linked_purchase_token_hash=p_linked_token_hash,
    current_period_start=p_period_start, current_period_end=p_period_end,
    cancel_at_period_end=p_cancel_at_period_end, last_provider_event_id=p_event_id,
    last_provider_event_at=greatest(coalesce(last_provider_event_at,p_event_at),p_event_at), updated_at=now()
  where user_id=p_user_id;
  insert into public.numina_payment_events(
    user_id,provider,provider_event_id,amount,currency,status,description,created_at
  ) values (
    p_user_id,'google_play',p_event_id,0,'usd',p_status,'Google Play RTDN',p_event_at
  );
  return jsonb_build_object('applied',true,'plan',p_plan);
end; $$;

revoke all on function public.apply_numina_google_play_event(uuid,text,timestamptz,text,text,text,text,text,timestamptz,timestamptz,boolean) from public,anon,authenticated;
grant execute on function public.apply_numina_google_play_event(uuid,text,timestamptz,text,text,text,text,text,timestamptz,timestamptz,boolean) to service_role;
