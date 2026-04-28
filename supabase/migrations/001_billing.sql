-- Run this in your Supabase SQL editor

create table public.billing (
  id                      uuid not null default gen_random_uuid (),
  user_id                 uuid not null,
  stripe_customer_id      text null,
  stripe_subscription_id  text null,
  plan_id                 text null,
  subscription_status     text null,
  minutes_balance         integer not null default 0,
  current_period_end      timestamp without time zone null,
  updated_at              timestamp without time zone not null default now(),
  constraint billing_pkey primary key (id),
  constraint billing_user_id_key unique (user_id),
  constraint billing_stripe_customer_id_key unique (stripe_customer_id),
  constraint billing_stripe_subscription_id_key unique (stripe_subscription_id)
) tablespace pg_default;

-- RLS: users can read their own billing row
alter table public.billing enable row level security;

create policy "billing_select_own"
  on public.billing for select
  using (auth.uid() = user_id);

create policy "billing_service_write"
  on public.billing for all
  using (auth.role() = 'service_role');

-- Auto-update updated_at on change
create or replace function public.update_billing_timestamp()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists billing_updated_at on public.billing;
create trigger billing_updated_at
  before update on public.billing
  for each row execute function public.update_billing_timestamp();

-- RPC: safely add minutes (called by webhook via service role)
create or replace function public.add_minutes(p_user_id uuid, p_minutes integer)
returns void language plpgsql security definer as $$
begin
  insert into public.billing (user_id, minutes_balance)
  values (p_user_id, greatest(0, p_minutes))
  on conflict (user_id) do update
    set minutes_balance = greatest(0, public.billing.minutes_balance + p_minutes);
end;
$$;

-- Trigger: deduct minutes after each call_log insert (single-tenant: one billing row)
create or replace function public.deduct_call_minutes()
returns trigger language plpgsql security definer as $$
declare
  v_minutes integer;
begin
  v_minutes := greatest(1, ceil(coalesce(new.duration, 0) / 60.0)::integer);
  update public.billing
  set minutes_balance = greatest(0, minutes_balance - v_minutes);
  return new;
end;
$$;

drop trigger if exists deduct_minutes_on_call on public.call_logs;
create trigger deduct_minutes_on_call
  after insert on public.call_logs
  for each row execute function public.deduct_call_minutes();
