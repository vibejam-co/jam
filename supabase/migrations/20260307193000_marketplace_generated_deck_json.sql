ALTER TABLE public.marketplace_assets
  ADD COLUMN IF NOT EXISTS generated_deck_json jsonb;

COMMENT ON COLUMN public.marketplace_assets.generated_deck_json IS
  'Fully generated AI pitch deck payload (theme + slides with base64 backgrounds).';
