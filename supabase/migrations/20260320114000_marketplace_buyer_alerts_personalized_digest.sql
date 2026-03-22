alter table public.buyer_alerts
  add column if not exists category text,
  add column if not exists verified_only boolean not null default false,
  add column if not exists max_churn_bps integer,
  add column if not exists min_traffic integer,
  add column if not exists include_alpha_digest boolean not null default true,
  add column if not exists digest_frequency text not null default 'weekly',
  add column if not exists last_digest_sent_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'buyer_alerts_max_churn_range'
  ) then
    alter table public.buyer_alerts
      add constraint buyer_alerts_max_churn_range
      check (max_churn_bps is null or (max_churn_bps >= 0 and max_churn_bps <= 100000));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'buyer_alerts_min_traffic_non_negative'
  ) then
    alter table public.buyer_alerts
      add constraint buyer_alerts_min_traffic_non_negative
      check (min_traffic is null or min_traffic >= 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'buyer_alerts_digest_frequency_check'
  ) then
    alter table public.buyer_alerts
      add constraint buyer_alerts_digest_frequency_check
      check (digest_frequency in ('weekly', 'daily', 'off'));
  end if;
end $$;

create index if not exists buyer_alerts_digest_due_idx
  on public.buyer_alerts (include_alpha_digest, digest_frequency, last_digest_sent_at);

create index if not exists buyer_alerts_match_extended_idx
  on public.buyer_alerts (
    min_mrr_cents,
    max_price_cents,
    min_profit_margin_bps,
    category,
    verified_only,
    max_churn_bps,
    min_traffic
  );
