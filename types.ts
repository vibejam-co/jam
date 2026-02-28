
import type { RankTier } from './lib/ranking';

export interface RevenuePoint {
  date: string;
  revenue: number;
}

export interface VibeApp {
  id: string;
  rank: string;
  rankValue?: number;
  rankTier?: RankTier;
  name: string;
  pitch: string;
  icon: string;
  accentColor: string;
  monthlyRevenue: number;
  lifetimeRevenue: number;
  activeUsers: number;
  buildStreak: number;
  growth: number;
  tags: string[];
  verified: boolean;
  category: string;
  founder: {
    name: string;
    handle: string;
    avatar: string;
    email?: string; // Private
  };
  techStack: string[];
  problem: string;
  solution: string;
  pricing: string;
  revenueHistory: RevenuePoint[];
  // Marketplace Fields
  isForSale?: boolean;
  askingPrice?: string;
  profitMargin?: number;
  isAnonymous?: boolean;
  boostTier?: 'Free' | 'Pro' | 'Elite';
  marketplaceAssetId?: string;
  valuationMultipleX100?: number | null;
  marketplaceVerifiedStatus?: 'unverified' | 'pending' | 'verified' | 'error';
  isOwnerListing?: boolean;
  publishSource?: 'start-jam' | 'list-app';
  publishToMarketplace?: boolean;
  marketplaceAskingPriceUsd?: string;
  marketplaceVisibility?: MarketplaceVisibility;
  marketplaceBoostTierId?: MarketplaceBoostTier;
  websiteUrl?: string;
}

export interface MarketItem {
  id: string;
  name: string;
  askingPrice: string;
  status: 'For Sale' | 'Pending';
}

export interface TrendingItem {
  id: string;
  name: string;
  change: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'wishlist' | 'offer' | 'system' | 'update';
  timestamp: string;
  isRead: boolean;
  appId?: string;
  link?: string;
}

export interface CanvasProfileInput {
  name: string;
  bio: string;
  avatar: string;
}

export interface CanvasDigitalProduct {
  id: string;
  title: string;
  description?: string;
  category: 'files' | 'presets' | 'code' | 'digital';
  priceUsd: number;
  url: string;
}

export type CanvasBrandCollabDealStatus = 'new' | 'reviewing' | 'accepted' | 'declined';

export interface CanvasBrandCollabDeal {
  id: string;
  brand: string;
  campaign: string;
  contactEmail: string;
  budgetUsd: number;
  timeline: string;
  deliverables: string;
  notes?: string;
  status: CanvasBrandCollabDealStatus;
  submittedAt: string;
}

export interface CanvasBrandCollabs {
  enabled: boolean;
  contactEmail: string;
  rateCardUrl?: string;
  minBudgetUsd?: number;
  inbox: CanvasBrandCollabDeal[];
}

export type CanvasLayoutBlockType =
  | 'hero'
  | 'stats'
  | 'links'
  | 'products'
  | 'music'
  | 'socials'
  | 'brand_collabs'
  | 'featured_link'
  | 'text'
  | 'image'
  | 'embed'
  | 'divider';

export interface CanvasLayoutBlock {
  id: string;
  type: CanvasLayoutBlockType;
  title: string;
  position: number;
  visible: boolean;
  data?: Record<string, string | number | boolean | null>;
}

export interface CanvasLayoutSchema {
  version: number;
  updatedAt: string;
  blocks: CanvasLayoutBlock[];
}

export interface CanvasMonetization {
  tipJarEnabled: boolean;
  tipJarUrl?: string;
  products: CanvasDigitalProduct[];
  brandCollabs?: CanvasBrandCollabs;
}

export interface CanvasLinkItem {
  id: string;
  title: string;
  url: string;
  clicks?: string;
}

export type CanvasThemeContainerSize = 'full' | 'standard' | 'profile';
export type CanvasThemeContainerKind = 'link' | 'image' | 'widget' | 'note';

export interface CanvasThemeContainer {
  id: string;
  size: CanvasThemeContainerSize;
  kind: CanvasThemeContainerKind;
  title: string;
  subtitle?: string;
  url?: string;
  mediaUrl?: string;
}

export interface CanvasOnboardingPayload {
  claimedName: string;
  vanitySlug?: string;
  profile: CanvasProfileInput;
  selectedTheme: string;
  selectedTemplateId?: string;
  selectedSignals: string[];
  links: Record<string, string>;
  linkItems?: CanvasLinkItem[];
  themeContainers?: Record<string, CanvasThemeContainer[]>;
  monetization?: CanvasMonetization;
  layout?: CanvasLayoutSchema;
}

export interface CanvasTheme {
  id: string;
  name: string;
  desc: string;
  accent: string;
  previewImg: string;
}

export interface CanvasTemplate {
  id: string;
  name: string;
  type: string;
  author: string;
  color: string;
}

export interface CanvasCatalogResponse {
  themes: CanvasTheme[];
  templates: CanvasTemplate[];
  featuredFrameworks: CanvasTheme[];
}

export interface CanvasPublishResult {
  success: boolean;
  profileId: string;
  slug: string;
  url: string;
  publishedAt: string;
}

export interface CanvasDashboardSession {
  onboarding: CanvasOnboardingPayload;
  publish: CanvasPublishResult;
}

export interface CanvasOwnedProfile {
  profileId: string;
  slug: string;
  url: string;
  publishedAt: string;
}

export interface CanvasSessionResponse {
  session: CanvasDashboardSession | null;
  profiles: CanvasOwnedProfile[];
}

export interface CanvasPublicSessionResponse {
  session: CanvasDashboardSession | null;
}

export type MarketplaceVisibility = 'public' | 'members_only' | 'private';
export type MarketplaceVerifiedStatus = 'unverified' | 'pending' | 'verified' | 'error';
export type MarketplaceProvider = 'stripe' | 'lemonsqueezy' | 'polar' | 'dodo' | 'revenuecat';
export type MarketplaceBoostTier = 'free' | 'pro' | 'elite';

export interface MarketplaceAssetCard {
  id: string;
  marketplaceAssetId?: string;
  slug: string;
  name: string;
  tagline: string;
  logoUrl?: string | null;
  category: string;
  subcategory?: string | null;
  techStack: string[];
  askingPriceCents: number;
  currency: string;
  verifiedStatus: MarketplaceVerifiedStatus;
  visibility: MarketplaceVisibility;
  isAnonymous: boolean;
  mrrCents: number;
  last30dRevenueCents: number;
  last30dGrowthBps: number;
  activeSubscribers?: number;
  churnBps?: number | null;
  metricsProvider?: MarketplaceProvider | null;
  profitMarginPercent: number | null;
  valuationMultipleX100: number | null;
  metricsUpdatedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  isOwner?: boolean;
}

export interface MarketplaceAssetOfferSummary {
  total: number;
  sent: number;
  viewed: number;
  accepted: number;
  rejected: number;
  countered: number;
}

export interface MarketplaceOwnerAsset extends MarketplaceAssetCard {
  offers: MarketplaceAssetOfferSummary;
  offerItems?: MarketplaceOfferItem[];
}

export interface MarketplaceOfferItem {
  id: string;
  assetId: string;
  buyerUserId: string;
  buyerLabel: string;
  offerPriceCents: number;
  message: string;
  status: 'sent' | 'viewed' | 'accepted' | 'rejected' | 'countered';
  createdAt: string;
  updatedAt: string;
}

export interface MarketplaceAssetDetail extends MarketplaceAssetCard {
  description: string;
  founder: { name: string; email?: string } | null;
  sparkline: Array<{
    periodEnd: string;
    revenueCents: number;
    mrrCents: number;
  }>;
  boost?: {
    tier: MarketplaceBoostTier;
    starts_at: string;
    ends_at: string | null;
  } | null;
}

export interface MarketplaceAssetsResponse {
  items: MarketplaceAssetCard[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
  meta: {
    requiresMembership: boolean;
    lockedCount: number;
  };
}

export interface MarketplaceAssetDetailResponse {
  locked: boolean;
  reason?: 'membership_required' | 'private_asset';
  asset: MarketplaceAssetDetail | MarketplaceAssetCard;
}

export interface MarketplaceMyAssetsResponse {
  items: MarketplaceOwnerAsset[];
}

export interface MarketplaceListingUpdateInput {
  name?: string;
  tagline?: string;
  description?: string;
  logoUrl?: string;
  category?: string;
  subcategory?: string;
  techStack?: string[];
  founderName?: string;
  founderEmail?: string;
  askingPriceUsd?: string;
  askingPriceCents?: number;
  profitMarginPercent?: number | null;
  isAnonymous?: boolean;
  visibility?: MarketplaceVisibility;
}

export interface MarketplaceAssetDraftInput {
  name: string;
  tagline: string;
  description: string;
  logoUrl?: string;
  category: string;
  subcategory?: string;
  techStack?: string[];
  founderName: string;
  founderEmail: string;
  isAnonymous?: boolean;
  visibility?: MarketplaceVisibility;
  jamId?: string;
}

export interface MarketplaceConnectInput {
  provider: MarketplaceProvider;
  apiKey: string;
  isAnonymous?: boolean;
}

export interface MarketplaceConnectResponse {
  connection: unknown;
  verifiedStatus: MarketplaceVerifiedStatus | 'pending';
  warning?: string;
  metrics?: {
    mrrCents: number;
    last30dRevenueCents: number;
    last30dGrowthBps: number;
    activeSubscribers: number;
  } | null;
}

export interface MarketplacePublishInput {
  askingPriceUsd?: string;
  askingPriceCents?: number;
  profitMarginPercent?: number | null;
  tier: MarketplaceBoostTier;
  visibility?: MarketplaceVisibility;
  boostCheckoutSessionId?: string;
}

export interface MarketplacePublishSuccessResponse {
  success: true;
  assetId: string;
  slug: string;
  askingPriceCents: number;
  valuationMultipleX100: number | null;
  tier: string;
  visibility: string;
  verifiedStatus: MarketplaceVerifiedStatus;
  mrrCents: number;
  last30dRevenueCents: number;
  last30dGrowthBps: number;
}

export interface MarketplacePublishPaymentRequiredResponse {
  success: false;
  requiresPayment: true;
  tier: MarketplaceBoostTier;
  boostCheckoutSessionId: string;
  checkoutUrl: string;
  paymentStatus: string;
}

export interface MarketplaceOfferInput {
  assetId: string;
  offerPriceUsd?: string;
  offerPriceCents?: number;
  message: string;
}

export interface MarketplaceOfferResponse {
  offer: unknown;
  emailStatus: 'sent' | 'skipped' | 'failed';
  emailMessageId?: string | null;
  inboxStatus?: 'created' | 'skipped' | 'failed';
  conversationId?: string | null;
  pipelineStage?: AcquireStage;
}

export type AcquireStage =
  | 'WATCHLISTED'
  | 'OFFER_SENT'
  | 'LOI_SIGNED'
  | 'DUE_DILIGENCE'
  | 'APA_SIGNED'
  | 'ESCROW_FUNDED'
  | 'CLOSED';

export interface ProfileMarketplaceSummary {
  roles: {
    seller: boolean;
    buyer: boolean;
    buyerEnabled: boolean;
  };
  stats: {
    activeListingsCount: number;
    listingsCount: number;
    portfolioValueCents: number;
    offersCount: number;
    pipelineCount: number;
    wishlistCount: number;
    conversationsCount: number;
    unreadInboxCount: number;
  };
}

export interface InboxConversationSummary {
  id: string;
  listingId: string | null;
  listingName: string;
  counterpartId: string;
  counterpartName: string;
  counterpartAvatarUrl?: string | null;
  lastMessagePreview: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface InboxMessage {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
  readAt: string | null;
  isMine: boolean;
}

export interface InboxConversationDetail {
  id: string;
  listingId: string | null;
  listingName: string;
  counterpartId: string;
  counterpartName: string;
  counterpartAvatarUrl?: string | null;
  lastMessageAt: string;
}

export interface InboxMessagesResponse {
  conversation: InboxConversationDetail;
  messages: InboxMessage[];
}

export interface InboxSendMessageResponse {
  message: InboxMessage;
  conversationId?: string;
  legacy?: boolean;
}

export interface AcquirePipelineListing {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  category: string;
  askingPriceCents: number;
  mrrCents: number;
  last30dRevenueCents: number;
  verifiedStatus: MarketplaceVerifiedStatus;
  isAnonymous: boolean;
  founderName: string;
}

export interface AcquirePipelineItem {
  id: string;
  listingId: string;
  stage: AcquireStage;
  stageLabel: string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;
  conversationId: string | null;
  listing: AcquirePipelineListing;
}

export interface AcquirePipelineStageSummary {
  stage: AcquireStage;
  label: string;
  count: number;
}

export interface AcquirePipelineResponse {
  items: AcquirePipelineItem[];
  stages: AcquirePipelineStageSummary[];
}

export interface WishlistListingItem {
  id: string;
  listingId: string;
  createdAt: string;
  listing: AcquirePipelineListing;
}
