-- Profitability layer: seller-entered operating expenses + computed margin
ALTER TABLE public.marketplace_assets
  ADD COLUMN IF NOT EXISTS operating_expenses_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS expense_breakdown text;

ALTER TABLE public.marketplace_assets
  ADD COLUMN IF NOT EXISTS profit_margin_bps integer;

UPDATE public.marketplace_assets
SET profit_margin_bps = COALESCE(profit_margin_bps, 0)
WHERE profit_margin_bps IS NULL;

ALTER TABLE public.marketplace_assets
  ALTER COLUMN profit_margin_bps SET DEFAULT 0,
  ALTER COLUMN profit_margin_bps SET NOT NULL;
