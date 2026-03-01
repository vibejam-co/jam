alter table public.marketplace_deal_pipeline
  add column if not exists escrow_transaction_id text,
  add column if not exists escrow_status text;

alter table public.marketplace_offers
  add column if not exists escrow_transaction_id text,
  add column if not exists escrow_status text;

alter table public.offers
  add column if not exists escrow_transaction_id text,
  add column if not exists escrow_status text;

create index if not exists marketplace_deal_pipeline_escrow_tx_idx
  on public.marketplace_deal_pipeline (escrow_transaction_id)
  where escrow_transaction_id is not null;

create index if not exists marketplace_offers_escrow_tx_idx
  on public.marketplace_offers (escrow_transaction_id)
  where escrow_transaction_id is not null;

create index if not exists offers_escrow_tx_idx
  on public.offers (escrow_transaction_id)
  where escrow_transaction_id is not null;
