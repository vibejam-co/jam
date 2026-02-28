import { z } from 'zod';
import { getMethod, methodNotAllowed, parseJsonBody, sendJson } from '../../lib/server/http.js';
import { getSupabaseAdmin } from '../../lib/server/supabase-admin.js';
import { getAuthenticatedUser } from '../../lib/server/auth.js';
import { CreateOfferSchema } from '../../lib/server/marketplace-validation.js';
import {
  getQueryValue,
  isRecoverableSchemaError,
  parseUsdToCents,
  sanitizeErrorDetails,
} from '../../lib/server/marketplace-utils.js';
import { sendOfferNotificationEmail } from '../../lib/server/email.js';
import { writeMarketplaceAuditLog } from '../../lib/server/marketplace-audit.js';
import { checkRateLimit } from '../../lib/server/rate-limit.js';
import { ensureConversation, upsertPipelineStage } from '../../lib/server/profile-marketplace.js';

const OfferStatusUpdateSchema = z.object({
  status: z.enum(['OFFER_MADE', 'ACCEPTED', 'REJECTED', 'COUNTERED', 'WITHDRAWN']),
  message: z.string().trim().max(4000).optional(),
});

type DomainOfferStatus = z.infer<typeof OfferStatusUpdateSchema>['status'];
type DomainPipelineStage =
  | 'OFFER_RECEIVED'
  | 'LOI_SIGNED'
  | 'DUE_DILIGENCE'
  | 'APA_SIGNED'
  | 'ESCROW_FUNDED'
  | 'TRANSFER_IN_PROGRESS'
  | 'CLOSED'
  | 'CANCELLED';

const toLegacyOfferStatus = (status: DomainOfferStatus): 'sent' | 'accepted' | 'rejected' | 'countered' => {
  if (status === 'ACCEPTED') return 'accepted';
  if (status === 'REJECTED') return 'rejected';
  if (status === 'COUNTERED') return 'countered';
  if (status === 'WITHDRAWN') return 'rejected';
  return 'sent';
};

const toDomainOfferStatus = (status: string): DomainOfferStatus => {
  if (status === 'accepted') return 'ACCEPTED';
  if (status === 'rejected') return 'REJECTED';
  if (status === 'countered') return 'COUNTERED';
  return 'OFFER_MADE';
};

const toDomainPipelineStage = (status: DomainOfferStatus): DomainPipelineStage => {
  if (status === 'REJECTED' || status === 'WITHDRAWN') {
    return 'CANCELLED';
  }
  return 'OFFER_RECEIVED';
};

const getOfferId = (req: any): string => {
  const fromQuery = getQueryValue(req, 'offerId');
  return typeof fromQuery === 'string' ? fromQuery : '';
};

const upsertDomainPipeline = async (input: {
  supabase: any;
  assetId: string;
  buyerUserId: string;
  sellerUserId: string;
  stage: DomainPipelineStage;
}) => {
  const { error } = await input.supabase
    .from('marketplace_deal_pipeline')
    .upsert(
      {
        asset_id: input.assetId,
        buyer_user_id: input.buyerUserId,
        seller_user_id: input.sellerUserId,
        stage: input.stage,
      },
      { onConflict: 'asset_id,buyer_user_id,seller_user_id' },
    );

  if (error && !isRecoverableSchemaError(error)) {
    throw error;
  }
};

const handleCreateOffer = async (req: any, res: any) => {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return sendJson(res, 401, { error: 'Authentication required.', code: 'AUTH_REQUIRED' });
  }

  const limiter = checkRateLimit(`marketplace-offer:${user.id}`, { limit: 20, windowMs: 10 * 60 * 1000 });
  if (!limiter.ok) {
    return sendJson(res, 429, {
      error: 'Too many offer attempts. Please wait before sending another offer.',
      details: `Retry in ${Math.ceil(limiter.retryAfterMs / 1000)}s`,
      code: 'RATE_LIMITED',
    });
  }

  const body = await parseJsonBody(req);
  const parsed = CreateOfferSchema.safeParse(body);

  if (!parsed.success) {
    return sendJson(res, 400, {
      error: 'Invalid offer payload.',
      details: parsed.error.issues[0]?.message,
      code: 'INVALID_PAYLOAD',
    });
  }

  const payload = parsed.data;
  const offerPriceCents = typeof payload.offerPriceCents === 'number'
    ? payload.offerPriceCents
    : parseUsdToCents(payload.offerPriceUsd ?? '');

  if (!offerPriceCents || offerPriceCents <= 0) {
    return sendJson(res, 400, { error: 'Offer price is required.', code: 'INVALID_PRICE' });
  }

  const supabase = await getSupabaseAdmin();

  const { data: asset, error: assetError } = await supabase
    .from('marketplace_assets')
    .select('id, owner_user_id, name, founder_email, is_listed')
    .eq('id', payload.assetId)
    .limit(1)
    .maybeSingle();

  if (assetError) {
    throw assetError;
  }

  let listingStatus: string | null = null;
  const listingStatusResult = await supabase
    .from('marketplace_assets')
    .select('listing_status')
    .eq('id', payload.assetId)
    .limit(1)
    .maybeSingle();

  if (listingStatusResult.error && !isRecoverableSchemaError(listingStatusResult.error)) {
    throw listingStatusResult.error;
  }

  listingStatus = (listingStatusResult.data as { listing_status?: string } | null)?.listing_status ?? null;
  const normalizedListingStatus = String(listingStatus ?? '').toUpperCase();
  const isAssetActive = Boolean(
    asset
    && (
      asset.is_listed === true
      || normalizedListingStatus === 'LISTED'
      || normalizedListingStatus === 'LIVE'
    ),
  );
  if (!asset || !isAssetActive) {
    return sendJson(res, 404, { error: 'Asset is not available for offers.', code: 'ASSET_NOT_AVAILABLE' });
  }

  if (asset.owner_user_id === user.id) {
    return sendJson(res, 400, { error: 'You cannot send an offer to your own listing.', code: 'SELF_OFFER_BLOCKED' });
  }

  const { data: offer, error: offerError } = await supabase
    .from('offers')
    .insert({
      asset_id: asset.id,
      buyer_user_id: user.id,
      seller_user_id: asset.owner_user_id,
      offer_price_cents: offerPriceCents,
      message: payload.message,
      status: 'sent',
    })
    .select('id, asset_id, buyer_user_id, seller_user_id, offer_price_cents, message, status, created_at, updated_at')
    .single();

  if (offerError) {
    throw offerError;
  }

  let domainOfferId: string | null = null;
  try {
    const { data: domainOffer, error: domainOfferError } = await supabase
      .from('marketplace_offers')
      .insert({
        asset_id: offer.asset_id,
        buyer_user_id: offer.buyer_user_id,
        seller_user_id: offer.seller_user_id,
        offer_price_cents: offer.offer_price_cents,
        message: offer.message,
        status: 'OFFER_MADE',
        legacy_offer_id: offer.id,
      })
      .select('id')
      .single();

    if (domainOfferError && !isRecoverableSchemaError(domainOfferError)) {
      throw domainOfferError;
    }
    domainOfferId = domainOffer?.id ?? null;
  } catch (domainOfferInsertError) {
    if (!isRecoverableSchemaError(domainOfferInsertError)) {
      throw domainOfferInsertError;
    }
  }

  const { error: legacyPipelineError } = await supabase.from('deal_pipeline').insert({
    offer_id: offer.id,
    stage: 'offer_received',
  });

  if (legacyPipelineError) {
    throw legacyPipelineError;
  }

  await upsertDomainPipeline({
    supabase,
    assetId: offer.asset_id,
    buyerUserId: offer.buyer_user_id,
    sellerUserId: offer.seller_user_id,
    stage: 'OFFER_RECEIVED',
  });

  let conversationId: string | null = null;
  let inboxStatus: 'created' | 'skipped' | 'failed' = 'skipped';
  try {
    conversationId = await ensureConversation({
      supabase,
      listingId: asset.id,
      buyerId: user.id,
      sellerId: asset.owner_user_id,
    });

    const offerPriceLabel = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(offerPriceCents / 100);

    const { error: conversationMessageError } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: user.id,
      body: `Offer submitted: ${offerPriceLabel}. ${payload.message}`,
    });

    if (conversationMessageError && !isRecoverableSchemaError(conversationMessageError)) {
      throw conversationMessageError;
    }

    const { error: conversationUpdateError } = await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId);

    if (conversationUpdateError && !isRecoverableSchemaError(conversationUpdateError)) {
      throw conversationUpdateError;
    }

    inboxStatus = 'created';
  } catch (inboxError) {
    if (isRecoverableSchemaError(inboxError)) {
      inboxStatus = 'skipped';
    } else {
      inboxStatus = 'failed';
      throw inboxError;
    }
  }

  try {
    await upsertPipelineStage({
      supabase,
      buyerId: user.id,
      listingId: asset.id,
      stage: 'OFFER_SENT',
      notes: payload.message,
    });
  } catch (pipelineError) {
    if (!isRecoverableSchemaError(pipelineError)) {
      throw pipelineError;
    }
  }

  const { error: notificationError } = await supabase.from('notifications').insert({
    title: 'New Offer Received',
    message: `A buyer sent an offer for ${asset.name}.`,
    type: 'offer',
    timestamp_label: 'just now',
    is_read: false,
    jam_id: null,
    recipient_user_id: asset.owner_user_id,
    metadata: {
      offer_id: offer.id,
      domain_offer_id: domainOfferId,
      asset_id: asset.id,
      offer_price_cents: offerPriceCents,
      conversation_id: conversationId,
    },
  });
  if (notificationError && !isRecoverableSchemaError(notificationError)) {
    throw notificationError;
  }

  let emailStatus: 'sent' | 'skipped' | 'failed' = 'skipped';
  let emailRecipient: string | null = null;
  let emailMessageId: string | null = null;
  const buyerLabel =
    (typeof user.user_metadata?.full_name === 'string' && user.user_metadata.full_name.trim())
    || (typeof user.user_metadata?.name === 'string' && user.user_metadata.name.trim())
    || (typeof user.email === 'string' && user.email.includes('@') ? user.email.split('@')[0] : 'A buyer');
  if (typeof asset.founder_email === 'string' && asset.founder_email.trim()) {
    emailRecipient = asset.founder_email.trim();
  }
  if (!emailRecipient && typeof asset.owner_user_id === 'string' && asset.owner_user_id) {
    const { data: ownerLookup, error: ownerLookupError } = await supabase.auth.admin.getUserById(asset.owner_user_id);
    if (!ownerLookupError) {
      emailRecipient = ownerLookup?.user?.email?.trim() || null;
    }
  }

  try {
    const emailResult = await sendOfferNotificationEmail({
      toEmail: emailRecipient,
      assetName: asset.name,
      offerPriceCents,
      message: payload.message,
      buyerLabel,
    });
    emailStatus = emailResult.sent ? 'sent' : 'skipped';
    emailMessageId = emailResult.messageId ?? null;
  } catch {
    emailStatus = 'failed';
  }

  await writeMarketplaceAuditLog({
    actorUserId: user.id,
    assetId: asset.id,
    action: 'offer_created',
    severity: 'INFO',
    reason: 'OFFER_CREATED',
    metadata: {
      offer_id: offer.id,
      domain_offer_id: domainOfferId,
      offer_price_cents: offerPriceCents,
      email_status: emailStatus,
      email_recipient: emailRecipient,
      email_message_id: emailMessageId,
      inbox_status: inboxStatus,
    },
  });

  return sendJson(res, 201, {
    data: {
      offer,
      domainOfferId,
      emailStatus,
      emailMessageId,
      inboxStatus,
      conversationId,
      pipelineStage: 'OFFER_SENT',
    },
  });
};

const handlePatchOfferStatus = async (req: any, res: any) => {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return sendJson(res, 401, { error: 'Authentication required.', code: 'AUTH_REQUIRED' });
  }

  const offerId = getOfferId(req);
  if (!offerId) {
    return sendJson(res, 400, { error: 'Missing offerId.', code: 'MISSING_OFFER_ID' });
  }

  const body = await parseJsonBody(req);
  const parsed = OfferStatusUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return sendJson(res, 400, {
      error: 'Invalid offer status payload.',
      details: parsed.error.issues[0]?.message,
      code: 'INVALID_STATUS_PAYLOAD',
    });
  }

  const payload = parsed.data;
  if (payload.status === 'OFFER_MADE') {
    return sendJson(res, 400, {
      error: 'OFFER_MADE is only valid on creation.',
      code: 'INVALID_STATUS_TRANSITION',
    });
  }

  const supabase = await getSupabaseAdmin();

  let domainOffer: any = null;
  let legacyOffer: any = null;

  try {
    const { data, error } = await supabase
      .from('marketplace_offers')
      .select('id, legacy_offer_id, asset_id, buyer_user_id, seller_user_id, offer_price_cents, message, status, created_at, updated_at')
      .eq('id', offerId)
      .limit(1)
      .maybeSingle();

    if (error && !isRecoverableSchemaError(error)) {
      throw error;
    }
    domainOffer = data ?? null;
  } catch (error) {
    if (!isRecoverableSchemaError(error)) {
      throw error;
    }
  }

  if (!domainOffer) {
    const { data: byLegacyRef, error: byLegacyRefError } = await supabase
      .from('marketplace_offers')
      .select('id, legacy_offer_id, asset_id, buyer_user_id, seller_user_id, offer_price_cents, message, status, created_at, updated_at')
      .eq('legacy_offer_id', offerId)
      .limit(1)
      .maybeSingle();

    if (byLegacyRefError && !isRecoverableSchemaError(byLegacyRefError)) {
      throw byLegacyRefError;
    }
    domainOffer = byLegacyRef ?? null;
  }

  if (domainOffer?.legacy_offer_id) {
    const { data: legacyFromDomain, error: legacyFromDomainError } = await supabase
      .from('offers')
      .select('id, asset_id, buyer_user_id, seller_user_id, offer_price_cents, message, status, created_at, updated_at')
      .eq('id', domainOffer.legacy_offer_id)
      .limit(1)
      .maybeSingle();

    if (legacyFromDomainError) {
      throw legacyFromDomainError;
    }
    legacyOffer = legacyFromDomain ?? null;
  }

  if (!legacyOffer) {
    const { data: directLegacy, error: directLegacyError } = await supabase
      .from('offers')
      .select('id, asset_id, buyer_user_id, seller_user_id, offer_price_cents, message, status, created_at, updated_at')
      .eq('id', offerId)
      .limit(1)
      .maybeSingle();

    if (directLegacyError) {
      throw directLegacyError;
    }
    legacyOffer = directLegacy ?? null;
  }

  if (!domainOffer && !legacyOffer) {
    return sendJson(res, 404, { error: 'Offer not found.', code: 'OFFER_NOT_FOUND' });
  }

  const buyerUserId = String(domainOffer?.buyer_user_id ?? legacyOffer?.buyer_user_id ?? '');
  const sellerUserId = String(domainOffer?.seller_user_id ?? legacyOffer?.seller_user_id ?? '');
  const assetId = String(domainOffer?.asset_id ?? legacyOffer?.asset_id ?? '');

  if (!buyerUserId || !sellerUserId || !assetId) {
    return sendJson(res, 500, { error: 'Offer record is malformed.', code: 'OFFER_DATA_INVALID' });
  }

  const isBuyer = buyerUserId === user.id;
  const isSeller = sellerUserId === user.id;
  if (!isBuyer && !isSeller) {
    return sendJson(res, 403, { error: 'Not allowed to modify this offer.', code: 'NOT_PARTICIPANT' });
  }

  if (payload.status === 'WITHDRAWN' && !isBuyer) {
    return sendJson(res, 403, { error: 'Only buyer can withdraw an offer.', code: 'BUYER_ONLY_ACTION' });
  }
  if ((payload.status === 'ACCEPTED' || payload.status === 'REJECTED' || payload.status === 'COUNTERED') && !isSeller) {
    return sendJson(res, 403, { error: 'Only seller can perform this status change.', code: 'SELLER_ONLY_ACTION' });
  }

  if (domainOffer) {
    const nextDomainUpdate: Record<string, unknown> = { status: payload.status };
    if (payload.message && payload.status === 'COUNTERED') {
      nextDomainUpdate.message = payload.message;
    }
    const { error: domainUpdateError } = await supabase
      .from('marketplace_offers')
      .update(nextDomainUpdate)
      .eq('id', domainOffer.id);

    if (domainUpdateError && !isRecoverableSchemaError(domainUpdateError)) {
      throw domainUpdateError;
    }
  }

  if (legacyOffer) {
    const nextLegacyUpdate: Record<string, unknown> = { status: toLegacyOfferStatus(payload.status) };
    if (payload.message && payload.status === 'COUNTERED') {
      nextLegacyUpdate.message = payload.message;
    }
    const { error: legacyUpdateError } = await supabase
      .from('offers')
      .update(nextLegacyUpdate)
      .eq('id', legacyOffer.id);

    if (legacyUpdateError) {
      throw legacyUpdateError;
    }
  }

  const nextStage = toDomainPipelineStage(payload.status);
  await upsertDomainPipeline({
    supabase,
    assetId,
    buyerUserId,
    sellerUserId,
    stage: nextStage,
  });

  await writeMarketplaceAuditLog({
    actorUserId: user.id,
    assetId,
    action: 'offer_status_updated',
    severity: 'INFO',
    reason: payload.status,
    metadata: {
      offer_id: legacyOffer?.id ?? domainOffer?.legacy_offer_id ?? null,
      domain_offer_id: domainOffer?.id ?? null,
      status: payload.status,
      legacy_status: toLegacyOfferStatus(payload.status),
      performed_by: user.id,
    },
  });

  return sendJson(res, 200, {
    data: {
      offerId: legacyOffer?.id ?? domainOffer?.legacy_offer_id ?? null,
      domainOfferId: domainOffer?.id ?? null,
      status: payload.status,
      pipelineStage: nextStage,
      legacyStatus: toLegacyOfferStatus(payload.status),
      effectiveStatus: domainOffer ? payload.status : toDomainOfferStatus(toLegacyOfferStatus(payload.status)),
    },
  });
};

export default async function handler(req: any, res: any) {
  try {
    const method = getMethod(req);
    if (method === 'POST') {
      return await handleCreateOffer(req, res);
    }
    if (method === 'PATCH') {
      return await handlePatchOfferStatus(req, res);
    }
    return methodNotAllowed(res, ['POST', 'PATCH']);
  } catch (error) {
    return sendJson(res, 500, {
      error: 'Failed to process marketplace offer request.',
      details: sanitizeErrorDetails(error),
      code: 'INTERNAL_ERROR',
    });
  }
}
