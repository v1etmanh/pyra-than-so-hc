-- Apply after auth_schema.sql. Payment webhooks write with the service role;
-- signed-in users can only read their own billing records.
drop table if exists public.numina_payment_events cascade;
drop table if exists public.numina_payment_orders cascade;
drop table if exists public.numina_subscriptions cascade;

create table if not exists public.numina_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  provider text check (provider in ('paypal', 'payos')),
  status text not null default 'inactive',
  provider_customer_id text,
  provider_subscription_id text,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  last_provider_event_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists numina_subscription_provider_id_unique
on public.numina_subscriptions(provider, provider_subscription_id)
where provider_subscription_id is not null;

create table if not exists public.numina_payment_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('paypal', 'payos')),
  order_code bigint unique,
  provider_order_id text,
  amount integer not null check (amount > 0),
  currency text not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'canceled', 'expired', 'failed')),
  expires_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(provider, provider_order_id)
);

create table if not exists public.numina_payment_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('paypal', 'payos')),
  provider_event_id text not null,
  provider_transaction_id text,
  amount integer not null default 0,
  currency text not null default 'usd',
  status text not null,
  description text,
  created_at timestamptz not null default now(),
  unique(provider, provider_event_id),
  unique(provider, provider_transaction_id)
);

alter table public.numina_subscriptions enable row level security;
alter table public.numina_payment_orders enable row level security;
alter table public.numina_payment_events enable row level security;

create policy "Users can view own subscription"
on public.numina_subscriptions for select using (auth.uid() = user_id);
create policy "Users can view own payment orders"
on public.numina_payment_orders for select using (auth.uid() = user_id);
create policy "Users can view own payment history"
on public.numina_payment_events for select using (auth.uid() = user_id);

-- Serializes checkout creation per user and prevents simultaneous providers.
create or replace function public.reserve_numina_checkout(p_user_id uuid, p_provider text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing public.numina_subscriptions%rowtype;
begin
  if p_provider not in ('paypal', 'payos') then raise exception 'Unsupported billing provider'; end if;
  perform pg_advisory_xact_lock(hashtext(p_user_id::text));

  update public.numina_payment_orders
     set status = 'expired', updated_at = now()
   where user_id = p_user_id
     and status = 'pending'
     and expires_at is not null
     and expires_at <= now();

  select * into v_existing from public.numina_subscriptions where user_id = p_user_id for update;

  if exists(
    select 1 from public.numina_payment_orders
    where user_id = p_user_id and status = 'pending' and (expires_at is null or expires_at > now())
  ) then return false; end if;
  if v_existing.plan = 'pro' and v_existing.current_period_end > now() and v_existing.provider <> p_provider then
    return false;
  end if;
  if upper(coalesce(v_existing.status, '')) = 'CREATING'
     and v_existing.updated_at > now() - interval '2 minutes' then return false; end if;
  if p_provider = 'paypal' and v_existing.provider = 'paypal'
     and upper(coalesce(v_existing.status, '')) in ('ACTIVE', 'SUSPENDED', 'PAST_DUE') then
    return false;
  end if;

  if p_provider = 'paypal' or not (v_existing.provider = 'payos' and v_existing.plan = 'pro' and v_existing.current_period_end > now()) then
    insert into public.numina_subscriptions(
      user_id, plan, provider, status, current_period_end, cancel_at_period_end, last_provider_event_at, updated_at
    ) values (
      p_user_id, 'free', p_provider, 'CREATING', null, false, null, now()
    ) on conflict (user_id) do update set
      plan = 'free', provider = excluded.provider, provider_customer_id = null,
      provider_subscription_id = null, status = 'CREATING', current_period_end = null,
      cancel_at_period_end = false, last_provider_event_at = null, updated_at = now();
  end if;
  return true;
end;
$$;

-- Clears a PayPal approval that the user closed before confirming. This is a
-- local checkout state change only; no paid entitlement exists at this point.
create or replace function public.abandon_numina_paypal_checkout(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing public.numina_subscriptions%rowtype;
begin
  perform pg_advisory_xact_lock(hashtext(p_user_id::text));
  select * into v_existing
    from public.numina_subscriptions
   where user_id = p_user_id
   for update;

  if not found then
    return false;
  end if;

  if v_existing.provider <> 'paypal'
     or upper(coalesce(v_existing.status, '')) not in ('CREATING', 'APPROVAL_PENDING') then
    return false;
  end if;

  update public.numina_payment_orders
     set status = 'canceled', updated_at = now()
   where user_id = p_user_id
     and provider = 'paypal'
     and status = 'pending';

  update public.numina_subscriptions
     set plan = 'free',
         provider = null,
         provider_customer_id = null,
         provider_subscription_id = null,
         status = 'INACTIVE',
         current_period_end = null,
         cancel_at_period_end = false,
         last_provider_event_at = null,
         updated_at = now()
   where user_id = p_user_id;

  return true;
end;
$$;

-- Atomically applies PayPal state changes and makes webhook delivery idempotent.
create or replace function public.apply_numina_paypal_event(
  p_user_id uuid,
  p_subscription_id text,
  p_status text,
  p_period_end timestamptz,
  p_cancel_at_period_end boolean,
  p_event_id text,
  p_event_created_at timestamptz,
  p_amount integer,
  p_currency text,
  p_payment_status text,
  p_description text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing public.numina_subscriptions%rowtype;
  v_plan text;
begin
  if exists(select 1 from public.numina_payment_events where provider = 'paypal' and provider_event_id = p_event_id) then
    return jsonb_build_object('applied', false, 'duplicate', true);
  end if;

  select * into v_existing from public.numina_subscriptions where user_id = p_user_id for update;
  if v_existing.provider = 'payos' and v_existing.plan = 'pro' and v_existing.current_period_end > now() then
    raise exception 'A payOS entitlement is still active';
  end if;

  if v_existing.last_provider_event_at is not null and v_existing.last_provider_event_at > p_event_created_at then
    insert into public.numina_payment_events(user_id, provider, provider_event_id, amount, currency, status, description, created_at)
    values (p_user_id, 'paypal', p_event_id, greatest(0, p_amount), lower(p_currency), p_payment_status, p_description, p_event_created_at)
    on conflict (provider, provider_event_id) do nothing;
    return jsonb_build_object('applied', false, 'stale', true);
  end if;

  v_plan := case
    when p_period_end is not null and p_period_end > now() and upper(p_status) not in ('EXPIRED', 'REVERSED') then 'pro'
    else 'free'
  end;
  insert into public.numina_subscriptions(
    user_id, plan, provider, provider_subscription_id, status, current_period_end,
    cancel_at_period_end, last_provider_event_at, updated_at
  ) values (
    p_user_id, v_plan, 'paypal', p_subscription_id, p_status, p_period_end,
    p_cancel_at_period_end, p_event_created_at, now()
  )
  on conflict (user_id) do update set
    plan = excluded.plan,
    provider = excluded.provider,
    provider_subscription_id = excluded.provider_subscription_id,
    status = excluded.status,
    current_period_end = excluded.current_period_end,
    cancel_at_period_end = excluded.cancel_at_period_end,
    last_provider_event_at = excluded.last_provider_event_at,
    updated_at = now();

  insert into public.numina_payment_events(user_id, provider, provider_event_id, amount, currency, status, description, created_at)
  values (p_user_id, 'paypal', p_event_id, greatest(0, p_amount), lower(p_currency), p_payment_status, p_description, p_event_created_at)
  on conflict (provider, provider_event_id) do nothing;
  return jsonb_build_object('applied', true, 'plan', v_plan);
end;
$$;

-- A verified payOS payment extends an existing payOS entitlement by exactly 30 days.
create or replace function public.apply_numina_payos_payment(
  p_order_code bigint,
  p_event_id text,
  p_transaction_id text,
  p_paid_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.numina_payment_orders%rowtype;
  v_existing public.numina_subscriptions%rowtype;
  v_base timestamptz;
  v_period_end timestamptz;
begin
  if exists(select 1 from public.numina_payment_events where provider = 'payos' and provider_event_id = p_event_id) then
    return jsonb_build_object('applied', false, 'duplicate', true);
  end if;
  select * into v_order from public.numina_payment_orders
   where provider = 'payos' and order_code = p_order_code for update;
  if not found then raise exception 'Payment order not found'; end if;
  if v_order.status = 'paid' then return jsonb_build_object('applied', false, 'duplicate', true); end if;
  if v_order.status <> 'pending' then raise exception 'Payment order is not payable'; end if;

  select * into v_existing from public.numina_subscriptions where user_id = v_order.user_id for update;
  if v_existing.provider = 'paypal' and v_existing.plan = 'pro' and v_existing.current_period_end > now() then
    raise exception 'A PayPal entitlement is still active';
  end if;
  v_base := case
    when v_existing.provider = 'payos' and v_existing.current_period_end > now() then v_existing.current_period_end
    else now()
  end;
  v_period_end := v_base + interval '30 days';

  insert into public.numina_subscriptions(
    user_id, plan, provider, provider_subscription_id, status, current_period_end,
    cancel_at_period_end, last_provider_event_at, updated_at
  ) values (
    v_order.user_id, 'pro', 'payos', null, 'ACTIVE', v_period_end, false, p_paid_at, now()
  )
  on conflict (user_id) do update set
    plan = 'pro', provider = 'payos', provider_customer_id = null,
    provider_subscription_id = null, status = 'ACTIVE', current_period_end = v_period_end,
    cancel_at_period_end = false, last_provider_event_at = p_paid_at, updated_at = now();

  update public.numina_payment_orders set status = 'paid', paid_at = p_paid_at, updated_at = now()
   where id = v_order.id;
  insert into public.numina_payment_events(
    user_id, provider, provider_event_id, provider_transaction_id, amount, currency, status, description, created_at
  ) values (
    v_order.user_id, 'payos', p_event_id, p_transaction_id, v_order.amount, v_order.currency, 'paid', 'Numina Pro 30 days via VietQR', p_paid_at
  );
  return jsonb_build_object('applied', true, 'plan', 'pro', 'current_period_end', v_period_end);
end;
$$;

revoke all on function public.apply_numina_paypal_event(uuid, text, text, timestamptz, boolean, text, timestamptz, integer, text, text, text) from public, anon, authenticated;
revoke all on function public.apply_numina_payos_payment(bigint, text, text, timestamptz) from public, anon, authenticated;
revoke all on function public.reserve_numina_checkout(uuid, text) from public, anon, authenticated;
revoke all on function public.abandon_numina_paypal_checkout(uuid) from public, anon, authenticated;
grant execute on function public.apply_numina_paypal_event(uuid, text, text, timestamptz, boolean, text, timestamptz, integer, text, text, text) to service_role;
grant execute on function public.apply_numina_payos_payment(bigint, text, text, timestamptz) to service_role;
grant execute on function public.reserve_numina_checkout(uuid, text) to service_role;
grant execute on function public.abandon_numina_paypal_checkout(uuid) to service_role;

-- Durable, atomic quota and burst-rate-limit counters. The service role calls
-- the security-definer functions below; end users have no direct policies.
create table if not exists public.numina_usage_counters (
  identity text not null,
  feature text not null check (feature in ('text', 'wallpaper')),
  usage_day date not null default current_date,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  requests integer not null default 0 check (requests >= 0),
  burst_count integer not null default 0 check (burst_count >= 0),
  burst_reset_at timestamptz not null default now(),
  estimated_cost_usd numeric(12,6) not null default 0 check (estimated_cost_usd >= 0),
  last_seen_at timestamptz not null default now(),
  primary key (identity, feature, usage_day)
);

alter table public.numina_usage_counters enable row level security;

create or replace function public.consume_numina_access(
  p_identity text,
  p_plan text,
  p_feature text,
  p_daily_limit integer,
  p_burst_limit integer,
  p_burst_window_seconds integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_day date := current_date;
  v_now timestamptz := now();
  v_burst_count integer;
  v_burst_reset_at timestamptz;
  v_requests integer;
  v_burst_allowed boolean;
  v_daily_allowed boolean;
begin
  if p_daily_limit < 1 or p_burst_limit < 1 or p_burst_window_seconds < 1 then
    raise exception 'Invalid usage limits';
  end if;

  insert into public.numina_usage_counters(identity, feature, usage_day, plan)
  values (p_identity, p_feature, v_day, p_plan)
  on conflict (identity, feature, usage_day) do nothing;

  select requests, burst_count, burst_reset_at
    into v_requests, v_burst_count, v_burst_reset_at
    from public.numina_usage_counters
   where identity = p_identity and feature = p_feature and usage_day = v_day
   for update;

  if v_burst_reset_at <= v_now then
    v_burst_count := 0;
    v_burst_reset_at := v_now + make_interval(secs => p_burst_window_seconds);
  end if;

  v_requests := v_requests + 1;
  v_burst_count := v_burst_count + 1;
  v_burst_allowed := v_burst_count <= p_burst_limit;
  v_daily_allowed := v_requests <= p_daily_limit;

  update public.numina_usage_counters
     set plan = p_plan,
         requests = v_requests,
         burst_count = v_burst_count,
         burst_reset_at = v_burst_reset_at,
         last_seen_at = v_now
   where identity = p_identity and feature = p_feature and usage_day = v_day;

  return jsonb_build_object(
    'allowed', v_burst_allowed and v_daily_allowed,
    'rate_limited', not v_burst_allowed,
    'used', v_requests,
    'daily_limit', p_daily_limit,
    'remaining', greatest(0, p_daily_limit - v_requests),
    'retry_after_seconds', greatest(1, ceil(extract(epoch from (v_burst_reset_at - v_now)))::integer)
  );
end;
$$;

create or replace function public.record_numina_ai_usage(
  p_identity text,
  p_feature text,
  p_usage_day date,
  p_estimated_cost_usd numeric
)
returns void
language sql
security definer
set search_path = public
as $$
  update public.numina_usage_counters
     set estimated_cost_usd = estimated_cost_usd + greatest(0, p_estimated_cost_usd),
         last_seen_at = now()
   where identity = p_identity and feature = p_feature and usage_day = p_usage_day;
$$;

revoke all on function public.consume_numina_access(text, text, text, integer, integer, integer) from public, anon, authenticated;
revoke all on function public.record_numina_ai_usage(text, text, date, numeric) from public, anon, authenticated;
grant execute on function public.consume_numina_access(text, text, text, integer, integer, integer) to service_role;
grant execute on function public.record_numina_ai_usage(text, text, date, numeric) to service_role;

notify pgrst, 'reload schema';
