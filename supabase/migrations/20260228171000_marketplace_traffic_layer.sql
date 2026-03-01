-- Phase 2 context layer: traffic signal + analytics proof URL
ALTER TABLE public.marketplace_assets
  ADD COLUMN IF NOT EXISTS monthly_unique_visitors integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS analytics_proof_url text;
