import type {
  CanvasCatalogResponse,
  CanvasPublicSessionResponse,
  CanvasSessionResponse,
  CanvasOnboardingPayload,
  CanvasPublishResult,
  MarketplaceAssetDetailResponse,
  MarketplaceAssetDraftInput,
  MarketplaceAssetsResponse,
  MarketplaceBuyerAlertInput,
  MarketplaceBuyerAlertResponse,
  MarketplaceListingUpdateInput,
  MarketplaceOfferResponse,
  MarketplaceMyAssetsResponse,
  ProfileMarketplaceSummary,
  InboxConversationSummary,
  InboxMessagesResponse,
  InboxSendMessageResponse,
  AcquirePipelineResponse,
  AcquireStage,
  WishlistListingItem,
  MarketplaceConnectResponse,
  MarketplaceConnectInput,
  MarketplaceAssetFinancialsInput,
  MarketplaceAssetFinancialsResponse,
  MarketplaceAssetTrafficInput,
  MarketplaceAssetTrafficResponse,
  MarketplaceGenerateDeckResponse,
  MarketplaceOfferInput,
  MarketplacePublishPaymentRequiredResponse,
  MarketplacePublishSuccessResponse,
  MarketplacePublishInput,
  DealRoomResponse,
  DealEscrowCreateResponse,
  DealRoomStatus,
  Notification,
  VibeApp,
} from '../types';
import { supabase } from './supabase-client';

type ApiResponse<T> = {
  data: T;
  error?: string;
  details?: string;
};

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const headers = new Headers(init?.headers ?? {});
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (supabase) {
    const { data } = await supabase.auth.getSession();
    const accessToken = data.session?.access_token;
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }
  }

  const response = await fetch(path, {
    ...init,
    headers,
  });

  const contentType = response.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  const rawBody = await response.text();
  const payload = (isJson && rawBody ? (JSON.parse(rawBody) as unknown) : null);

  if (!response.ok) {
    const maybeEnvelope = payload as Partial<ApiResponse<T>> | null;
    const message =
      maybeEnvelope?.details ||
      maybeEnvelope?.error ||
      (rawBody ? rawBody.slice(0, 160) : '') ||
      `Request failed: ${response.status}`;
    throw new Error(message);
  }

  if (!payload) {
    throw new Error(`Expected JSON response from ${path}, received ${contentType || 'unknown content-type'}.`);
  }

  if (typeof payload === 'object' && payload !== null && Object.prototype.hasOwnProperty.call(payload, 'data')) {
    return (payload as ApiResponse<T>).data;
  }

  return payload as T;
};

const normalizeDeckPayloadToPitchDecks = (
  deckPayload: unknown,
): MarketplaceGenerateDeckResponse['pitchDecks'] | null => {
  if (!deckPayload || typeof deckPayload !== 'object') {
    return null;
  }

  const candidate = deckPayload as any;

  if (Array.isArray(candidate.slides)) {
    return candidate as MarketplaceGenerateDeckResponse['pitchDecks'];
  }

  if (Array.isArray(candidate.rendered_slides)) {
    return {
      slides: candidate.rendered_slides.map((slide: any) => ({
        slideNumber: Number(slide?.slideNumber ?? 0),
        slideGoal: typeof slide?.slideGoal === 'string' ? slide.slideGoal : undefined,
        theme: typeof slide?.theme === 'string' ? slide.theme : undefined,
        headline: typeof slide?.headline === 'string' ? slide.headline : undefined,
        subheadline: typeof slide?.subheadline === 'string' ? slide.subheadline : undefined,
        dataPoints: Array.isArray(slide?.dataPoints) ? slide.dataPoints : [],
        backgroundImageBase64: typeof slide?.backgroundImageBase64 === 'string' ? slide.backgroundImageBase64 : undefined,
      })),
    };
  }

  if (Array.isArray(candidate?.final_deck_package?.repaired_slides)) {
    return {
      slides: candidate.final_deck_package.repaired_slides.map((slide: any) => ({
        slideNumber: Number(slide?.slide_number ?? 0),
        slideGoal: typeof slide?.slide_goal === 'string' ? slide.slide_goal : undefined,
        theme: typeof slide?.theme === 'string' ? slide.theme : undefined,
        headline: typeof slide?.headline === 'string' ? slide.headline : undefined,
        subheadline: typeof slide?.subheadline === 'string' ? slide.subheadline : undefined,
        dataPoints: Array.isArray(slide?.data_points) ? slide.data_points : [],
      })),
    };
  }

  return null;
};

const normalizeMarketplaceDeckResponse = (
  assetId: string,
  payload: MarketplaceGenerateDeckResponse | { deck?: unknown; reused?: unknown; assetId?: unknown } | null | undefined,
): MarketplaceGenerateDeckResponse => {
  const payloadObject = payload && typeof payload === 'object' ? (payload as any) : null;

  if (payloadObject && 'pitchDecks' in payloadObject) {
    const normalizedPitchDecks = normalizeDeckPayloadToPitchDecks(payloadObject.pitchDecks);
    if (normalizedPitchDecks) {
      return {
        assetId: String(payloadObject.assetId ?? assetId),
        reused: Boolean(payloadObject.reused),
        pitchDecks: normalizedPitchDecks,
      };
    }
    return payloadObject as MarketplaceGenerateDeckResponse;
  }

  const deckPayload = payloadObject?.deck;
  const normalizedDeck = normalizeDeckPayloadToPitchDecks(deckPayload);
  if (normalizedDeck) {
    return {
      assetId: String(payloadObject?.assetId ?? assetId),
      reused: Boolean(payloadObject?.reused),
      pitchDecks: normalizedDeck,
    };
  }

  throw new Error('Deck payload unavailable.');
};

export const fetchApps = () => request<VibeApp[]>('/api/apps');

export const publishApp = (app: VibeApp) =>
  request<VibeApp[]>('/api/apps', {
    method: 'POST',
    body: JSON.stringify({ app }),
  });

export const deleteJam = (id: string) =>
  request<VibeApp[]>(`/api/apps?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });

export const fetchNotifications = () => request<Notification[]>('/api/notifications');

export const subscribeToNewsletter = (email: string) =>
  request<{ success: boolean }>('/api/newsletter', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });

export const saveCanvasOnboarding = (payload: CanvasOnboardingPayload) =>
  request<CanvasPublishResult>('/api/canvas', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const fetchCanvasCatalog = () => request<CanvasCatalogResponse>('/api/canvas');

export const fetchMyCanvasSession = () =>
  request<CanvasSessionResponse>('/api/canvas?mode=session');

export const fetchPublicCanvasSession = (slug: string) =>
  request<CanvasPublicSessionResponse>(`/api/canvas?mode=public&slug=${encodeURIComponent(slug)}`);

export const fetchMarketplaceAssets = (params?: {
  q?: string;
  category?: string;
  min_mrr?: number;
  max_price?: number;
  min_rev30?: number;
  max_multiple?: number;
  minProfitMarginBps?: number;
  maxChurnBps?: number;
  minTraffic?: number;
  verified_only?: boolean;
  sort?: 'latest' | 'mrr' | 'rev30' | 'multiple';
  page?: number;
  pageSize?: number;
}) => {
  const query = new URLSearchParams();
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === '') {
        continue;
      }
      query.set(key, String(value));
    }
  }
  const suffix = query.toString();
  return request<MarketplaceAssetsResponse>(`/api/marketplace/assets${suffix ? `?${suffix}` : ''}`);
};

export const fetchMarketplaceAssetDetail = (idOrSlug: string) =>
  request<MarketplaceAssetDetailResponse>(`/api/marketplace/assets?assetId=${encodeURIComponent(idOrSlug)}`);

export const createMarketplaceBuyerAlert = (payload: MarketplaceBuyerAlertInput) =>
  request<MarketplaceBuyerAlertResponse>('/api/marketplace/alerts', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const updateMarketplaceAsset = (
  idOrSlug: string,
  payload: MarketplaceListingUpdateInput,
) =>
  request<MarketplaceAssetDetailResponse>(`/api/marketplace/assets?assetId=${encodeURIComponent(idOrSlug)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

export const updateMarketplaceAssetFinancials = (
  assetId: string,
  payload: MarketplaceAssetFinancialsInput,
) =>
  request<MarketplaceAssetFinancialsResponse>(
    `/api/marketplace/assets/${encodeURIComponent(assetId)}/financials`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  );

export const fetchMarketplaceAssetFinancials = (assetId: string) =>
  request<MarketplaceAssetFinancialsResponse>(
    `/api/marketplace/assets/${encodeURIComponent(assetId)}/financials`,
  );

export const updateMarketplaceAssetTraffic = (
  assetId: string,
  payload: MarketplaceAssetTrafficInput,
) =>
  request<MarketplaceAssetTrafficResponse>(
    `/api/marketplace/assets/${encodeURIComponent(assetId)}/traffic`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  );

export const fetchMarketplaceAssetTraffic = (assetId: string) =>
  request<MarketplaceAssetTrafficResponse>(
    `/api/marketplace/assets/${encodeURIComponent(assetId)}/traffic`,
  );

export const generateMarketplaceAssetDeck = (
  assetId: string,
  options?: { forceRegenerate?: boolean },
) =>
  request<MarketplaceGenerateDeckResponse | { deck?: unknown; reused?: unknown; assetId?: unknown }>(
    `/api/marketplace/assets/${encodeURIComponent(assetId)}/generate-deck`,
    {
      method: 'POST',
      body: JSON.stringify({
        forceRegenerate: Boolean(options?.forceRegenerate),
      }),
    },
  ).then((payload) => normalizeMarketplaceDeckResponse(assetId, payload));

export const fetchMarketplaceAssetDeck = (assetId: string) =>
  request<MarketplaceGenerateDeckResponse | { deck?: unknown; reused?: unknown; assetId?: unknown }>(
    `/api/marketplace/assets/${encodeURIComponent(assetId)}/generate-deck`,
  ).then((payload) => normalizeMarketplaceDeckResponse(assetId, payload));

export const deleteMarketplaceAsset = (idOrSlug: string) =>
  request<{ deleted: boolean; assetId: string }>(
    `/api/marketplace/assets?assetId=${encodeURIComponent(idOrSlug)}`,
    {
      method: 'DELETE',
    },
  );

export const createMarketplaceAssetDraft = (payload: MarketplaceAssetDraftInput) =>
  request<{ asset: unknown; draft: boolean }>('/api/marketplace/assets', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const connectMarketplaceAsset = (assetId: string, payload: MarketplaceConnectInput) =>
  request<MarketplaceConnectResponse>(
    `/api/marketplace/assets/${encodeURIComponent(assetId)}/connect`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );

export const publishMarketplaceAsset = (assetId: string, payload: MarketplacePublishInput) =>
  request<MarketplacePublishSuccessResponse | MarketplacePublishPaymentRequiredResponse>(
    `/api/marketplace/assets/${encodeURIComponent(assetId)}/publish`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );

export const submitMarketplaceOffer = (payload: MarketplaceOfferInput) =>
  request<MarketplaceOfferResponse>('/api/marketplace/offers', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const fetchDealRoom = (offerId: string) =>
  request<DealRoomResponse>(`/api/marketplace/deals/${encodeURIComponent(offerId)}`);

export const updateDealRoomStatus = (offerId: string, newStatus: DealRoomStatus) =>
  request<DealRoomResponse>(`/api/marketplace/deals/${encodeURIComponent(offerId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ newStatus }),
  });

export const initiateDealRoomEscrow = (
  offerId: string,
  options?: {
    action?: 'initiate' | 'sandbox-fund';
    paymentMethod?: 'wire_transfer';
    sandboxAutoFund?: boolean;
  },
) =>
  request<DealEscrowCreateResponse>(`/api/marketplace/deals/${encodeURIComponent(offerId)}/escrow`, {
    method: 'POST',
    body: JSON.stringify({
      action: options?.action ?? 'initiate',
      paymentMethod: options?.paymentMethod ?? 'wire_transfer',
      sandboxAutoFund: options?.sandboxAutoFund ?? true,
    }),
  });

export const fundDealRoomEscrowSandbox = (
  offerId: string,
  paymentMethod: 'wire_transfer' = 'wire_transfer',
) =>
  initiateDealRoomEscrow(offerId, {
    action: 'sandbox-fund',
    paymentMethod,
    sandboxAutoFund: true,
  });

export const fetchMyMarketplaceAssets = (options?: {
  includeOfferItems?: boolean;
  assetId?: string;
  markViewed?: boolean;
}) => {
  const query = new URLSearchParams();
  if (options?.includeOfferItems) {
    query.set('include_offer_items', 'true');
  }
  if (options?.assetId) {
    query.set('asset_id', options.assetId);
  }
  if (options?.markViewed) {
    query.set('mark_viewed', 'true');
  }
  const suffix = query.toString();
  return request<MarketplaceMyAssetsResponse>(`/api/marketplace/my-assets${suffix ? `?${suffix}` : ''}`);
};

export const fetchProfileMarketplaceSummary = () =>
  request<ProfileMarketplaceSummary>('/api/profile-marketplace?scope=profile-summary');

export const fetchInboxConversations = () =>
  request<{ items: InboxConversationSummary[] }>('/api/profile-marketplace?scope=inbox-conversations');

export const fetchInboxMessages = (conversationId: string) =>
  request<InboxMessagesResponse>(
    `/api/profile-marketplace?scope=inbox-messages&conversationId=${encodeURIComponent(conversationId)}`,
  );

export const sendInboxMessage = (payload: { conversationId: string; body: string }) =>
  request<InboxSendMessageResponse>('/api/profile-marketplace?scope=inbox-send', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const startInboxConversation = (payload: { listingId: string; initialMessage?: string }) =>
  request<{
    conversationId: string;
    listing: { id: string; name: string };
    created: boolean;
  }>('/api/profile-marketplace?scope=inbox-start', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const fetchAcquirePipeline = () =>
  request<AcquirePipelineResponse>('/api/profile-marketplace?scope=acquire-pipeline');

export const upsertAcquirePipelineItem = (payload: {
  listingId: string;
  stage?: AcquireStage;
  notes?: string;
}) =>
  request<AcquirePipelineResponse>('/api/profile-marketplace?scope=acquire-pipeline', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const updateAcquireStage = (payload: {
  listingId: string;
  stage: AcquireStage;
  notes?: string;
  message?: string;
}) =>
  request<{
    listingId: string;
    stage: AcquireStage;
    stageLabel: string;
    conversationId: string | null;
  }>('/api/profile-marketplace?scope=acquire-stage', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const fetchWishlistItems = () =>
  request<{ items: WishlistListingItem[] }>('/api/profile-marketplace?scope=wishlist');

export const addWishlistItem = (listingId: string) =>
  request<{ success: true; listingId: string }>('/api/profile-marketplace?scope=wishlist', {
    method: 'POST',
    body: JSON.stringify({ listingId }),
  });

export const removeWishlistItem = (listingId: string) =>
  request<{ success: true; listingId: string }>(
    `/api/profile-marketplace?scope=wishlist&listingId=${encodeURIComponent(listingId)}`,
    {
      method: 'DELETE',
    },
  );
