
export interface RevenuePoint {
  date: string;
  revenue: number;
}

export interface VibeApp {
  id: string;
  rank: string;
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
  profile: CanvasProfileInput;
  selectedTheme: string;
  selectedSignals: string[];
  links: Record<string, string>;
}
