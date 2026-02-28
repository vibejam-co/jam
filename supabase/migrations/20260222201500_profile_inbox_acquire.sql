DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'acquire_stage') THEN
    CREATE TYPE public.acquire_stage AS ENUM (
      'WATCHLISTED',
      'OFFER_SENT',
      'LOI_SIGNED',
      'DUE_DILIGENCE',
      'APA_SIGNED',
      'ESCROW_FUNDED',
      'CLOSED'
    );
  END IF;
END
$$;

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  listing_id uuid references public.marketplace_assets(id) on delete set null,
  buyer_id uuid not null references auth.users(id) on delete cascade,
  seller_id uuid not null references auth.users(id) on delete cascade,
  last_message_at timestamptz not null default now(),
  constraint conversations_participants_check check (buyer_id <> seller_id),
  constraint conversations_listing_buyer_seller_unique unique (listing_id, buyer_id, seller_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  constraint messages_body_length_check check (char_length(trim(body)) between 1 and 4000)
);

create table if not exists public.acquisition_pipeline_items (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid not null references public.marketplace_assets(id) on delete cascade,
  stage public.acquire_stage not null default 'WATCHLISTED',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now(),
  constraint acquisition_pipeline_items_buyer_listing_unique unique (buyer_id, listing_id)
);

create table if not exists public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid not null references public.marketplace_assets(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint wishlist_items_user_listing_unique unique (user_id, listing_id)
);

create index if not exists conversations_buyer_last_message_idx
  on public.conversations (buyer_id, last_message_at desc);
create index if not exists conversations_seller_last_message_idx
  on public.conversations (seller_id, last_message_at desc);
create index if not exists conversations_listing_idx
  on public.conversations (listing_id);

create index if not exists messages_conversation_created_idx
  on public.messages (conversation_id, created_at asc);
create index if not exists messages_conversation_unread_idx
  on public.messages (conversation_id, read_at);

create index if not exists acquisition_pipeline_buyer_stage_activity_idx
  on public.acquisition_pipeline_items (buyer_id, stage, last_activity_at desc);
create index if not exists acquisition_pipeline_listing_idx
  on public.acquisition_pipeline_items (listing_id);

create index if not exists wishlist_items_user_created_idx
  on public.wishlist_items (user_id, created_at desc);
create index if not exists wishlist_items_listing_idx
  on public.wishlist_items (listing_id);

drop trigger if exists set_updated_at_conversations on public.conversations;
create trigger set_updated_at_conversations
before update on public.conversations
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_acquisition_pipeline_items on public.acquisition_pipeline_items;
create trigger set_updated_at_acquisition_pipeline_items
before update on public.acquisition_pipeline_items
for each row execute function public.set_updated_at();

alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.acquisition_pipeline_items enable row level security;
alter table public.wishlist_items enable row level security;

DROP POLICY IF EXISTS "Participants read conversations" ON public.conversations;
CREATE POLICY "Participants read conversations"
ON public.conversations
FOR SELECT
USING (buyer_id = auth.uid() OR seller_id = auth.uid());

DROP POLICY IF EXISTS "Buyer creates conversations" ON public.conversations;
CREATE POLICY "Buyer creates conversations"
ON public.conversations
FOR INSERT
WITH CHECK (buyer_id = auth.uid() AND buyer_id <> seller_id);

DROP POLICY IF EXISTS "Participants update conversations" ON public.conversations;
CREATE POLICY "Participants update conversations"
ON public.conversations
FOR UPDATE
USING (buyer_id = auth.uid() OR seller_id = auth.uid())
WITH CHECK (buyer_id = auth.uid() OR seller_id = auth.uid());

DROP POLICY IF EXISTS "Participants read messages" ON public.messages;
CREATE POLICY "Participants read messages"
ON public.messages
FOR SELECT
USING (
  exists (
    select 1
    from public.conversations c
    where c.id = messages.conversation_id
      and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Participants send messages" ON public.messages;
CREATE POLICY "Participants send messages"
ON public.messages
FOR INSERT
WITH CHECK (
  sender_id = auth.uid()
  and exists (
    select 1
    from public.conversations c
    where c.id = messages.conversation_id
      and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Participants update messages" ON public.messages;
CREATE POLICY "Participants update messages"
ON public.messages
FOR UPDATE
USING (
  exists (
    select 1
    from public.conversations c
    where c.id = messages.conversation_id
      and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
  )
)
WITH CHECK (
  exists (
    select 1
    from public.conversations c
    where c.id = messages.conversation_id
      and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Buyer reads pipeline" ON public.acquisition_pipeline_items;
CREATE POLICY "Buyer reads pipeline"
ON public.acquisition_pipeline_items
FOR SELECT
USING (buyer_id = auth.uid());

DROP POLICY IF EXISTS "Buyer inserts pipeline" ON public.acquisition_pipeline_items;
CREATE POLICY "Buyer inserts pipeline"
ON public.acquisition_pipeline_items
FOR INSERT
WITH CHECK (buyer_id = auth.uid());

DROP POLICY IF EXISTS "Buyer updates pipeline" ON public.acquisition_pipeline_items;
CREATE POLICY "Buyer updates pipeline"
ON public.acquisition_pipeline_items
FOR UPDATE
USING (buyer_id = auth.uid())
WITH CHECK (buyer_id = auth.uid());

DROP POLICY IF EXISTS "Buyer deletes pipeline" ON public.acquisition_pipeline_items;
CREATE POLICY "Buyer deletes pipeline"
ON public.acquisition_pipeline_items
FOR DELETE
USING (buyer_id = auth.uid());

DROP POLICY IF EXISTS "User reads wishlist" ON public.wishlist_items;
CREATE POLICY "User reads wishlist"
ON public.wishlist_items
FOR SELECT
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "User inserts wishlist" ON public.wishlist_items;
CREATE POLICY "User inserts wishlist"
ON public.wishlist_items
FOR INSERT
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "User deletes wishlist" ON public.wishlist_items;
CREATE POLICY "User deletes wishlist"
ON public.wishlist_items
FOR DELETE
USING (user_id = auth.uid());
