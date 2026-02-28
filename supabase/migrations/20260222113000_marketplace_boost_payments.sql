DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'boost_payment_status') THEN
    CREATE TYPE public.boost_payment_status AS ENUM ('pending', 'paid', 'failed', 'expired');
  END IF;
END
$$;

create table if not exists public.boost_payments (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.marketplace_assets(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  tier public.boost_tier not null,
  amount_cents integer not null default 0,
  currency text not null default 'USD',
  dodo_checkout_id text not null unique,
  dodo_checkout_url text not null,
  dodo_payment_id text,
  status public.boost_payment_status not null default 'pending',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists boost_payments_asset_idx on public.boost_payments (asset_id, created_at desc);
create index if not exists boost_payments_owner_idx on public.boost_payments (owner_user_id, created_at desc);
create index if not exists boost_payments_status_idx on public.boost_payments (status, updated_at desc);

drop trigger if exists set_updated_at_boost_payments on public.boost_payments;
create trigger set_updated_at_boost_payments
before update on public.boost_payments
for each row execute function public.set_updated_at();

alter table public.boost_payments enable row level security;

DROP POLICY IF EXISTS "Owners read boost payments" ON public.boost_payments;
CREATE POLICY "Owners read boost payments"
ON public.boost_payments
FOR SELECT
USING (owner_user_id = auth.uid());

DROP POLICY IF EXISTS "Owners insert boost payments" ON public.boost_payments;
CREATE POLICY "Owners insert boost payments"
ON public.boost_payments
FOR INSERT
WITH CHECK (owner_user_id = auth.uid());

DROP POLICY IF EXISTS "Owners update boost payments" ON public.boost_payments;
CREATE POLICY "Owners update boost payments"
ON public.boost_payments
FOR UPDATE
USING (owner_user_id = auth.uid())
WITH CHECK (owner_user_id = auth.uid());
