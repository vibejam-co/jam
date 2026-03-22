import { getMethod, methodNotAllowed, parseJsonBody, sendJson } from '../lib/server/http.js';
import { getAuthenticatedUser } from '../lib/server/auth.js';
import { getSupabaseAdmin } from '../lib/server/supabase-admin.js';
import { checkRateLimit } from '../lib/server/rate-limit.js';
import {
  AcquirePipelineStageUpdateSchema,
  AcquirePipelineUpsertSchema,
  InboxMessagesQuerySchema,
  InboxSendMessageSchema,
  InboxStartConversationSchema,
  WishlistMutationSchema,
} from '../lib/server/marketplace-validation.js';
import {
  ACQUIRE_STAGE_ORDER,
  type AcquireStage,
  ensureConversation,
  formatAcquireStageLabel,
  upsertPipelineStage,
} from '../lib/server/profile-marketplace.js';
import { sendInboxMessageNotificationEmail } from '../lib/server/email.js';
import { getQueryValue, isRecoverableSchemaError, sanitizeErrorDetails } from '../lib/server/marketplace-utils.js';

type Scope =
  | 'profile-summary'
  | 'inbox-conversations'
  | 'inbox-messages'
  | 'inbox-send'
  | 'inbox-start'
  | 'acquire-pipeline'
  | 'acquire-stage'
  | 'wishlist';

const PIPELINE_SELECT = [
  'id',
  'buyer_id',
  'listing_id',
  'stage',
  'notes',
  'created_at',
  'updated_at',
  'last_activity_at',
].join(',');

const LISTING_SELECT = [
  'id',
  'slug',
  'name',
  'tagline',
  'category',
  'asking_price_cents',
  'mrr_cents',
  'last30d_revenue_cents',
  'verified_status',
  'is_anonymous',
  'founder_name',
].join(',');

const PREVIEW_MAX = 120;
const ACQUIRE_VISIBLE_STAGE_ORDER = ACQUIRE_STAGE_ORDER.filter((stage) => stage !== 'WATCHLISTED');

const parseBooleanFlag = (value: unknown): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === 'true' || normalized === '1' || normalized === 'yes';
  }
  return false;
};

const toPreview = (value: string): string => {
  const trimmed = value.trim();
  if (trimmed.length <= PREVIEW_MAX) {
    return trimmed;
  }
  return `${trimmed.slice(0, PREVIEW_MAX - 1)}…`;
};

const formatOfferPrice = (offerPriceCents: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Math.max(0, Number(offerPriceCents ?? 0)) / 100);

const bootstrapInboxFromOffers = async (supabase: any, userId: string) => {
  const { data: offers, error: offersError } = await supabase
    .from('offers')
    .select('id, asset_id, buyer_user_id, seller_user_id, offer_price_cents, message, status, created_at')
    .or(`buyer_user_id.eq.${userId},seller_user_id.eq.${userId}`)
    .order('created_at', { ascending: false })
    .limit(120);

  if (offersError) {
    if (isRecoverableSchemaError(offersError)) {
      return;
    }
    throw offersError;
  }

  const offerRows = Array.isArray(offers) ? offers : [];
  if (offerRows.length === 0) {
    return;
  }

  const conversationSeed = new Map<string, any>();
  for (const offer of offerRows) {
    if (!offer?.asset_id || !offer?.buyer_user_id || !offer?.seller_user_id) {
      continue;
    }
    if (offer.buyer_user_id === offer.seller_user_id) {
      continue;
    }

    try {
      const conversationId = await ensureConversation({
        supabase,
        listingId: String(offer.asset_id),
        buyerId: String(offer.buyer_user_id),
        sellerId: String(offer.seller_user_id),
      });

      const seeded = conversationSeed.get(conversationId);
      if (!seeded) {
        conversationSeed.set(conversationId, offer);
        continue;
      }

      const seededAt = new Date(seeded.created_at ?? 0).getTime();
      const offerAt = new Date(offer.created_at ?? 0).getTime();
      if (offerAt > seededAt) {
        conversationSeed.set(conversationId, offer);
      }
    } catch (error) {
      if (isRecoverableSchemaError(error)) {
        continue;
      }
      throw error;
    }
  }

  const conversationIds = Array.from(conversationSeed.keys());
  if (conversationIds.length === 0) {
    return;
  }

  const { data: existingMessages, error: existingMessagesError } = await supabase
    .from('messages')
    .select('id, conversation_id')
    .in('conversation_id', conversationIds)
    .limit(2000);

  if (existingMessagesError) {
    if (isRecoverableSchemaError(existingMessagesError)) {
      return;
    }
    throw existingMessagesError;
  }

  const hasMessages = new Set(
    (Array.isArray(existingMessages) ? existingMessages : []).map((row: any) => String(row.conversation_id)),
  );

  const messageInserts: Array<{
    conversation_id: string;
    sender_id: string;
    body: string;
    created_at?: string;
  }> = [];

  const conversationUpdates: Array<{ id: string; last_message_at: string }> = [];

  for (const conversationId of conversationIds) {
    if (hasMessages.has(conversationId)) {
      continue;
    }

    const offer = conversationSeed.get(conversationId);
    if (!offer) {
      continue;
    }

    const body = `Offer submitted: ${formatOfferPrice(Number(offer.offer_price_cents ?? 0))}. ${String(offer.message ?? '').trim()}`;
    messageInserts.push({
      conversation_id: conversationId,
      sender_id: String(offer.buyer_user_id),
      body,
      created_at: offer.created_at ?? undefined,
    });
    conversationUpdates.push({
      id: conversationId,
      last_message_at: offer.created_at ?? new Date().toISOString(),
    });
  }

  if (messageInserts.length > 0) {
    const { error: insertMessageError } = await supabase.from('messages').insert(messageInserts);
    if (insertMessageError && !isRecoverableSchemaError(insertMessageError)) {
      throw insertMessageError;
    }
  }

  await Promise.all(
    conversationUpdates.map(async (row) => {
      const { error: updateError } = await supabase
        .from('conversations')
        .update({ last_message_at: row.last_message_at })
        .eq('id', row.id);
      if (updateError && !isRecoverableSchemaError(updateError)) {
        throw updateError;
      }
    }),
  );
};

const detectScope = (req: any): Scope | null => {
  const fromQuery = getQueryValue(req, 'scope');
  if (fromQuery) {
    return fromQuery as Scope;
  }

  const path = typeof req?.url === 'string' ? req.url.split('?')[0] : '';
  if (path.endsWith('/api/profile/marketplace')) return 'profile-summary';
  if (path.endsWith('/api/inbox/conversations')) return 'inbox-conversations';
  if (path.endsWith('/api/inbox/messages')) return 'inbox-messages';
  if (path.endsWith('/api/inbox/send')) return 'inbox-send';
  if (path.endsWith('/api/inbox/start')) return 'inbox-start';
  if (path.endsWith('/api/acquire/pipeline')) return 'acquire-pipeline';
  if (path.endsWith('/api/acquire/stage')) return 'acquire-stage';
  if (path.endsWith('/api/wishlist/items')) return 'wishlist';
  return null;
};

const resolveUserLabel = (userRow: any): string | null => {
  if (!userRow) {
    return null;
  }

  const metadata = userRow.user_metadata ?? {};
  const fullName = typeof metadata.full_name === 'string' ? metadata.full_name.trim() : '';
  const name = typeof metadata.name === 'string' ? metadata.name.trim() : '';
  if (fullName) {
    return fullName;
  }
  if (name) {
    return name;
  }

  const email = typeof userRow.email === 'string' ? userRow.email.trim() : '';
  if (email.includes('@')) {
    return email.split('@')[0];
  }

  return null;
};

const resolveUserAvatarUrl = (userRow: any): string | null => {
  if (!userRow) {
    return null;
  }

  const metadata = userRow.user_metadata ?? {};
  const avatar =
    (typeof metadata.avatar_url === 'string' && metadata.avatar_url.trim()) ||
    (typeof metadata.picture === 'string' && metadata.picture.trim()) ||
    '';
  return avatar || null;
};

const resolveCounterpartProfile = async (
  supabase: any,
  counterpartId: string,
): Promise<{ name: string; avatarUrl: string | null }> => {
  const { data } = await supabase.auth.admin.getUserById(counterpartId);
  return {
    name: resolveUserLabel(data?.user) ?? 'Member',
    avatarUrl: resolveUserAvatarUrl(data?.user),
  };
};

const resolveUserEmailById = async (supabase: any, userId: string): Promise<string | null> => {
  if (!userId) {
    return null;
  }
  const { data, error } = await supabase.auth.admin.getUserById(userId);
  if (error) {
    return null;
  }
  const email = data?.user?.email;
  if (typeof email === 'string' && email.trim()) {
    return email.trim();
  }
  return null;
};

const buildLegacyInboxItemsFromOffers = async (supabase: any, userId: string) => {
  const { data: offers, error: offersError } = await supabase
    .from('offers')
    .select('id, asset_id, buyer_user_id, seller_user_id, offer_price_cents, message, status, created_at, updated_at')
    .or(`buyer_user_id.eq.${userId},seller_user_id.eq.${userId}`)
    .order('created_at', { ascending: false })
    .limit(240);

  if (offersError) {
    if (isRecoverableSchemaError(offersError)) {
      return [] as any[];
    }
    throw offersError;
  }

  const offerRows = Array.isArray(offers) ? offers : [];
  if (offerRows.length === 0) {
    return [] as any[];
  }

  const groupedByThread = new Map<string, { latest: any; all: any[] }>();
  for (const offer of offerRows) {
    if (!offer?.asset_id || !offer?.buyer_user_id || !offer?.seller_user_id) {
      continue;
    }
    if (offer.buyer_user_id === offer.seller_user_id) {
      continue;
    }

    const threadKey = `${offer.asset_id}:${offer.buyer_user_id}:${offer.seller_user_id}`;
    const existing = groupedByThread.get(threadKey);
    if (!existing) {
      groupedByThread.set(threadKey, { latest: offer, all: [offer] });
      continue;
    }

    existing.all.push(offer);
    const existingTime = new Date(existing.latest?.created_at ?? 0).getTime();
    const nextTime = new Date(offer.created_at ?? 0).getTime();
    if (nextTime > existingTime) {
      existing.latest = offer;
    }
  }

  if (groupedByThread.size === 0) {
    return [] as any[];
  }

  const threads = Array.from(groupedByThread.values());
  const listingIds = Array.from(new Set(threads.map((thread) => String(thread.latest.asset_id)).filter(Boolean)));
  const counterpartIds = Array.from(
    new Set(
      threads
        .map((thread) =>
          String(thread.latest.buyer_user_id) === userId
            ? String(thread.latest.seller_user_id)
            : String(thread.latest.buyer_user_id),
        )
        .filter(Boolean),
    ),
  );

  const { data: listings, error: listingsError } = listingIds.length
    ? await supabase.from('marketplace_assets').select('id, name, founder_name, is_anonymous').in('id', listingIds)
    : { data: [], error: null };

  if (listingsError && !isRecoverableSchemaError(listingsError)) {
    throw listingsError;
  }

  const listingMap = new Map<string, any>(
    (Array.isArray(listings) ? listings : []).map((listing: any) => [String(listing.id), listing]),
  );

  const counterpartProfileMap = new Map<string, { name: string; avatarUrl: string | null }>();
  await Promise.all(
    counterpartIds.slice(0, 80).map(async (counterpartId) => {
      const profile = await resolveCounterpartProfile(supabase, counterpartId);
      counterpartProfileMap.set(counterpartId, profile);
    }),
  );

  const items = threads
    .map((thread) => {
      const latest = thread.latest;
      const listing = listingMap.get(String(latest.asset_id));
      const buyerId = String(latest.buyer_user_id);
      const sellerId = String(latest.seller_user_id);
      const counterpartId = buyerId === userId ? sellerId : buyerId;

      let fallbackCounterpart = buyerId === userId ? 'Seller' : 'Buyer';
      if (buyerId === userId && listing?.is_anonymous) {
        fallbackCounterpart = 'Private Seller';
      } else if (buyerId === userId && listing?.founder_name) {
        fallbackCounterpart = listing.founder_name;
      }

      const offerMessage = String(latest.message ?? '').trim();
      const status = String(latest.status ?? '').toLowerCase();
      const sellerResponded = status === 'countered' || status === 'accepted' || status === 'rejected';
      const offerSummary = `Offer submitted: ${formatOfferPrice(Number(latest.offer_price_cents ?? 0))}${offerMessage && !sellerResponded ? `. ${offerMessage}` : ''}`;
      const sellerReplySummary = offerMessage
        ? `Seller reply: ${offerMessage}`
        : `Seller updated offer status to ${status || 'updated'}.`;
      const preview = buyerId === userId && sellerResponded ? sellerReplySummary : offerSummary;
      const unreadCount = sellerId === userId
        ? thread.all.filter((row: any) => String(row.status ?? '').toLowerCase() === 'sent').length
        : buyerId === userId
          ? thread.all.filter((row: any) => String(row.status ?? '').toLowerCase() === 'countered').length
          : 0;

      const counterpartProfile = counterpartProfileMap.get(counterpartId);

      return {
        id: String(latest.id),
        listingId: String(latest.asset_id),
        listingName: listing?.name ?? 'Marketplace Listing',
        counterpartId,
        counterpartName: counterpartProfile?.name ?? fallbackCounterpart,
        counterpartAvatarUrl: counterpartProfile?.avatarUrl ?? null,
        lastMessagePreview: toPreview(preview),
        lastMessageAt: latest.updated_at ?? latest.created_at ?? new Date().toISOString(),
        unreadCount,
      };
    })
    .sort(
      (a, b) =>
        new Date(b.lastMessageAt || 0).getTime()
        - new Date(a.lastMessageAt || 0).getTime(),
    );

  return items;
};

const buildLegacyInboxMessagePayloadFromOffer = async (supabase: any, userId: string, offerId: string) => {
  const { data: offer, error: offerError } = await supabase
    .from('offers')
    .select('id, asset_id, buyer_user_id, seller_user_id, offer_price_cents, message, status, created_at, updated_at')
    .eq('id', offerId)
    .limit(1)
    .maybeSingle();

  if (offerError) {
    if (isRecoverableSchemaError(offerError)) {
      return null;
    }
    throw offerError;
  }

  if (!offer) {
    return null;
  }

  const buyerId = String(offer.buyer_user_id ?? '');
  const sellerId = String(offer.seller_user_id ?? '');
  const listingId = String(offer.asset_id ?? '');
  if (!buyerId || !sellerId || !listingId) {
    return null;
  }
  if (buyerId !== userId && sellerId !== userId) {
    return null;
  }

  let listing: any = null;
  const { data: listingRow, error: listingError } = await supabase
    .from('marketplace_assets')
    .select('id, name, founder_name, is_anonymous')
    .eq('id', listingId)
    .limit(1)
    .maybeSingle();

  if (listingError && !isRecoverableSchemaError(listingError)) {
    throw listingError;
  }
  listing = listingRow ?? null;

  const counterpartId = buyerId === userId ? sellerId : buyerId;
  const counterpartProfile = await resolveCounterpartProfile(supabase, counterpartId);
  let counterpartName = counterpartProfile.name;
  if (buyerId === userId && listing?.is_anonymous) {
    counterpartName = 'Private Seller';
  } else if (buyerId === userId && listing?.founder_name) {
    counterpartName = listing.founder_name;
  }

  const status = String(offer.status ?? '').toLowerCase();
  const offerMessage = String(offer.message ?? '').trim();
  const offerPriceLabel = formatOfferPrice(Number(offer.offer_price_cents ?? 0));
  const sellerResponded = status === 'countered' || status === 'accepted' || status === 'rejected';
  const createdAt = offer.created_at ?? new Date().toISOString();
  const updatedAt = offer.updated_at ?? createdAt;
  const initialBody = sellerResponded
    ? `Offer submitted: ${offerPriceLabel}.`
    : `Offer submitted: ${offerPriceLabel}${offerMessage ? `. ${offerMessage}` : ''}`;

  const messages: any[] = [
    {
      id: `offer-${offer.id}-initial`,
      conversationId: String(offer.id),
      senderId: buyerId,
      body: initialBody,
      createdAt,
      readAt: null,
      isMine: buyerId === userId,
    },
  ];

  if (sellerResponded) {
    const sellerReplyBody = offerMessage || `Offer status updated: ${status}.`;
    messages.push({
      id: `offer-${offer.id}-seller`,
      conversationId: String(offer.id),
      senderId: sellerId,
      body: sellerReplyBody,
      createdAt: updatedAt,
      readAt: null,
      isMine: sellerId === userId,
    });
  }

  return {
    conversation: {
      id: String(offer.id),
      listingId,
      listingName: listing?.name ?? 'Marketplace Listing',
      counterpartId,
      counterpartName,
      counterpartAvatarUrl: counterpartProfile.avatarUrl,
      lastMessageAt: offer.updated_at ?? offer.created_at ?? new Date().toISOString(),
      dealOfferId: String(offer.id),
    },
    messages,
  };
};

const resolveConversationIdFromLegacyOffer = async (
  supabase: any,
  userId: string,
  offerId: string,
): Promise<string | null> => {
  const { data: offer, error: offerError } = await supabase
    .from('offers')
    .select('id, asset_id, buyer_user_id, seller_user_id')
    .eq('id', offerId)
    .limit(1)
    .maybeSingle();

  if (offerError) {
    if (isRecoverableSchemaError(offerError)) {
      return null;
    }
    throw offerError;
  }

  if (!offer?.asset_id || !offer?.buyer_user_id || !offer?.seller_user_id) {
    return null;
  }

  const buyerId = String(offer.buyer_user_id);
  const sellerId = String(offer.seller_user_id);
  const listingId = String(offer.asset_id);
  if (!buyerId || !sellerId || !listingId) {
    return null;
  }
  if (buyerId !== userId && sellerId !== userId) {
    return null;
  }

  try {
    return await ensureConversation({
      supabase,
      listingId,
      buyerId,
      sellerId,
    });
  } catch (error) {
    if (isRecoverableSchemaError(error)) {
      return null;
    }
    throw error;
  }
};

const syncOfferSentIntoPipeline = async (supabase: any, buyerId: string) => {
  const collected = new Map<string, { listingId: string; note: string | null; at: string }>();

  const mergeRows = (
    rows: any[] | null | undefined,
    getListingId: (row: any) => string | null,
    getNote: (row: any) => string | null,
    getAt: (row: any) => string | null,
  ) => {
    for (const row of Array.isArray(rows) ? rows : []) {
      const listingId = getListingId(row);
      if (!listingId) {
        continue;
      }
      const candidateAt = getAt(row) ?? new Date().toISOString();
      const existing = collected.get(listingId);
      if (!existing || new Date(candidateAt).getTime() >= new Date(existing.at).getTime()) {
        collected.set(listingId, {
          listingId,
          note: getNote(row),
          at: candidateAt,
        });
      }
    }
  };

  const { data: marketplaceOffers, error: marketplaceOffersError } = await supabase
    .from('marketplace_offers')
    .select('asset_id, offer_message, updated_at, created_at')
    .eq('buyer_user_id', buyerId)
    .order('created_at', { ascending: false });

  if (marketplaceOffersError && !isRecoverableSchemaError(marketplaceOffersError)) {
    throw marketplaceOffersError;
  }

  mergeRows(
    marketplaceOffers,
    (row) => (typeof row?.asset_id === 'string' ? row.asset_id : null),
    (row) => (typeof row?.offer_message === 'string' ? row.offer_message : null),
    (row) => (typeof row?.updated_at === 'string' ? row.updated_at : (typeof row?.created_at === 'string' ? row.created_at : null)),
  );

  const { data: legacyOffers, error: legacyOffersError } = await supabase
    .from('offers')
    .select('asset_id, message, updated_at, created_at')
    .eq('buyer_user_id', buyerId)
    .order('created_at', { ascending: false });

  if (legacyOffersError && !isRecoverableSchemaError(legacyOffersError)) {
    throw legacyOffersError;
  }

  mergeRows(
    legacyOffers,
    (row) => (typeof row?.asset_id === 'string' ? row.asset_id : null),
    (row) => (typeof row?.message === 'string' ? row.message : null),
    (row) => (typeof row?.updated_at === 'string' ? row.updated_at : (typeof row?.created_at === 'string' ? row.created_at : null)),
  );

  const offerRows = Array.from(collected.values());
  if (offerRows.length === 0) {
    return;
  }

  const listingIds = offerRows.map((row) => row.listingId);
  const { data: existingPipelineRows, error: existingPipelineRowsError } = await supabase
    .from('acquisition_pipeline_items')
    .select('listing_id, stage')
    .eq('buyer_id', buyerId)
    .in('listing_id', listingIds);

  if (existingPipelineRowsError) {
    if (isRecoverableSchemaError(existingPipelineRowsError)) {
      return;
    }
    throw existingPipelineRowsError;
  }

  const existingByListingId = new Map<string, any>(
    (Array.isArray(existingPipelineRows) ? existingPipelineRows : [])
      .map((row: any) => [String(row.listing_id), row]),
  );

  const upsertRows = offerRows
    .filter((row) => {
      const existing = existingByListingId.get(row.listingId);
      if (!existing) {
        return true;
      }
      return existing.stage === 'WATCHLISTED';
    })
    .map((row) => ({
      buyer_id: buyerId,
      listing_id: row.listingId,
      stage: 'OFFER_SENT',
      notes: row.note,
      last_activity_at: row.at,
    }));

  if (upsertRows.length === 0) {
    return;
  }

  const { error: upsertError } = await supabase
    .from('acquisition_pipeline_items')
    .upsert(upsertRows, { onConflict: 'buyer_id,listing_id' });

  if (upsertError && !isRecoverableSchemaError(upsertError)) {
    throw upsertError;
  }
};

const buildPipelineResponse = async (supabase: any, buyerId: string) => {
  const { data: rows, error } = await supabase
    .from('acquisition_pipeline_items')
    .select(PIPELINE_SELECT)
    .eq('buyer_id', buyerId)
    .order('last_activity_at', { ascending: false });

  if (error) {
    if (isRecoverableSchemaError(error)) {
      return {
        items: [],
        stages: ACQUIRE_VISIBLE_STAGE_ORDER.map((stage) => ({
          stage,
          label: formatAcquireStageLabel(stage),
          count: 0,
        })),
      };
    }
    throw error;
  }

  const pipelineRows = Array.isArray(rows) ? rows : [];
  if (pipelineRows.length === 0) {
    return {
      items: [],
      stages: ACQUIRE_VISIBLE_STAGE_ORDER.map((stage) => ({
        stage,
        label: formatAcquireStageLabel(stage),
        count: 0,
      })),
    };
  }

  const listingIds = Array.from(new Set(pipelineRows.map((row: any) => row.listing_id).filter(Boolean)));

  const [
    { data: listings, error: listingsError },
    { data: conversations, error: conversationsError },
    { data: domainOffers, error: domainOffersError },
    { data: legacyOffers, error: legacyOffersError },
  ] =
    await Promise.all([
      supabase.from('marketplace_assets').select(LISTING_SELECT).in('id', listingIds),
      supabase
        .from('conversations')
        .select('id, listing_id, buyer_id, seller_id')
        .eq('buyer_id', buyerId)
        .in('listing_id', listingIds),
      supabase
        .from('marketplace_offers')
        .select('id, asset_id, updated_at, created_at')
        .eq('buyer_user_id', buyerId)
        .in('asset_id', listingIds),
      supabase
        .from('offers')
        .select('id, asset_id, updated_at, created_at')
        .eq('buyer_user_id', buyerId)
        .in('asset_id', listingIds),
    ]);

  if (listingsError) {
    throw listingsError;
  }

  if (conversationsError && !isRecoverableSchemaError(conversationsError)) {
    throw conversationsError;
  }
  if (domainOffersError && !isRecoverableSchemaError(domainOffersError)) {
    throw domainOffersError;
  }
  if (legacyOffersError && !isRecoverableSchemaError(legacyOffersError)) {
    throw legacyOffersError;
  }

  const listingMap = new Map<string, any>(
    (Array.isArray(listings) ? listings : []).map((listing: any) => [listing.id, listing]),
  );
  const conversationMap = new Map<string, any>(
    (Array.isArray(conversations) ? conversations : []).map((row: any) => [row.listing_id, row]),
  );
  const dealOfferByListingId = new Map<string, { id: string; at: number; source: 'domain' | 'legacy' }>();

  const pushOfferRows = (rows: any[] | null | undefined, source: 'domain' | 'legacy') => {
    for (const row of Array.isArray(rows) ? rows : []) {
      const listingId = typeof row?.asset_id === 'string' ? row.asset_id : null;
      const offerId = typeof row?.id === 'string' ? row.id : null;
      if (!listingId || !offerId) {
        continue;
      }

      const atIso =
        typeof row?.updated_at === 'string'
          ? row.updated_at
          : (typeof row?.created_at === 'string' ? row.created_at : null);
      const parsedAt = atIso ? Date.parse(atIso) : Number.NaN;
      const at = Number.isFinite(parsedAt) ? parsedAt : 0;
      const existing = dealOfferByListingId.get(listingId);

      if (
        !existing
        || at > existing.at
        || (at === existing.at && source === 'domain' && existing.source === 'legacy')
      ) {
        dealOfferByListingId.set(listingId, { id: offerId, at, source });
      }
    }
  };

  pushOfferRows(domainOffers, 'domain');
  pushOfferRows(legacyOffers, 'legacy');

  const stageCounts = new Map<string, number>();
  for (const stage of ACQUIRE_VISIBLE_STAGE_ORDER) {
    stageCounts.set(stage, 0);
  }

  const items = pipelineRows
    .map((row: any) => {
      if (row.stage === 'WATCHLISTED') {
        return null;
      }

      const listing = listingMap.get(row.listing_id);
      if (!listing) {
        return null;
      }

      stageCounts.set(row.stage, (stageCounts.get(row.stage) ?? 0) + 1);

      const conversation = conversationMap.get(row.listing_id);
      return {
        id: row.id,
        listingId: row.listing_id,
        stage: row.stage,
        stageLabel: formatAcquireStageLabel(row.stage),
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        lastActivityAt: row.last_activity_at,
        conversationId: conversation?.id ?? null,
        dealOfferId: dealOfferByListingId.get(String(row.listing_id))?.id ?? null,
        listing: {
          id: listing.id,
          slug: listing.slug,
          name: listing.name,
          tagline: listing.tagline,
          category: listing.category,
          askingPriceCents: Number(listing.asking_price_cents ?? 0),
          mrrCents: Number(listing.mrr_cents ?? 0),
          last30dRevenueCents: Number(listing.last30d_revenue_cents ?? 0),
          verifiedStatus: listing.verified_status,
          isAnonymous: Boolean(listing.is_anonymous),
          founderName: listing.is_anonymous ? 'Private Seller' : listing.founder_name,
        },
      };
    })
    .filter(Boolean);

  return {
    items,
    stages: ACQUIRE_VISIBLE_STAGE_ORDER.map((stage) => ({
      stage,
      label: formatAcquireStageLabel(stage),
      count: stageCounts.get(stage) ?? 0,
    })),
  };
};

const getListingIdFromDelete = async (req: any): Promise<string | undefined> => {
  const fromQuery = getQueryValue(req, 'listingId') ?? undefined;
  if (fromQuery) {
    return fromQuery;
  }

  try {
    const body = await parseJsonBody(req);
    if (body && typeof body.listingId === 'string') {
      return body.listingId;
    }
  } catch {
    return undefined;
  }

  return undefined;
};

const handleProfileSummary = async (req: any, res: any, user: any, supabase: any) => {
  if (getMethod(req) !== 'GET') {
    return methodNotAllowed(res, ['GET']);
  }

  await bootstrapInboxFromOffers(supabase, user.id);

  const [assetsResult, offersResult, pipelineResult, wishlistResult, conversationsResult] = await Promise.all([
    supabase
      .from('marketplace_assets')
      .select('id, is_listed, asking_price_cents, verified_status', { count: 'exact' })
      .eq('owner_user_id', user.id),
    supabase.from('offers').select('id', { count: 'exact', head: true }).eq('buyer_user_id', user.id),
    supabase.from('acquisition_pipeline_items').select('id', { count: 'exact', head: true }).eq('buyer_id', user.id),
    supabase.from('wishlist_items').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('conversations').select('id').or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`),
  ]);

  if (assetsResult.error && !isRecoverableSchemaError(assetsResult.error)) {
    throw assetsResult.error;
  }
  if (offersResult.error && !isRecoverableSchemaError(offersResult.error)) {
    throw offersResult.error;
  }
  if (pipelineResult.error && !isRecoverableSchemaError(pipelineResult.error)) {
    throw pipelineResult.error;
  }
  if (wishlistResult.error && !isRecoverableSchemaError(wishlistResult.error)) {
    throw wishlistResult.error;
  }
  if (conversationsResult.error && !isRecoverableSchemaError(conversationsResult.error)) {
    throw conversationsResult.error;
  }

  const assets = Array.isArray(assetsResult.data) ? assetsResult.data : [];
  const activeListingsCount = assets.filter((row: any) => row.is_listed === true).length;
  const portfolioValueCents = assets
    .filter((row: any) => row.is_listed === true)
    .reduce((sum: number, row: any) => sum + Number(row.asking_price_cents ?? 0), 0);

  let publishedJamCount = 0;
  const userEmail = typeof user.email === 'string' ? user.email.trim() : '';
  if (userEmail) {
    const jamCountResult = await supabase
      .from('jams')
      .select('id', { count: 'exact', head: true })
      .eq('founder_email', userEmail);

    if (jamCountResult.error) {
      if (!isRecoverableSchemaError(jamCountResult.error)) {
        throw jamCountResult.error;
      }
    } else {
      publishedJamCount = jamCountResult.count ?? 0;
    }
  }

  const conversations = Array.isArray(conversationsResult.data) ? conversationsResult.data : [];
  const conversationIds = conversations.map((row: any) => row.id);

  let unreadCount = 0;
  if (conversationIds.length > 0) {
    const unreadResult = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .in('conversation_id', conversationIds)
      .is('read_at', null)
      .neq('sender_id', user.id);

    if (unreadResult.error && !isRecoverableSchemaError(unreadResult.error)) {
      throw unreadResult.error;
    }

    unreadCount = unreadResult.count ?? 0;
  }

  const buyerEnabled = parseBooleanFlag((user.app_metadata as any)?.buyer_enabled)
    || parseBooleanFlag((user.user_metadata as any)?.buyer_enabled);

  const offersCount = offersResult.count ?? 0;
  const pipelineCount = pipelineResult.count ?? 0;
  const wishlistCount = wishlistResult.count ?? 0;

  return sendJson(res, 200, {
    data: {
      roles: {
        seller: assets.length > 0 || publishedJamCount > 0,
        buyer: true,
        buyerEnabled,
      },
      stats: {
        activeListingsCount,
        listingsCount: assets.length,
        portfolioValueCents,
        offersCount,
        pipelineCount,
        wishlistCount,
        conversationsCount: conversations.length,
        unreadInboxCount: unreadCount,
      },
    },
  });
};

const handleInboxConversations = async (req: any, res: any, user: any, supabase: any) => {
  if (getMethod(req) !== 'GET') {
    return methodNotAllowed(res, ['GET']);
  }

  await bootstrapInboxFromOffers(supabase, user.id);

  const { data: conversations, error: conversationsError } = await supabase
    .from('conversations')
    .select('id, listing_id, buyer_id, seller_id, last_message_at, created_at, updated_at')
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order('last_message_at', { ascending: false })
    .limit(100);

  if (conversationsError) {
    if (isRecoverableSchemaError(conversationsError)) {
      const legacyItems = await buildLegacyInboxItemsFromOffers(supabase, user.id);
      return sendJson(res, 200, { data: { items: legacyItems } });
    }
    throw conversationsError;
  }

  const rows = Array.isArray(conversations) ? conversations : [];
  if (rows.length === 0) {
    const legacyItems = await buildLegacyInboxItemsFromOffers(supabase, user.id);
    if (legacyItems.length > 0) {
      return sendJson(res, 200, { data: { items: legacyItems } });
    }
    return sendJson(res, 200, { data: { items: [] } });
  }

  const conversationIds = rows.map((row) => row.id);
  const listingIds = Array.from(new Set(rows.map((row) => row.listing_id).filter(Boolean)));
  const counterpartIds = Array.from(
    new Set(
      rows
        .map((row) => (row.buyer_id === user.id ? row.seller_id : row.buyer_id))
        .filter((id): id is string => Boolean(id)),
    ),
  );

  const [{ data: listings, error: listingsError }, { data: messages, error: messagesError }] = await Promise.all([
    listingIds.length
      ? supabase.from('marketplace_assets').select('id, name, founder_name, is_anonymous').in('id', listingIds)
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from('messages')
      .select('id, conversation_id, sender_id, body, created_at, read_at')
      .in('conversation_id', conversationIds)
      .order('created_at', { ascending: false })
      .limit(800),
  ]);

  if (listingsError) {
    throw listingsError;
  }
  if (messagesError && !isRecoverableSchemaError(messagesError)) {
    throw messagesError;
  }

  const listingMap = new Map<string, any>(
    (Array.isArray(listings) ? listings : []).map((listing: any) => [listing.id, listing]),
  );

  const byConversation = new Map<string, any[]>();
  for (const message of Array.isArray(messages) ? messages : []) {
    const id = String(message.conversation_id);
    if (!byConversation.has(id)) {
      byConversation.set(id, []);
    }
    byConversation.get(id)!.push(message);
  }

  const counterpartProfileMap = new Map<string, { name: string; avatarUrl: string | null }>();
  await Promise.all(
    counterpartIds.slice(0, 50).map(async (counterpartId) => {
      const profile = await resolveCounterpartProfile(supabase, counterpartId);
      counterpartProfileMap.set(counterpartId, profile);
    }),
  );

  const items = rows.map((conversation) => {
    const listing = conversation.listing_id ? listingMap.get(conversation.listing_id) : null;
    const counterpartId = conversation.buyer_id === user.id ? conversation.seller_id : conversation.buyer_id;
    const counterpartProfile = counterpartProfileMap.get(counterpartId);

    let fallbackCounterpart = conversation.buyer_id === user.id ? 'Seller' : 'Buyer';
    if (conversation.buyer_id === user.id && listing?.is_anonymous) {
      fallbackCounterpart = 'Private Seller';
    } else if (conversation.buyer_id === user.id && listing?.founder_name) {
      fallbackCounterpart = listing.founder_name;
    }

    const messageRows = byConversation.get(conversation.id) ?? [];
    const latest = messageRows[0] ?? null;
    const unreadCount = messageRows.filter((message) => message.sender_id !== user.id && !message.read_at).length;

    return {
      id: conversation.id,
      listingId: conversation.listing_id,
      listingName: listing?.name ?? 'Marketplace Listing',
      counterpartId,
      counterpartName: counterpartProfile?.name ?? fallbackCounterpart,
      counterpartAvatarUrl: counterpartProfile?.avatarUrl ?? null,
      lastMessagePreview: latest?.body ? toPreview(String(latest.body)) : 'No messages yet',
      lastMessageAt: latest?.created_at ?? conversation.last_message_at ?? conversation.created_at,
      unreadCount,
    };
  });

  return sendJson(res, 200, { data: { items } });
};

const handleInboxMessages = async (req: any, res: any, user: any, supabase: any) => {
  if (getMethod(req) !== 'GET') {
    return methodNotAllowed(res, ['GET']);
  }

  const parsed = InboxMessagesQuerySchema.safeParse({
    conversationId: getQueryValue(req, 'conversationId') ?? undefined,
  });

  if (!parsed.success) {
    return sendJson(res, 400, {
      error: 'Missing conversation id.',
      details: parsed.error.issues[0]?.message,
    });
  }

  const { conversationId } = parsed.data;

  let { data: conversation, error: conversationError } = await supabase
    .from('conversations')
    .select('id, listing_id, buyer_id, seller_id, last_message_at, created_at')
    .eq('id', conversationId)
    .limit(1)
    .maybeSingle();

  if (conversationError) {
    if (!isRecoverableSchemaError(conversationError)) {
      throw conversationError;
    }
    conversation = null;
    conversationError = null;
  }

  if (!conversation) {
    const recoveredConversationId = await resolveConversationIdFromLegacyOffer(supabase, user.id, conversationId);
    if (recoveredConversationId) {
      const { data: recoveredConversation, error: recoveredConversationError } = await supabase
        .from('conversations')
        .select('id, listing_id, buyer_id, seller_id, last_message_at, created_at')
        .eq('id', recoveredConversationId)
        .limit(1)
        .maybeSingle();
      if (recoveredConversationError && !isRecoverableSchemaError(recoveredConversationError)) {
        throw recoveredConversationError;
      }
      if (recoveredConversation) {
        conversation = recoveredConversation;
      }
    }
  }

  if (!conversation || (conversation.buyer_id !== user.id && conversation.seller_id !== user.id)) {
    const legacyPayload = await buildLegacyInboxMessagePayloadFromOffer(supabase, user.id, conversationId);
    if (legacyPayload) {
      return sendJson(res, 200, { data: legacyPayload });
    }
    return sendJson(res, 404, { error: 'Conversation not found.' });
  }

  const [{ data: listing }, { data: messages, error: messagesError }] = await Promise.all([
    conversation.listing_id
      ? supabase
          .from('marketplace_assets')
          .select('id, name, founder_name, is_anonymous')
          .eq('id', conversation.listing_id)
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from('messages')
      .select('id, conversation_id, sender_id, body, created_at, read_at')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true }),
  ]);

  if (messagesError && !isRecoverableSchemaError(messagesError)) {
    throw messagesError;
  }

  const counterpartId = conversation.buyer_id === user.id ? conversation.seller_id : conversation.buyer_id;
  const counterpartProfile = await resolveCounterpartProfile(supabase, counterpartId);
  let counterpartName = counterpartProfile.name;

  if (conversation.buyer_id === user.id && listing?.is_anonymous) {
    counterpartName = 'Private Seller';
  } else if (conversation.buyer_id === user.id && listing?.founder_name) {
    counterpartName = listing.founder_name;
  }

  const [domainOfferLookup, legacyOfferLookup] = await Promise.all([
    conversation.listing_id
      ? supabase
          .from('marketplace_offers')
          .select('id, legacy_offer_id, status, updated_at, created_at')
          .eq('asset_id', conversation.listing_id)
          .eq('buyer_user_id', conversation.buyer_id)
          .eq('seller_user_id', conversation.seller_id)
          .order('updated_at', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    conversation.listing_id
      ? supabase
          .from('offers')
          .select('id, status, updated_at, created_at')
          .eq('asset_id', conversation.listing_id)
          .eq('buyer_user_id', conversation.buyer_id)
          .eq('seller_user_id', conversation.seller_id)
          .order('updated_at', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (domainOfferLookup.error && !isRecoverableSchemaError(domainOfferLookup.error)) {
    throw domainOfferLookup.error;
  }
  if (legacyOfferLookup.error && !isRecoverableSchemaError(legacyOfferLookup.error)) {
    throw legacyOfferLookup.error;
  }

  const domainOffer = domainOfferLookup.data ?? null;
  const legacyOffer = legacyOfferLookup.data ?? null;
  const dealOfferId = domainOffer?.id
    ? String(domainOffer.id)
    : legacyOffer?.id
      ? String(legacyOffer.id)
      : domainOffer?.legacy_offer_id
        ? String(domainOffer.legacy_offer_id)
        : null;

  const messageRows = Array.isArray(messages) ? messages : [];
  const hasUnreadIncoming = messageRows.some((message) => message.sender_id !== user.id && !message.read_at);
  if (hasUnreadIncoming) {
    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', conversation.id)
      .is('read_at', null)
      .neq('sender_id', user.id);
  }

  return sendJson(res, 200, {
    data: {
      conversation: {
        id: conversation.id,
        listingId: conversation.listing_id,
        listingName: listing?.name ?? 'Marketplace Listing',
        counterpartId,
        counterpartName,
        counterpartAvatarUrl: counterpartProfile.avatarUrl,
        lastMessageAt: conversation.last_message_at ?? conversation.created_at,
        dealOfferId,
      },
      messages: messageRows.map((message) => ({
        id: message.id,
        conversationId: message.conversation_id,
        senderId: message.sender_id,
        body: message.body,
        createdAt: message.created_at,
        readAt: message.read_at,
        isMine: message.sender_id === user.id,
      })),
    },
  });
};

const handleInboxSend = async (req: any, res: any, user: any, supabase: any) => {
  if (getMethod(req) !== 'POST') {
    return methodNotAllowed(res, ['POST']);
  }

  const limiter = checkRateLimit(`inbox-send:${user.id}`, { limit: 80, windowMs: 10 * 60 * 1000 });
  if (!limiter.ok) {
    return sendJson(res, 429, {
      error: 'Too many messages sent. Please wait before trying again.',
      details: `Retry in ${Math.ceil(limiter.retryAfterMs / 1000)}s`,
    });
  }

  const body = await parseJsonBody(req);
  const parsed = InboxSendMessageSchema.safeParse(body);
  if (!parsed.success) {
    return sendJson(res, 400, {
      error: 'Invalid message payload.',
      details: parsed.error.issues[0]?.message,
    });
  }

  const payload = parsed.data;
  const senderLabel = resolveUserLabel(user) ?? 'Marketplace Member';

  const { data: conversation, error: conversationError } = await supabase
    .from('conversations')
    .select('id, listing_id, buyer_id, seller_id')
    .eq('id', payload.conversationId)
    .limit(1)
    .maybeSingle();

  if (conversationError && !isRecoverableSchemaError(conversationError)) {
    throw conversationError;
  }

  let resolvedConversation = conversation;
  let legacyOffer: any = null;

  if (!resolvedConversation || (resolvedConversation.buyer_id !== user.id && resolvedConversation.seller_id !== user.id)) {
    const { data: offerRow, error: offerError } = await supabase
      .from('offers')
      .select('id, asset_id, buyer_user_id, seller_user_id, status')
      .eq('id', payload.conversationId)
      .limit(1)
      .maybeSingle();

    if (offerError) {
      if (!isRecoverableSchemaError(offerError)) {
        throw offerError;
      }
    } else {
      legacyOffer = offerRow ?? null;
    }

    if (legacyOffer?.asset_id && legacyOffer?.buyer_user_id && legacyOffer?.seller_user_id) {
      const buyerId = String(legacyOffer.buyer_user_id);
      const sellerId = String(legacyOffer.seller_user_id);
      const listingId = String(legacyOffer.asset_id);
      if (buyerId !== user.id && sellerId !== user.id) {
        return sendJson(res, 404, { error: 'Conversation not found.' });
      }

      try {
        const recoveredConversationId = await ensureConversation({
          supabase,
          listingId,
          buyerId,
          sellerId,
        });

        const { data: recoveredConversation, error: recoveredConversationError } = await supabase
          .from('conversations')
          .select('id, listing_id, buyer_id, seller_id')
          .eq('id', recoveredConversationId)
          .limit(1)
          .maybeSingle();

        if (recoveredConversationError) {
          throw recoveredConversationError;
        }
        resolvedConversation = recoveredConversation;
      } catch (recoverError) {
        if (!isRecoverableSchemaError(recoverError)) {
          throw recoverError;
        }

        if (sellerId !== user.id) {
          return sendJson(res, 409, {
            error: 'Reply is temporarily unavailable for this thread.',
            details: 'Legacy offer thread is read-only until inbox migration completes.',
          });
        }

        const nowIso = new Date().toISOString();
        const { error: legacyUpdateError } = await supabase
          .from('offers')
          .update({
            status: 'countered',
            message: payload.body,
          })
          .eq('id', legacyOffer.id)
          .eq('seller_user_id', user.id);

        if (legacyUpdateError) {
          throw legacyUpdateError;
        }

        await supabase.from('notifications').insert({
          title: 'Seller Replied',
          message: 'You received a reply to your marketplace offer.',
          type: 'update',
          timestamp_label: 'just now',
          is_read: false,
          jam_id: null,
          recipient_user_id: buyerId,
          metadata: {
            offer_id: legacyOffer.id,
            listing_id: listingId,
          },
        });

        const recipientEmail = await resolveUserEmailById(supabase, buyerId);
        let listingName = 'Marketplace Listing';
        const { data: listingNameRow, error: listingNameError } = await supabase
          .from('marketplace_assets')
          .select('name')
          .eq('id', listingId)
          .limit(1)
          .maybeSingle();
        if (!listingNameError && listingNameRow?.name) {
          listingName = String(listingNameRow.name);
        }

        try {
          await sendInboxMessageNotificationEmail({
            toEmail: recipientEmail,
            senderLabel,
            listingName,
            message: payload.body,
          });
        } catch {
          // Non-blocking: message send should succeed even when email provider fails.
        }

        return sendJson(res, 201, {
          data: {
            conversationId: String(legacyOffer.id),
            legacy: true,
            message: {
              id: `legacy-${legacyOffer.id}-${Date.now()}`,
              conversationId: String(legacyOffer.id),
              senderId: user.id,
              body: payload.body,
              createdAt: nowIso,
              readAt: null,
              isMine: true,
            },
          },
        });
      }
    } else {
      return sendJson(res, 404, { error: 'Conversation not found.' });
    }
  }

  if (!resolvedConversation || (resolvedConversation.buyer_id !== user.id && resolvedConversation.seller_id !== user.id)) {
    return sendJson(res, 404, { error: 'Conversation not found.' });
  }

  const nowIso = new Date().toISOString();
  const { data: message, error: messageError } = await supabase
    .from('messages')
    .insert({
      conversation_id: resolvedConversation.id,
      sender_id: user.id,
      body: payload.body,
    })
    .select('id, conversation_id, sender_id, body, created_at, read_at')
    .single();

  if (messageError) {
    throw messageError;
  }

  const { error: updateConversationError } = await supabase
    .from('conversations')
    .update({
      last_message_at: nowIso,
    })
    .eq('id', resolvedConversation.id);

  if (updateConversationError) {
    throw updateConversationError;
  }

  const recipientId = resolvedConversation.buyer_id === user.id ? resolvedConversation.seller_id : resolvedConversation.buyer_id;
  const recipientEmail = await resolveUserEmailById(supabase, recipientId);
  let listingName = 'Marketplace Listing';
  if (resolvedConversation.listing_id) {
    const { data: listingRow, error: listingRowError } = await supabase
      .from('marketplace_assets')
      .select('name')
      .eq('id', resolvedConversation.listing_id)
      .limit(1)
      .maybeSingle();
    if (!listingRowError && listingRow?.name) {
      listingName = String(listingRow.name);
    }
  }

  const { error: inboxNotificationError } = await supabase.from('notifications').insert({
    title: 'New Inbox Message',
    message: 'You received a new message in your acquisition inbox.',
    type: 'update',
    timestamp_label: 'just now',
    is_read: false,
    jam_id: null,
    recipient_user_id: recipientId,
    metadata: {
      conversation_id: resolvedConversation.id,
      listing_id: resolvedConversation.listing_id,
    },
  });
  if (inboxNotificationError && !isRecoverableSchemaError(inboxNotificationError)) {
    throw inboxNotificationError;
  }

  try {
    await sendInboxMessageNotificationEmail({
      toEmail: recipientEmail,
      senderLabel,
      listingName,
      message: payload.body,
    });
  } catch {
    // Non-blocking: keep inbox messaging responsive if email provider has issues.
  }

  return sendJson(res, 201, {
    data: {
      conversationId: resolvedConversation.id,
      message: {
        id: message.id,
        conversationId: message.conversation_id,
        senderId: message.sender_id,
        body: message.body,
        createdAt: message.created_at,
        readAt: message.read_at,
        isMine: true,
      },
    },
  });
};

const handleInboxStart = async (req: any, res: any, user: any, supabase: any) => {
  if (getMethod(req) !== 'POST') {
    return methodNotAllowed(res, ['POST']);
  }

  const limiter = checkRateLimit(`inbox-start:${user.id}`, { limit: 30, windowMs: 10 * 60 * 1000 });
  if (!limiter.ok) {
    return sendJson(res, 429, {
      error: 'Too many conversation starts. Please try again shortly.',
      details: `Retry in ${Math.ceil(limiter.retryAfterMs / 1000)}s`,
    });
  }

  const body = await parseJsonBody(req);
  const parsed = InboxStartConversationSchema.safeParse(body);
  if (!parsed.success) {
    return sendJson(res, 400, {
      error: 'Invalid conversation payload.',
      details: parsed.error.issues[0]?.message,
    });
  }

  const payload = parsed.data;
  const senderLabel = resolveUserLabel(user) ?? 'Marketplace Member';

  const { data: listing, error: listingError } = await supabase
    .from('marketplace_assets')
    .select('id, owner_user_id, name, is_listed')
    .eq('id', payload.listingId)
    .limit(1)
    .maybeSingle();

  if (listingError) {
    throw listingError;
  }

  if (!listing || listing.is_listed !== true) {
    return sendJson(res, 404, { error: 'Listing not found.' });
  }

  if (listing.owner_user_id === user.id) {
    return sendJson(res, 400, { error: 'You cannot start a buyer conversation on your own listing.' });
  }

  const conversationId = await ensureConversation({
    supabase,
    listingId: listing.id,
    buyerId: user.id,
    sellerId: listing.owner_user_id,
  });

  const initialMessage = payload.initialMessage?.trim() ?? '';
  if (initialMessage) {
    const nowIso = new Date().toISOString();
    const { error: messageError } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: user.id,
      body: initialMessage,
    });

    if (messageError && !isRecoverableSchemaError(messageError)) {
      throw messageError;
    }

    const { error: conversationUpdateError } = await supabase
      .from('conversations')
      .update({
        last_message_at: nowIso,
      })
      .eq('id', conversationId);

    if (conversationUpdateError && !isRecoverableSchemaError(conversationUpdateError)) {
      throw conversationUpdateError;
    }

    await supabase.from('notifications').insert({
      title: 'New Buyer Message',
      message: `A buyer messaged you about ${listing.name}.`,
      type: 'offer',
      timestamp_label: 'just now',
      is_read: false,
      jam_id: null,
      recipient_user_id: listing.owner_user_id,
      metadata: {
        listing_id: listing.id,
        conversation_id: conversationId,
      },
    });

    const recipientEmail = await resolveUserEmailById(supabase, String(listing.owner_user_id));
    try {
      await sendInboxMessageNotificationEmail({
        toEmail: recipientEmail,
        senderLabel,
        listingName: String(listing.name ?? 'Marketplace Listing'),
        message: initialMessage,
      });
    } catch {
      // Non-blocking: conversation should open even if email provider fails.
    }
  }

  try {
    await upsertPipelineStage({
      supabase,
      buyerId: user.id,
      listingId: listing.id,
      stage: 'WATCHLISTED',
    });
  } catch (error) {
    if (!isRecoverableSchemaError(error)) {
      throw error;
    }
  }

  return sendJson(res, 200, {
    data: {
      conversationId,
      listing: {
        id: listing.id,
        name: listing.name,
      },
      created: true,
    },
  });
};

const handleAcquirePipeline = async (req: any, res: any, user: any, supabase: any) => {
  const method = getMethod(req);

  if (method === 'GET') {
    await syncOfferSentIntoPipeline(supabase, user.id);
    const payload = await buildPipelineResponse(supabase, user.id);
    return sendJson(res, 200, { data: payload });
  }

  if (method === 'POST') {
    const body = await parseJsonBody(req);
    const parsed = AcquirePipelineUpsertSchema.safeParse(body);

    if (!parsed.success) {
      return sendJson(res, 400, {
        error: 'Invalid pipeline payload.',
        details: parsed.error.issues[0]?.message,
      });
    }

    const input = parsed.data;

    const { data: listing, error: listingError } = await supabase
      .from('marketplace_assets')
      .select('id, is_listed')
      .eq('id', input.listingId)
      .limit(1)
      .maybeSingle();

    if (listingError) {
      throw listingError;
    }

    if (!listing || listing.is_listed !== true) {
      return sendJson(res, 404, { error: 'Listing not found.' });
    }

    await upsertPipelineStage({
      supabase,
      buyerId: user.id,
      listingId: input.listingId,
      stage: input.stage,
      notes: input.notes,
    });

    const payload = await buildPipelineResponse(supabase, user.id);
    return sendJson(res, 200, { data: payload });
  }

  return methodNotAllowed(res, ['GET', 'POST']);
};

const handleAcquireStage = async (req: any, res: any, user: any, supabase: any) => {
  if (getMethod(req) !== 'POST') {
    return methodNotAllowed(res, ['POST']);
  }

  const limiter = checkRateLimit(`acquire-stage:${user.id}`, { limit: 40, windowMs: 10 * 60 * 1000 });
  if (!limiter.ok) {
    return sendJson(res, 429, {
      error: 'Too many pipeline updates. Please retry shortly.',
      details: `Retry in ${Math.ceil(limiter.retryAfterMs / 1000)}s`,
    });
  }

  const body = await parseJsonBody(req);
  const parsed = AcquirePipelineStageUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return sendJson(res, 400, {
      error: 'Invalid stage update payload.',
      details: parsed.error.issues[0]?.message,
    });
  }

  const payload = parsed.data;

  const { data: existingPipelineItem, error: existingPipelineItemError } = await supabase
    .from('acquisition_pipeline_items')
    .select('stage')
    .eq('buyer_id', user.id)
    .eq('listing_id', payload.listingId)
    .limit(1)
    .maybeSingle();

  if (existingPipelineItemError && !isRecoverableSchemaError(existingPipelineItemError)) {
    throw existingPipelineItemError;
  }

  const currentStage = (typeof existingPipelineItem?.stage === 'string'
    ? existingPipelineItem.stage
    : null) as AcquireStage | null;
  if (!currentStage && payload.stage !== 'OFFER_SENT') {
    return sendJson(res, 400, {
      error: 'Stage sequence invalid. Start with OFFER_SENT.',
    });
  }
  if (currentStage) {
    const currentIndex = ACQUIRE_STAGE_ORDER.indexOf(currentStage);
    const nextAllowedStage = currentIndex >= 0 ? ACQUIRE_STAGE_ORDER[currentIndex + 1] : null;
    const isNoOp = currentStage === payload.stage;
    if (!isNoOp && payload.stage !== nextAllowedStage) {
      return sendJson(res, 400, {
        error: `Stage sequence invalid. ${currentStage} can only move to ${nextAllowedStage ?? 'no further stage'}.`,
      });
    }
  }

  const { data: listing, error: listingError } = await supabase
    .from('marketplace_assets')
    .select('id, name, owner_user_id, is_listed')
    .eq('id', payload.listingId)
    .limit(1)
    .maybeSingle();

  if (listingError) {
    throw listingError;
  }

  if (!listing || listing.is_listed !== true) {
    return sendJson(res, 404, { error: 'Listing not found.' });
  }

  if (listing.owner_user_id === user.id) {
    return sendJson(res, 400, { error: 'Sellers cannot move buyer acquisition stages for their own listing.' });
  }

  const senderLabel = resolveUserLabel(user) ?? 'Marketplace Member';

  await upsertPipelineStage({
    supabase,
    buyerId: user.id,
    listingId: listing.id,
    stage: payload.stage,
    notes: payload.notes,
  });

  let conversationId: string | null = null;
  if (payload.stage !== 'WATCHLISTED') {
    conversationId = await ensureConversation({
      supabase,
      listingId: listing.id,
      buyerId: user.id,
      sellerId: listing.owner_user_id,
    });

    const messageBody = payload.message?.trim()
      ? payload.message.trim()
      : `Pipeline update: moved to ${formatAcquireStageLabel(payload.stage)}.`;

    const { error: messageError } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: user.id,
      body: messageBody,
    });

    if (messageError && !isRecoverableSchemaError(messageError)) {
      throw messageError;
    }

    await supabase.from('conversations').update({ last_message_at: new Date().toISOString() }).eq('id', conversationId);

    await supabase.from('notifications').insert({
      title: 'Pipeline Update',
      message: `A buyer progressed ${listing.name} to ${formatAcquireStageLabel(payload.stage)}.`,
      type: 'update',
      timestamp_label: 'just now',
      is_read: false,
      jam_id: null,
      recipient_user_id: listing.owner_user_id,
      metadata: {
        listing_id: listing.id,
        conversation_id: conversationId,
        stage: payload.stage,
      },
    });

    const recipientEmail = await resolveUserEmailById(supabase, String(listing.owner_user_id));
    try {
      await sendInboxMessageNotificationEmail({
        toEmail: recipientEmail,
        senderLabel,
        listingName: String(listing.name ?? 'Marketplace Listing'),
        message: messageBody,
      });
    } catch {
      // Non-blocking: keep pipeline updates flowing even if email delivery fails.
    }
  }

  return sendJson(res, 200, {
    data: {
      listingId: listing.id,
      stage: payload.stage,
      stageLabel: formatAcquireStageLabel(payload.stage),
      conversationId,
    },
  });
};

const handleWishlist = async (req: any, res: any, user: any, supabase: any) => {
  const method = getMethod(req);

  if (method === 'GET') {
    const { data: rows, error } = await supabase
      .from('wishlist_items')
      .select('id, listing_id, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      if (isRecoverableSchemaError(error)) {
        return sendJson(res, 200, { data: { items: [] } });
      }
      throw error;
    }

    const wishlistRows = Array.isArray(rows) ? rows : [];
    const listingIds = wishlistRows.map((row: any) => row.listing_id).filter(Boolean);
    const { data: listings, error: listingsError } = listingIds.length
      ? await supabase.from('marketplace_assets').select(LISTING_SELECT).in('id', listingIds)
      : { data: [], error: null };

    if (listingsError) {
      throw listingsError;
    }

    const listingMap = new Map<string, any>(
      (Array.isArray(listings) ? listings : []).map((listing: any) => [listing.id, listing]),
    );

    const items = wishlistRows
      .map((row: any) => {
        const listing = listingMap.get(row.listing_id);
        if (!listing) {
          return null;
        }

        return {
          id: row.id,
          listingId: row.listing_id,
          createdAt: row.created_at,
          listing: {
            id: listing.id,
            slug: listing.slug,
            name: listing.name,
            tagline: listing.tagline,
            category: listing.category,
            askingPriceCents: Number(listing.asking_price_cents ?? 0),
            mrrCents: Number(listing.mrr_cents ?? 0),
            last30dRevenueCents: Number(listing.last30d_revenue_cents ?? 0),
            verifiedStatus: listing.verified_status,
            isAnonymous: Boolean(listing.is_anonymous),
            founderName: listing.is_anonymous ? 'Private Seller' : listing.founder_name,
          },
        };
      })
      .filter(Boolean);

    return sendJson(res, 200, { data: { items } });
  }

  if (method === 'POST') {
    const body = await parseJsonBody(req);
    const parsed = WishlistMutationSchema.safeParse(body);
    if (!parsed.success) {
      return sendJson(res, 400, {
        error: 'Invalid wishlist payload.',
        details: parsed.error.issues[0]?.message,
      });
    }

    const listingId = parsed.data.listingId;
    const { data: listing, error: listingError } = await supabase
      .from('marketplace_assets')
      .select('id, is_listed')
      .eq('id', listingId)
      .limit(1)
      .maybeSingle();

    if (listingError) {
      throw listingError;
    }

    if (!listing || listing.is_listed !== true) {
      return sendJson(res, 404, { error: 'Listing not found.' });
    }

    const { error: insertError } = await supabase.from('wishlist_items').insert(
      {
        user_id: user.id,
        listing_id: listingId,
      },
      { onConflict: 'user_id,listing_id', ignoreDuplicates: true } as any,
    );

    if (insertError && !isRecoverableSchemaError(insertError)) {
      throw insertError;
    }

    return sendJson(res, 200, { data: { success: true, listingId } });
  }

  if (method === 'DELETE') {
    const listingId = await getListingIdFromDelete(req);
    const parsedDelete = WishlistMutationSchema.safeParse({ listingId });
    if (!parsedDelete.success) {
      return sendJson(res, 400, {
        error: 'Missing listing id.',
        details: parsedDelete.error.issues[0]?.message,
      });
    }

    const { error: deleteError } = await supabase
      .from('wishlist_items')
      .delete()
      .eq('user_id', user.id)
      .eq('listing_id', parsedDelete.data.listingId);

    if (deleteError && !isRecoverableSchemaError(deleteError)) {
      throw deleteError;
    }

    return sendJson(res, 200, {
      data: {
        success: true,
        listingId: parsedDelete.data.listingId,
      },
    });
  }

  return methodNotAllowed(res, ['GET', 'POST', 'DELETE']);
};

export default async function handler(req: any, res: any) {
  try {
    const scope = detectScope(req);
    if (!scope) {
      return sendJson(res, 404, { error: 'Unknown marketplace profile route.' });
    }

    const user = await getAuthenticatedUser(req);
    if (!user) {
      return sendJson(res, 401, { error: 'Authentication required.' });
    }

    const supabase = await getSupabaseAdmin();

    if (scope === 'profile-summary') {
      return handleProfileSummary(req, res, user, supabase);
    }
    if (scope === 'inbox-conversations') {
      return handleInboxConversations(req, res, user, supabase);
    }
    if (scope === 'inbox-messages') {
      return handleInboxMessages(req, res, user, supabase);
    }
    if (scope === 'inbox-send') {
      return handleInboxSend(req, res, user, supabase);
    }
    if (scope === 'inbox-start') {
      return handleInboxStart(req, res, user, supabase);
    }
    if (scope === 'acquire-pipeline') {
      return handleAcquirePipeline(req, res, user, supabase);
    }
    if (scope === 'acquire-stage') {
      return handleAcquireStage(req, res, user, supabase);
    }
    if (scope === 'wishlist') {
      return handleWishlist(req, res, user, supabase);
    }

    return sendJson(res, 404, { error: 'Unknown marketplace profile route.' });
  } catch (error) {
    return sendJson(res, 500, {
      error: 'Failed to process profile marketplace request.',
      details: sanitizeErrorDetails(error),
    });
  }
}
