-- Allow abandoned PayPal approval flows to expire and be explicitly cleared.
-- Apply this migration before deploying the matching application code.

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

revoke all on function public.reserve_numina_checkout(uuid, text) from public, anon, authenticated;
revoke all on function public.abandon_numina_paypal_checkout(uuid) from public, anon, authenticated;
grant execute on function public.reserve_numina_checkout(uuid, text) to service_role;
grant execute on function public.abandon_numina_paypal_checkout(uuid) to service_role;

notify pgrst, 'reload schema';
