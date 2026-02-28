import { sanitizeErrorDetails } from './marketplace-utils.js';

export const ACQUIRE_STAGE_ORDER = [
  'WATCHLISTED',
  'OFFER_SENT',
  'LOI_SIGNED',
  'DUE_DILIGENCE',
  'APA_SIGNED',
  'ESCROW_FUNDED',
  'CLOSED',
] as const;

export type AcquireStage = (typeof ACQUIRE_STAGE_ORDER)[number];

export const formatAcquireStageLabel = (stage: string): string =>
  stage
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/(^|\s)\S/g, (char) => char.toUpperCase());

export const ensureConversation = async (input: {
  supabase: any;
  listingId: string;
  buyerId: string;
  sellerId: string;
}) => {
  const { supabase, listingId, buyerId, sellerId } = input;

  const { data: existing, error: existingError } = await supabase
    .from('conversations')
    .select('id')
    .eq('listing_id', listingId)
    .eq('buyer_id', buyerId)
    .eq('seller_id', sellerId)
    .limit(1)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existing?.id) {
    return existing.id as string;
  }

  const { data: created, error: createError } = await supabase
    .from('conversations')
    .insert({
      listing_id: listingId,
      buyer_id: buyerId,
      seller_id: sellerId,
      last_message_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (createError) {
    const details = sanitizeErrorDetails(createError).toLowerCase();
    if (details.includes('duplicate key') || details.includes('unique')) {
      const { data: raceWinner, error: raceError } = await supabase
        .from('conversations')
        .select('id')
        .eq('listing_id', listingId)
        .eq('buyer_id', buyerId)
        .eq('seller_id', sellerId)
        .limit(1)
        .single();

      if (raceError) {
        throw raceError;
      }
      return raceWinner.id as string;
    }
    throw createError;
  }

  return created.id as string;
};

export const upsertPipelineStage = async (input: {
  supabase: any;
  buyerId: string;
  listingId: string;
  stage: AcquireStage;
  notes?: string | null;
}) => {
  const { supabase, buyerId, listingId, stage, notes } = input;
  const nowIso = new Date().toISOString();

  const { error } = await supabase
    .from('acquisition_pipeline_items')
    .upsert(
      {
        buyer_id: buyerId,
        listing_id: listingId,
        stage,
        notes: notes ?? null,
        last_activity_at: nowIso,
      },
      { onConflict: 'buyer_id,listing_id' },
    );

  if (error) {
    throw error;
  }
};
