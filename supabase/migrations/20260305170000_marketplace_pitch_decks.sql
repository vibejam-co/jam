ALTER TABLE public.marketplace_assets
  ADD COLUMN IF NOT EXISTS pitch_decks jsonb;

COMMENT ON COLUMN public.marketplace_assets.pitch_decks IS
  'AI generated sender deck payload (slides with banker copy, metrics, and visual image URLs).';
