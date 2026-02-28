create extension if not exists pgcrypto;
create extension if not exists citext;

-- Enums
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'marketplace_visibility') THEN
    CREATE TYPE public.marketplace_visibility AS ENUM ('public', 'members_only', 'private');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'marketplace_verified_status') THEN
    CREATE TYPE public.marketplace_verified_status AS ENUM ('unverified', 'pending', 'verified', 'error');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'marketplace_provider') THEN
    CREATE TYPE public.marketplace_provider AS ENUM ('stripe', 'lemonsqueezy', 'polar', 'dodo', 'revenuecat');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'connection_status') THEN
    CREATE TYPE public.connection_status AS ENUM ('active', 'revoked', 'error');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'offer_status') THEN
    CREATE TYPE public.offer_status AS ENUM ('sent', 'viewed', 'accepted', 'rejected', 'countered');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'deal_stage') THEN
    CREATE TYPE public.deal_stage AS ENUM (
      'offer_received',
      'loi_signed',
      'due_diligence',
      'apa_signed',
      'escrow_funded',
      'closed',
      'lost'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'boost_tier') THEN
    CREATE TYPE public.boost_tier AS ENUM ('free', 'pro', 'elite');
  END IF;
END
$$;

create table if not exists public.marketplace_assets (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  jam_id uuid references public.jams(id) on delete set null,
  slug text not null unique,
  name text not null,
  tagline text not null default '',
  description text not null default '',
  logo_url text,
  category text not null,
  subcategory text,
  tech_stack text[] not null default '{}',
  founder_name text not null default '',
  founder_email citext,
  asking_price_cents integer not null default 0,
  currency text not null default 'USD',
  is_listed boolean not null default false,
  is_anonymous boolean not null default false,
  visibility public.marketplace_visibility not null default 'public',
  verified_status public.marketplace_verified_status not null default 'unverified',
  last30d_revenue_cents integer not null default 0,
  last30d_growth_bps integer not null default 0,
  mrr_cents integer not null default 0,
  profit_margin_bps integer,
  valuation_multiple_x100 integer,
  metrics_updated_at timestamptz,
  search_vector tsvector generated always as (
    to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(tagline, '') || ' ' || coalesce(description, ''))
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_connections (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  asset_id uuid not null references public.marketplace_assets(id) on delete cascade,
  provider public.marketplace_provider not null,
  encrypted_api_key text not null,
  key_fingerprint text not null,
  status public.connection_status not null default 'active',
  status_message text,
  failure_count integer not null default 0,
  next_retry_at timestamptz,
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (asset_id, provider)
);

create table if not exists public.revenue_snapshots (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.marketplace_assets(id) on delete cascade,
  provider public.marketplace_provider not null,
  period_start timestamptz not null,
  period_end timestamptz not null,
  revenue_cents integer not null default 0,
  mrr_cents integer not null default 0,
  active_subscribers integer not null default 0,
  churn_bps integer,
  created_at timestamptz not null default now()
);

create table if not exists public.offers (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.marketplace_assets(id) on delete cascade,
  buyer_user_id uuid not null references auth.users(id) on delete cascade,
  seller_user_id uuid not null references auth.users(id) on delete cascade,
  offer_price_cents integer not null,
  message text not null default '',
  status public.offer_status not null default 'sent',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.deal_pipeline (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.offers(id) on delete cascade,
  stage public.deal_stage not null default 'offer_received',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.boosts (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.marketplace_assets(id) on delete cascade,
  tier public.boost_tier not null default 'free',
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.marketplace_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  asset_id uuid references public.marketplace_assets(id) on delete set null,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.notifications
  add column if not exists recipient_user_id uuid references auth.users(id) on delete cascade;

alter table public.notifications
  add column if not exists metadata jsonb not null default '{}'::jsonb;

-- Indexes
create index if not exists marketplace_assets_is_listed_idx on public.marketplace_assets (is_listed);
create index if not exists marketplace_assets_visibility_idx on public.marketplace_assets (visibility);
create index if not exists marketplace_assets_verified_status_idx on public.marketplace_assets (verified_status);
create index if not exists marketplace_assets_category_idx on public.marketplace_assets (category);
create index if not exists marketplace_assets_asking_price_idx on public.marketplace_assets (asking_price_cents desc);
create index if not exists marketplace_assets_mrr_idx on public.marketplace_assets (mrr_cents desc);
create index if not exists marketplace_assets_last30d_idx on public.marketplace_assets (last30d_revenue_cents desc);
create index if not exists marketplace_assets_multiple_idx on public.marketplace_assets (valuation_multiple_x100 desc nulls last);
create index if not exists marketplace_assets_owner_idx on public.marketplace_assets (owner_user_id, created_at desc);
create index if not exists marketplace_assets_search_gin_idx on public.marketplace_assets using gin (search_vector);

create index if not exists payment_connections_owner_idx on public.payment_connections (owner_user_id, created_at desc);
create index if not exists payment_connections_asset_idx on public.payment_connections (asset_id, provider);
create index if not exists payment_connections_status_idx on public.payment_connections (status, next_retry_at);

create index if not exists revenue_snapshots_asset_period_idx on public.revenue_snapshots (asset_id, period_end desc);
create index if not exists offers_seller_idx on public.offers (seller_user_id, created_at desc);
create index if not exists offers_buyer_idx on public.offers (buyer_user_id, created_at desc);
create index if not exists offers_asset_idx on public.offers (asset_id, created_at desc);
create index if not exists deal_pipeline_offer_idx on public.deal_pipeline (offer_id, updated_at desc);
create index if not exists boosts_asset_idx on public.boosts (asset_id, starts_at desc);
create index if not exists notifications_recipient_idx on public.notifications (recipient_user_id, created_at desc);
create index if not exists marketplace_audit_logs_asset_idx on public.marketplace_audit_logs (asset_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at_marketplace_assets on public.marketplace_assets;
create trigger set_updated_at_marketplace_assets
before update on public.marketplace_assets
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_payment_connections on public.payment_connections;
create trigger set_updated_at_payment_connections
before update on public.payment_connections
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_offers on public.offers;
create trigger set_updated_at_offers
before update on public.offers
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_deal_pipeline on public.deal_pipeline;
create trigger set_updated_at_deal_pipeline
before update on public.deal_pipeline
for each row execute function public.set_updated_at();

-- RLS
alter table public.marketplace_assets enable row level security;
alter table public.payment_connections enable row level security;
alter table public.revenue_snapshots enable row level security;
alter table public.offers enable row level security;
alter table public.deal_pipeline enable row level security;
alter table public.boosts enable row level security;
alter table public.marketplace_audit_logs enable row level security;

-- marketplace_assets
DROP POLICY IF EXISTS "Public read listed marketplace assets" ON public.marketplace_assets;
CREATE POLICY "Public read listed marketplace assets"
ON public.marketplace_assets
FOR SELECT
USING (
  (is_listed = true AND visibility = 'public')
  OR owner_user_id = auth.uid()
  OR (
    is_listed = true
    AND visibility = 'members_only'
    AND auth.role() = 'authenticated'
    AND coalesce((auth.jwt() ->> 'is_member')::boolean, false) = true
  )
);

DROP POLICY IF EXISTS "Owners insert marketplace assets" ON public.marketplace_assets;
CREATE POLICY "Owners insert marketplace assets"
ON public.marketplace_assets
FOR INSERT
WITH CHECK (owner_user_id = auth.uid());

DROP POLICY IF EXISTS "Owners update marketplace assets" ON public.marketplace_assets;
CREATE POLICY "Owners update marketplace assets"
ON public.marketplace_assets
FOR UPDATE
USING (owner_user_id = auth.uid())
WITH CHECK (owner_user_id = auth.uid());

DROP POLICY IF EXISTS "Owners delete marketplace assets" ON public.marketplace_assets;
CREATE POLICY "Owners delete marketplace assets"
ON public.marketplace_assets
FOR DELETE
USING (owner_user_id = auth.uid());

-- payment_connections
DROP POLICY IF EXISTS "Owners read payment connections" ON public.payment_connections;
CREATE POLICY "Owners read payment connections"
ON public.payment_connections
FOR SELECT
USING (owner_user_id = auth.uid());

DROP POLICY IF EXISTS "Owners insert payment connections" ON public.payment_connections;
CREATE POLICY "Owners insert payment connections"
ON public.payment_connections
FOR INSERT
WITH CHECK (owner_user_id = auth.uid());

DROP POLICY IF EXISTS "Owners update payment connections" ON public.payment_connections;
CREATE POLICY "Owners update payment connections"
ON public.payment_connections
FOR UPDATE
USING (owner_user_id = auth.uid())
WITH CHECK (owner_user_id = auth.uid());

DROP POLICY IF EXISTS "Owners delete payment connections" ON public.payment_connections;
CREATE POLICY "Owners delete payment connections"
ON public.payment_connections
FOR DELETE
USING (owner_user_id = auth.uid());

-- revenue_snapshots
DROP POLICY IF EXISTS "Readable revenue snapshots for readable assets" ON public.revenue_snapshots;
CREATE POLICY "Readable revenue snapshots for readable assets"
ON public.revenue_snapshots
FOR SELECT
USING (
  exists (
    select 1
    from public.marketplace_assets a
    where a.id = revenue_snapshots.asset_id
      and (
        (a.is_listed = true and a.visibility = 'public')
        or a.owner_user_id = auth.uid()
        or (
          a.is_listed = true
          and a.visibility = 'members_only'
          and auth.role() = 'authenticated'
          and coalesce((auth.jwt() ->> 'is_member')::boolean, false) = true
        )
      )
  )
);

-- offers
DROP POLICY IF EXISTS "Participants read offers" ON public.offers;
CREATE POLICY "Participants read offers"
ON public.offers
FOR SELECT
USING (buyer_user_id = auth.uid() OR seller_user_id = auth.uid());

DROP POLICY IF EXISTS "Buyer insert offers" ON public.offers;
CREATE POLICY "Buyer insert offers"
ON public.offers
FOR INSERT
WITH CHECK (buyer_user_id = auth.uid());

DROP POLICY IF EXISTS "Participants update offers" ON public.offers;
CREATE POLICY "Participants update offers"
ON public.offers
FOR UPDATE
USING (buyer_user_id = auth.uid() OR seller_user_id = auth.uid())
WITH CHECK (buyer_user_id = auth.uid() OR seller_user_id = auth.uid());

-- deal_pipeline
DROP POLICY IF EXISTS "Participants read deal pipeline" ON public.deal_pipeline;
CREATE POLICY "Participants read deal pipeline"
ON public.deal_pipeline
FOR SELECT
USING (
  exists (
    select 1 from public.offers o
    where o.id = deal_pipeline.offer_id
      and (o.buyer_user_id = auth.uid() OR o.seller_user_id = auth.uid())
  )
);

-- boosts
DROP POLICY IF EXISTS "Readable boosts for readable assets" ON public.boosts;
CREATE POLICY "Readable boosts for readable assets"
ON public.boosts
FOR SELECT
USING (
  exists (
    select 1
    from public.marketplace_assets a
    where a.id = boosts.asset_id
      and (
        (a.is_listed = true and a.visibility = 'public')
        or a.owner_user_id = auth.uid()
        or (
          a.is_listed = true
          and a.visibility = 'members_only'
          and auth.role() = 'authenticated'
          and coalesce((auth.jwt() ->> 'is_member')::boolean, false) = true
        )
      )
  )
);

-- marketplace_audit_logs
DROP POLICY IF EXISTS "Owners read marketplace audit logs" ON public.marketplace_audit_logs;
CREATE POLICY "Owners read marketplace audit logs"
ON public.marketplace_audit_logs
FOR SELECT
USING (
  actor_user_id = auth.uid()
  OR exists (
    select 1 from public.marketplace_assets a
    where a.id = marketplace_audit_logs.asset_id
      and a.owner_user_id = auth.uid()
  )
);
