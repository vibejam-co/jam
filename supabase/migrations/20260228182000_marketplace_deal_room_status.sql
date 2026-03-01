DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'marketplace_deal_room_status') THEN
    CREATE TYPE public.marketplace_deal_room_status AS ENUM (
      'PENDING',
      'ACCEPTED',
      'LOI_SIGNED',
      'DUE_DILIGENCE',
      'APA_SIGNED',
      'ESCROW_FUNDED',
      'ASSETS_TRANSFERRED',
      'CLOSED',
      'REJECTED'
    );
  END IF;
END
$$;

ALTER TABLE public.marketplace_deal_pipeline
  ADD COLUMN IF NOT EXISTS status public.marketplace_deal_room_status;

UPDATE public.marketplace_deal_pipeline
SET status = CASE
  WHEN stage = 'LOI_SIGNED'::public.marketplace_pipeline_stage THEN 'LOI_SIGNED'::public.marketplace_deal_room_status
  WHEN stage = 'DUE_DILIGENCE'::public.marketplace_pipeline_stage THEN 'DUE_DILIGENCE'::public.marketplace_deal_room_status
  WHEN stage = 'APA_SIGNED'::public.marketplace_pipeline_stage THEN 'APA_SIGNED'::public.marketplace_deal_room_status
  WHEN stage = 'ESCROW_FUNDED'::public.marketplace_pipeline_stage THEN 'ESCROW_FUNDED'::public.marketplace_deal_room_status
  WHEN stage = 'TRANSFER_IN_PROGRESS'::public.marketplace_pipeline_stage THEN 'ASSETS_TRANSFERRED'::public.marketplace_deal_room_status
  WHEN stage = 'CLOSED'::public.marketplace_pipeline_stage THEN 'CLOSED'::public.marketplace_deal_room_status
  WHEN stage = 'CANCELLED'::public.marketplace_pipeline_stage THEN 'REJECTED'::public.marketplace_deal_room_status
  ELSE 'PENDING'::public.marketplace_deal_room_status
END
WHERE status IS NULL;

WITH latest_offer AS (
  SELECT DISTINCT ON (asset_id, buyer_user_id, seller_user_id)
    asset_id,
    buyer_user_id,
    seller_user_id,
    status
  FROM public.marketplace_offers
  ORDER BY asset_id, buyer_user_id, seller_user_id, created_at DESC
)
UPDATE public.marketplace_deal_pipeline p
SET status = CASE
  WHEN o.status = 'REJECTED'::public.marketplace_offer_status THEN 'REJECTED'::public.marketplace_deal_room_status
  WHEN o.status = 'ACCEPTED'::public.marketplace_offer_status AND p.status = 'PENDING'::public.marketplace_deal_room_status
    THEN 'ACCEPTED'::public.marketplace_deal_room_status
  ELSE p.status
END
FROM latest_offer o
WHERE p.asset_id = o.asset_id
  AND p.buyer_user_id = o.buyer_user_id
  AND p.seller_user_id = o.seller_user_id;

ALTER TABLE public.marketplace_deal_pipeline
  ALTER COLUMN status SET DEFAULT 'PENDING'::public.marketplace_deal_room_status,
  ALTER COLUMN status SET NOT NULL;

CREATE INDEX IF NOT EXISTS marketplace_deal_pipeline_status_idx
  ON public.marketplace_deal_pipeline (status, updated_at DESC);

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants read offers" ON public.offers;
CREATE POLICY "Participants read offers"
ON public.offers
FOR SELECT
USING (buyer_user_id = auth.uid() OR seller_user_id = auth.uid());

DROP POLICY IF EXISTS "Participants update offers" ON public.offers;
CREATE POLICY "Participants update offers"
ON public.offers
FOR UPDATE
USING (buyer_user_id = auth.uid() OR seller_user_id = auth.uid())
WITH CHECK (buyer_user_id = auth.uid() OR seller_user_id = auth.uid());

DROP POLICY IF EXISTS "Marketplace offer participants read" ON public.marketplace_offers;
CREATE POLICY "Marketplace offer participants read"
ON public.marketplace_offers
FOR SELECT
USING (buyer_user_id = auth.uid() OR seller_user_id = auth.uid());

DROP POLICY IF EXISTS "Marketplace participants update offers" ON public.marketplace_offers;
CREATE POLICY "Marketplace participants update offers"
ON public.marketplace_offers
FOR UPDATE
USING (buyer_user_id = auth.uid() OR seller_user_id = auth.uid())
WITH CHECK (buyer_user_id = auth.uid() OR seller_user_id = auth.uid());
