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
import {
  createEscrowTransaction,
  fetchEscrowTransaction,
  getEscrowTransactionPortalUrl,
} from '../../lib/server/escrow.js';
import { handleEscrowWebhook } from '../../lib/server/escrow-webhook.js';

const OfferStatusUpdateSchema = z.object({
  status: z.enum(['OFFER_MADE', 'ACCEPTED', 'REJECTED', 'COUNTERED', 'WITHDRAWN']),
  message: z.string().trim().max(4000).optional(),
});

const DealRoomStatusSchema = z.enum([
  'PENDING',
  'ACCEPTED',
  'LOI_SIGNED',
  'DUE_DILIGENCE',
  'APA_SIGNED',
  'ESCROW_FUNDED',
  'ASSETS_TRANSFERRED',
  'CLOSED',
  'REJECTED',
]);

const DealRoomUpdateSchema = z.object({
  newStatus: DealRoomStatusSchema,
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
type DealRoomStatus = z.infer<typeof DealRoomStatusSchema>;

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

const dealRoomStageByStatus: Record<DealRoomStatus, DomainPipelineStage> = {
  PENDING: 'OFFER_RECEIVED',
  ACCEPTED: 'OFFER_RECEIVED',
  LOI_SIGNED: 'LOI_SIGNED',
  DUE_DILIGENCE: 'DUE_DILIGENCE',
  APA_SIGNED: 'APA_SIGNED',
  ESCROW_FUNDED: 'ESCROW_FUNDED',
  ASSETS_TRANSFERRED: 'TRANSFER_IN_PROGRESS',
  CLOSED: 'CLOSED',
  REJECTED: 'CANCELLED',
};

const dealRoomTransitions: Record<DealRoomStatus, DealRoomStatus[]> = {
  PENDING: ['ACCEPTED', 'REJECTED'],
  ACCEPTED: ['LOI_SIGNED', 'REJECTED'],
  LOI_SIGNED: ['DUE_DILIGENCE', 'REJECTED'],
  DUE_DILIGENCE: ['APA_SIGNED', 'REJECTED'],
  APA_SIGNED: ['ESCROW_FUNDED', 'REJECTED'],
  ESCROW_FUNDED: ['ASSETS_TRANSFERRED', 'REJECTED'],
  ASSETS_TRANSFERRED: ['CLOSED'],
  CLOSED: [],
  REJECTED: [],
};

const toDealRoomStatusFromOfferStatus = (status: string | null | undefined): DealRoomStatus => {
  const normalized = String(status ?? '').toUpperCase();
  if (normalized === 'ACCEPTED') return 'ACCEPTED';
  if (normalized === 'REJECTED') return 'REJECTED';
  return 'PENDING';
};

const toLegacyStorageStatusFromDealStatus = (status: DealRoomStatus): 'sent' | 'accepted' | 'rejected' => {
  if (status === 'REJECTED') return 'rejected';
  if (status === 'PENDING') return 'sent';
  return 'accepted';
};

const toDomainStorageStatusFromDealStatus = (status: DealRoomStatus): 'OFFER_MADE' | 'ACCEPTED' | 'REJECTED' => {
  if (status === 'REJECTED') return 'REJECTED';
  if (status === 'PENDING') return 'OFFER_MADE';
  return 'ACCEPTED';
};

const getOfferId = (req: any): string => {
  const fromQuery = getQueryValue(req, 'offerId');
  return typeof fromQuery === 'string' ? fromQuery : '';
};

const DOMAIN_OFFER_SELECT = 'id, legacy_offer_id, asset_id, buyer_user_id, seller_user_id, offer_price_cents, message, status, escrow_transaction_id, escrow_status, created_at, updated_at';
const DOMAIN_OFFER_FALLBACK_SELECT = 'id, legacy_offer_id, asset_id, buyer_user_id, seller_user_id, offer_price_cents, message, status, created_at, updated_at';
const LEGACY_OFFER_SELECT = 'id, asset_id, buyer_user_id, seller_user_id, offer_price_cents, message, status, escrow_transaction_id, escrow_status, created_at, updated_at';
const LEGACY_OFFER_FALLBACK_SELECT = 'id, asset_id, buyer_user_id, seller_user_id, offer_price_cents, message, status, created_at, updated_at';

const normalizeEscrowColumns = (row: any) => {
  if (!row) {
    return null;
  }
  return {
    ...row,
    escrow_transaction_id: row.escrow_transaction_id ?? null,
    escrow_status: row.escrow_status ?? null,
  };
};

const fetchDomainOfferBy = async (supabase: any, column: string, value: string) => {
  const rich = await supabase
    .from('marketplace_offers')
    .select(DOMAIN_OFFER_SELECT)
    .eq(column, value)
    .limit(1)
    .maybeSingle();
  if (!rich.error) {
    return normalizeEscrowColumns(rich.data);
  }
  if (!isRecoverableSchemaError(rich.error)) {
    throw rich.error;
  }

  const fallback = await supabase
    .from('marketplace_offers')
    .select(DOMAIN_OFFER_FALLBACK_SELECT)
    .eq(column, value)
    .limit(1)
    .maybeSingle();
  if (fallback.error && !isRecoverableSchemaError(fallback.error)) {
    throw fallback.error;
  }
  return normalizeEscrowColumns(fallback.data);
};

const fetchLegacyOfferById = async (supabase: any, id: string) => {
  const rich = await supabase
    .from('offers')
    .select(LEGACY_OFFER_SELECT)
    .eq('id', id)
    .limit(1)
    .maybeSingle();
  if (!rich.error) {
    return normalizeEscrowColumns(rich.data);
  }
  if (!isRecoverableSchemaError(rich.error)) {
    throw rich.error;
  }

  const fallback = await supabase
    .from('offers')
    .select(LEGACY_OFFER_FALLBACK_SELECT)
    .eq('id', id)
    .limit(1)
    .maybeSingle();
  if (fallback.error && !isRecoverableSchemaError(fallback.error)) {
    throw fallback.error;
  }
  return normalizeEscrowColumns(fallback.data);
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

const ensureDealRoomPipeline = async (input: {
  supabase: any;
  assetId: string;
  buyerUserId: string;
  sellerUserId: string;
  fallbackStatus: DealRoomStatus;
}) => {
  const { supabase, assetId, buyerUserId, sellerUserId, fallbackStatus } = input;
  const { data: existing, error: existingError } = await supabase
    .from('marketplace_deal_pipeline')
    .select('id, status, stage, escrow_transaction_id, escrow_status, updated_at, created_at')
    .eq('asset_id', assetId)
    .eq('buyer_user_id', buyerUserId)
    .eq('seller_user_id', sellerUserId)
    .limit(1)
    .maybeSingle();

  if (existingError) {
    if (isRecoverableSchemaError(existingError)) {
      return { pipeline: null, schemaReady: false as const };
    }
    throw existingError;
  }

  if (existing) {
    return { pipeline: existing, schemaReady: true as const };
  }

  const { error: upsertError } = await supabase
    .from('marketplace_deal_pipeline')
    .upsert(
      {
        asset_id: assetId,
        buyer_user_id: buyerUserId,
        seller_user_id: sellerUserId,
        stage: dealRoomStageByStatus[fallbackStatus],
        status: fallbackStatus,
      },
      { onConflict: 'asset_id,buyer_user_id,seller_user_id' },
    );

  if (upsertError) {
    if (isRecoverableSchemaError(upsertError)) {
      return { pipeline: null, schemaReady: false as const };
    }
    throw upsertError;
  }

  const { data: created, error: createdError } = await supabase
    .from('marketplace_deal_pipeline')
    .select('id, status, stage, escrow_transaction_id, escrow_status, updated_at, created_at')
    .eq('asset_id', assetId)
    .eq('buyer_user_id', buyerUserId)
    .eq('seller_user_id', sellerUserId)
    .limit(1)
    .maybeSingle();

  if (createdError) {
    throw createdError;
  }

  return { pipeline: created ?? null, schemaReady: true as const };
};

const resolveDealRoomContext = async (supabase: any, offerId: string) => {
  let domainOffer: any = null;
  let legacyOffer: any = null;

  domainOffer = await fetchDomainOfferBy(supabase, 'id', offerId);

  if (!domainOffer) {
    domainOffer = await fetchDomainOfferBy(supabase, 'legacy_offer_id', offerId);
  }

  if (domainOffer?.legacy_offer_id) {
    legacyOffer = await fetchLegacyOfferById(supabase, String(domainOffer.legacy_offer_id));
  }

  if (!legacyOffer) {
    legacyOffer = await fetchLegacyOfferById(supabase, offerId);
  }

  if (!domainOffer && !legacyOffer) {
    return null;
  }

  const assetId = String(domainOffer?.asset_id ?? legacyOffer?.asset_id ?? '');
  const buyerUserId = String(domainOffer?.buyer_user_id ?? legacyOffer?.buyer_user_id ?? '');
  const sellerUserId = String(domainOffer?.seller_user_id ?? legacyOffer?.seller_user_id ?? '');
  if (!assetId || !buyerUserId || !sellerUserId) {
    return null;
  }

  const fallbackStatus = toDealRoomStatusFromOfferStatus(domainOffer?.status ?? legacyOffer?.status);
  const pipelineState = await ensureDealRoomPipeline({
    supabase,
    assetId,
    buyerUserId,
    sellerUserId,
    fallbackStatus,
  });

  const { data: asset, error: assetError } = await supabase
    .from('marketplace_assets')
    .select('id, slug, name, title, tagline, asking_price_cents, mrr_cents')
    .eq('id', assetId)
    .limit(1)
    .maybeSingle();
  if (assetError) {
    throw assetError;
  }

  const [buyerLookup, sellerLookup] = await Promise.all([
    supabase.auth.admin.getUserById(buyerUserId),
    supabase.auth.admin.getUserById(sellerUserId),
  ]);

  const parsedStatus = DealRoomStatusSchema.safeParse(String(pipelineState.pipeline?.status ?? fallbackStatus).toUpperCase());

  return {
    schemaReady: pipelineState.schemaReady,
    pipelineId: pipelineState.pipeline?.id ? String(pipelineState.pipeline.id) : null,
    domainOffer,
    legacyOffer,
    offerId: String(domainOffer?.id ?? legacyOffer?.id ?? offerId),
    legacyOfferId: legacyOffer?.id ? String(legacyOffer.id) : null,
    assetId,
    asset,
    buyerUserId,
    sellerUserId,
    buyerEmail: buyerLookup.data?.user?.email ?? null,
    sellerEmail: sellerLookup.data?.user?.email ?? null,
    agreedPriceCents: Math.max(0, Math.round(Number(domainOffer?.offer_price_cents ?? legacyOffer?.offer_price_cents ?? 0))),
    initialMessage: String(domainOffer?.message ?? legacyOffer?.message ?? ''),
    escrowTransactionId: String(
      pipelineState.pipeline?.escrow_transaction_id
      ?? domainOffer?.escrow_transaction_id
      ?? legacyOffer?.escrow_transaction_id
      ?? '',
    ).trim() || null,
    escrowStatus:
      String(
        pipelineState.pipeline?.escrow_status
        ?? domainOffer?.escrow_status
        ?? legacyOffer?.escrow_status
        ?? '',
      ).trim() || null,
    status: parsedStatus.success ? parsedStatus.data : fallbackStatus,
  };
};

const dealRoomResponse = (context: any, viewerId: string) => {
  const viewerRole = context.buyerUserId === viewerId ? 'buyer' : 'seller';
  const counterpartId = viewerRole === 'buyer' ? context.sellerUserId : context.buyerUserId;
  const counterpartEmail = viewerRole === 'buyer' ? context.sellerEmail : context.buyerEmail;

  return {
    deal: {
      offerId: context.offerId,
      legacyOfferId: context.legacyOfferId,
      asset: {
        id: context.assetId,
        slug: context.asset?.slug ?? null,
        name: context.asset?.name ?? context.asset?.title ?? 'Marketplace Asset',
        tagline: context.asset?.tagline ?? '',
        mrrCents: Math.max(0, Number(context.asset?.mrr_cents ?? 0)),
        askingPriceCents: Math.max(0, Number(context.asset?.asking_price_cents ?? 0)),
      },
      agreedPriceCents: context.agreedPriceCents,
      initialMessage: context.initialMessage,
      escrowTransactionId: context.escrowTransactionId,
      escrowStatus: context.escrowStatus,
      status: context.status,
      viewerRole,
      buyer: {
        id: context.buyerUserId,
        email: context.buyerEmail,
      },
      seller: {
        id: context.sellerUserId,
        email: context.sellerEmail,
      },
      counterparty: {
        id: counterpartId,
        email: counterpartEmail,
      },
      allowedNextStatuses: dealRoomTransitions[context.status as DealRoomStatus] ?? [],
    },
  };
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

const handleGetDealRoom = async (req: any, res: any) => {
  const user = await getAuthenticatedUser(req);
  if (!user?.id) {
    return sendJson(res, 401, { error: 'Authentication required.', code: 'AUTH_REQUIRED' });
  }

  const offerId = getOfferId(req);
  if (!offerId) {
    return sendJson(res, 400, { error: 'Missing offerId.', code: 'MISSING_OFFER_ID' });
  }

  const supabase = await getSupabaseAdmin();
  const context = await resolveDealRoomContext(supabase, offerId);
  if (!context) {
    return sendJson(res, 404, { error: 'Deal not found.', code: 'DEAL_NOT_FOUND' });
  }
  if (!context.schemaReady) {
    return sendJson(res, 503, {
      error: 'Deal room schema is not ready yet.',
      details: 'Run the latest Supabase migration to enable deal room status.',
      code: 'DEAL_SCHEMA_NOT_READY',
    });
  }

  if (user.id !== context.buyerUserId && user.id !== context.sellerUserId) {
    return sendJson(res, 403, { error: 'Not allowed to view this deal.', code: 'NOT_PARTICIPANT' });
  }

  return sendJson(res, 200, {
    data: dealRoomResponse(context, user.id),
  });
};

const handlePatchDealRoom = async (req: any, res: any) => {
  const user = await getAuthenticatedUser(req);
  if (!user?.id) {
    return sendJson(res, 401, { error: 'Authentication required.', code: 'AUTH_REQUIRED' });
  }

  const offerId = getOfferId(req);
  if (!offerId) {
    return sendJson(res, 400, { error: 'Missing offerId.', code: 'MISSING_OFFER_ID' });
  }

  const body = await parseJsonBody(req);
  const parsed = DealRoomUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return sendJson(res, 400, {
      error: 'Invalid deal status payload.',
      details: parsed.error.issues[0]?.message,
      code: 'INVALID_STATUS_PAYLOAD',
    });
  }

  const nextStatus = parsed.data.newStatus;
  const supabase = await getSupabaseAdmin();
  const context = await resolveDealRoomContext(supabase, offerId);

  if (!context) {
    return sendJson(res, 404, { error: 'Deal not found.', code: 'DEAL_NOT_FOUND' });
  }
  if (!context.schemaReady || !context.pipelineId) {
    return sendJson(res, 503, {
      error: 'Deal room schema is not ready yet.',
      details: 'Run the latest Supabase migration to enable deal room status.',
      code: 'DEAL_SCHEMA_NOT_READY',
    });
  }

  if (user.id !== context.buyerUserId && user.id !== context.sellerUserId) {
    return sendJson(res, 403, { error: 'Not allowed to update this deal.', code: 'NOT_PARTICIPANT' });
  }

  const currentStatus = context.status as DealRoomStatus;
  if (currentStatus === nextStatus) {
    return sendJson(res, 200, {
      data: dealRoomResponse(context, user.id),
    });
  }

  const allowed = dealRoomTransitions[currentStatus] ?? [];
  if (!allowed.includes(nextStatus)) {
    return sendJson(res, 400, {
      error: `Invalid status transition from ${currentStatus} to ${nextStatus}.`,
      details: allowed.length > 0 ? `Allowed next statuses: ${allowed.join(', ')}` : 'Deal is in a terminal state.',
      code: 'INVALID_STATUS_TRANSITION',
    });
  }

  const { error: pipelineUpdateError } = await supabase
    .from('marketplace_deal_pipeline')
    .update({
      status: nextStatus,
      stage: dealRoomStageByStatus[nextStatus],
    })
    .eq('id', context.pipelineId);

  if (pipelineUpdateError) {
    throw pipelineUpdateError;
  }

  if (context.domainOffer?.id) {
    const { error: domainStatusError } = await supabase
      .from('marketplace_offers')
      .update({
        status: toDomainStorageStatusFromDealStatus(nextStatus),
      })
      .eq('id', context.domainOffer.id);

    if (domainStatusError && !isRecoverableSchemaError(domainStatusError)) {
      throw domainStatusError;
    }
  }

  if (context.legacyOffer?.id) {
    const { error: legacyStatusError } = await supabase
      .from('offers')
      .update({
        status: toLegacyStorageStatusFromDealStatus(nextStatus),
      })
      .eq('id', context.legacyOffer.id);

    if (legacyStatusError && !isRecoverableSchemaError(legacyStatusError)) {
      throw legacyStatusError;
    }
  }

  await writeMarketplaceAuditLog({
    actorUserId: user.id,
    assetId: context.assetId,
    action: 'deal_room_status_updated',
    severity: 'INFO',
    reason: nextStatus,
    metadata: {
      offer_id: context.legacyOfferId,
      domain_offer_id: context.domainOffer?.id ?? null,
      from_status: currentStatus,
      to_status: nextStatus,
      by_user_id: user.id,
    },
  });

  const refreshed = await resolveDealRoomContext(supabase, offerId);
  if (!refreshed) {
    return sendJson(res, 404, { error: 'Deal not found.', code: 'DEAL_NOT_FOUND' });
  }

  return sendJson(res, 200, {
    data: dealRoomResponse(refreshed, user.id),
  });
};

const persistEscrowStateForContext = async (input: {
  supabase: any;
  context: any;
  escrowTransactionId: string;
  escrowStatus: string | null;
}) => {
  const nextEscrowStatus = input.escrowStatus ? String(input.escrowStatus).trim() : null;
  const updatePayload = {
    escrow_transaction_id: input.escrowTransactionId,
    escrow_status: nextEscrowStatus,
  };

  if (input.context.pipelineId) {
    const { error: pipelineError } = await input.supabase
      .from('marketplace_deal_pipeline')
      .update(updatePayload)
      .eq('id', input.context.pipelineId);
    if (pipelineError && !isRecoverableSchemaError(pipelineError)) {
      throw pipelineError;
    }
  }

  if (input.context.domainOffer?.id) {
    const { error: domainOfferError } = await input.supabase
      .from('marketplace_offers')
      .update(updatePayload)
      .eq('id', input.context.domainOffer.id);
    if (domainOfferError && !isRecoverableSchemaError(domainOfferError)) {
      throw domainOfferError;
    }
  }

  if (input.context.legacyOffer?.id) {
    const { error: legacyOfferError } = await input.supabase
      .from('offers')
      .update(updatePayload)
      .eq('id', input.context.legacyOffer.id);
    if (legacyOfferError && !isRecoverableSchemaError(legacyOfferError)) {
      throw legacyOfferError;
    }
  }
};

const handlePostDealRoomEscrow = async (req: any, res: any) => {
  const user = await getAuthenticatedUser(req);
  if (!user?.id) {
    return sendJson(res, 401, { error: 'Authentication required.', code: 'AUTH_REQUIRED' });
  }

  const offerId = getOfferId(req);
  if (!offerId) {
    return sendJson(res, 400, { error: 'Missing offerId.', code: 'MISSING_OFFER_ID' });
  }

  const supabase = await getSupabaseAdmin();
  const context = await resolveDealRoomContext(supabase, offerId);

  if (!context) {
    return sendJson(res, 404, { error: 'Deal not found.', code: 'DEAL_NOT_FOUND' });
  }
  if (!context.schemaReady || !context.pipelineId) {
    return sendJson(res, 503, {
      error: 'Deal room schema is not ready yet.',
      details: 'Run the latest Supabase migration to enable deal room status.',
      code: 'DEAL_SCHEMA_NOT_READY',
    });
  }
  if (user.id !== context.buyerUserId) {
    return sendJson(res, 403, {
      error: 'Only the buyer can initiate escrow.',
      code: 'BUYER_ONLY_ACTION',
    });
  }

  const transactionAlreadyExists =
    typeof context.escrowTransactionId === 'string' && context.escrowTransactionId.trim().length > 0;
  if (!transactionAlreadyExists && context.status !== 'APA_SIGNED') {
    return sendJson(res, 409, {
      error: 'Escrow can only be initiated after APA is signed.',
      details: `Current deal status is ${context.status}.`,
      code: 'DEAL_NOT_READY_FOR_ESCROW',
    });
  }

  if (!context.buyerEmail || !context.sellerEmail) {
    return sendJson(res, 400, {
      error: 'Buyer and seller emails are required before creating escrow.',
      code: 'MISSING_PARTY_EMAIL',
    });
  }

  const safeAssetTitle = String(context.asset?.name ?? context.asset?.title ?? 'Marketplace Asset').trim() || 'Marketplace Asset';
  const agreedPriceUsd = Number((Math.max(0, Number(context.agreedPriceCents ?? 0)) / 100).toFixed(2));
  if (!(agreedPriceUsd > 0)) {
    return sendJson(res, 400, {
      error: 'Agreed price must be greater than zero before creating escrow.',
      code: 'INVALID_AGREED_PRICE',
    });
  }

  try {
    if (transactionAlreadyExists) {
      let landingPage: string | null = null;
      let nextEscrowStatus: string | null = context.escrowStatus ?? null;
      let transactionPortalUrl: string | null = getEscrowTransactionPortalUrl(context.escrowTransactionId ?? '');

      try {
        const escrowSnapshot = await fetchEscrowTransaction(context.escrowTransactionId);
        landingPage = escrowSnapshot.buyerLandingPage ?? null;
        transactionPortalUrl = escrowSnapshot.transactionPortalUrl ?? transactionPortalUrl;
        nextEscrowStatus = escrowSnapshot.escrowStatus ?? nextEscrowStatus;
        await persistEscrowStateForContext({
          supabase,
          context,
          escrowTransactionId: escrowSnapshot.transactionId,
          escrowStatus: nextEscrowStatus,
        });
      } catch {
        // Keep request resilient if Escrow lookup is temporarily unavailable.
      }

      const refreshed = await resolveDealRoomContext(supabase, offerId);
      return sendJson(res, 200, {
        data: {
          transactionId: context.escrowTransactionId,
          escrowStatus: nextEscrowStatus,
          landingPage: landingPage ?? transactionPortalUrl,
          transactionPortalUrl,
          existingTransaction: true,
          ...(refreshed ? dealRoomResponse(refreshed, user.id) : {}),
        },
      });
    }

    const escrowCreateResult = await createEscrowTransaction({
      description: `VibeJam Acquisition: ${safeAssetTitle}`,
      title: safeAssetTitle,
      itemDescription: `Full transfer of source code, domains, and IP for ${safeAssetTitle}`,
      priceUsd: agreedPriceUsd,
      buyerEmail: context.buyerEmail,
      sellerEmail: context.sellerEmail,
    });

    await persistEscrowStateForContext({
      supabase,
      context,
      escrowTransactionId: escrowCreateResult.transactionId,
      escrowStatus: escrowCreateResult.escrowStatus,
    });

    await writeMarketplaceAuditLog({
      actorUserId: user.id,
      assetId: context.assetId,
      action: 'deal_room_escrow_created',
      severity: 'INFO',
      reason: 'ESCROW_CREATED',
      metadata: {
        offer_id: context.legacyOfferId,
        domain_offer_id: context.domainOffer?.id ?? null,
        escrow_transaction_id: escrowCreateResult.transactionId,
        escrow_status: escrowCreateResult.escrowStatus,
        buyer_email: context.buyerEmail,
        seller_email: context.sellerEmail,
      },
    });

    const refreshed = await resolveDealRoomContext(supabase, offerId);
    const transactionPortalUrl =
      escrowCreateResult.transactionPortalUrl
      ?? getEscrowTransactionPortalUrl(escrowCreateResult.transactionId);
    return sendJson(res, 201, {
      data: {
        transactionId: escrowCreateResult.transactionId,
        escrowStatus: escrowCreateResult.escrowStatus,
        landingPage: escrowCreateResult.buyerLandingPage ?? transactionPortalUrl,
        transactionPortalUrl,
        existingTransaction: false,
        ...(refreshed ? dealRoomResponse(refreshed, user.id) : {}),
      },
    });
  } catch (error) {
    const detail = sanitizeErrorDetails(error);
    const normalized = detail.toLowerCase();
    if (normalized.includes('escrow api')) {
      return sendJson(res, 502, {
        error: 'Escrow request failed.',
        details: detail,
        code: 'ESCROW_API_ERROR',
      });
    }
    throw error;
  }
};

export default async function handler(req: any, res: any) {
  try {
    const method = getMethod(req);
    const scope = getQueryValue(req, 'scope');

    if (scope === 'deal-room') {
      if (method === 'GET') {
        return await handleGetDealRoom(req, res);
      }
      if (method === 'PATCH') {
        return await handlePatchDealRoom(req, res);
      }
      return methodNotAllowed(res, ['GET', 'PATCH']);
    }
    if (scope === 'deal-room-escrow') {
      if (method === 'POST') {
        return await handlePostDealRoomEscrow(req, res);
      }
      return methodNotAllowed(res, ['POST']);
    }
    if (scope === 'escrow-webhook') {
      if (method === 'POST') {
        return await handleEscrowWebhook(req, res);
      }
      return methodNotAllowed(res, ['POST']);
    }

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
