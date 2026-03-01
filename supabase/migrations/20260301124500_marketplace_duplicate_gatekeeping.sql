ALTER TABLE public.marketplace_assets
  ADD COLUMN IF NOT EXISTS website_url text;

UPDATE public.marketplace_assets
SET website_url = NULLIF(trim(website_url), '')
WHERE website_url IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS marketplace_assets_website_url_unique_idx
  ON public.marketplace_assets ((lower(trim(website_url))))
  WHERE website_url IS NOT NULL
    AND length(trim(website_url)) > 0;

ALTER TABLE public.payment_connections
  ADD COLUMN IF NOT EXISTS provider_account_id text;

UPDATE public.payment_connections
SET provider_account_id = NULLIF(trim(provider_account_id), '')
WHERE provider_account_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS payment_connections_provider_account_id_unique_idx
  ON public.payment_connections (provider_account_id)
  WHERE provider_account_id IS NOT NULL
    AND length(trim(provider_account_id)) > 0;
