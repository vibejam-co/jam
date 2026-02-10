create extension if not exists pgcrypto;
create extension if not exists citext;

create table if not exists public.jams (
  id uuid primary key default gen_random_uuid(),
  rank text,
  name text not null,
  pitch text not null,
  icon text not null,
  accent_color text not null default '124, 58, 237',
  monthly_revenue bigint not null default 0,
  lifetime_revenue bigint not null default 0,
  active_users integer not null default 0,
  build_streak integer not null default 0,
  growth numeric(8, 2) not null default 0,
  tags text[] not null default '{}',
  verified boolean not null default false,
  category text not null,
  founder_name text not null,
  founder_handle text not null,
  founder_avatar text not null,
  founder_email citext,
  tech_stack text[] not null default '{}',
  problem text not null default '',
  solution text not null default '',
  pricing text not null default '',
  is_for_sale boolean not null default false,
  asking_price text,
  profit_margin numeric(8, 2),
  is_anonymous boolean not null default false,
  boost_tier text check (boost_tier in ('Free', 'Pro', 'Elite')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jam_revenue_history (
  id bigserial primary key,
  jam_id uuid not null references public.jams(id) on delete cascade,
  period_label text not null,
  revenue bigint not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  type text not null check (type in ('wishlist', 'offer', 'system', 'update')),
  timestamp_label text not null,
  is_read boolean not null default false,
  jam_id uuid references public.jams(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.newsletter_subscriptions (
  id uuid primary key default gen_random_uuid(),
  email citext not null unique,
  source text not null default 'vibejam-web',
  created_at timestamptz not null default now()
);

create table if not exists public.canvas_profiles (
  id uuid primary key default gen_random_uuid(),
  claimed_name text not null,
  display_name text not null,
  bio text not null default '',
  avatar_url text not null default '',
  selected_theme text not null,
  selected_signals text[] not null default '{}',
  links jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists jams_monthly_revenue_idx on public.jams (monthly_revenue desc);
create index if not exists jams_created_at_idx on public.jams (created_at desc);
create index if not exists jam_revenue_history_jam_id_idx on public.jam_revenue_history (jam_id, sort_order);
create index if not exists notifications_created_at_idx on public.notifications (created_at desc);
create index if not exists canvas_profiles_created_at_idx on public.canvas_profiles (created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at_jams on public.jams;
create trigger set_updated_at_jams
before update on public.jams
for each row
execute function public.set_updated_at();

drop trigger if exists set_updated_at_canvas_profiles on public.canvas_profiles;
create trigger set_updated_at_canvas_profiles
before update on public.canvas_profiles
for each row
execute function public.set_updated_at();

alter table public.jams enable row level security;
alter table public.jam_revenue_history enable row level security;
alter table public.notifications enable row level security;
alter table public.newsletter_subscriptions enable row level security;
alter table public.canvas_profiles enable row level security;

drop policy if exists "Public read jams" on public.jams;
create policy "Public read jams"
on public.jams
for select
using (true);

drop policy if exists "Public read jam revenue history" on public.jam_revenue_history;
create policy "Public read jam revenue history"
on public.jam_revenue_history
for select
using (true);

drop policy if exists "Public read notifications" on public.notifications;
create policy "Public read notifications"
on public.notifications
for select
using (true);
