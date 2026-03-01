create table if not exists public.buyer_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  min_mrr_cents integer not null default 0,
  max_price_cents integer,
  min_profit_margin_bps integer not null default 0,
  created_at timestamptz not null default now(),
  constraint buyer_alerts_min_mrr_non_negative check (min_mrr_cents >= 0),
  constraint buyer_alerts_max_price_non_negative check (max_price_cents is null or max_price_cents >= 0),
  constraint buyer_alerts_min_margin_range check (min_profit_margin_bps >= 0 and min_profit_margin_bps <= 10000)
);

create index if not exists buyer_alerts_user_created_idx
  on public.buyer_alerts (user_id, created_at desc);

create index if not exists buyer_alerts_match_idx
  on public.buyer_alerts (min_mrr_cents, max_price_cents, min_profit_margin_bps);

alter table public.buyer_alerts enable row level security;

drop policy if exists "Users read own buyer alerts" on public.buyer_alerts;
create policy "Users read own buyer alerts"
on public.buyer_alerts
for select
using (user_id = auth.uid());

drop policy if exists "Users insert own buyer alerts" on public.buyer_alerts;
create policy "Users insert own buyer alerts"
on public.buyer_alerts
for insert
with check (user_id = auth.uid());

drop policy if exists "Users update own buyer alerts" on public.buyer_alerts;
create policy "Users update own buyer alerts"
on public.buyer_alerts
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users delete own buyer alerts" on public.buyer_alerts;
create policy "Users delete own buyer alerts"
on public.buyer_alerts
for delete
using (user_id = auth.uid());
