-- Migration 002: overage tracking, auto top-up flag, updated deduct trigger

-- New columns
alter table public.billing
  add column if not exists overage_minutes   integer not null default 0,
  add column if not exists auto_topup_pending boolean not null default false;

-- Updated deduct trigger: tracks overage when balance hits 0
create or replace function public.deduct_call_minutes()
returns trigger language plpgsql security definer as $$
declare
  v_minutes integer;
begin
  v_minutes := greatest(1, ceil(coalesce(new.duration, 0) / 60.0)::integer);

  update public.billing
  set
    overage_minutes = overage_minutes + greatest(0, v_minutes - minutes_balance),
    minutes_balance = greatest(0, minutes_balance - v_minutes);

  return new;
end;
$$;

drop trigger if exists deduct_minutes_on_call on public.call_logs;
create trigger deduct_minutes_on_call
  after insert on public.call_logs
  for each row execute function public.deduct_call_minutes();

-- -----------------------------------------------------------------------
-- OPTIONAL: Auto top-up via pg_net (Supabase managed extension)
--
-- Step 1: Enable pg_net in Supabase Dashboard → Database → Extensions
--
-- Step 2: Set these in Supabase Dashboard → Settings → Database → Config:
--   app.auto_topup_url  = https://your-app.vercel.app/api/billing/auto-topup
--   app.auto_topup_secret = <your AUTO_TOPUP_SECRET env var value>
--
-- Step 3: Uncomment and run the function + trigger below:
-- -----------------------------------------------------------------------

-- create or replace function public.trigger_auto_topup()
-- returns trigger language plpgsql security definer as $$
-- declare
--   v_user_id uuid;
--   v_balance integer;
--   v_plan_id text;
--   v_plan_minutes integer;
-- begin
--   select user_id, minutes_balance, plan_id
--   into v_user_id, v_balance, v_plan_id
--   from public.billing limit 1;
--
--   if v_plan_id is null then return new; end if;
--
--   v_plan_minutes := case v_plan_id
--     when 'starter' then 500
--     when 'growth'  then 1000
--     when 'pro'     then 2000
--     else 0
--   end;
--
--   if v_plan_minutes > 0 and v_balance <= floor(v_plan_minutes * 0.20) then
--     perform net.http_post(
--       url     := current_setting('app.auto_topup_url'),
--       body    := json_build_object('userId', v_user_id)::text::jsonb,
--       headers := json_build_object(
--         'Content-Type',  'application/json',
--         'Authorization', 'Bearer ' || current_setting('app.auto_topup_secret')
--       )::jsonb
--     );
--   end if;
--
--   return new;
-- end;
-- $$;
--
-- drop trigger if exists auto_topup_check on public.call_logs;
-- create trigger auto_topup_check
--   after insert on public.call_logs
--   for each row execute function public.trigger_auto_topup();
