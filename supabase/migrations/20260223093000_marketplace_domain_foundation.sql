DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'marketplace_asset_type') THEN
    CREATE TYPE public.marketplace_asset_type AS ENUM ('SAAS', 'ECOM', 'MOBILE_APP', 'NEWSLETTER');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'marketplace_listing_status') THEN
    CREATE TYPE public.marketplace_listing_status AS ENUM ('DRAFT', 'LISTED', 'PAUSED', 'SOLD');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'marketplace_offer_status') THEN
    CREATE TYPE public.marketplace_offer_status AS ENUM ('OFFER_MADE', 'ACCEPTED', 'REJECTED', 'COUNTERED', 'WITHDRAWN');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'marketplace_pipeline_stage') THEN
    CREATE TYPE public.marketplace_pipeline_stage AS ENUM (
      'OFFER_RECEIVED',
      'LOI_SIGNED',
      'DUE_DILIGENCE',
      'APA_SIGNED',
      'ESCROW_FUNDED',
      'TRANSFER_IN_PROGRESS',
      'CLOSED',
      'CANCELLED'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'marketplace_audit_severity') THEN
    CREATE TYPE public.marketplace_audit_severity AS ENUM ('INFO', 'WARN', 'BLOCK');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'marketplace_domain_visibility') THEN
    CREATE TYPE public.marketplace_domain_visibility AS ENUM ('PUBLIC', 'PRIVATE');
  END IF;
END
$$;

ALTER TABLE public.marketplace_assets
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS asset_type public.marketplace_asset_type NOT NULL DEFAULT 'SAAS',
  ADD COLUMN IF NOT EXISTS listing_status public.marketplace_listing_status NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN IF NOT EXISTS trailing_30d_revenue_cents bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS trailing_30d_profit_cents bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS trailing_30d_expenses_cents bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS profit_margin_pct numeric(8, 2),
  ADD COLUMN IF NOT EXISTS domain_visibility public.marketplace_domain_visibility NOT NULL DEFAULT 'PUBLIC';

UPDATE public.marketplace_assets
SET title = COALESCE(NULLIF(title, ''), name, '')
WHERE title IS NULL OR title = '';

UPDATE public.marketplace_assets
SET listing_status = CASE
  WHEN is_listed = true THEN 'LISTED'::public.marketplace_listing_status
  WHEN listing_status IS NULL THEN 'DRAFT'::public.marketplace_listing_status
  ELSE listing_status
END;

UPDATE public.marketplace_assets
SET trailing_30d_revenue_cents = COALESCE(last30d_revenue_cents, 0)
WHERE trailing_30d_revenue_cents IS NULL OR trailing_30d_revenue_cents = 0;

UPDATE public.marketplace_assets
SET trailing_30d_profit_cents = COALESCE(trailing_30d_revenue_cents, 0) - COALESCE(trailing_30d_expenses_cents, 0);

UPDATE public.marketplace_assets
SET profit_margin_pct = CASE
  WHEN COALESCE(trailing_30d_revenue_cents, 0) <= 0 THEN NULL
  ELSE ROUND(
    GREATEST(
      LEAST(
        ((COALESCE(trailing_30d_profit_cents, 0)::numeric / NULLIF(trailing_30d_revenue_cents, 0)::numeric) * 100),
        100
      ),
      0
    ),
    2
  )
END;

UPDATE public.marketplace_assets
SET domain_visibility = CASE
  WHEN visibility = 'private'::public.marketplace_visibility THEN 'PRIVATE'::public.marketplace_domain_visibility
  ELSE 'PUBLIC'::public.marketplace_domain_visibility
END
WHERE domain_visibility IS NULL;

ALTER TABLE public.marketplace_assets
  ALTER COLUMN title SET NOT NULL;

CREATE INDEX IF NOT EXISTS marketplace_assets_listing_status_idx
  ON public.marketplace_assets (listing_status, created_at DESC);
CREATE INDEX IF NOT EXISTS marketplace_assets_asset_type_idx
  ON public.marketplace_assets (asset_type);
CREATE INDEX IF NOT EXISTS marketplace_assets_domain_visibility_idx
  ON public.marketplace_assets (domain_visibility);

CREATE TABLE IF NOT EXISTS public.marketplace_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES public.marketplace_assets(id) ON DELETE CASCADE,
  buyer_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  offer_price_cents bigint NOT NULL CHECK (offer_price_cents > 0),
  message text NOT NULL DEFAULT '',
  status public.marketplace_offer_status NOT NULL DEFAULT 'OFFER_MADE',
  legacy_offer_id uuid UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT marketplace_offers_participants_check CHECK (buyer_user_id <> seller_user_id)
);

CREATE INDEX IF NOT EXISTS marketplace_offers_asset_idx
  ON public.marketplace_offers (asset_id, created_at DESC);
CREATE INDEX IF NOT EXISTS marketplace_offers_buyer_idx
  ON public.marketplace_offers (buyer_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS marketplace_offers_seller_idx
  ON public.marketplace_offers (seller_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS marketplace_offers_status_idx
  ON public.marketplace_offers (status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.marketplace_deal_pipeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES public.marketplace_assets(id) ON DELETE CASCADE,
  buyer_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stage public.marketplace_pipeline_stage NOT NULL DEFAULT 'OFFER_RECEIVED',
  escrow_transaction_id text,
  nda_doc_id text,
  loi_doc_id text,
  apa_doc_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT marketplace_deal_pipeline_participants_check CHECK (buyer_user_id <> seller_user_id),
  CONSTRAINT marketplace_deal_pipeline_unique_participants UNIQUE (asset_id, buyer_user_id, seller_user_id)
);

CREATE INDEX IF NOT EXISTS marketplace_deal_pipeline_buyer_stage_idx
  ON public.marketplace_deal_pipeline (buyer_user_id, stage, updated_at DESC);
CREATE INDEX IF NOT EXISTS marketplace_deal_pipeline_seller_stage_idx
  ON public.marketplace_deal_pipeline (seller_user_id, stage, updated_at DESC);
CREATE INDEX IF NOT EXISTS marketplace_deal_pipeline_asset_idx
  ON public.marketplace_deal_pipeline (asset_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS public.marketplace_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL,
  asset_id uuid REFERENCES public.marketplace_assets(id) ON DELETE SET NULL,
  sender_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT marketplace_messages_body_check CHECK (char_length(trim(body)) BETWEEN 1 AND 4000)
);

CREATE INDEX IF NOT EXISTS marketplace_messages_thread_idx
  ON public.marketplace_messages (thread_id, created_at ASC);
CREATE INDEX IF NOT EXISTS marketplace_messages_sender_idx
  ON public.marketplace_messages (sender_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS marketplace_messages_recipient_idx
  ON public.marketplace_messages (recipient_user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.marketplace_metrics_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES public.marketplace_assets(id) ON DELETE CASCADE,
  snapshot_at timestamptz NOT NULL DEFAULT now(),
  trailing_30d_revenue_cents bigint NOT NULL DEFAULT 0,
  trailing_30d_profit_cents bigint NOT NULL DEFAULT 0,
  trailing_30d_expenses_cents bigint NOT NULL DEFAULT 0,
  visitors_30d integer,
  pageviews_30d integer,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS marketplace_metrics_snapshots_asset_idx
  ON public.marketplace_metrics_snapshots (asset_id, snapshot_at DESC);

ALTER TABLE public.marketplace_audit_logs
  ADD COLUMN IF NOT EXISTS severity public.marketplace_audit_severity NOT NULL DEFAULT 'INFO',
  ADD COLUMN IF NOT EXISTS reason text;

UPDATE public.marketplace_audit_logs
SET reason = COALESCE(NULLIF(reason, ''), action)
WHERE reason IS NULL OR reason = '';

DROP TRIGGER IF EXISTS set_updated_at_marketplace_offers ON public.marketplace_offers;
CREATE TRIGGER set_updated_at_marketplace_offers
BEFORE UPDATE ON public.marketplace_offers
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_marketplace_deal_pipeline ON public.marketplace_deal_pipeline;
CREATE TRIGGER set_updated_at_marketplace_deal_pipeline
BEFORE UPDATE ON public.marketplace_deal_pipeline
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.marketplace_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_deal_pipeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_metrics_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read listed marketplace assets v2" ON public.marketplace_assets;
CREATE POLICY "Public read listed marketplace assets v2"
ON public.marketplace_assets
FOR SELECT
USING (
  owner_user_id = auth.uid()
  OR (listing_status = 'LISTED'::public.marketplace_listing_status AND domain_visibility = 'PUBLIC'::public.marketplace_domain_visibility)
);

DROP POLICY IF EXISTS "Marketplace offer participants read" ON public.marketplace_offers;
CREATE POLICY "Marketplace offer participants read"
ON public.marketplace_offers
FOR SELECT
USING (buyer_user_id = auth.uid() OR seller_user_id = auth.uid());

DROP POLICY IF EXISTS "Marketplace buyer creates offers" ON public.marketplace_offers;
CREATE POLICY "Marketplace buyer creates offers"
ON public.marketplace_offers
FOR INSERT
WITH CHECK (buyer_user_id = auth.uid() AND buyer_user_id <> seller_user_id);

DROP POLICY IF EXISTS "Marketplace participants update offers" ON public.marketplace_offers;
CREATE POLICY "Marketplace participants update offers"
ON public.marketplace_offers
FOR UPDATE
USING (buyer_user_id = auth.uid() OR seller_user_id = auth.uid())
WITH CHECK (buyer_user_id = auth.uid() OR seller_user_id = auth.uid());

DROP POLICY IF EXISTS "Marketplace participants delete offers" ON public.marketplace_offers;
CREATE POLICY "Marketplace participants delete offers"
ON public.marketplace_offers
FOR DELETE
USING (buyer_user_id = auth.uid() OR seller_user_id = auth.uid());

DROP POLICY IF EXISTS "Marketplace participants read pipeline" ON public.marketplace_deal_pipeline;
CREATE POLICY "Marketplace participants read pipeline"
ON public.marketplace_deal_pipeline
FOR SELECT
USING (buyer_user_id = auth.uid() OR seller_user_id = auth.uid());

DROP POLICY IF EXISTS "Marketplace participants insert pipeline" ON public.marketplace_deal_pipeline;
CREATE POLICY "Marketplace participants insert pipeline"
ON public.marketplace_deal_pipeline
FOR INSERT
WITH CHECK (buyer_user_id = auth.uid() OR seller_user_id = auth.uid());

DROP POLICY IF EXISTS "Marketplace participants update pipeline" ON public.marketplace_deal_pipeline;
CREATE POLICY "Marketplace participants update pipeline"
ON public.marketplace_deal_pipeline
FOR UPDATE
USING (buyer_user_id = auth.uid() OR seller_user_id = auth.uid())
WITH CHECK (buyer_user_id = auth.uid() OR seller_user_id = auth.uid());

DROP POLICY IF EXISTS "Marketplace participants delete pipeline" ON public.marketplace_deal_pipeline;
CREATE POLICY "Marketplace participants delete pipeline"
ON public.marketplace_deal_pipeline
FOR DELETE
USING (buyer_user_id = auth.uid() OR seller_user_id = auth.uid());

DROP POLICY IF EXISTS "Marketplace participants read messages" ON public.marketplace_messages;
CREATE POLICY "Marketplace participants read messages"
ON public.marketplace_messages
FOR SELECT
USING (sender_user_id = auth.uid() OR recipient_user_id = auth.uid());

DROP POLICY IF EXISTS "Marketplace authenticated send messages" ON public.marketplace_messages;
CREATE POLICY "Marketplace authenticated send messages"
ON public.marketplace_messages
FOR INSERT
WITH CHECK (auth.role() = 'authenticated' AND sender_user_id = auth.uid());

DROP POLICY IF EXISTS "Marketplace sender update own messages" ON public.marketplace_messages;
CREATE POLICY "Marketplace sender update own messages"
ON public.marketplace_messages
FOR UPDATE
USING (sender_user_id = auth.uid())
WITH CHECK (sender_user_id = auth.uid());

DROP POLICY IF EXISTS "Marketplace sender delete own messages" ON public.marketplace_messages;
CREATE POLICY "Marketplace sender delete own messages"
ON public.marketplace_messages
FOR DELETE
USING (sender_user_id = auth.uid());

DROP POLICY IF EXISTS "Marketplace visible asset metrics read" ON public.marketplace_metrics_snapshots;
CREATE POLICY "Marketplace visible asset metrics read"
ON public.marketplace_metrics_snapshots
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.marketplace_assets a
    WHERE a.id = marketplace_metrics_snapshots.asset_id
      AND (
        a.owner_user_id = auth.uid()
        OR (a.listing_status = 'LISTED'::public.marketplace_listing_status AND a.domain_visibility = 'PUBLIC'::public.marketplace_domain_visibility)
      )
  )
);

