import type {
  CanvasCatalogResponse,
  CanvasPublicSessionResponse,
  CanvasSessionResponse,
  CanvasOnboardingPayload,
  CanvasPublishResult,
  MarketplaceAssetDetailResponse,
  MarketplaceAssetDraftInput,
  MarketplaceAssetsResponse,
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
  MarketplaceOfferInput,
  MarketplacePublishPaymentRequiredResponse,
  MarketplacePublishSuccessResponse,
  MarketplacePublishInput,
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
  const payload = (isJson && rawBody ? (JSON.parse(rawBody) as ApiResponse<T>) : null);

  if (!response.ok) {
    const message =
      payload?.details ||
      payload?.error ||
      (rawBody ? rawBody.slice(0, 160) : '') ||
      `Request failed: ${response.status}`;
    throw new Error(message);
  }

  if (!payload) {
    throw new Error(`Expected JSON response from ${path}, received ${contentType || 'unknown content-type'}.`);
  }

  return payload.data;
};

export const fetchApps = () => request<VibeApp[]>('/api/apps');

export const publishApp = (app: VibeApp) =>
  request<VibeApp[]>('/api/apps', {
    method: 'POST',
    body: JSON.stringify({ app }),
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

export const updateMarketplaceAsset = (
  idOrSlug: string,
  payload: MarketplaceListingUpdateInput,
) =>
  request<MarketplaceAssetDetailResponse>(`/api/marketplace/assets?assetId=${encodeURIComponent(idOrSlug)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

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
