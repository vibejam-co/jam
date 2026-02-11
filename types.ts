
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

export interface CanvasOnboardingPayload {
  claimedName: string;
  vanitySlug?: string;
  profile: CanvasProfileInput;
  selectedTheme: string;
  selectedTemplateId?: string;
  selectedSignals: string[];
  links: Record<string, string>;
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
