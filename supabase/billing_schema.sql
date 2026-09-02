-- Apply after auth_schema.sql. Stripe webhook writes with the service role;
-- signed-in users can only read their own billing records.
create table if not exists public.numina_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  status text not null default 'inactive',
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.numina_payment_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_event_id text unique not null,
  amount integer not null default 0,
  currency text not null default 'usd',
  status text not null,
  description text,
  created_at timestamptz not null default now()
);

alter table public.numina_subscriptions enable row level security;
alter table public.numina_payment_events enable row level security;

create policy "Users can view own subscription"
on public.numina_subscriptions for select using (auth.uid() = user_id);
create policy "Users can view own payment history"
on public.numina_payment_events for select using (auth.uid() = user_id);

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
