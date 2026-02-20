
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
