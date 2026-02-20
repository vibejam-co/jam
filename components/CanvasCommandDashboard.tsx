import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  Bell,
  Box,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  Edit3,
  ExternalLink,
  Eye,
  Filter,
  Globe,
  GripVertical,
  Heart,
  Layers,
  Mail,
  Menu,
  Monitor,
  MoreHorizontal,
  MousePointer2,
  Palette,
  Plus,
  Search,
  Settings,
  ShoppingBag,
  Sliders,
  Smartphone,
  Target,
  Trash2,
  TrendingUp,
  Type,
  UserPlus,
  Users,
  X,
  Zap,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import MidnightZenithApp from './midnightZenith/App';
import EditorialKineticProfile from './editorialKinetic/EditorialKineticProfile';
import CreatorHubApp from './creatorHub/App';
import EtherealLiquidApp from './etherealLiquid/App';
import GlassArtifactApp from './glassArtifact/App';
import GoldStandardCollectionApp from './collection/goldStandard/App';
import AccordionDeckCollectionApp from './collection/accordionDeck/App';
import CollageOsCollectionApp from './collection/collageOs/App';
import TerrariumCollectionApp from './collection/terrarium/App';
import PrismOsCollectionApp from './collection/prismOs/App';
import AeroCanvasCollectionApp from './collection/aeroCanvas/App';
import IsometricLoftApp from './isometricLoft/App';
import KineticVariableApp from './kineticVariable/App';
import OrbitalLensApp from './orbitalLens/App';
import VaporOsApp from './vaporOs/App';
import NotificationCenter from './NotificationCenter';
import {
  CATEGORIES as MIDNIGHT_CATEGORIES,
  GRID_ITEMS as MIDNIGHT_GRID_ITEMS,
  MIDNIGHT_FOOTER as MIDNIGHT_FOOTER_DEFAULTS,
  PROFILE_DATA as MIDNIGHT_PROFILE_DEFAULTS,
} from './midnightZenith/constants';
import type { MidnightZenithRenderModel } from './midnightZenith/types';
import { EDITORIAL_LINKS } from './editorialKinetic/constants';
import { LINKS_DATA as ETHEREAL_LINKS_DATA } from './etherealLiquid/constants';
import {
  CREATOR as CREATOR_HUB_CREATOR,
  CTA_CARDS as CREATOR_HUB_CTA_CARDS,
  FEATURED_PRODUCT as CREATOR_HUB_FEATURED_PRODUCT,
  CATALOG as CREATOR_HUB_CATALOG,
  TIMELINE as CREATOR_HUB_TIMELINE,
  TRUST_BADGES as CREATOR_HUB_TRUST_BADGES,
} from './creatorHub/constants';
import type { CreatorHubRenderModel, CreatorHubSectionKey } from './creatorHub/types';
import { SLICES as ACCORDION_DECK_SLICES } from './collection/accordionDeck/constants';
import { INITIAL_CREATOR as GOLD_STANDARD_INITIAL_CREATOR } from './collection/goldStandard/constants';
import { INITIAL_WIDGETS as AERO_CANVAS_INITIAL_WIDGETS } from './collection/aeroCanvas/constants';
import ThemeMonetizationOverlay from './monetization/ThemeMonetizationOverlay';
import type {
  CanvasDigitalProduct,
  CanvasLayoutSchema,
  CanvasThemeContainer,
  CanvasThemeContainerKind,
  CanvasThemeContainerSize,
  CanvasMonetization,
  CanvasOnboardingPayload,
  CanvasPublishResult,
  CanvasTheme,
  Notification,
} from '../types';
import { saveCanvasOnboarding } from '../lib/api';
import {
  sanitizeLayoutSchema,
} from '../lib/canvas-layout';

type DashboardTab = 'canvas' | 'themes' | 'monetize' | 'audience' | 'analytics';
type PreviewMode = 'mobile' | 'desktop';
type ThemePreviewFamily = 'midnight' | 'editorial' | 'creator' | 'aurora' | 'glass';

type DashboardLink = {
  id: string;
  title: string;
  url: string;
  clicks: string;
};

type DashboardProfile = {
  displayName: string;
  handle: string;
  bio: string;
  avatar: string;
};

type ThemeOverrides = {
  accentColor: string;
  fontFamily: 'Inter' | 'JetBrains Mono';
  cornerRadius: number;
  bouncyMode: boolean;
};

type MonetizeStatus = 'completed' | 'pending' | 'failed';

type MonetizeTransaction = {
  id: string;
  user: string;
  amount: string;
  type: string;
  status: MonetizeStatus;
  date: string;
};

type MonetizeStream = {
  id: 1 | 2 | 3 | 4;
  title: string;
  desc: string;
  icon: typeof ShoppingBag;
  color: string;
  action: string;
  badge?: string;
  toggle?: boolean;
};

type ProductFormState = {
  title: string;
  description: string;
  category: 'files' | 'presets' | 'code' | 'digital';
  priceUsd: string;
  url: string;
};

type MidnightGridFormState = {
  id?: string;
  title: string;
  category: string;
  subtitle: string;
  type: MidnightCardType;
  live: boolean;
  videoUrl: string;
  thumbnailUrl: string;
};

type BrandCollabDealStatus = 'new' | 'reviewing' | 'accepted' | 'declined';

type BrandCollabDeal = {
  id: string;
  brand: string;
  campaign: string;
  contactEmail: string;
  budgetUsd: number;
  timeline: string;
  deliverables: string;
  notes?: string;
  status: BrandCollabDealStatus;
  submittedAt: string;
};

type BrandCollabFormState = {
  brand: string;
  campaign: string;
  contactEmail: string;
  budgetUsd: string;
  timeline: string;
  deliverables: string;
  notes: string;
};

interface CanvasCommandDashboardProps {
  onboarding: CanvasOnboardingPayload;
  publish: CanvasPublishResult;
  themes: CanvasTheme[];
  studioThemes?: CanvasTheme[];
  authAvatarUrl?: string;
  authDisplayName?: string;
  unreadCount?: number;
  isNotificationsOpen?: boolean;
  onNavigateMainTab?: (tab: 'Rankings' | 'Marketplace' | 'Canvas') => void;
  onToggleNotifications?: () => void;
  onOpenProfile?: () => void;
  onOpenStartJam?: () => void;
  onClose: () => void;
}

const SIGNAL_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  x: 'X (Twitter)',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  spotify: 'Spotify',
  github: 'GitHub',
  website: 'Portfolio',
  store: 'Storefront',
};

const ANALYTICS_DATA = [
  { name: 'Mon', views: 4000, clicks: 2400 },
  { name: 'Tue', views: 3000, clicks: 1398 },
  { name: 'Wed', views: 2000, clicks: 9800 },
  { name: 'Thu', views: 2780, clicks: 3908 },
  { name: 'Fri', views: 1890, clicks: 4800 },
  { name: 'Sat', views: 2390, clicks: 3800 },
  { name: 'Sun', views: 3490, clicks: 4300 },
];

const ANALYTICS_DATA_30D = Array.from({ length: 30 }, (_, index) => {
  const seed = ANALYTICS_DATA[index % ANALYTICS_DATA.length];
  const variance = 0.82 + ((index % 9) * 0.05);
  return {
    name: `D${index + 1}`,
    views: Math.round(seed.views * variance),
    clicks: Math.round(seed.clicks * (variance + 0.08)),
  };
});

const RECENT_TRANSACTIONS: MonetizeTransaction[] = [
  { id: '1', user: 'Alex Rivera', amount: '$49.00', type: 'Digital Drop', status: 'completed', date: '2 mins ago' },
  { id: '2', user: 'Sarah Chen', amount: '$15.00', type: 'Tip Jar', status: 'completed', date: '1 hour ago' },
  { id: '3', user: 'Marko Polo', amount: '$299.00', type: 'Brand Collab', status: 'pending', date: '3 hours ago' },
  { id: '4', user: 'Elena Wu', amount: '$12.50', type: 'Affiliate', status: 'completed', date: '5 hours ago' },
  { id: '5', user: 'Jordan Lee', amount: '$49.00', type: 'Digital Drop', status: 'failed', date: 'Yesterday' },
];

const INITIAL_MONETIZE_STREAMS: MonetizeStream[] = [
  { id: 1, title: 'Digital Drops', desc: 'Sell files, presets, or code.', icon: ShoppingBag, color: 'bg-blue-500/10 text-blue-500', action: 'Add Product' },
  { id: 2, title: 'The Tip Jar', desc: 'Accept support from fans.', icon: Heart, color: 'bg-rose-500/10 text-rose-500', action: 'Configure', toggle: true, badge: 'ON' },
  { id: 3, title: 'Brand Collabs', desc: 'Run your sponsor inbox and campaign pipeline.', icon: Target, color: 'bg-emerald-500/10 text-emerald-500', action: 'Open Pipeline', badge: '2 New' },
  { id: 4, title: 'Affiliate Hub', desc: 'Recommend tools and earn.', icon: TrendingUp, color: 'bg-amber-500/10 text-amber-500', action: 'Marketplace' },
];

const INITIAL_MONETIZE_REVENUE = 12400;
const DEFAULT_TIP_JAR_URL = 'https://buy.stripe.com/test_tip_jar';
const DEFAULT_BRAND_COLLAB_EMAIL = 'collabs@vibejam.co';
const BRAND_COLLAB_STATUS_LABELS: Record<BrandCollabDealStatus, string> = {
  new: 'New',
  reviewing: 'Reviewing',
  accepted: 'Accepted',
  declined: 'Declined',
};
const BRAND_COLLAB_STATUS_CLASSES: Record<BrandCollabDealStatus, string> = {
  new: 'bg-sky-500/15 text-sky-200 border border-sky-500/30',
  reviewing: 'bg-amber-500/15 text-amber-200 border border-amber-500/30',
  accepted: 'bg-emerald-500/15 text-emerald-200 border border-emerald-500/30',
  declined: 'bg-rose-500/15 text-rose-200 border border-rose-500/30',
};

const DEFAULT_BRAND_COLLAB_DEALS: BrandCollabDeal[] = [
  {
    id: 'deal-1',
    brand: 'Atlas Labs',
    campaign: 'Creator Toolkit Launch',
    contactEmail: 'partnerships@atlaslabs.co',
    budgetUsd: 2500,
    timeline: '2 weeks',
    deliverables: '1 Reel + 3 Stories + Link in bio',
    notes: 'Looking for a live walkthrough angle.',
    status: 'new',
    submittedAt: '2026-02-14T13:40:00.000Z',
  },
  {
    id: 'deal-2',
    brand: 'OpenClaw',
    campaign: 'Setup Guide Spotlight',
    contactEmail: 'campaigns@openclaw.ai',
    budgetUsd: 3200,
    timeline: '10 days',
    deliverables: '1 explainer short + 1 carousel + pinned link',
    notes: 'Priority for creators with dev audience.',
    status: 'new',
    submittedAt: '2026-02-15T10:10:00.000Z',
  },
];

const formatUsd = (value: number): string => {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const createDefaultMonetization = (): CanvasMonetization => ({
  tipJarEnabled: false,
  tipJarUrl: '',
  products: [],
  brandCollabs: {
    enabled: true,
    contactEmail: DEFAULT_BRAND_COLLAB_EMAIL,
    rateCardUrl: '',
    minBudgetUsd: 500,
    inbox: DEFAULT_BRAND_COLLAB_DEALS,
  },
});

const sanitizeMonetizationState = (value?: CanvasMonetization): CanvasMonetization => {
  if (!value) {
    return createDefaultMonetization();
  }

  const safeProducts = Array.isArray(value.products)
    ? value.products.filter((item) => item && typeof item.title === 'string' && typeof item.url === 'string')
    : [];
  const rawBrandCollabInbox = Array.isArray(value.brandCollabs?.inbox) ? value.brandCollabs.inbox : [];
  const safeBrandCollabInbox = rawBrandCollabInbox.filter(
    (item): item is BrandCollabDeal =>
      Boolean(item) &&
      typeof item.brand === 'string' &&
      typeof item.campaign === 'string' &&
      typeof item.contactEmail === 'string',
  );

  return {
    tipJarEnabled: Boolean(value.tipJarEnabled),
    tipJarUrl: typeof value.tipJarUrl === 'string' ? value.tipJarUrl : '',
    products: safeProducts.map((item) => ({
      id: item.id || `${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
      title: item.title,
      description: item.description ?? '',
      category: item.category ?? 'digital',
      priceUsd: Number.isFinite(item.priceUsd) ? Math.max(0, item.priceUsd) : 0,
      url: item.url,
    })),
    brandCollabs: {
      enabled: value.brandCollabs?.enabled ?? true,
      contactEmail: value.brandCollabs?.contactEmail || DEFAULT_BRAND_COLLAB_EMAIL,
      rateCardUrl: value.brandCollabs?.rateCardUrl || '',
      minBudgetUsd: Number.isFinite(value.brandCollabs?.minBudgetUsd)
        ? Math.max(0, Math.round(Number(value.brandCollabs?.minBudgetUsd)))
        : 500,
      inbox: safeBrandCollabInbox.map((item) => {
        const status = (['new', 'reviewing', 'accepted', 'declined'] as const).includes(item.status)
          ? item.status
          : 'new';
        return {
          id: item.id || `${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
          brand: item.brand,
          campaign: item.campaign,
          contactEmail: item.contactEmail,
          budgetUsd: Number.isFinite(item.budgetUsd) ? Math.max(0, item.budgetUsd) : 0,
          timeline: item.timeline || '',
          deliverables: item.deliverables || '',
          notes: item.notes || '',
          status,
          submittedAt: item.submittedAt || new Date().toISOString(),
        };
      }),
    },
  };
};

const SUBSCRIBERS = [
  { id: '1', name: 'James Wilson', email: 'james.w@example.com', source: 'Tip Jar', ltv: '$145.00', avatar: 'https://i.pravatar.cc/150?u=1' },
  { id: '2', name: 'Sophia Loren', email: 'sophia.l@example.com', source: 'Digital Drop', ltv: '$49.00', avatar: 'https://i.pravatar.cc/150?u=2' },
  { id: '3', name: 'David Beckham', email: 'db7@example.com', source: 'Affiliate', ltv: '$0.00', avatar: 'https://i.pravatar.cc/150?u=3' },
  { id: '4', name: 'Mila Kunis', email: 'mila@example.com', source: 'Tip Jar', ltv: '$880.00', avatar: 'https://i.pravatar.cc/150?u=4' },
  { id: '5', name: 'Chris Evans', email: 'cap@example.com', source: 'Digital Drop', ltv: '$120.00', avatar: 'https://i.pravatar.cc/150?u=5' },
] as const;

const clickPresets = ['2.4k', '1.8k', '942', '811', '620'];
const MIDNIGHT_THEME_ID = 'midnight-zenith';
const CREATOR_HUB_THEME_ID = 'concrete-vibe';
const CREATOR_HUB_FEATURED_CONTAINER_ID = 'creator-hub-featured';
const CREATOR_HUB_PROOF_PREFIX = 'creator-hub-proof-';
const CREATOR_HUB_LOG_PREFIX = 'creator-hub-log-';

const CREATOR_HUB_SECTION_CONFIG: Array<{
  key: CreatorHubSectionKey;
  label: string;
  blockType: 'links' | 'socials' | 'featured_link' | 'products' | 'stats' | 'text';
  blockId: string;
}> = [
  { key: 'social_row', label: 'Social Links', blockType: 'socials', blockId: 'creator-hub-social-row' },
  { key: 'top_actions', label: 'Top Actions', blockType: 'links', blockId: 'creator-hub-top-actions' },
  { key: 'featured_release', label: 'Featured Release', blockType: 'featured_link', blockId: 'creator-hub-featured-release' },
  { key: 'boutique_shelf', label: 'Boutique Shelf', blockType: 'products', blockId: 'creator-hub-boutique-shelf' },
  { key: 'trusted_proof', label: 'Trusted Proof', blockType: 'stats', blockId: 'creator-hub-trusted-proof' },
  { key: 'vibejam_log', label: 'VibeJam Log', blockType: 'text', blockId: 'creator-hub-vibejam-log' },
];

type MidnightSectionKey = 'hero' | 'nav_tabs' | 'content_grid' | 'footer_cta';
type MidnightCardType = 'vertical' | 'horizontal' | 'square';

const MIDNIGHT_HERO_META_ID = 'midnight-hero-meta';
const MIDNIGHT_NAV_PREFIX = 'midnight-nav-';
const MIDNIGHT_GRID_PREFIX = 'midnight-grid-';
const MIDNIGHT_FOOTER_META_ID = 'midnight-footer-meta';
const MIDNIGHT_FOOTER_SOCIAL_PREFIX = 'midnight-footer-social-';

const MIDNIGHT_SECTION_CONFIG: Array<{
  key: MidnightSectionKey;
  label: string;
  blockType: 'hero' | 'links' | 'featured_link' | 'text';
  blockId: string;
}> = [
  { key: 'hero', label: 'Hero', blockType: 'hero', blockId: 'midnight-hero-block' },
  { key: 'nav_tabs', label: 'Navigation Tabs', blockType: 'links', blockId: 'midnight-nav-block' },
  { key: 'content_grid', label: 'Content Grid', blockType: 'featured_link', blockId: 'midnight-grid-block' },
  { key: 'footer_cta', label: 'Footer CTA', blockType: 'text', blockId: 'midnight-footer-block' },
];

const midnightTypeToSize = (type: MidnightCardType): CanvasThemeContainerSize =>
  type === 'horizontal' ? 'full' : type === 'vertical' ? 'profile' : 'standard';

const midnightSizeToType = (size: CanvasThemeContainerSize): MidnightCardType =>
  size === 'full' ? 'horizontal' : size === 'profile' ? 'vertical' : 'square';

const encodeMidnightGridSubtitle = (category: string, subtitle: string, live: boolean): string =>
  `${category.trim() || 'ALL'}||${subtitle.trim()}||${live ? '1' : '0'}`;

const decodeMidnightGridSubtitle = (value?: string) => {
  if (!value) {
    return { category: 'ALL', subtitle: '', live: false };
  }
  const [category = 'ALL', subtitle = '', liveFlag = '0'] = value.split('||');
  return {
    category: category.trim() || 'ALL',
    subtitle: subtitle.trim(),
    live: liveFlag.trim() === '1',
  };
};

const encodeMidnightHeroSubtitle = (bio: string, verified: boolean): string =>
  `${bio.trim()}||${verified ? '1' : '0'}`;

const decodeMidnightHeroSubtitle = (value?: string) => {
  if (!value) {
    return { bio: '', verified: true };
  }
  const [bio = '', verifiedFlag = '1'] = value.split('||');
  return {
    bio: bio.trim(),
    verified: verifiedFlag.trim() !== '0',
  };
};

const decodeMidnightFooterSubtitle = (value?: string) => {
  if (!value) {
    return { subheadline: '', tagline: '' };
  }
  const [subheadline = '', tagline = ''] = value.split('||');
  return {
    subheadline: subheadline.trim(),
    tagline: tagline.trim(),
  };
};

const ACCENT_TOKEN_MAP: Record<string, string> = {
  'cyan-400': '#22d3ee',
  'yellow-400': '#facc15',
  'rose-500': '#f43f5e',
  'purple-500': '#a855f7',
  'blue-400': '#60a5fa',
  'green-400': '#4ade80',
  'fuchsia-400': '#e879f9',
  'amber-300': '#fcd34d',
  'emerald-400': '#34d399',
  'zinc-300': '#d4d4d8',
  'sky-300': '#7dd3fc',
  'violet-400': '#a78bfa',
  'lime-400': '#a3e635',
  'cyan-300': '#67e8f9',
  'indigo-300': '#a5b4fc',
  'blue-300': '#93c5fd',
  'stone-300': '#d6d3d1',
  'teal-300': '#5eead4',
  'amber-400': '#fbbf24',
  'slate-300': '#cbd5e1',
  'violet-300': '#c4b5fd',
  'yellow-300': '#fde047',
};

const resolveAccentColor = (value: string): string => {
  if (!value) return '#a855f7';
  if (value.startsWith('#')) return value;
  return ACCENT_TOKEN_MAP[value] ?? '#a855f7';
};

const hexToRgba = (hex: string, alpha: number): string => {
  const normalized = hex.replace('#', '');
  const expanded = normalized.length === 3
    ? normalized.split('').map((ch) => ch + ch).join('')
    : normalized;
  const parsed = Number.parseInt(expanded.slice(0, 6), 16);
  if (Number.isNaN(parsed)) return `rgba(168, 85, 247, ${alpha})`;
  const r = (parsed >> 16) & 255;
  const g = (parsed >> 8) & 255;
  const b = parsed & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const getThemePreviewFamily = (themeId: string): ThemePreviewFamily => {
  const id = themeId.toLowerCase();

  if (id.includes('editorial') || id.includes('monarch') || id.includes('newsroom') || id.includes('press')) {
    return 'editorial';
  }
  if (id.includes('aurora') || id.includes('atlas') || id.includes('halo') || id.includes('sonic')) {
    return 'aurora';
  }
  if (id.includes('glass') || id.includes('prism') || id.includes('opal') || id.includes('sapphire')) {
    return 'glass';
  }
  if (id.includes('concrete') || id.includes('carbon') || id.includes('luxe') || id.includes('market')) {
    return 'creator';
  }
  return 'midnight';
};

const dedupeThemesById = (input: CanvasTheme[]): CanvasTheme[] => {
  const seen = new Set<string>();
  const output: CanvasTheme[] = [];
  for (const theme of input) {
    if (seen.has(theme.id)) {
      continue;
    }
    seen.add(theme.id);
    output.push(theme);
  }
  return output;
};

const normalizePreviewUrl = (value: string): string | null => {
  const raw = value.trim();
  if (!raw || raw === '#') {
    return null;
  }
  if (/^(https?:\/\/|mailto:|tel:)/i.test(raw)) {
    return raw;
  }
  if (raw.startsWith('www.') || raw.includes('.')) {
    return `https://${raw}`;
  }
  return null;
};

const inferLinkKeyFromTitle = (title: string): string | null => {
  const t = title.trim().toLowerCase();
  if (!t) {
    return null;
  }
  if (t.includes('twitter') || t === 'x' || t.includes('(x)')) {
    return 'x';
  }
  if (t.includes('instagram') || t.includes('insta')) {
    return 'instagram';
  }
  if (t.includes('github')) {
    return 'github';
  }
  if (t.includes('youtube') || t.includes('yt')) {
    return 'youtube';
  }
  if (t.includes('spotify') || t.includes('music')) {
    return 'spotify';
  }
  if (t.includes('store') || t.includes('shop') || t.includes('merch')) {
    return 'store';
  }
  if (t.includes('tiktok') || t.includes('tik tok')) {
    return 'youtube';
  }
  if (t.includes('newsletter')) {
    return 'newsletter';
  }
  if (t.includes('email') || t.includes('mail')) {
    return 'email';
  }
  if (t.includes('discord')) {
    return 'discord';
  }
  if (t.includes('telegram')) {
    return 'telegram';
  }
  if (t.includes('community')) {
    return 'community';
  }
  if (
    t.includes('website') ||
    t.includes('portfolio') ||
    t.includes('live canvas') ||
    t.includes('live page') ||
    t.includes('linkedin') ||
    t.includes('vimeo')
  ) {
    return 'website';
  }
  return null;
};

const PREVIEW_THEME_LINK_KEYS = new Set([
  'website',
  'newsletter',
  'community',
  'instagram',
  'x',
  'discord',
  'email',
  'github',
  'youtube',
  'spotify',
  'store',
]);

const buildPreviewLinksRecordFromDashboardLinks = (
  dashboardLinks: DashboardLink[],
  effectiveLiveUrl: string,
): Record<string, string> => {
  const next: Record<string, string> = {};

  for (const link of dashboardLinks) {
    const normalized = normalizePreviewUrl(link.url);
    if (!normalized) {
      continue;
    }

    const inferredKey = inferLinkKeyFromTitle(link.title);
    if (inferredKey && PREVIEW_THEME_LINK_KEYS.has(inferredKey)) {
      next[inferredKey] = normalized;
      continue;
    }

    if (!next.website) {
      next.website = normalized;
    }
  }

  if (!next.website) {
    next.website = effectiveLiveUrl;
  }

  return next;
};

const sanitizeLiveSlug = (input: string): string =>
  input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\/(www\.)?vibejam\.co\//, '')
    .replace(/^vibejam\.co\//, '')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);

const getInitialLinks = (onboarding: CanvasOnboardingPayload, publish: CanvasPublishResult): DashboardLink[] => {
  if (Array.isArray(onboarding.linkItems) && onboarding.linkItems.length > 0) {
    const restored = onboarding.linkItems
      .filter((item) => item && typeof item.title === 'string' && typeof item.url === 'string')
      .map((item, index) => ({
        id: item.id || `${Date.now()}-${index}`,
        title: item.title.trim(),
        url: item.url.trim(),
        clicks: item.clicks || clickPresets[index % clickPresets.length],
      }))
      .filter((item) => item.title.length > 0 && item.url.length > 0);
    if (restored.length > 0) {
      return restored;
    }
  }

  const orderedSignalIds = onboarding.selectedSignals.length > 0 ? onboarding.selectedSignals : Object.keys(onboarding.links);

  const seeded = orderedSignalIds
    .map((id, index) => {
      const value = onboarding.links[id];
      if (!value) {
        return null;
      }

      return {
        id: `${id}-${index}`,
        title: SIGNAL_LABELS[id] ?? id,
        url: value,
        clicks: clickPresets[index % clickPresets.length],
      };
    })
    .filter((item): item is DashboardLink => Boolean(item));

  if (seeded.length > 0) {
    return seeded;
  }

  return [
    {
      id: 'live-url',
      title: 'Live Canvas',
      url: publish.url,
      clicks: '2.1k',
    },
  ];
};

const parsePriceLabelToNumber = (value?: string): number => {
  if (!value) {
    return 0;
  }
  const normalized = value.trim().toLowerCase();
  if (normalized === 'free') {
    return 0;
  }
  const parsed = Number(normalized.replace(/[^0-9.]/g, ''));
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed * 100) / 100) : 0;
};

const buildDefaultCreatorHubProducts = (fallbackUrl: string): CanvasDigitalProduct[] =>
  CREATOR_HUB_CATALOG.map((item, index) => ({
    id: `creator-hub-default-${index}`,
    title: item.title,
    description: item.description,
    category: 'digital',
    priceUsd: parsePriceLabelToNumber(item.price),
    url: fallbackUrl,
  }));

const ensureCreatorHubLayoutSchema = (schema: CanvasLayoutSchema): CanvasLayoutSchema => {
  const sorted = [...schema.blocks].sort((a, b) => a.position - b.position);
  const next = [...sorted];
  let changed = false;

  for (const config of CREATOR_HUB_SECTION_CONFIG) {
    const existingIndex = next.findIndex((item) => item.id === config.blockId);
    if (existingIndex >= 0) {
      const existing = next[existingIndex];
      if (existing.type !== config.blockType || existing.title !== config.label) {
        next[existingIndex] = {
          ...existing,
          type: config.blockType,
          title: config.label,
        };
        changed = true;
      }
      continue;
    }

    const fallbackByTypeIndex = next.findIndex((item) => item.type === config.blockType);
    if (fallbackByTypeIndex >= 0) {
      const fallback = next[fallbackByTypeIndex];
      next[fallbackByTypeIndex] = {
        ...fallback,
        id: config.blockId,
        title: config.label,
      };
      changed = true;
      continue;
    }

    next.push({
      id: config.blockId,
      type: config.blockType,
      title: config.label,
      position: next.length,
      visible: true,
      data: {},
    });
    changed = true;
  }

  if (!changed) {
    return schema;
  }

  return {
    ...schema,
    updatedAt: new Date().toISOString(),
    blocks: next
      .sort((a, b) => a.position - b.position)
      .map((item, index) => ({
        ...item,
        position: index,
      })),
  };
};

const ensureMidnightLayoutSchema = (schema: CanvasLayoutSchema): CanvasLayoutSchema => {
  const sorted = [...schema.blocks].sort((a, b) => a.position - b.position);
  const next = [...sorted];
  let changed = false;

  for (const config of MIDNIGHT_SECTION_CONFIG) {
    const existingIndex = next.findIndex((item) => item.id === config.blockId);
    if (existingIndex >= 0) {
      const existing = next[existingIndex];
      if (existing.type !== config.blockType || existing.title !== config.label) {
        next[existingIndex] = {
          ...existing,
          type: config.blockType,
          title: config.label,
        };
        changed = true;
      }
      continue;
    }

    const fallbackByTypeIndex = next.findIndex((item) => item.type === config.blockType);
    if (fallbackByTypeIndex >= 0) {
      const fallback = next[fallbackByTypeIndex];
      next[fallbackByTypeIndex] = {
        ...fallback,
        id: config.blockId,
        title: config.label,
      };
      changed = true;
      continue;
    }

    next.push({
      id: config.blockId,
      type: config.blockType,
      title: config.label,
      position: next.length,
      visible: true,
      data: {},
    });
    changed = true;
  }

  if (!changed) {
    return schema;
  }

  return {
    ...schema,
    updatedAt: new Date().toISOString(),
    blocks: next
      .sort((a, b) => a.position - b.position)
      .map((item, index) => ({
        ...item,
        position: index,
      })),
  };
};

type ThemeCanvasPresetKey =
  | 'website'
  | 'newsletter'
  | 'community'
  | 'instagram'
  | 'x'
  | 'discord'
  | 'email'
  | 'github'
  | 'youtube'
  | 'spotify'
  | 'store';

type ThemeCanvasPresetItem = {
  title: string;
  key: ThemeCanvasPresetKey;
  fallbackUrl?: string;
};

const THEME_CANVAS_PRESETS: Record<'midnight' | 'editorial' | 'creator' | 'aurora' | 'glass' | 'collection', ThemeCanvasPresetItem[]> = {
  midnight: [
    { title: 'X (Twitter)', key: 'x' },
    { title: 'Instagram', key: 'instagram' },
    { title: 'Portfolio', key: 'website' },
    { title: 'YouTube', key: 'youtube' },
  ],
  editorial: [
    { title: 'Feature Article', key: 'website' },
    { title: 'Newsletter', key: 'newsletter' },
    { title: 'Archive', key: 'website' },
    { title: 'X (Twitter)', key: 'x' },
  ],
  creator: [
    { title: 'Visit Website', key: 'website' },
    { title: 'Join Newsletter', key: 'newsletter' },
    { title: 'Community', key: 'community' },
    { title: 'Instagram', key: 'instagram' },
    { title: 'X (Twitter)', key: 'x' },
    { title: 'GitHub', key: 'github' },
  ],
  aurora: [
    { title: 'Portfolio', key: 'website' },
    { title: 'Instagram', key: 'instagram' },
    { title: 'X (Twitter)', key: 'x' },
    { title: 'Spotify', key: 'spotify' },
  ],
  glass: [
    { title: 'Portfolio', key: 'website' },
    { title: 'Instagram', key: 'instagram' },
    { title: 'X (Twitter)', key: 'x' },
    { title: 'Storefront', key: 'store' },
  ],
  collection: [
    { title: 'Hero Link', key: 'website' },
    { title: 'Storefront', key: 'store' },
    { title: 'Newsletter', key: 'newsletter' },
    { title: 'Community', key: 'community' },
  ],
};

const dedupeThemePresetItems = (items: ThemeCanvasPresetItem[]): ThemeCanvasPresetItem[] => {
  const seen = new Set<string>();
  const out: ThemeCanvasPresetItem[] = [];
  for (const item of items) {
    const token = `${item.title.toLowerCase()}::${item.key}`;
    if (seen.has(token)) {
      continue;
    }
    seen.add(token);
    out.push(item);
  }
  return out;
};

const ORBITAL_DEFAULT_LINKS: ThemeCanvasPresetItem[] = [
  { title: 'Music', key: 'spotify', fallbackUrl: 'https://open.spotify.com' },
  { title: 'Merch', key: 'store', fallbackUrl: 'https://www.vibejam.co/marketplace' },
  { title: 'Instagram', key: 'instagram', fallbackUrl: 'https://instagram.com' },
  { title: 'Twitter', key: 'x', fallbackUrl: 'https://x.com' },
  { title: 'YouTube', key: 'youtube', fallbackUrl: 'https://youtube.com' },
  { title: 'Code', key: 'github', fallbackUrl: 'https://github.com' },
  { title: 'Portfolio', key: 'website', fallbackUrl: 'https://www.vibejam.co' },
  { title: 'LinkedIn', key: 'website', fallbackUrl: 'https://linkedin.com' },
  { title: 'Contact', key: 'email', fallbackUrl: 'mailto:hello@vibejam.co' },
];

const getThemePresetItemsById = (themeId: string): ThemeCanvasPresetItem[] => {
  if (themeId === 'midnight-zenith') {
    const categoryLinks: ThemeCanvasPresetItem[] = MIDNIGHT_CATEGORIES.filter((item) => item !== 'All').map((item) => ({
      title: item,
      key: 'website',
    }));
    const mediaLinks: ThemeCanvasPresetItem[] = MIDNIGHT_GRID_ITEMS.map((item) => ({
      title: `${item.title} (${item.subtitle})`,
      key: 'website',
      fallbackUrl: item.videoUrl,
    }));
    const footer: ThemeCanvasPresetItem[] = [
      { title: 'Instagram', key: 'instagram' },
      { title: 'Twitter', key: 'x' },
      { title: 'Vimeo', key: 'website' },
      { title: 'Discord', key: 'discord' },
    ];
    return [...categoryLinks, ...mediaLinks, ...footer];
  }

  if (themeId === 'editorial-kinetic') {
    return EDITORIAL_LINKS.map((item) => ({
      title: `${item.title}`,
      key: 'website',
      fallbackUrl: item.url,
    }));
  }

  if (themeId === 'concrete-vibe') {
    const social: ThemeCanvasPresetItem[] = CREATOR_HUB_CREATOR.socials.map((item) => ({
      title: item.platform,
      key:
        item.platform.toLowerCase().includes('twitter')
          ? 'x'
          : item.platform.toLowerCase().includes('instagram')
            ? 'instagram'
            : item.platform.toLowerCase().includes('github')
              ? 'github'
              : 'website' as ThemeCanvasPresetKey,
      fallbackUrl: item.url,
    }));
    const ctas: ThemeCanvasPresetItem[] = CREATOR_HUB_CTA_CARDS.map((item) => ({
      title: item.title,
      key:
        item.title.toLowerCase().includes('newsletter')
          ? 'newsletter'
          : item.title.toLowerCase().includes('community')
            ? 'community'
            : 'website' as ThemeCanvasPresetKey,
      fallbackUrl: item.url,
    }));
    const catalog: ThemeCanvasPresetItem[] = CREATOR_HUB_CATALOG.map((item) => ({
      title: item.title,
      key: 'store',
    }));
    return [
      ...social,
      ...ctas,
      { title: CREATOR_HUB_FEATURED_PRODUCT.title, key: 'store' },
      ...catalog,
    ];
  }

  if (themeId === 'aurora-bento') {
    const cardLinks: ThemeCanvasPresetItem[] = ETHEREAL_LINKS_DATA.map((item) => ({
      title: item.title,
      key:
        item.title.toLowerCase().includes('instagram')
          ? 'instagram'
          : item.title.toLowerCase().includes('twitter')
            ? 'x'
            : item.title.toLowerCase().includes('newsletter')
              ? 'newsletter'
              : 'website' as ThemeCanvasPresetKey,
      fallbackUrl: item.url,
    }));
    return [...cardLinks, { title: 'Music', key: 'spotify' }];
  }

  if (themeId === 'glass-artifact') {
    return [
      { title: 'User Profile', key: 'website' },
      { title: 'Now Playing', key: 'spotify' },
      { title: 'Location', key: 'website' },
      { title: 'Vibe Feed', key: 'youtube' },
      { title: 'Atmosphere', key: 'website' },
      { title: 'Quick Catch', key: 'website' },
    ];
  }

  if (themeId === 'isometric-loft-profile') {
    return [
      { title: 'My Playlist', key: 'spotify' },
      { title: 'Dev Desktop', key: 'website' },
      { title: 'Merch Rack', key: 'store' },
      { title: 'Pixel Me', key: 'website' },
      { title: 'Favorite', key: 'website' },
      { title: 'Follow', key: 'community' },
    ];
  }

  if (themeId === 'kinetic-variable-profile') {
    return [
      { title: 'SPOTIFY', key: 'spotify' },
      { title: 'INSTAGRAM', key: 'instagram' },
      { title: 'TWITTER', key: 'x' },
      { title: 'YOUTUBE', key: 'youtube' },
      { title: 'BEHANCE', key: 'website' },
      { title: 'WEBSITE', key: 'website' },
    ];
  }

  if (themeId === 'orbital-lens-spatial-link-in-bio') {
    return ORBITAL_DEFAULT_LINKS;
  }

  if (themeId === 'vapor-os') {
    return [
      { title: 'Music', key: 'spotify' },
      { title: 'Notepad', key: 'website' },
      { title: 'Paint', key: 'website' },
      { title: 'Start', key: 'website' },
    ];
  }

  if (themeId === 'collection-gold-standard') {
    const signals: ThemeCanvasPresetItem[] = GOLD_STANDARD_INITIAL_CREATOR.signals.map((item) => ({
      title: item.label,
      key: 'website',
    }));
    return [
      { title: 'Narrative', key: 'website', fallbackUrl: GOLD_STANDARD_INITIAL_CREATOR.heroImage },
      ...signals,
    ];
  }

  if (themeId === 'collection-accordion-deck') {
    return ACCORDION_DECK_SLICES.map((slice) => ({
      title: `${slice.title}`,
      key: (slice.type === 'audio' ? 'spotify' : 'website') as ThemeCanvasPresetKey,
      fallbackUrl: slice.imageUrl,
    }));
  }

  if (themeId === 'collection-collage-os') {
    return [
      { title: 'Cassette Player', key: 'spotify' },
      { title: 'CRT Video', key: 'youtube' },
      { title: 'Polaroid Stack', key: 'website' },
      { title: 'Mood Note', key: 'website' },
    ];
  }

  if (themeId === 'collection-terrarium') {
    return [
      { title: 'About', key: 'website' },
      { title: 'Projects', key: 'website' },
      { title: 'Gallery', key: 'website' },
      { title: 'Contact', key: 'email' },
      { title: 'Instagram', key: 'instagram' },
      { title: 'TikTok', key: 'website' },
      { title: 'Portfolio', key: 'website' },
      { title: 'Newsletter', key: 'newsletter' },
      { title: 'Spotify', key: 'spotify' },
    ];
  }

  if (themeId === 'collection-prism-os') {
    return [
      { title: 'Profile', key: 'website' },
      { title: 'Live', key: 'website' },
      { title: 'Music', key: 'spotify' },
      { title: 'Shop', key: 'store' },
      { title: 'Socials', key: 'instagram' },
      { title: 'System Log', key: 'website' },
    ];
  }

  if (themeId === 'collection-aero-canvas') {
    return AERO_CANVAS_INITIAL_WIDGETS.map((item) => ({
      title: item.type,
      key:
        item.type === 'spotify'
          ? 'spotify'
          : item.type === 'newsletter'
            ? 'newsletter'
            : item.type === 'tiktok'
              ? 'youtube'
              : 'website' as ThemeCanvasPresetKey,
      fallbackUrl: item.type === 'tiktok' ? item.content.videoUrl : undefined,
    }));
  }

  const presetGroup = themeId.startsWith('collection-') ? 'collection' : getThemePreviewFamily(themeId);
  return THEME_CANVAS_PRESETS[presetGroup] ?? THEME_CANVAS_PRESETS.midnight;
};

const CanvasCommandDashboard: React.FC<CanvasCommandDashboardProps> = ({
  onboarding,
  publish,
  themes,
  studioThemes,
  authAvatarUrl,
  authDisplayName,
  unreadCount = 0,
  isNotificationsOpen = false,
  onNavigateMainTab,
  onToggleNotifications,
  onOpenProfile,
  onOpenStartJam,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('canvas');
  const [selectedThemeId, setSelectedThemeId] = useState(onboarding.selectedTheme);
  const [links, setLinks] = useState<DashboardLink[]>(() => getInitialLinks(onboarding, publish));
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDesktopPreviewOpen, setIsDesktopPreviewOpen] = useState(false);
  const [isOpeningLivePage, setIsOpeningLivePage] = useState(false);

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<DashboardLink | null>(null);
  const [formState, setFormState] = useState({ title: '', url: '' });
  const [themeContainers, setThemeContainers] = useState<Record<string, CanvasThemeContainer[]>>(
    () => onboarding.themeContainers ?? {},
  );
  const [isAddContainerMenuOpen, setIsAddContainerMenuOpen] = useState(false);
  const [isContainerEditorOpen, setIsContainerEditorOpen] = useState(false);
  const [editingContainer, setEditingContainer] = useState<CanvasThemeContainer | null>(null);
  const [containerForm, setContainerForm] = useState<{
    title: string;
    subtitle: string;
    url: string;
    mediaUrl: string;
    size: CanvasThemeContainerSize;
    kind: CanvasThemeContainerKind;
  }>({
    title: '',
    subtitle: '',
    url: '',
    mediaUrl: '',
    size: 'standard',
    kind: 'note',
  });
  const mobileThemePreviewRef = useRef<HTMLDivElement | null>(null);
  const desktopThemePreviewRef = useRef<HTMLDivElement | null>(null);
  const headerNotificationsRef = useRef<HTMLDivElement | null>(null);
  const didSeedCreatorHubProductsRef = useRef(false);
  const didSeedCreatorHubMetaRef = useRef(false);
  const didSeedMidnightMetaRef = useRef(false);

  const [isTuning, setIsTuning] = useState(false);
  const [isRebooting, setIsRebooting] = useState(false);
  const [overrides, setOverrides] = useState<ThemeOverrides>({
    accentColor: resolveAccentColor(themes.find((item) => item.id === onboarding.selectedTheme)?.accent ?? '#a855f7'),
    fontFamily: 'Inter',
    cornerRadius: 16,
    bouncyMode: true,
  });
  const [monetizeStreams, setMonetizeStreams] = useState<MonetizeStream[]>(INITIAL_MONETIZE_STREAMS);
  const [monetizeTransactions, setMonetizeTransactions] = useState<MonetizeTransaction[]>(RECENT_TRANSACTIONS);
  const [monetizeRevenue] = useState(INITIAL_MONETIZE_REVENUE);
  const [monetization, setMonetization] = useState<CanvasMonetization>(() =>
    sanitizeMonetizationState(onboarding.monetization),
  );
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isTipJarModalOpen, setIsTipJarModalOpen] = useState(false);
  const [isBrandCollabsModalOpen, setIsBrandCollabsModalOpen] = useState(false);
  const [isProductsSheetOpen, setIsProductsSheetOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isHeaderNotificationsOpen, setIsHeaderNotificationsOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  const [dashboardNotice, setDashboardNotice] = useState<string | null>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [workspaceProfile, setWorkspaceProfile] = useState(onboarding.profile);
  const [workspaceSlug, setWorkspaceSlug] = useState(
    sanitizeLiveSlug(publish.slug || onboarding.vanitySlug || onboarding.claimedName) || 'beacons',
  );
  const [settingsDraft, setSettingsDraft] = useState({
    name: onboarding.profile.name,
    bio: onboarding.profile.bio,
    avatar: onboarding.profile.avatar,
    slug: sanitizeLiveSlug(publish.slug || onboarding.vanitySlug || onboarding.claimedName) || 'beacons',
  });
  const [productForm, setProductForm] = useState<ProductFormState>({
    title: '',
    description: '',
    category: 'digital',
    priceUsd: '',
    url: '',
  });
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [isMidnightGridModalOpen, setIsMidnightGridModalOpen] = useState(false);
  const [midnightGridForm, setMidnightGridForm] = useState<MidnightGridFormState>({
    title: '',
    category: 'ALL',
    subtitle: '',
    type: 'square',
    live: false,
    videoUrl: '',
    thumbnailUrl: '',
  });
  const [tipJarDraftUrl, setTipJarDraftUrl] = useState(onboarding.monetization?.tipJarUrl ?? DEFAULT_TIP_JAR_URL);
  const [brandCollabForm, setBrandCollabForm] = useState<BrandCollabFormState>({
    brand: '',
    campaign: '',
    contactEmail: '',
    budgetUsd: '',
    timeline: '',
    deliverables: '',
    notes: '',
  });
  const [isPersistingMonetization, setIsPersistingMonetization] = useState(false);
  const [monetizeNotice, setMonetizeNotice] = useState<string | null>(null);
  const [layoutSchema, setLayoutSchema] = useState<CanvasLayoutSchema>(() =>
    sanitizeLayoutSchema(
      onboarding.layout,
      { links: onboarding.links, monetization: sanitizeMonetizationState(onboarding.monetization) },
    ),
  );
  const [draggingLinkId, setDraggingLinkId] = useState<string | null>(null);
  const [audienceFilter, setAudienceFilter] = useState<'All' | 'Buyers' | 'Waitlist' | 'Subscribers'>('All');
  const [visibleAudienceCount, setVisibleAudienceCount] = useState(5);
  const [analyticsRange, setAnalyticsRange] = useState<'7d' | '30d'>('7d');
  const resolvedAccentColor = resolveAccentColor(overrides.accentColor);
  const accentRingSoft = hexToRgba(resolvedAccentColor, 0.32);
  const accentRingStrong = hexToRgba(resolvedAccentColor, 0.55);
  const effectiveSlug = sanitizeLiveSlug(workspaceSlug || onboarding.vanitySlug || onboarding.claimedName) || 'beacons';
  const effectiveLiveUrl = `https://vibejam.co/${effectiveSlug}`;

  const profile = useMemo<DashboardProfile>(
    () => ({
      displayName: workspaceProfile.name || onboarding.claimedName,
      handle: `@${effectiveSlug.replace(/^@/, '')}`,
      bio: workspaceProfile.bio || 'Creator, builder, and storyteller.',
      avatar: workspaceProfile.avatar,
    }),
    [effectiveSlug, onboarding.claimedName, workspaceProfile.avatar, workspaceProfile.bio, workspaceProfile.name],
  );
  const headerAvatar = authAvatarUrl || profile.avatar;
  const headerDisplayName = authDisplayName || profile.displayName;

  const availableStudioThemes = useMemo(
    () => (studioThemes && studioThemes.length > 0 ? studioThemes : themes),
    [studioThemes, themes],
  );
  const allThemeCatalog = useMemo(
    () => dedupeThemesById([...themes, ...availableStudioThemes]),
    [availableStudioThemes, themes],
  );
  const selectedTheme = useMemo(
    () => allThemeCatalog.find((theme) => theme.id === selectedThemeId) ?? allThemeCatalog[0],
    [allThemeCatalog, selectedThemeId],
  );
  const activePreviewThemeId = selectedThemeId ?? selectedTheme?.id ?? 'midnight-zenith';
  const isMidnightThemeActive = activePreviewThemeId === MIDNIGHT_THEME_ID;
  const isCreatorHubThemeActive = activePreviewThemeId === CREATOR_HUB_THEME_ID;
  const midnightThemeContainers = useMemo(
    () => themeContainers[MIDNIGHT_THEME_ID] ?? [],
    [themeContainers],
  );
  const midnightHeroMetaContainer = useMemo(
    () => midnightThemeContainers.find((item) => item.id === MIDNIGHT_HERO_META_ID),
    [midnightThemeContainers],
  );
  const midnightNavContainers = useMemo(
    () => midnightThemeContainers.filter((item) => item.id.startsWith(MIDNIGHT_NAV_PREFIX)),
    [midnightThemeContainers],
  );
  const midnightGridContainers = useMemo(
    () => midnightThemeContainers.filter((item) => item.id.startsWith(MIDNIGHT_GRID_PREFIX)),
    [midnightThemeContainers],
  );
  const midnightFooterMetaContainer = useMemo(
    () => midnightThemeContainers.find((item) => item.id === MIDNIGHT_FOOTER_META_ID),
    [midnightThemeContainers],
  );
  const midnightFooterSocialContainers = useMemo(
    () => midnightThemeContainers.filter((item) => item.id.startsWith(MIDNIGHT_FOOTER_SOCIAL_PREFIX)),
    [midnightThemeContainers],
  );
  const creatorHubThemeContainers = useMemo(
    () => themeContainers[CREATOR_HUB_THEME_ID] ?? [],
    [themeContainers],
  );
  const creatorHubProofContainers = useMemo(
    () =>
      creatorHubThemeContainers
        .filter((item) => item.id.startsWith(CREATOR_HUB_PROOF_PREFIX))
        .sort((a, b) => a.id.localeCompare(b.id)),
    [creatorHubThemeContainers],
  );
  const creatorHubLogContainers = useMemo(
    () =>
      creatorHubThemeContainers
        .filter((item) => item.id.startsWith(CREATOR_HUB_LOG_PREFIX))
        .sort((a, b) => a.id.localeCompare(b.id)),
    [creatorHubThemeContainers],
  );
  const creatorHubFeaturedContainer = useMemo(
    () => creatorHubThemeContainers.find((item) => item.id === CREATOR_HUB_FEATURED_CONTAINER_ID),
    [creatorHubThemeContainers],
  );
  const creatorHubSectionBlocks = useMemo(() => {
    const ensured = ensureCreatorHubLayoutSchema(layoutSchema);
    const blocks = [...ensured.blocks].sort((a, b) => a.position - b.position);
    return CREATOR_HUB_SECTION_CONFIG.map((config) => {
      const block = blocks.find((item) => item.id === config.blockId) ?? blocks.find((item) => item.type === config.blockType);
      return {
        key: config.key,
        label: config.label,
        blockType: config.blockType,
        blockId: config.blockId,
        visible: block?.visible ?? true,
        position: block?.position ?? Number.MAX_SAFE_INTEGER,
      };
    })
      .sort((a, b) => a.position - b.position)
      .map((item, index) => ({ ...item, position: index }));
  }, [layoutSchema]);
  const midnightSectionBlocks = useMemo(() => {
    const ensured = ensureMidnightLayoutSchema(layoutSchema);
    const blocks = [...ensured.blocks].sort((a, b) => a.position - b.position);
    return MIDNIGHT_SECTION_CONFIG.map((config) => {
      const block = blocks.find((item) => item.id === config.blockId) ?? blocks.find((item) => item.type === config.blockType);
      return {
        key: config.key,
        label: config.label,
        blockType: config.blockType,
        blockId: config.blockId,
        visible: block?.visible ?? true,
        position: block?.position ?? Number.MAX_SAFE_INTEGER,
      };
    })
      .sort((a, b) => a.position - b.position)
      .map((item, index) => ({ ...item, position: index }));
  }, [layoutSchema]);
  const midnightHeroMeta = useMemo(() => {
    const decoded = decodeMidnightHeroSubtitle(midnightHeroMetaContainer?.subtitle);
    return {
      name: midnightHeroMetaContainer?.title?.trim() || workspaceProfile.name || MIDNIGHT_PROFILE_DEFAULTS.name,
      handle: midnightHeroMetaContainer?.url?.trim() || `@${effectiveSlug}`,
      bio: decoded.bio || workspaceProfile.bio || MIDNIGHT_PROFILE_DEFAULTS.bio,
      verified: decoded.verified,
      avatar: midnightHeroMetaContainer?.mediaUrl?.trim() || workspaceProfile.avatar || MIDNIGHT_PROFILE_DEFAULTS.profilePic,
    };
  }, [effectiveSlug, midnightHeroMetaContainer, workspaceProfile.avatar, workspaceProfile.bio, workspaceProfile.name]);
  const midnightFooterMeta = useMemo(() => {
    const decoded = decodeMidnightFooterSubtitle(midnightFooterMetaContainer?.subtitle);
    return {
      headline: midnightFooterMetaContainer?.title?.trim() || MIDNIGHT_FOOTER_DEFAULTS.headline,
      subheadline: decoded.subheadline || MIDNIGHT_FOOTER_DEFAULTS.subheadline,
      tagline: decoded.tagline || MIDNIGHT_FOOTER_DEFAULTS.tagline,
    };
  }, [midnightFooterMetaContainer]);
  const analyticsSeries = analyticsRange === '30d' ? ANALYTICS_DATA_30D : ANALYTICS_DATA;
  const filteredSubscribers = useMemo(() => {
    if (audienceFilter === 'Buyers') {
      return SUBSCRIBERS.filter((sub) => sub.source === 'Tip Jar' || sub.source === 'Digital Drop');
    }
    if (audienceFilter === 'Waitlist') {
      return SUBSCRIBERS.filter((sub) => sub.source === 'Affiliate');
    }
    if (audienceFilter === 'Subscribers') {
      return SUBSCRIBERS.filter((sub) => sub.source === 'Tip Jar' || sub.source === 'Affiliate');
    }
    return SUBSCRIBERS;
  }, [audienceFilter]);
  const visibleSubscribers = filteredSubscribers.slice(0, visibleAudienceCount);
  const brandCollabInbox = monetization.brandCollabs?.inbox ?? [];
  const newBrandCollabCount = brandCollabInbox.filter((deal) => deal.status === 'new').length;
  const activeBrandCollabCount = brandCollabInbox.filter((deal) => deal.status === 'reviewing' || deal.status === 'accepted').length;
  const brandCollabPipelineValue = brandCollabInbox
    .filter((deal) => deal.status !== 'declined')
    .reduce((sum, deal) => sum + Math.max(0, deal.budgetUsd), 0);
  const headerNotifications = useMemo(
    () => [
      {
        id: 'hq-1',
        title: 'Canvas synced',
        body: 'Your latest command center updates are live.',
        type: 'update' as const,
        timestamp: '2 hours ago',
      },
      {
        id: 'hq-2',
        title: 'Brand collab intake active',
        body: `${newBrandCollabCount} inbound request${newBrandCollabCount === 1 ? '' : 's'} waiting.`,
        type: 'offer' as const,
        timestamp: '5 hours ago',
      },
      {
        id: 'hq-3',
        title: 'Monetization pulse',
        body: `${activeBrandCollabCount} active collab deal${activeBrandCollabCount === 1 ? '' : 's'} in pipeline.`,
        type: 'system' as const,
        timestamp: '1 day ago',
      },
    ],
    [activeBrandCollabCount, newBrandCollabCount],
  );
  const canvasNotifications = useMemo<Notification[]>(
    () =>
      headerNotifications.map((item) => ({
        id: item.id,
        title: item.title,
        message: item.body,
        type: item.type,
        timestamp: item.timestamp,
        isRead: false,
      })),
    [headerNotifications],
  );

  const navItems = [
    { id: 'canvas' as const, label: 'Canvas', icon: Layers, color: 'text-blue-400' },
    { id: 'themes' as const, label: 'Themes', icon: Palette, color: 'text-purple-400' },
    { id: 'monetize' as const, label: 'Monetize', icon: DollarSign, color: 'text-emerald-400' },
    { id: 'audience' as const, label: 'Audience', icon: Users, color: 'text-orange-400' },
    { id: 'analytics' as const, label: 'Analytics', icon: BarChart3, color: 'text-blue-400' },
  ];

  useEffect(() => {
    didSeedCreatorHubProductsRef.current = false;
    didSeedCreatorHubMetaRef.current = false;
    didSeedMidnightMetaRef.current = false;
    setWorkspaceProfile(onboarding.profile);
    setWorkspaceSlug(sanitizeLiveSlug(publish.slug || onboarding.vanitySlug || onboarding.claimedName) || 'beacons');
    setLinks(getInitialLinks(onboarding, publish));
    setThemeContainers(onboarding.themeContainers ?? {});
    setLayoutSchema(
      sanitizeLayoutSchema(
        onboarding.layout,
        { links: onboarding.links, monetization: sanitizeMonetizationState(onboarding.monetization) },
      ),
    );
  }, [
    onboarding.claimedName,
    onboarding.layout,
    onboarding.links,
    onboarding.themeContainers,
    onboarding.monetization,
    onboarding.profile,
    onboarding.vanitySlug,
    publish.slug,
    publish.url,
  ]);

  useEffect(() => {
    if (!dashboardNotice) {
      return;
    }
    const timeout = window.setTimeout(() => setDashboardNotice(null), 3800);
    return () => window.clearTimeout(timeout);
  }, [dashboardNotice]);

  useEffect(() => {
    if (!isCreatorHubThemeActive) {
      return;
    }
    setLayoutSchema((prev) => ensureCreatorHubLayoutSchema(prev));
  }, [isCreatorHubThemeActive]);

  useEffect(() => {
    if (!isCreatorHubThemeActive) {
      return;
    }
    if (monetization.products.length > 0) {
      didSeedCreatorHubProductsRef.current = true;
      return;
    }
    if (didSeedCreatorHubProductsRef.current) {
      return;
    }
    setMonetization((prev) => ({
      ...prev,
      products: buildDefaultCreatorHubProducts(effectiveLiveUrl),
    }));
    didSeedCreatorHubProductsRef.current = true;
  }, [effectiveLiveUrl, isCreatorHubThemeActive, monetization.products.length]);

  useEffect(() => {
    if (!isCreatorHubThemeActive) {
      return;
    }
    if (didSeedCreatorHubMetaRef.current) {
      return;
    }
    const hasFeatured = creatorHubThemeContainers.some((item) => item.id === CREATOR_HUB_FEATURED_CONTAINER_ID);
    const hasProof = creatorHubThemeContainers.some((item) => item.id.startsWith(CREATOR_HUB_PROOF_PREFIX));
    const hasLog = creatorHubThemeContainers.some((item) => item.id.startsWith(CREATOR_HUB_LOG_PREFIX));
    if (hasFeatured && hasProof && hasLog) {
      didSeedCreatorHubMetaRef.current = true;
      return;
    }
    const defaults: CanvasThemeContainer[] = [];
    if (!hasFeatured) {
      defaults.push({
        id: CREATOR_HUB_FEATURED_CONTAINER_ID,
        size: 'full',
        kind: 'image',
        title: CREATOR_HUB_FEATURED_PRODUCT.title,
        subtitle: CREATOR_HUB_FEATURED_PRODUCT.description,
        url: effectiveLiveUrl,
        mediaUrl: CREATOR_HUB_FEATURED_PRODUCT.image,
      });
    }
    if (!hasProof) {
      CREATOR_HUB_TRUST_BADGES.forEach((badge, index) => {
        defaults.push({
          id: `${CREATOR_HUB_PROOF_PREFIX}${index}`,
          size: 'standard',
          kind: 'note',
          title: badge.label,
          subtitle: '',
          url: '',
          mediaUrl: '',
        });
      });
    }
    if (!hasLog) {
      CREATOR_HUB_TIMELINE.forEach((entry, index) => {
        defaults.push({
          id: `${CREATOR_HUB_LOG_PREFIX}${index}`,
          size: 'full',
          kind: 'note',
          title: entry.title,
          subtitle: `${entry.date}||${entry.content}`,
          url: '',
          mediaUrl: '',
        });
      });
    }
    if (defaults.length > 0) {
      setThemeContainers((prev) => ({
        ...prev,
        [CREATOR_HUB_THEME_ID]: [...(prev[CREATOR_HUB_THEME_ID] ?? []), ...defaults],
      }));
    }
    didSeedCreatorHubMetaRef.current = true;
  }, [
    creatorHubThemeContainers,
    effectiveLiveUrl,
    isCreatorHubThemeActive,
  ]);

  useEffect(() => {
    if (!isMidnightThemeActive) {
      return;
    }
    setLayoutSchema((prev) => ensureMidnightLayoutSchema(prev));
  }, [isMidnightThemeActive]);

  useEffect(() => {
    if (!isMidnightThemeActive) {
      return;
    }
    if (didSeedMidnightMetaRef.current) {
      return;
    }
    const hasHeroMeta = midnightThemeContainers.some((item) => item.id === MIDNIGHT_HERO_META_ID);
    const hasNav = midnightThemeContainers.some((item) => item.id.startsWith(MIDNIGHT_NAV_PREFIX));
    const hasGrid = midnightThemeContainers.some((item) => item.id.startsWith(MIDNIGHT_GRID_PREFIX));
    const hasFooterMeta = midnightThemeContainers.some((item) => item.id === MIDNIGHT_FOOTER_META_ID);
    const hasFooterSocial = midnightThemeContainers.some((item) => item.id.startsWith(MIDNIGHT_FOOTER_SOCIAL_PREFIX));
    if (hasHeroMeta && hasNav && hasGrid && hasFooterMeta && hasFooterSocial) {
      didSeedMidnightMetaRef.current = true;
      return;
    }

    const defaults: CanvasThemeContainer[] = [];
    if (!hasHeroMeta) {
      defaults.push({
        id: MIDNIGHT_HERO_META_ID,
        size: 'profile',
        kind: 'note',
        title: `@${effectiveSlug}`,
        subtitle: '1',
        url: '',
        mediaUrl: '',
      });
    }
    if (!hasNav) {
      MIDNIGHT_CATEGORIES.forEach((label, index) => {
        defaults.push({
          id: `${MIDNIGHT_NAV_PREFIX}${index}`,
          size: 'standard',
          kind: 'note',
          title: label,
          subtitle: '',
          url: '',
          mediaUrl: '',
        });
      });
    }
    if (!hasGrid) {
      MIDNIGHT_GRID_ITEMS.forEach((item, index) => {
        defaults.push({
          id: `${MIDNIGHT_GRID_PREFIX}${index}`,
          size: midnightTypeToSize(item.type),
          kind: 'image',
          title: item.title,
          subtitle: encodeMidnightGridSubtitle(item.category || 'ALL', item.subtitle, Boolean(item.live)),
          url: item.videoUrl,
          mediaUrl: item.thumbnail || '',
        });
      });
    }
    if (!hasFooterMeta) {
      defaults.push({
        id: MIDNIGHT_FOOTER_META_ID,
        size: 'full',
        kind: 'note',
        title: MIDNIGHT_FOOTER_DEFAULTS.headline,
        subtitle: `${MIDNIGHT_FOOTER_DEFAULTS.subheadline}||${MIDNIGHT_FOOTER_DEFAULTS.tagline}`,
        url: '',
        mediaUrl: '',
      });
    }
    if (!hasFooterSocial) {
      MIDNIGHT_FOOTER_DEFAULTS.socials.forEach((social, index) => {
        defaults.push({
          id: `${MIDNIGHT_FOOTER_SOCIAL_PREFIX}${index}`,
          size: 'standard',
          kind: 'link',
          title: social.label,
          subtitle: '',
          url: social.href,
          mediaUrl: '',
        });
      });
    }
    if (defaults.length > 0) {
      setThemeContainers((prev) => ({
        ...prev,
        [MIDNIGHT_THEME_ID]: [...(prev[MIDNIGHT_THEME_ID] ?? []), ...defaults],
      }));
    }
    didSeedMidnightMetaRef.current = true;
  }, [effectiveSlug, isMidnightThemeActive, midnightThemeContainers]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isContainerEditorOpen) {
          setIsContainerEditorOpen(false);
          setEditingContainer(null);
          return;
        }
        if (isMidnightGridModalOpen) {
          setIsMidnightGridModalOpen(false);
          return;
        }
        if (isAddContainerMenuOpen) {
          setIsAddContainerMenuOpen(false);
          return;
        }
        if (isCommandPaletteOpen) {
          setIsCommandPaletteOpen(false);
          return;
        }
        if (isHeaderNotificationsOpen) {
          setIsHeaderNotificationsOpen(false);
          return;
        }
        if (isSettingsOpen) {
          setIsSettingsOpen(false);
          return;
        }
        if (isDesktopPreviewOpen) {
          setIsDesktopPreviewOpen(false);
          return;
        }
        if (isPreviewOpen) {
          setIsPreviewOpen(false);
          return;
        }
        if (isProductsSheetOpen) {
          setIsProductsSheetOpen(false);
          return;
        }
        if (isTipJarModalOpen) {
          setIsTipJarModalOpen(false);
          return;
        }
        if (isBrandCollabsModalOpen) {
          setIsBrandCollabsModalOpen(false);
          return;
        }
        if (isProductModalOpen) {
          setIsProductModalOpen(false);
          return;
        }
        if (isEditorOpen) {
          setIsEditorOpen(false);
          return;
        }
        if (isSidebarOpen) {
          setIsSidebarOpen(false);
          return;
        }
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    isCommandPaletteOpen,
    isHeaderNotificationsOpen,
    isDesktopPreviewOpen,
    isEditorOpen,
    isPreviewOpen,
    isBrandCollabsModalOpen,
    isProductModalOpen,
    isProductsSheetOpen,
    isMidnightGridModalOpen,
    isContainerEditorOpen,
    isAddContainerMenuOpen,
    isSettingsOpen,
    isSidebarOpen,
    isTipJarModalOpen,
    onClose,
  ]);

  useEffect(() => {
    if (!isHeaderNotificationsOpen) {
      return;
    }

    const onPointerDown = (event: MouseEvent) => {
      const root = headerNotificationsRef.current;
      if (!root) {
        return;
      }
      if (event.target instanceof Node && !root.contains(event.target)) {
        setIsHeaderNotificationsOpen(false);
      }
    };

    window.addEventListener('mousedown', onPointerDown);
    return () => window.removeEventListener('mousedown', onPointerDown);
  }, [isHeaderNotificationsOpen]);

  const buildThemeSyncedLinks = (themeId: string): DashboardLink[] => {
    const nextByKey = buildPreviewLinksRecordFromDashboardLinks(links, effectiveLiveUrl);

    const preset = getThemePresetItemsById(themeId);

    return preset.map((item, index) => ({
      id: `${themeId}-${item.key}-${index}`,
      title: item.title,
      url: nextByKey[item.key] ?? item.fallbackUrl ?? nextByKey.website ?? effectiveLiveUrl,
      clicks: clickPresets[index % clickPresets.length],
    }));
  };

  const handleThemeChange = (theme: CanvasTheme) => {
    setIsRebooting(true);
    setSelectedThemeId(theme.id);
    setLinks(buildThemeSyncedLinks(theme.id));
    setOverrides((prev) => ({ ...prev, accentColor: resolveAccentColor(theme.accent) }));
    window.setTimeout(() => setIsRebooting(false), 450);
  };

  useEffect(() => {
    setLinks(buildThemeSyncedLinks(selectedThemeId || onboarding.selectedTheme));
  }, []);

  useEffect(() => {
    setIsAddContainerMenuOpen(false);
  }, [activePreviewThemeId, activeTab]);

  const updateOverride = <K extends keyof ThemeOverrides>(key: K, value: ThemeOverrides[K]) => {
    setOverrides((prev) => ({ ...prev, [key]: value }));
  };

  const setStreamBadge = (streamId: MonetizeStream['id'], badge?: string) => {
    setMonetizeStreams((prev) =>
      prev.map((stream) => (stream.id === streamId ? { ...stream, badge } : stream)),
    );
  };

  const handleToggleTipJar = () => {
    setMonetization((prev) => {
      const nextEnabled = !prev.tipJarEnabled;
      setStreamBadge(2, nextEnabled ? 'ON' : 'OFF');
      setMonetizeNotice(nextEnabled ? 'Tip Jar activated for fans.' : 'Tip Jar paused.');
      return {
        ...prev,
        tipJarEnabled: nextEnabled,
        tipJarUrl: prev.tipJarUrl || tipJarDraftUrl || DEFAULT_TIP_JAR_URL,
      };
    });
  };

  const handleMonetizeStreamAction = (streamId: MonetizeStream['id']) => {
    if (streamId === 1) {
      openProductEditor();
      return;
    }

    if (streamId === 2) {
      setTipJarDraftUrl(monetization.tipJarUrl || DEFAULT_TIP_JAR_URL);
      setIsTipJarModalOpen(true);
      return;
    }

    if (streamId === 3) {
      setIsBrandCollabsModalOpen(true);
      return;
    }

    onNavigateMainTab?.('Marketplace');
    setMonetizeNotice('Opening Marketplace to manage affiliate tools.');
  };

  const handleWithdrawFunds = () => {
    setMonetizeNotice('Withdrawals are enabled. Connect payout destination to go live.');
  };

  const resetProductForm = () => {
    setProductForm({
      title: '',
      description: '',
      category: 'digital',
      priceUsd: '',
      url: '',
    });
    setEditingProductId(null);
  };

  const openProductEditor = (product?: CanvasDigitalProduct) => {
    if (!product) {
      resetProductForm();
      setIsProductModalOpen(true);
      return;
    }
    setEditingProductId(product.id);
    setProductForm({
      title: product.title,
      description: product.description ?? '',
      category: product.category,
      priceUsd: product.priceUsd.toFixed(2),
      url: product.url,
    });
    setIsProductModalOpen(true);
  };

  const addProduct = () => {
    const title = productForm.title.trim();
    const url = productForm.url.trim();
    const price = Number(productForm.priceUsd);

    if (!title || !url || !Number.isFinite(price) || price < 0) {
      setMonetizeNotice('Complete all product fields with a valid price and URL.');
      return;
    }

    const nextProduct: CanvasDigitalProduct = {
      id: editingProductId || `${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
      title,
      description: productForm.description.trim(),
      category: productForm.category,
      priceUsd: Math.round(price * 100) / 100,
      url,
    };

    setMonetization((prev) => {
      const index = prev.products.findIndex((item) => item.id === nextProduct.id);
      if (index < 0) {
        return { ...prev, products: [nextProduct, ...prev.products] };
      }
      return {
        ...prev,
        products: prev.products.map((item, i) => (i === index ? nextProduct : item)),
      };
    });
    const action = editingProductId ? 'updated' : 'added';
    setMonetizeNotice(`Product "${nextProduct.title}" ${action} in Digital Drops.`);
    setIsProductModalOpen(false);
    resetProductForm();
  };

  const removeProduct = (productId: string) => {
    setMonetization((prev) => ({ ...prev, products: prev.products.filter((item) => item.id !== productId) }));
    setMonetizeNotice('Product removed.');
  };

  const moveProduct = (productId: string, direction: -1 | 1) => {
    setMonetization((prev) => {
      const index = prev.products.findIndex((item) => item.id === productId);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= prev.products.length) {
        return prev;
      }
      const next = [...prev.products];
      const [picked] = next.splice(index, 1);
      next.splice(target, 0, picked);
      return {
        ...prev,
        products: next,
      };
    });
  };

  const saveTipJarSettings = () => {
    const nextUrl = tipJarDraftUrl.trim();
    if (!nextUrl) {
      setMonetizeNotice('Add a Tip Jar URL to continue.');
      return;
    }
    setMonetization((prev) => ({
      ...prev,
      tipJarEnabled: true,
      tipJarUrl: nextUrl,
    }));
    setStreamBadge(2, 'ON');
    setIsTipJarModalOpen(false);
    setMonetizeNotice('Tip Jar settings saved.');
  };

  const resetBrandCollabForm = () => {
    setBrandCollabForm({
      brand: '',
      campaign: '',
      contactEmail: '',
      budgetUsd: '',
      timeline: '',
      deliverables: '',
      notes: '',
    });
  };

  const addBrandCollabDeal = () => {
    const brand = brandCollabForm.brand.trim();
    const campaign = brandCollabForm.campaign.trim();
    const contactEmail = brandCollabForm.contactEmail.trim();
    const budgetUsd = Number(brandCollabForm.budgetUsd);

    if (!brand || !campaign || !contactEmail || !Number.isFinite(budgetUsd) || budgetUsd <= 0) {
      setMonetizeNotice('Add brand, campaign, contact email, and valid budget to create a collab request.');
      return;
    }
    if (budgetUsd < (monetization.brandCollabs?.minBudgetUsd ?? 0)) {
      setMonetizeNotice(`Budget is below your minimum threshold of $${(monetization.brandCollabs?.minBudgetUsd ?? 0).toFixed(0)}.`);
      return;
    }

    const nextDeal: BrandCollabDeal = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
      brand,
      campaign,
      contactEmail,
      budgetUsd: Math.round(budgetUsd * 100) / 100,
      timeline: brandCollabForm.timeline.trim(),
      deliverables: brandCollabForm.deliverables.trim(),
      notes: brandCollabForm.notes.trim(),
      status: 'new',
      submittedAt: new Date().toISOString(),
    };

    setMonetization((prev) => ({
      ...prev,
      brandCollabs: {
        enabled: prev.brandCollabs?.enabled ?? true,
        contactEmail: prev.brandCollabs?.contactEmail || DEFAULT_BRAND_COLLAB_EMAIL,
        rateCardUrl: prev.brandCollabs?.rateCardUrl || '',
        minBudgetUsd: prev.brandCollabs?.minBudgetUsd ?? 500,
        inbox: [nextDeal, ...(prev.brandCollabs?.inbox ?? [])],
      },
    }));
    setMonetizeNotice(`Collab request from ${nextDeal.brand} added to the pipeline.`);
    resetBrandCollabForm();
  };

  const updateBrandCollabStatus = (dealId: string, status: BrandCollabDealStatus) => {
    let updatedBrand = '';
    setMonetization((prev) => ({
      ...prev,
      brandCollabs: {
        enabled: prev.brandCollabs?.enabled ?? true,
        contactEmail: prev.brandCollabs?.contactEmail || DEFAULT_BRAND_COLLAB_EMAIL,
        rateCardUrl: prev.brandCollabs?.rateCardUrl || '',
        minBudgetUsd: prev.brandCollabs?.minBudgetUsd ?? 500,
        inbox: (prev.brandCollabs?.inbox ?? []).map((deal) => {
          if (deal.id !== dealId) {
            return deal;
          }
          updatedBrand = deal.brand;
          return { ...deal, status };
        }),
      },
    }));

    if (updatedBrand) {
      setMonetizeNotice(`${updatedBrand} deal marked as ${BRAND_COLLAB_STATUS_LABELS[status]}.`);
    }
  };

  const toggleBrandCollabsEnabled = () => {
    const nextEnabled = !(monetization.brandCollabs?.enabled ?? true);
    setMonetization((prev) => ({
      ...prev,
      brandCollabs: {
        enabled: nextEnabled,
        contactEmail: prev.brandCollabs?.contactEmail || DEFAULT_BRAND_COLLAB_EMAIL,
        rateCardUrl: prev.brandCollabs?.rateCardUrl || '',
        minBudgetUsd: prev.brandCollabs?.minBudgetUsd ?? 500,
        inbox: prev.brandCollabs?.inbox ?? [],
      },
    }));
    setMonetizeNotice(nextEnabled
      ? 'Brand Collabs is now accepting inbound sponsorship requests.'
      : 'Brand Collabs paused for your canvas.');
  };

  const saveBrandCollabSettings = () => {
    const nextEmail = (monetization.brandCollabs?.contactEmail || '').trim();
    if (!nextEmail) {
      setMonetizeNotice('Add a contact email so brands know where to reach you.');
      return;
    }
    setIsBrandCollabsModalOpen(false);
    setMonetizeNotice('Brand Collabs settings saved.');
  };

  const openSettings = () => {
    setSettingsDraft({
      name: workspaceProfile.name,
      bio: workspaceProfile.bio,
      avatar: workspaceProfile.avatar,
      slug: effectiveSlug,
    });
    setIsSettingsOpen(true);
  };

  const saveWorkspaceSettings = async () => {
    const nextName = settingsDraft.name.trim();
    const nextSlug = sanitizeLiveSlug(settingsDraft.slug || effectiveSlug);

    if (!nextName) {
      setDashboardNotice('Display name is required.');
      return;
    }
    if (!nextSlug) {
      setDashboardNotice('Choose a valid URL slug.');
      return;
    }

    const nextProfile = {
      name: nextName,
      bio: settingsDraft.bio.trim(),
      avatar: settingsDraft.avatar.trim(),
    };

    setIsSavingSettings(true);
    try {
      const nextPublish = await saveCanvasOnboarding({
        claimedName: onboarding.claimedName,
        vanitySlug: nextSlug,
        profile: nextProfile,
        selectedTheme: selectedThemeId ?? onboarding.selectedTheme,
        selectedTemplateId: onboarding.selectedTemplateId,
        selectedSignals: onboarding.selectedSignals,
        links: previewLinksRecord,
        linkItems: serializedLinkItems,
        themeContainers: serializedThemeContainers,
        monetization,
        layout: layoutSchema,
      });
      setWorkspaceProfile(nextProfile);
      setWorkspaceSlug(sanitizeLiveSlug(nextPublish.slug || nextSlug) || nextSlug);
      setIsSettingsOpen(false);
      setDashboardNotice('Settings saved and synced across your themes.');
    } catch {
      setDashboardNotice('Could not save settings right now.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleExportAudience = () => {
    const rows = [
      ['name', 'email', 'source', 'ltv'],
      ...filteredSubscribers.map((item) => [item.name, item.email, item.source, item.ltv]),
    ];
    const csv = rows
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${effectiveSlug}-audience.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setDashboardNotice('Audience export downloaded.');
  };

  const handleSendAudienceBlast = () => {
    setDashboardNotice(`Blast queued for ${filteredSubscribers.length} contacts.`);
  };

  const getContainerToneClass = (themeId: string): string => {
    const family = themeId.startsWith('collection-') ? 'collection' : getThemePreviewFamily(themeId);
    if (family === 'glass') return 'bg-white/[0.08] border-white/25 backdrop-blur-xl';
    if (family === 'aurora') return 'bg-gradient-to-br from-cyan-500/20 via-indigo-500/18 to-fuchsia-500/18 border-cyan-200/30 backdrop-blur-xl';
    if (family === 'creator') return 'bg-[#f3e9d8]/90 border-[#2f281d]/25 text-[#1f1912]';
    if (family === 'editorial') return 'bg-black/78 border-white/25';
    if (family === 'collection') return 'bg-[#0d1021]/75 border-cyan-300/25';
    return 'bg-[#0b1326]/75 border-indigo-300/25';
  };

  const updateActiveThemeContainers = (
    updater: (prev: CanvasThemeContainer[]) => CanvasThemeContainer[],
  ) => {
    setThemeContainers((prev) => {
      const key = activePreviewThemeId;
      const next = updater(prev[key] ?? []);
      if (next.length === 0) {
        const { [key]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [key]: next };
    });
  };

  const updateCreatorHubThemeContainers = (
    updater: (prev: CanvasThemeContainer[]) => CanvasThemeContainer[],
  ) => {
    setThemeContainers((prev) => {
      const next = updater(prev[CREATOR_HUB_THEME_ID] ?? []);
      if (next.length === 0) {
        const { [CREATOR_HUB_THEME_ID]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [CREATOR_HUB_THEME_ID]: next };
    });
  };

  const updateMidnightThemeContainers = (
    updater: (prev: CanvasThemeContainer[]) => CanvasThemeContainer[],
  ) => {
    setThemeContainers((prev) => {
      const next = updater(prev[MIDNIGHT_THEME_ID] ?? []);
      if (next.length === 0) {
        const { [MIDNIGHT_THEME_ID]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [MIDNIGHT_THEME_ID]: next };
    });
  };

  const setCreatorHubSectionVisible = (sectionKey: CreatorHubSectionKey, visible: boolean) => {
    const config = CREATOR_HUB_SECTION_CONFIG.find((item) => item.key === sectionKey);
    if (!config) {
      return;
    }
    setLayoutSchema((prev) => {
      const ensured = ensureCreatorHubLayoutSchema(prev);
      const nextBlocks = ensured.blocks.map((block) =>
        block.id === config.blockId
          ? { ...block, visible }
          : block,
      );
      return {
        ...ensured,
        updatedAt: new Date().toISOString(),
        blocks: nextBlocks,
      };
    });
  };

  const moveCreatorHubSection = (sectionKey: CreatorHubSectionKey, direction: -1 | 1) => {
    setLayoutSchema((prev) => {
      const ensured = ensureCreatorHubLayoutSchema(prev);
      const sorted = [...ensured.blocks].sort((a, b) => a.position - b.position);
      const sectionBlocks = CREATOR_HUB_SECTION_CONFIG
        .map((config) => sorted.find((block) => block.id === config.blockId))
        .filter((block): block is CanvasLayoutSchema['blocks'][number] => Boolean(block));
      const index = sectionBlocks.findIndex((block) =>
        CREATOR_HUB_SECTION_CONFIG.some((cfg) => cfg.key === sectionKey && cfg.blockId === block.id),
      );
      const target = index + direction;
      if (index < 0 || target < 0 || target >= sectionBlocks.length) {
        return ensured;
      }
      const moved = [...sectionBlocks];
      const [picked] = moved.splice(index, 1);
      moved.splice(target, 0, picked);

      const basePosition = Math.min(...sectionBlocks.map((item) => item.position));
      const reassigned = new Map<string, number>();
      moved.forEach((item, idx) => {
        reassigned.set(item.id, basePosition + idx);
      });

      const nextBlocks = ensured.blocks.map((block) =>
        reassigned.has(block.id)
          ? { ...block, position: reassigned.get(block.id)! }
          : block,
      );

      return {
        ...ensured,
        updatedAt: new Date().toISOString(),
        blocks: [...nextBlocks].sort((a, b) => a.position - b.position).map((block, idx) => ({
          ...block,
          position: idx,
        })),
      };
    });
  };

  const setMidnightSectionVisible = (sectionKey: MidnightSectionKey, visible: boolean) => {
    const config = MIDNIGHT_SECTION_CONFIG.find((item) => item.key === sectionKey);
    if (!config) {
      return;
    }
    setLayoutSchema((prev) => {
      const ensured = ensureMidnightLayoutSchema(prev);
      const nextBlocks = ensured.blocks.map((block) =>
        block.id === config.blockId
          ? { ...block, visible }
          : block,
      );
      return {
        ...ensured,
        updatedAt: new Date().toISOString(),
        blocks: nextBlocks,
      };
    });
  };

  const moveMidnightSection = (sectionKey: MidnightSectionKey, direction: -1 | 1) => {
    setLayoutSchema((prev) => {
      const ensured = ensureMidnightLayoutSchema(prev);
      const sorted = [...ensured.blocks].sort((a, b) => a.position - b.position);
      const sectionBlocks = MIDNIGHT_SECTION_CONFIG
        .map((config) => sorted.find((block) => block.id === config.blockId))
        .filter((block): block is CanvasLayoutSchema['blocks'][number] => Boolean(block));
      const index = sectionBlocks.findIndex((block) =>
        MIDNIGHT_SECTION_CONFIG.some((cfg) => cfg.key === sectionKey && cfg.blockId === block.id),
      );
      const target = index + direction;
      if (index < 0 || target < 0 || target >= sectionBlocks.length) {
        return ensured;
      }
      const moved = [...sectionBlocks];
      const [picked] = moved.splice(index, 1);
      moved.splice(target, 0, picked);

      const basePosition = Math.min(...sectionBlocks.map((item) => item.position));
      const reassigned = new Map<string, number>();
      moved.forEach((item, idx) => {
        reassigned.set(item.id, basePosition + idx);
      });

      const nextBlocks = ensured.blocks.map((block) =>
        reassigned.has(block.id)
          ? { ...block, position: reassigned.get(block.id)! }
          : block,
      );

      return {
        ...ensured,
        updatedAt: new Date().toISOString(),
        blocks: [...nextBlocks].sort((a, b) => a.position - b.position).map((block, idx) => ({
          ...block,
          position: idx,
        })),
      };
    });
  };

  const moveCreatorHubContainer = (containerId: string, direction: -1 | 1, prefix: string) => {
    updateCreatorHubThemeContainers((prev) => {
      const ids = prev.filter((item) => item.id.startsWith(prefix)).map((item) => item.id);
      const index = ids.findIndex((id) => id === containerId);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= ids.length) {
        return prev;
      }
      const ordered = [...ids];
      const [picked] = ordered.splice(index, 1);
      ordered.splice(target, 0, picked);
      const orderMap = new Map(ordered.map((id, idx) => [id, idx]));
      const scoped = prev.filter((item) => item.id.startsWith(prefix));
      const rest = prev.filter((item) => !item.id.startsWith(prefix));
      const reorderedScoped = [...scoped].sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));
      return [...rest, ...reorderedScoped];
    });
  };

  const moveMidnightContainer = (containerId: string, direction: -1 | 1, prefix: string) => {
    updateMidnightThemeContainers((prev) => {
      const ids = prev.filter((item) => item.id.startsWith(prefix)).map((item) => item.id);
      const index = ids.findIndex((id) => id === containerId);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= ids.length) {
        return prev;
      }
      const ordered = [...ids];
      const [picked] = ordered.splice(index, 1);
      ordered.splice(target, 0, picked);
      const orderMap = new Map(ordered.map((id, idx) => [id, idx]));
      const scoped = prev.filter((item) => item.id.startsWith(prefix));
      const rest = prev.filter((item) => !item.id.startsWith(prefix));
      const reorderedScoped = [...scoped].sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));
      return [...rest, ...reorderedScoped];
    });
  };

  const updateMidnightHeroMeta = (next: {
    name?: string;
    handle?: string;
    bio?: string;
    verified?: boolean;
    avatar?: string;
  }) => {
    const nextName = next.name ?? midnightHeroMeta.name;
    const nextHandle = next.handle ?? midnightHeroMeta.handle;
    const nextBio = next.bio ?? midnightHeroMeta.bio;
    const nextVerified = next.verified ?? midnightHeroMeta.verified;
    const nextAvatar = next.avatar ?? midnightHeroMeta.avatar;

    updateMidnightThemeContainers((prev) => {
      const rest = prev.filter((item) => item.id !== MIDNIGHT_HERO_META_ID);
      const hero: CanvasThemeContainer = {
        id: MIDNIGHT_HERO_META_ID,
        size: 'profile',
        kind: 'note',
        title: nextName,
        subtitle: encodeMidnightHeroSubtitle(nextBio, nextVerified),
        url: nextHandle,
        mediaUrl: nextAvatar,
      };
      return [...rest, hero];
    });
  };

  const addMidnightNavTab = () => {
    const nextContainer: CanvasThemeContainer = {
      id: `${MIDNIGHT_NAV_PREFIX}${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
      size: 'standard',
      kind: 'note',
      title: 'NEW TAB',
      subtitle: '',
      url: '',
      mediaUrl: '',
    };
    updateMidnightThemeContainers((prev) => [...prev, nextContainer]);
  };

  const addMidnightGridTile = () => {
    setMidnightGridForm({
      title: '',
      category: 'ALL',
      subtitle: '',
      type: 'square',
      live: false,
      videoUrl: '',
      thumbnailUrl: '',
    });
    setIsMidnightGridModalOpen(true);
  };

  const editMidnightGridTile = (container: CanvasThemeContainer) => {
    const decoded = decodeMidnightGridSubtitle(container.subtitle);
    setMidnightGridForm({
      id: container.id,
      title: container.title,
      category: decoded.category,
      subtitle: decoded.subtitle,
      type: midnightSizeToType(container.size),
      live: decoded.live,
      videoUrl: container.url ?? '',
      thumbnailUrl: container.mediaUrl ?? '',
    });
    setIsMidnightGridModalOpen(true);
  };

  const saveMidnightGridTile = () => {
    const title = midnightGridForm.title.trim();
    const videoUrl = midnightGridForm.videoUrl.trim();
    if (!title || !videoUrl) {
      setDashboardNotice('Grid tile title and video URL are required.');
      return;
    }
    const id = midnightGridForm.id ?? `${MIDNIGHT_GRID_PREFIX}${Date.now()}-${Math.random().toString(16).slice(2, 6)}`;
    const nextTile: CanvasThemeContainer = {
      id,
      size: midnightTypeToSize(midnightGridForm.type),
      kind: 'image',
      title,
      subtitle: encodeMidnightGridSubtitle(midnightGridForm.category, midnightGridForm.subtitle, midnightGridForm.live),
      url: videoUrl,
      mediaUrl: midnightGridForm.thumbnailUrl.trim() || undefined,
    };
    updateMidnightThemeContainers((prev) => {
      const index = prev.findIndex((item) => item.id === id);
      if (index < 0) {
        return [...prev, nextTile];
      }
      return prev.map((item, i) => (i === index ? nextTile : item));
    });
    setIsMidnightGridModalOpen(false);
    setMidnightGridForm({
      title: '',
      category: 'ALL',
      subtitle: '',
      type: 'square',
      live: false,
      videoUrl: '',
      thumbnailUrl: '',
    });
  };

  const removeMidnightGridTile = (id: string) => {
    updateMidnightThemeContainers((prev) => prev.filter((item) => item.id !== id));
  };

  const updateMidnightFooterMeta = (next: { headline?: string; subheadline?: string; tagline?: string }) => {
    const nextHeadline = next.headline ?? midnightFooterMeta.headline;
    const nextSubheadline = next.subheadline ?? midnightFooterMeta.subheadline;
    const nextTagline = next.tagline ?? midnightFooterMeta.tagline;
    updateMidnightThemeContainers((prev) => {
      const rest = prev.filter((item) => item.id !== MIDNIGHT_FOOTER_META_ID);
      const footerMeta: CanvasThemeContainer = {
        id: MIDNIGHT_FOOTER_META_ID,
        size: 'full',
        kind: 'note',
        title: nextHeadline,
        subtitle: `${nextSubheadline}||${nextTagline}`,
        url: '',
        mediaUrl: '',
      };
      return [...rest, footerMeta];
    });
  };

  const addMidnightFooterSocial = () => {
    const nextContainer: CanvasThemeContainer = {
      id: `${MIDNIGHT_FOOTER_SOCIAL_PREFIX}${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
      size: 'standard',
      kind: 'link',
      title: 'New Social',
      subtitle: '',
      url: 'https://',
      mediaUrl: '',
    };
    updateMidnightThemeContainers((prev) => [...prev, nextContainer]);
  };

  const addCreatorHubProofBadge = () => {
    const nextContainer: CanvasThemeContainer = {
      id: `${CREATOR_HUB_PROOF_PREFIX}${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
      size: 'standard',
      kind: 'note',
      title: 'Proof Badge',
      subtitle: 'Add proof copy',
      url: '',
      mediaUrl: '',
    };
    updateCreatorHubThemeContainers((prev) => [...prev, nextContainer]);
    openContainerEditor(nextContainer);
  };

  const addCreatorHubLogEntry = () => {
    const nextContainer: CanvasThemeContainer = {
      id: `${CREATOR_HUB_LOG_PREFIX}${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
      size: 'full',
      kind: 'note',
      title: 'Log Entry',
      subtitle: 'Today||Write your update here.',
      url: '',
      mediaUrl: '',
    };
    updateCreatorHubThemeContainers((prev) => [...prev, nextContainer]);
    openContainerEditor(nextContainer);
  };

  const editCreatorHubFeatured = () => {
    const existing = creatorHubFeaturedContainer;
    const draft: CanvasThemeContainer = existing ?? {
      id: CREATOR_HUB_FEATURED_CONTAINER_ID,
      size: 'full',
      kind: 'image',
      title: CREATOR_HUB_FEATURED_PRODUCT.title,
      subtitle: CREATOR_HUB_FEATURED_PRODUCT.description,
      url: effectiveLiveUrl,
      mediaUrl: CREATOR_HUB_FEATURED_PRODUCT.image,
    };
    if (!existing) {
      updateCreatorHubThemeContainers((prev) => [...prev, draft]);
    }
    openContainerEditor(draft);
  };

  const openContainerEditor = (container?: CanvasThemeContainer) => {
    const draft = container ?? {
      id: `container-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
      size: 'standard' as CanvasThemeContainerSize,
      kind: 'note' as CanvasThemeContainerKind,
      title: 'New Container',
      subtitle: '',
      url: '',
      mediaUrl: '',
    };
    setEditingContainer(draft);
    setContainerForm({
      title: draft.title,
      subtitle: draft.subtitle ?? '',
      url: draft.url ?? '',
      mediaUrl: draft.mediaUrl ?? '',
      size: draft.size,
      kind: draft.kind,
    });
    setIsContainerEditorOpen(true);
  };

  const saveContainerDraft = () => {
    if (!editingContainer) {
      return;
    }
    const title = containerForm.title.trim();
    if (!title) {
      setDashboardNotice('Container title is required.');
      return;
    }
    const nextContainer: CanvasThemeContainer = {
      id: editingContainer.id,
      size: containerForm.size,
      kind: containerForm.kind,
      title,
      subtitle: containerForm.subtitle.trim() || undefined,
      url: containerForm.url.trim() || undefined,
      mediaUrl: containerForm.mediaUrl.trim() || undefined,
    };

    updateActiveThemeContainers((prev) => {
      const index = prev.findIndex((item) => item.id === nextContainer.id);
      if (index < 0) {
        return [...prev, nextContainer];
      }
      return prev.map((item, i) => (i === index ? nextContainer : item));
    });

    setIsContainerEditorOpen(false);
    setEditingContainer(null);
    setDashboardNotice('Container updated.');
  };

  const removeContainer = (containerId: string) => {
    updateActiveThemeContainers((prev) => prev.filter((item) => item.id !== containerId));
    setDashboardNotice('Container removed.');
  };

  const addContainerFromPreset = (
    preset: { title: string; kind: CanvasThemeContainerKind; size: CanvasThemeContainerSize },
  ) => {
    setIsAddContainerMenuOpen(false);
    if (preset.kind === 'link') {
      openAddModal();
      return;
    }
    openContainerEditor({
      id: `container-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
      size: preset.size,
      kind: preset.kind,
      title: preset.title,
      subtitle: preset.kind === 'widget' ? 'Widget module' : '',
      url: '',
      mediaUrl: '',
    });
  };

  const openAddModal = () => {
    setEditingLink(null);
    setFormState({ title: '', url: '' });
    setIsEditorOpen(true);
  };

  const openEditModal = (link: DashboardLink) => {
    setEditingLink(link);
    setFormState({ title: link.title, url: link.url });
    setIsEditorOpen(true);
  };

  const saveLink = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formState.title.trim() || !formState.url.trim()) {
      return;
    }

    if (editingLink) {
      setLinks((prev) =>
        prev.map((item) =>
          item.id === editingLink.id
            ? { ...item, title: formState.title.trim(), url: formState.url.trim() }
            : item,
        ),
      );
    } else {
      setLinks((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${prev.length + 1}`,
          title: formState.title.trim(),
          url: formState.url.trim(),
          clicks: '0',
        },
      ]);
    }

    setIsEditorOpen(false);
  };

  const deleteLink = (id: string) => {
    setLinks((prev) => prev.filter((item) => item.id !== id));
  };

  const moveLinkToTarget = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) {
      return;
    }
    setLinks((prev) => {
      const sourceIndex = prev.findIndex((item) => item.id === sourceId);
      const targetIndex = prev.findIndex((item) => item.id === targetId);
      if (sourceIndex < 0 || targetIndex < 0) {
        return prev;
      }
      const next = [...prev];
      const [source] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, source);
      return next;
    });
  };

  const handleLinkDrop = (targetId: string) => {
    if (!draggingLinkId) {
      return;
    }
    moveLinkToTarget(draggingLinkId, targetId);
    setDraggingLinkId(null);
  };

  const renderThemeContainerBuilder = (mode: PreviewMode) => {
    if (activeTab !== 'canvas' && activeTab !== 'themes') {
      return null;
    }

    const compact = mode === 'mobile';
    const activeContainers = themeContainers[activePreviewThemeId] ?? [];
    const surfaceTone = getContainerToneClass(activePreviewThemeId);
    const linkContainerSource = links.map((link) => ({
      source: 'link' as const,
      id: `link-${link.id}`,
      size: 'standard' as CanvasThemeContainerSize,
      kind: 'link' as CanvasThemeContainerKind,
      title: link.title,
      subtitle: link.url,
      url: link.url,
      linkRef: link,
    }));
    const customContainerSource = activeContainers.map((container) => ({
      source: 'custom' as const,
      ...container,
    }));
    const allContainers = [...linkContainerSource, ...customContainerSource];
    const desktopSlots: Array<React.CSSProperties> = [
      { left: '52%', top: '58%', width: '18%', height: '16%' },
      { left: '72%', top: '58%', width: '18%', height: '16%' },
      { left: '52%', top: '76%', width: '38%', height: '14%' },
      { left: '31%', top: '76%', width: '18%', height: '14%' },
      { left: '10%', top: '76%', width: '18%', height: '14%' },
    ];
    const mobileSlots: Array<React.CSSProperties> = [
      { left: '7%', top: '63%', width: '40%', height: '11%' },
      { left: '53%', top: '63%', width: '40%', height: '11%' },
      { left: '7%', top: '76%', width: '86%', height: '10%' },
      { left: '7%', top: '88%', width: '40%', height: '9%' },
      { left: '53%', top: '88%', width: '40%', height: '9%' },
    ];
    const slotCatalog = compact ? mobileSlots : desktopSlots;
    const resolveSlotStyle = (index: number): React.CSSProperties => {
      if (index < slotCatalog.length) {
        return slotCatalog[index];
      }
      const overflow = index - slotCatalog.length;
      const colCount = compact ? 1 : 2;
      const col = overflow % colCount;
      const row = Math.floor(overflow / colCount);
      if (compact) {
        return {
          left: '7%',
          top: `${Math.min(88 + row * 11, 95)}%`,
          width: '86%',
          height: '9%',
        };
      }
      return {
        left: col === 0 ? '10%' : '52%',
        top: `${Math.min(76 + row * 15, 92)}%`,
        width: '38%',
        height: '13%',
      };
    };

    const visibleContainers = allContainers.slice(0, 10);
    if (visibleContainers.length === 0) {
      return null;
    }

    return (
      <div data-vj-ignore-edit className={`absolute z-[80] pointer-events-none inset-0 ${compact ? 'p-2' : 'p-4'}`}>
        {visibleContainers.map((container, index) => (
          <div
            key={container.id}
            style={resolveSlotStyle(index)}
            className={`absolute rounded-3xl border ${surfaceTone} p-3 backdrop-blur-xl transition-all`}
          >
            <div className="min-w-0">
              <p className={`font-bold text-white/95 truncate ${compact ? 'text-[10px]' : 'text-xs'}`}>{container.title}</p>
              {container.subtitle && (
                <p className={`mt-1 text-white/60 truncate ${compact ? 'text-[9px]' : 'text-[11px]'}`}>{container.subtitle}</p>
              )}
              {container.kind === 'image' && container.mediaUrl && !compact && (
                <img
                  src={container.mediaUrl}
                  alt={container.title}
                  className="mt-2 w-full h-14 rounded-xl object-cover border border-white/20"
                />
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderCanvasView = () => (
    <div className="space-y-8 md:space-y-12 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-black tracking-tighter">The Canvas</h2>
          <p className="text-white/40 mt-1 md:mt-2 text-base md:text-lg">Build your link architecture. Drag, drop, dominate.</p>
        </div>
        <button
          onClick={openAddModal}
          className="w-full md:w-auto flex items-center justify-center gap-3 bg-white text-black px-6 md:px-8 py-3 md:py-4 rounded-2xl font-black hover:bg-blue-400 transition-all shadow-xl shadow-white/5 text-sm md:text-base whitespace-nowrap"
        >
          <Plus className="w-5 h-5" />
          Add New Link
        </button>
      </header>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3">
        <p className="text-xs md:text-sm text-white/60">
          {isMidnightThemeActive
            ? 'Canvas is the source of truth for Midnight Zenith. Hero, tabs, grid, and footer blocks update the preview instantly.'
            : isCreatorHubThemeActive
              ? 'Canvas is the source of truth for Creator Hub. Edits here update the preview instantly on mobile and desktop.'
              : 'Canvas blocks are the source of truth for this theme. Add, edit, delete, reorder, and hide blocks here; preview updates instantly.'}
        </p>
      </div>

      <div className="space-y-4">
        {links.length > 0 ? (
          links.map((link, i) => (
            <motion.div
              key={link.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex flex-col sm:flex-row sm:items-center gap-4 md:gap-6 p-5 md:p-6 rounded-3xl bg-[#111] border border-white/5 hover:border-white/20 transition-all group"
              draggable
              onDragStart={() => setDraggingLinkId(link.id)}
              onDragEnd={() => setDraggingLinkId(null)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => handleLinkDrop(link.id)}
            >
              <div className="hidden sm:block cursor-grab active:cursor-grabbing text-white/20 hover:text-white transition-colors">
                <GripVertical className="w-5 h-5" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <h4 className="font-bold text-base md:text-lg truncate">{link.title}</h4>
                  <span className="px-2 py-0.5 rounded-md bg-white/5 text-[9px] uppercase font-black text-white/40 tracking-widest">Live</span>
                </div>
                <p className="text-white/30 text-xs mt-1 truncate">{link.url}</p>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-6 md:gap-12 pt-4 sm:pt-0 border-t sm:border-t-0 border-white/5 sm:border-none">
                <div className="text-left sm:text-center">
                  <p className="text-[10px] text-white/30 uppercase font-black tracking-widest mb-1">Clicks</p>
                  <p className="font-bold text-blue-400">{link.clicks}</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(link)}
                    className="p-2.5 md:p-3 rounded-xl bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                    aria-label={`Edit ${link.title}`}
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteLink(link.id)}
                    className="p-2.5 md:p-3 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-colors"
                    aria-label={`Delete ${link.title}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <button
            type="button"
            onClick={openAddModal}
            className="w-full border-2 border-dashed border-white/5 rounded-3xl p-10 flex flex-col items-center justify-center gap-4 group hover:border-white/10 transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/20 group-hover:text-white group-hover:bg-white/10 transition-all">
              <Plus className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-white/20 group-hover:text-white/60">Drop a new identity anchor here</p>
          </button>
        )}
      </div>

      {isCreatorHubThemeActive && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-5 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg md:text-xl font-bold">Creator Hub Sections</h3>
              <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">Theme-safe zones</span>
            </div>
            <div className="space-y-2">
              {creatorHubSectionBlocks.map((section, index) => (
                <div key={section.key} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-3 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{section.label}</p>
                    <p className="text-[11px] text-white/45">
                      {section.key === 'social_row'
                        ? (section.visible ? 'Visible in profile header zone' : 'Hidden from profile header zone')
                        : (section.visible ? 'Visible in preview' : 'Hidden from preview')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => moveCreatorHubSection(section.key, -1)}
                    disabled={section.key === 'social_row' || index === 0}
                    className="p-2 rounded-lg border border-white/10 text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30"
                    aria-label={`Move ${section.label} up`}
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveCreatorHubSection(section.key, 1)}
                    disabled={section.key === 'social_row' || index === creatorHubSectionBlocks.length - 1}
                    className="p-2 rounded-lg border border-white/10 text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30"
                    aria-label={`Move ${section.label} down`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreatorHubSectionVisible(section.key, !section.visible)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold ${
                      section.visible
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-white/10 text-white/60 border border-white/10'
                    }`}
                  >
                    {section.visible ? 'Shown' : 'Hidden'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-5 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg md:text-xl font-bold">Featured Release</h3>
                <p className="text-sm text-white/45 mt-1">Controls the featured card content in Creator Hub.</p>
              </div>
              <button
                type="button"
                onClick={editCreatorHubFeatured}
                className="px-4 py-2 rounded-xl bg-white text-black text-sm font-bold hover:bg-white/90"
              >
                Edit Featured
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-5 md:p-6 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg md:text-xl font-bold">Boutique Shelf</h3>
                <p className="text-sm text-white/45 mt-1">These items render in the product shelf.</p>
              </div>
              <button
                type="button"
                onClick={() => openProductEditor()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black text-sm font-bold hover:bg-white/90"
              >
                <Plus className="w-4 h-4" />
                Add Product
              </button>
            </div>
            {monetization.products.map((product, index) => (
              <div key={product.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-3 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{product.title}</p>
                  <p className="text-[11px] text-white/45 truncate">{product.url}</p>
                </div>
                <button
                  type="button"
                  onClick={() => moveProduct(product.id, -1)}
                  disabled={index === 0}
                  className="p-2 rounded-lg border border-white/10 text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => moveProduct(product.id, 1)}
                  disabled={index === monetization.products.length - 1}
                  className="p-2 rounded-lg border border-white/10 text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => openProductEditor(product)}
                  className="p-2 rounded-lg border border-white/10 text-white/70 hover:text-white hover:bg-white/10"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => removeProduct(product.id)}
                  className="p-2 rounded-lg border border-rose-400/30 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-5 md:p-6 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg md:text-xl font-bold">Trusted Proof Badges</h3>
                <p className="text-sm text-white/45 mt-1">Edit badge labels used in the trust section.</p>
              </div>
              <button
                type="button"
                onClick={addCreatorHubProofBadge}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black text-sm font-bold hover:bg-white/90"
              >
                <Plus className="w-4 h-4" />
                Add Badge
              </button>
            </div>
            {creatorHubProofContainers.map((item, index) => (
              <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-3 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{item.title}</p>
                </div>
                <button type="button" onClick={() => moveCreatorHubContainer(item.id, -1, CREATOR_HUB_PROOF_PREFIX)} disabled={index === 0} className="p-2 rounded-lg border border-white/10 text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30">
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => moveCreatorHubContainer(item.id, 1, CREATOR_HUB_PROOF_PREFIX)} disabled={index === creatorHubProofContainers.length - 1} className="p-2 rounded-lg border border-white/10 text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30">
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => openContainerEditor(item)} className="p-2 rounded-lg border border-white/10 text-white/70 hover:text-white hover:bg-white/10">
                  <Edit3 className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => updateCreatorHubThemeContainers((prev) => prev.filter((container) => container.id !== item.id))} className="p-2 rounded-lg border border-rose-400/30 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-5 md:p-6 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg md:text-xl font-bold">VibeJam Log Entries</h3>
                <p className="text-sm text-white/45 mt-1">Use subtitle format: <span className="text-white/70">Date||Description</span>.</p>
              </div>
              <button
                type="button"
                onClick={addCreatorHubLogEntry}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black text-sm font-bold hover:bg-white/90"
              >
                <Plus className="w-4 h-4" />
                Add Entry
              </button>
            </div>
            {creatorHubLogContainers.map((item, index) => (
              <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-3 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{item.title}</p>
                  <p className="text-[11px] text-white/45 truncate">{item.subtitle || 'Recent Update||Describe this update'}</p>
                </div>
                <button type="button" onClick={() => moveCreatorHubContainer(item.id, -1, CREATOR_HUB_LOG_PREFIX)} disabled={index === 0} className="p-2 rounded-lg border border-white/10 text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30">
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => moveCreatorHubContainer(item.id, 1, CREATOR_HUB_LOG_PREFIX)} disabled={index === creatorHubLogContainers.length - 1} className="p-2 rounded-lg border border-white/10 text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30">
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => openContainerEditor(item)} className="p-2 rounded-lg border border-white/10 text-white/70 hover:text-white hover:bg-white/10">
                  <Edit3 className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => updateCreatorHubThemeContainers((prev) => prev.filter((container) => container.id !== item.id))} className="p-2 rounded-lg border border-rose-400/30 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {isMidnightThemeActive && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-5 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg md:text-xl font-bold">Midnight Zenith Sections</h3>
              <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">Theme-safe zones</span>
            </div>
            <div className="space-y-2">
              {midnightSectionBlocks.map((section, index) => (
                <div key={section.key} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-3 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{section.label}</p>
                    <p className="text-[11px] text-white/45">{section.visible ? 'Visible in preview' : 'Hidden from preview'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => moveMidnightSection(section.key, -1)}
                    disabled={index === 0}
                    className="p-2 rounded-lg border border-white/10 text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30"
                    aria-label={`Move ${section.label} up`}
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveMidnightSection(section.key, 1)}
                    disabled={index === midnightSectionBlocks.length - 1}
                    className="p-2 rounded-lg border border-white/10 text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30"
                    aria-label={`Move ${section.label} down`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setMidnightSectionVisible(section.key, !section.visible)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold ${
                      section.visible
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-white/10 text-white/60 border border-white/10'
                    }`}
                  >
                    {section.visible ? 'Shown' : 'Hidden'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-5 md:p-6 space-y-4">
            <h3 className="text-lg md:text-xl font-bold">Hero Block</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="space-y-1">
                <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Display Name</span>
                <input
                  value={midnightHeroMeta.name}
                  onChange={(event) => updateMidnightHeroMeta({ name: event.target.value })}
                  className="w-full bg-[#111] border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-400/60"
                />
              </label>
              <label className="space-y-1">
                <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Handle</span>
                <input
                  value={midnightHeroMeta.handle}
                  onChange={(event) => updateMidnightHeroMeta({ handle: event.target.value })}
                  className="w-full bg-[#111] border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-400/60"
                />
              </label>
              <label className="space-y-1 md:col-span-2">
                <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Bio</span>
                <textarea
                  value={midnightHeroMeta.bio}
                  onChange={(event) => updateMidnightHeroMeta({ bio: event.target.value })}
                  className="w-full min-h-[84px] bg-[#111] border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-400/60"
                />
              </label>
              <label className="space-y-1 md:col-span-2">
                <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Avatar URL</span>
                <input
                  value={midnightHeroMeta.avatar}
                  onChange={(event) => updateMidnightHeroMeta({ avatar: event.target.value })}
                  className="w-full bg-[#111] border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-400/60"
                />
              </label>
            </div>
            <button
              type="button"
              onClick={() => updateMidnightHeroMeta({ verified: !midnightHeroMeta.verified })}
              className={`px-3 py-2 rounded-lg text-xs font-bold ${
                midnightHeroMeta.verified
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-white/10 text-white/60 border border-white/10'
              }`}
            >
              {midnightHeroMeta.verified ? 'Verified Badge: On' : 'Verified Badge: Off'}
            </button>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-5 md:p-6 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg md:text-xl font-bold">Nav Tabs Block</h3>
                <p className="text-sm text-white/45 mt-1">Add, rename, reorder, or remove tabs.</p>
              </div>
              <button
                type="button"
                onClick={addMidnightNavTab}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black text-sm font-bold hover:bg-white/90"
              >
                <Plus className="w-4 h-4" />
                Add Tab
              </button>
            </div>
            {midnightNavContainers.map((item, index) => (
              <div key={item.id} className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.02] px-3 py-3">
                <input
                  value={item.title}
                  onChange={(event) => updateMidnightThemeContainers((prev) => prev.map((container) => (
                    container.id === item.id ? { ...container, title: event.target.value } : container
                  )))}
                  className="flex-1 bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400/60"
                />
                <button type="button" onClick={() => moveMidnightContainer(item.id, -1, MIDNIGHT_NAV_PREFIX)} disabled={index === 0} className="p-2 rounded-lg border border-white/10 text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30">
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => moveMidnightContainer(item.id, 1, MIDNIGHT_NAV_PREFIX)} disabled={index === midnightNavContainers.length - 1} className="p-2 rounded-lg border border-white/10 text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30">
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => updateMidnightThemeContainers((prev) => prev.filter((container) => container.id !== item.id))} className="p-2 rounded-lg border border-rose-400/30 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-5 md:p-6 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg md:text-xl font-bold">Content Grid Block</h3>
                <p className="text-sm text-white/45 mt-1">Manage Midnight tiles and masonry order.</p>
              </div>
              <button
                type="button"
                onClick={addMidnightGridTile}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black text-sm font-bold hover:bg-white/90"
              >
                <Plus className="w-4 h-4" />
                Add Tile
              </button>
            </div>
            {midnightGridContainers.map((item, index) => {
              const decoded = decodeMidnightGridSubtitle(item.subtitle);
              return (
                <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-3 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{item.title}</p>
                    <p className="text-[11px] text-white/45 truncate">
                      {decoded.category} • {decoded.subtitle || 'No subtitle'}{decoded.live ? ' • LIVE' : ''}
                    </p>
                  </div>
                  <button type="button" onClick={() => moveMidnightContainer(item.id, -1, MIDNIGHT_GRID_PREFIX)} disabled={index === 0} className="p-2 rounded-lg border border-white/10 text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30">
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => moveMidnightContainer(item.id, 1, MIDNIGHT_GRID_PREFIX)} disabled={index === midnightGridContainers.length - 1} className="p-2 rounded-lg border border-white/10 text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30">
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => editMidnightGridTile(item)} className="p-2 rounded-lg border border-white/10 text-white/70 hover:text-white hover:bg-white/10">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => removeMidnightGridTile(item.id)} className="p-2 rounded-lg border border-rose-400/30 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-5 md:p-6 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg md:text-xl font-bold">Footer CTA Block</h3>
                <p className="text-sm text-white/45 mt-1">Edit footer text and social links.</p>
              </div>
              <button
                type="button"
                onClick={addMidnightFooterSocial}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black text-sm font-bold hover:bg-white/90"
              >
                <Plus className="w-4 h-4" />
                Add Social
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                value={midnightFooterMeta.headline}
                onChange={(event) => updateMidnightFooterMeta({ headline: event.target.value })}
                placeholder="Headline"
                className="bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400/60"
              />
              <input
                value={midnightFooterMeta.subheadline}
                onChange={(event) => updateMidnightFooterMeta({ subheadline: event.target.value })}
                placeholder="Subheadline"
                className="bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400/60"
              />
              <input
                value={midnightFooterMeta.tagline}
                onChange={(event) => updateMidnightFooterMeta({ tagline: event.target.value })}
                placeholder="Tagline"
                className="bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400/60"
              />
            </div>
            {midnightFooterSocialContainers.map((item, index) => (
              <div key={item.id} className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.02] px-3 py-3">
                <input
                  value={item.title}
                  onChange={(event) => updateMidnightThemeContainers((prev) => prev.map((container) => (
                    container.id === item.id ? { ...container, title: event.target.value } : container
                  )))}
                  className="sm:w-48 bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400/60"
                />
                <input
                  value={item.url ?? ''}
                  onChange={(event) => updateMidnightThemeContainers((prev) => prev.map((container) => (
                    container.id === item.id ? { ...container, url: event.target.value } : container
                  )))}
                  className="flex-1 bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400/60"
                />
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => moveMidnightContainer(item.id, -1, MIDNIGHT_FOOTER_SOCIAL_PREFIX)} disabled={index === 0} className="p-2 rounded-lg border border-white/10 text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30">
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => moveMidnightContainer(item.id, 1, MIDNIGHT_FOOTER_SOCIAL_PREFIX)} disabled={index === midnightFooterSocialContainers.length - 1} className="p-2 rounded-lg border border-white/10 text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30">
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => updateMidnightThemeContainers((prev) => prev.filter((container) => container.id !== item.id))} className="p-2 rounded-lg border border-rose-400/30 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderThemeStudio = () => (
    <div className="space-y-8 md:space-y-12 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-black tracking-tighter">The Design Studio</h2>
          <p className="text-white/40 mt-1 md:mt-2 text-base md:text-lg">Select and refine your visual identity.</p>
        </div>
        <button
          onClick={() => setIsTuning((current) => !current)}
          className={`flex items-center justify-center gap-2 px-6 py-3 rounded-full border transition-all font-bold text-sm ${
            isTuning ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'bg-transparent border-white/10 text-white hover:bg-white/5'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Fine Tune
        </button>
      </header>
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3">
        <p className="text-xs text-white/55">
          Theme previews are read-only. Edit, add, delete, and reorder content from Canvas only.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3">
        <p className="text-xs md:text-sm text-white/60">
          Theme tabs and link modules are auto-populated in Canvas per selected theme, then fully editable from this panel.
        </p>
      </div>

      <AnimatePresence>
        {isTuning && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-[#0A0A0A] border border-white/5 rounded-3xl"
          >
            <div className="p-6 md:p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-white/40 text-[10px] uppercase tracking-widest font-bold">
                  <Palette className="w-3 h-3" />
                  Primary Accent
                </div>
                <div className="flex flex-wrap gap-3">
                  {['#4ade80', '#a855f7', '#38bdf8', '#fb7185', '#f59e0b', '#ffffff'].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => updateOverride('accentColor', color)}
                      className={`w-8 h-8 rounded-full cursor-pointer transition-transform hover:scale-125 border-2 ${overrides.accentColor === color ? 'border-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'border-transparent'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-white/40 text-[10px] uppercase tracking-widest font-bold">
                  <Type className="w-3 h-3" />
                  Typography
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => updateOverride('fontFamily', 'Inter')}
                    className={`p-2 rounded-lg text-xs font-medium transition-all border ${overrides.fontFamily === 'Inter' ? 'bg-white text-black border-white' : 'bg-[#111] text-white/60 border-white/5 hover:border-white/20'}`}
                  >
                    Inter
                  </button>
                  <button
                    type="button"
                    onClick={() => updateOverride('fontFamily', 'JetBrains Mono')}
                    className={`p-2 rounded-lg text-xs font-medium transition-all border ${overrides.fontFamily === 'JetBrains Mono' ? 'bg-white text-black border-white' : 'bg-[#111] text-white/60 border-white/5 hover:border-white/20'}`}
                  >
                    Mono
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-white/40 text-[10px] uppercase tracking-widest font-bold">
                  <Box className="w-3 h-3" />
                  Corner Radius: <span className="text-white">{overrides.cornerRadius}px</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={40}
                  step={2}
                  value={overrides.cornerRadius}
                  onChange={(event) => updateOverride('cornerRadius', Number(event.target.value))}
                  className="w-full h-1.5 bg-white/10 rounded-full appearance-none accent-purple-500 cursor-pointer"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-white/40 text-[10px] uppercase tracking-widest font-bold">
                  <Zap className="w-3 h-3" />
                  Bouncy Mode
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => updateOverride('bouncyMode', !overrides.bouncyMode)}
                    className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${overrides.bouncyMode ? 'bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.5)]' : 'bg-white/10'}`}
                  >
                    <motion.div
                      animate={{ x: overrides.bouncyMode ? 24 : 4 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className="absolute top-1 w-4 h-4 bg-white rounded-full"
                    />
                  </button>
                  <span className="text-xs text-white/60">{overrides.bouncyMode ? 'Active' : 'Disabled'}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {availableStudioThemes.map((theme) => {
          const isSelected = selectedThemeId === theme.id;
          return (
            <motion.button
              key={theme.id}
              type="button"
              whileHover={{ y: overrides.bouncyMode ? -10 : -4 }}
              whileTap={{ scale: overrides.bouncyMode ? 0.985 : 0.995 }}
              onClick={() => handleThemeChange(theme)}
              className={`group relative aspect-[3/4] rounded-[2.5rem] border-2 transition-all cursor-pointer overflow-hidden text-left ${isSelected ? 'border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.15)]' : 'border-white/5 hover:border-white/20'}`}
              style={{
                borderRadius: `${overrides.cornerRadius + 20}px`,
                boxShadow: isSelected ? `0 0 0 1px ${accentRingStrong}, 0 0 26px ${accentRingSoft}` : undefined,
              }}
            >
              {renderThemeCardThumbnail(theme)}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/5 group-hover:via-black/45 transition-all duration-500" />

              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <h3 className="text-xl md:text-2xl font-black truncate pr-2">{theme.name}</h3>
                  {isSelected && (
                    <div className="p-2 rounded-full flex-shrink-0" style={{ backgroundColor: overrides.accentColor }}>
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                <p className="text-white/60 text-xs md:text-sm leading-relaxed mb-4 md:mb-6 line-clamp-2">{theme.desc}</p>
                <div className="flex gap-2">
                  <div className="px-3 py-1 rounded-full bg-white/10 text-[10px] uppercase font-bold tracking-widest">Minimal</div>
                  <div className="px-3 py-1 rounded-full bg-white/10 text-[10px] uppercase font-bold tracking-widest">OLED</div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );

  const renderMonetizeView = () => {
    const revenueLabel = formatUsd(monetizeRevenue);
    const [revenueWhole, revenueCents = '00'] = revenueLabel.split('.');
    const growthLabel = '+12% vs last';

    return (
      <div className="space-y-8 md:space-y-12 pb-20">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="text-sm font-bold text-emerald-500 uppercase tracking-widest mb-2 flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Monetization OS
            </h2>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter">
              {revenueWhole}
              <span className="text-white/20">.{revenueCents}</span>
            </h1>
            <p className="text-white/40 mt-3 md:mt-4 text-base md:text-lg">
              Total Revenue this month · <span className="text-emerald-500 font-bold">{growthLabel}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={handleWithdrawFunds}
            disabled={isPersistingMonetization}
            className={`w-full md:w-auto bg-white text-black font-black px-8 py-4 rounded-2xl transition-all shadow-[0_20px_40px_-10px_rgba(255,255,255,0.1)] text-sm md:text-base ${
              isPersistingMonetization ? 'opacity-70 cursor-not-allowed' : 'hover:bg-emerald-400'
            }`}
          >
            {isPersistingMonetization ? 'Syncing...' : 'Withdraw Funds'}
          </button>
        </header>

        {monetizeNotice && (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
            <p className="text-emerald-300 text-xs md:text-sm font-medium">{monetizeNotice}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          {monetizeStreams.map((stream) => (
            <motion.div
              key={stream.id}
              whileHover={{ scale: 1.01 }}
              className="p-6 md:p-8 rounded-3xl bg-[#111] border border-white/5 hover:border-white/10 hover:bg-[#161616] transition-all group relative overflow-hidden"
            >
              <div className="flex items-start justify-between mb-6 md:mb-8">
                <div className={`p-3 md:p-4 rounded-2xl ${stream.color}`}>
                  <stream.icon className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                {'badge' in stream && stream.badge && (
                  <span className={`px-2 md:px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    stream.id === 2
                      ? (monetization.tipJarEnabled ? 'bg-emerald-500/20 text-emerald-500' : 'bg-zinc-500/20 text-zinc-300')
                      : stream.id === 3
                        ? ((monetization.brandCollabs?.enabled ?? true) ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-500/20 text-zinc-300')
                      : 'bg-purple-500 text-white'
                  }`}>
                    {stream.badge}
                  </span>
                )}
              </div>

              <h3 className="text-xl md:text-2xl font-bold mb-2">{stream.title}</h3>
              <p className="text-white/40 text-sm mb-6 md:mb-10">{stream.desc}</p>

              <div className="flex items-center justify-between mt-auto">
                <button
                  type="button"
                  onClick={() => handleMonetizeStreamAction(stream.id)}
                  className="flex items-center gap-2 text-sm font-bold hover:text-white transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  {stream.action}
                </button>
                {'toggle' in stream && stream.toggle && (
                  <button
                    type="button"
                    onClick={handleToggleTipJar}
                    className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${
                      monetization.tipJarEnabled ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-zinc-700'
                    }`}
                  >
                    <motion.div
                      animate={{ x: monetization.tipJarEnabled ? 24 : 4 }}
                      transition={{ type: 'spring', stiffness: 460, damping: 30 }}
                      className="absolute top-1 w-4 h-4 bg-white rounded-full"
                    />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="rounded-3xl border border-white/5 bg-[#0A0A0A] p-5 md:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg md:text-xl font-bold">Digital Products</h3>
              <p className="text-white/40 text-sm">Files, presets, code, and digital goods listed across all themes.</p>
            </div>
            <button
              type="button"
              onClick={() => openProductEditor()}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white text-black text-sm font-bold hover:bg-white/90"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </button>
          </div>
          <div className="space-y-3">
            {monetization.products.length === 0 && (
              <p className="text-white/40 text-sm">No products yet. Add your first digital drop.</p>
            )}
            {monetization.products.map((product) => (
              <div key={product.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <div className="min-w-0">
                  <p className="font-bold text-white truncate">{product.title}</p>
                  <p className="text-xs text-white/40 truncate">{product.description || 'Digital product'}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="px-2 py-1 rounded-full bg-white/10 text-[10px] uppercase tracking-wider">{product.category}</span>
                    <span className="text-emerald-400 font-semibold text-sm">${product.priceUsd.toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openProductEditor(product)}
                    className="px-3 py-1.5 rounded-lg border border-white/10 text-xs font-bold hover:bg-white/10"
                  >
                    Edit
                  </button>
                  <a
                    href={product.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-2 rounded-lg bg-white text-black text-xs font-bold hover:bg-white/90"
                  >
                    Open
                  </a>
                  <button
                    type="button"
                    onClick={() => removeProduct(product.id)}
                    className="px-3 py-2 rounded-lg bg-rose-500/15 text-rose-300 text-xs font-bold hover:bg-rose-500/25"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/5 bg-[#0A0A0A] p-5 md:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg md:text-xl font-bold">Brand Collabs Pipeline</h3>
              <p className="text-white/40 text-sm">
                Triage inbound sponsor requests, qualify fit, and move the right deals to accepted.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsBrandCollabsModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white text-black text-sm font-bold hover:bg-white/90"
            >
              <Target className="w-4 h-4" />
              Manage Collabs
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <p className="text-[10px] uppercase tracking-widest text-white/35 font-bold">New Requests</p>
              <p className="text-2xl font-black mt-1">{newBrandCollabCount}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <p className="text-[10px] uppercase tracking-widest text-white/35 font-bold">Active Pipeline</p>
              <p className="text-2xl font-black mt-1">{activeBrandCollabCount}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <p className="text-[10px] uppercase tracking-widest text-white/35 font-bold">Pipeline Value</p>
              <p className="text-2xl font-black mt-1">{formatUsd(brandCollabPipelineValue)}</p>
            </div>
          </div>

          <div className="space-y-3">
            {brandCollabInbox.length === 0 && (
              <p className="text-white/40 text-sm">
                No collab requests yet. Enable Brand Collabs and add your first inbound request.
              </p>
            )}
            {brandCollabInbox.map((deal) => (
              <div key={deal.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <p className="font-bold text-white">{deal.brand}</p>
                    <p className="text-xs text-white/40">{deal.campaign}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-emerald-300">${deal.budgetUsd.toFixed(2)}</span>
                    <span className={`px-2 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider ${BRAND_COLLAB_STATUS_CLASSES[deal.status]}`}>
                      {BRAND_COLLAB_STATUS_LABELS[deal.status]}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-white/55">
                  {deal.deliverables || 'Deliverables TBD'}{deal.timeline ? ` · Timeline: ${deal.timeline}` : ''}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {deal.status === 'new' && (
                    <button
                      type="button"
                      onClick={() => updateBrandCollabStatus(deal.id, 'reviewing')}
                      className="px-3 py-2 rounded-lg bg-amber-500/15 text-amber-200 text-xs font-bold hover:bg-amber-500/25"
                    >
                      Move To Reviewing
                    </button>
                  )}
                  {(deal.status === 'new' || deal.status === 'reviewing') && (
                    <button
                      type="button"
                      onClick={() => updateBrandCollabStatus(deal.id, 'accepted')}
                      className="px-3 py-2 rounded-lg bg-emerald-500/15 text-emerald-200 text-xs font-bold hover:bg-emerald-500/25"
                    >
                      Accept
                    </button>
                  )}
                  {deal.status !== 'declined' && (
                    <button
                      type="button"
                      onClick={() => updateBrandCollabStatus(deal.id, 'declined')}
                      className="px-3 py-2 rounded-lg bg-rose-500/15 text-rose-200 text-xs font-bold hover:bg-rose-500/25"
                    >
                      Decline
                    </button>
                  )}
                  <a
                    href={`mailto:${deal.contactEmail}?subject=${encodeURIComponent(`VibeJam Collab: ${deal.campaign}`)}`}
                    className="px-3 py-2 rounded-lg bg-white text-black text-xs font-bold hover:bg-white/90"
                  >
                    Contact Brand
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xl font-bold">Recent Transactions</h3>
            <span className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold">
              {isPersistingMonetization ? 'Syncing changes...' : 'Synced'}
            </span>
          </div>
          <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[650px]">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] uppercase tracking-widest text-white/30">
                    <th className="px-6 md:px-8 py-4 md:py-6 font-bold">Contributor</th>
                    <th className="px-6 md:px-8 py-4 md:py-6 font-bold">Amount</th>
                    <th className="px-6 md:px-8 py-4 md:py-6 font-bold">Type</th>
                    <th className="px-6 md:px-8 py-4 md:py-6 font-bold">Date</th>
                    <th className="px-6 md:px-8 py-4 md:py-6 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="text-xs">
                  {monetizeTransactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 md:px-8 py-4 md:py-6 font-bold text-white">{tx.user}</td>
                      <td className={`px-6 md:px-8 py-4 md:py-6 ${tx.type === 'Withdrawal' ? 'text-amber-300' : 'text-emerald-400'}`}>{tx.amount}</td>
                      <td className="px-6 md:px-8 py-4 md:py-6 text-white/60">{tx.type}</td>
                      <td className="px-6 md:px-8 py-4 md:py-6 text-white/30">{tx.date}</td>
                      <td className="px-6 md:px-8 py-4 md:py-6">
                        <span className={`px-2 py-1 rounded-md text-[9px] uppercase font-bold tracking-tighter ${
                          tx.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                          tx.status === 'failed' ? 'bg-rose-500/10 text-rose-500' :
                          'bg-amber-500/10 text-amber-500'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAudienceView = () => (
    <div className="space-y-8 md:space-y-10 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-black tracking-tighter">Your Community</h2>
          <p className="text-white/40 mt-1 md:mt-2 text-base md:text-lg">Direct access to your top 1% fans.</p>
        </div>
        <div className="flex gap-3 md:gap-4">
          <button
            type="button"
            onClick={handleExportAudience}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition-all font-bold text-sm"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            type="button"
            onClick={handleSendAudienceBlast}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-purple-600 text-white transition-all font-bold text-sm shadow-xl shadow-purple-500/20 hover:bg-purple-500"
          >
            <Mail className="w-4 h-4" />
            Send Blast
          </button>
        </div>
      </header>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#0A0A0A] border border-white/5 rounded-2xl gap-4">
        <div className="flex items-center gap-5 overflow-x-auto whitespace-nowrap">
          <div className="flex items-center gap-2 text-white/40 text-[10px] font-bold uppercase tracking-widest">
            <Filter className="w-3 h-3" />
            Filters
          </div>
          <div className="h-4 w-px bg-white/10 hidden sm:block" />
          <div className="flex gap-2">
            {(['All', 'Buyers', 'Waitlist', 'Subscribers'] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setAudienceFilter(item);
                  setVisibleAudienceCount(5);
                }}
                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter transition-colors ${
                  item === audienceFilter ? 'bg-white text-black' : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 text-white/30 text-[10px] uppercase font-bold">
          <UserPlus className="w-3 h-3" />
          {filteredSubscribers.length} Visible
        </div>
      </div>

      <div className="bg-[#0A0A0A] border border-white/5 rounded-[2.5rem] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="border-b border-white/5 text-[10px] uppercase tracking-widest text-white/30">
                <th className="px-6 md:px-10 py-6 md:py-8 font-bold">Subscriber</th>
                <th className="px-6 md:px-10 py-6 md:py-8 font-bold">Joined via</th>
                <th className="px-6 md:px-10 py-6 md:py-8 font-bold">Lifetime Value</th>
                <th className="px-6 md:px-10 py-6 md:py-8 font-bold">Status</th>
                <th className="px-6 md:px-10 py-6 md:py-8 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleSubscribers.map((sub) => (
                <tr key={sub.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 md:px-10 py-4 md:py-6">
                    <div className="flex items-center gap-4">
                      <img src={sub.avatar} className="w-10 h-10 rounded-full border border-white/10" alt={sub.name} />
                      <div>
                        <h4 className="font-bold text-white text-sm">{sub.name}</h4>
                        <p className="text-white/30 text-[11px]">{sub.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 md:px-10 py-4 md:py-6">
                    <span className="px-3 py-1 rounded-lg bg-white/5 text-white/60 text-[10px] uppercase font-bold tracking-widest">
                      {sub.source}
                    </span>
                  </td>
                  <td className="px-6 md:px-10 py-4 md:py-6 font-bold text-emerald-500">{sub.ltv}</td>
                  <td className="px-6 md:px-10 py-4 md:py-6">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Active</span>
                    </div>
                  </td>
                  <td className="px-6 md:px-10 py-4 md:py-6 text-right">
                    <button
                      type="button"
                      onClick={() => setDashboardNotice(`Opened actions for ${sub.name}.`)}
                      className="p-2 rounded-lg hover:bg-white/5 text-white/20 hover:text-white transition-colors"
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
              {visibleSubscribers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 md:px-10 py-10 text-center text-white/40 text-sm">
                    No subscribers match this filter yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-6 md:p-8 border-t border-white/5 flex justify-center">
          <button
            type="button"
            onClick={() => {
              if (visibleAudienceCount >= filteredSubscribers.length) {
                setVisibleAudienceCount(5);
                return;
              }
              setVisibleAudienceCount((prev) => Math.min(prev + 5, filteredSubscribers.length));
            }}
            className="text-[10px] uppercase font-black tracking-[0.3em] text-white/30 hover:text-white transition-colors"
          >
            {visibleAudienceCount >= filteredSubscribers.length ? 'Reset List' : 'Load More Commandos'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderAnalyticsView = () => {
    const totalViews = analyticsSeries.reduce((sum, item) => sum + item.views, 0);
    const totalClicks = analyticsSeries.reduce((sum, item) => sum + item.clicks, 0);
    const avgClicks = Math.round(totalClicks / Math.max(1, analyticsSeries.length));
    const retention = Math.round((totalClicks / Math.max(totalViews, 1)) * 100);
    const inferredSubs = Math.max(120, Math.round(totalClicks * 0.03));
    const stats = [
      {
        label: 'Total Views',
        value: totalViews >= 1000 ? `${(totalViews / 1000).toFixed(1)}k` : `${totalViews}`,
        change: analyticsRange === '30d' ? '+31%' : '+24%',
        icon: Eye,
        color: 'text-blue-400',
      },
      {
        label: 'Avg. Clicks',
        value: avgClicks >= 1000 ? `${(avgClicks / 1000).toFixed(1)}k` : `${avgClicks}`,
        change: analyticsRange === '30d' ? '+12%' : '+8%',
        icon: MousePointer2,
        color: 'text-purple-400',
      },
      { label: 'Retention', value: `${retention}%`, change: '+2%', icon: Clock, color: 'text-emerald-400' },
      { label: 'New Subs', value: inferredSubs.toLocaleString(), change: '+15%', icon: Users, color: 'text-amber-400' },
    ];

    return (
      <div className="space-y-8 md:space-y-10 pb-20">
        <header>
          <h2 className="text-3xl md:text-4xl font-black tracking-tighter">Insights Console</h2>
          <p className="text-white/40 mt-1 md:mt-2 text-base md:text-lg">Real-time performance analytics across your network.</p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {stats.map((stat) => (
            <div key={stat.label} className="p-5 md:p-6 rounded-3xl bg-[#111] border border-white/5">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <div className={`p-2 rounded-lg bg-white/5 ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <span className="text-emerald-400 text-xs font-bold">{stat.change}</span>
              </div>
              <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold">{stat.label}</p>
              <h3 className="text-2xl md:text-3xl font-black mt-1">{stat.value}</h3>
            </div>
          ))}
        </div>

        <div className="p-6 md:p-8 rounded-[2rem] bg-[#0A0A0A] border border-white/5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 md:mb-10 gap-4">
            <div>
              <h3 className="text-xl font-bold">The Pulse</h3>
              <p className="text-xs text-white/30">Traffic volume vs user engagement ({analyticsRange === '30d' ? '30-day' : '7-day'} view).</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAnalyticsRange('7d')}
                className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors ${
                  analyticsRange === '7d' ? 'bg-white text-black' : 'bg-white/5 text-white/40 hover:text-white'
                }`}
              >
                7 Days
              </button>
              <button
                type="button"
                onClick={() => setAnalyticsRange('30d')}
                className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors ${
                  analyticsRange === '30d' ? 'bg-white text-black' : 'bg-white/5 text-white/40 hover:text-white'
                }`}
              >
                30 Days
              </button>
            </div>
          </div>

          <div className="h-[280px] md:h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analyticsSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700 }} />
                <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} itemStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                <Area type="monotone" dataKey="views" stroke="#a855f7" strokeWidth={3} fillOpacity={1} fill="url(#colorViews)" />
                <Area type="monotone" dataKey="clicks" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorClicks)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          <div className="p-6 md:p-8 rounded-[2rem] bg-[#0A0A0A] border border-white/5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold flex items-center gap-3">
                <MousePointer2 className="w-5 h-5 text-purple-500" />
                Interaction Heatmap
              </h3>
            </div>
            <div className="aspect-video rounded-2xl bg-[#050505] flex items-center justify-center relative overflow-hidden">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
              <span className="text-[10px] text-white/20 uppercase tracking-[0.4em]">Live Tapping View</span>
            </div>
          </div>

          <div className="p-6 md:p-8 rounded-[2rem] bg-[#0A0A0A] border border-white/5">
            <h3 className="text-xl font-bold mb-6 md:mb-8 flex items-center gap-3">
              <Globe className="w-5 h-5 text-blue-500" />
              Top Locations
            </h3>
            <div className="space-y-5 md:space-y-6">
              {[
                { country: 'United States', flag: '🇺🇸', percent: 42 },
                { country: 'United Kingdom', flag: '🇬🇧', percent: 18 },
                { country: 'Germany', flag: '🇩🇪', percent: 12 },
                { country: 'Japan', flag: '🇯🇵', percent: 9 },
                { country: 'Canada', flag: '🇨🇦', percent: 6 },
              ].map((loc, index) => (
                <div key={loc.country} className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="flex items-center gap-2">
                      <span className="text-lg">{loc.flag}</span>
                      <span className="font-medium text-white/60">{loc.country}</span>
                    </span>
                    <span className="font-bold text-white/80">{loc.percent}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${loc.percent}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: index * 0.08 }}
                      className="h-full bg-blue-500 rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'canvas':
        return renderCanvasView();
      case 'themes':
        return renderThemeStudio();
      case 'monetize':
        return renderMonetizeView();
      case 'audience':
        return renderAudienceView();
      case 'analytics':
        return renderAnalyticsView();
      default:
        return renderCanvasView();
    }
  };

  const fontClass = overrides.fontFamily === 'Inter' ? "font-['Inter']" : 'font-mono';
  const previewLinksRecord = useMemo(() => {
    return buildPreviewLinksRecordFromDashboardLinks(links, effectiveLiveUrl);
  }, [effectiveLiveUrl, links]);
  const serializedLinkItems = useMemo(
    () =>
      links
        .map((item) => ({
          id: item.id,
          title: item.title.trim(),
          url: item.url.trim(),
          clicks: item.clicks,
        }))
        .filter((item) => item.title.length > 0 && item.url.length > 0),
    [links],
  );
  const serializedThemeContainers = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(themeContainers)
          .map(([themeId, items]) => [
            themeId,
            ((items ?? []) as CanvasThemeContainer[])
              .map((item) => ({
                id: item.id,
                size: item.size,
                kind: item.kind,
                title: item.title.trim(),
                subtitle: item.subtitle?.trim() || undefined,
                url: item.url?.trim() || undefined,
                mediaUrl: item.mediaUrl?.trim() || undefined,
              }))
              .filter((item) => item.title.length > 0),
          ])
          .filter((entry) => entry[1].length > 0),
      ),
    [themeContainers],
  );
  const creatorHubRenderModel = useMemo<CreatorHubRenderModel>(() => {
    const socials: CreatorHubRenderModel['socials'] = [];
    const topActions: CreatorHubRenderModel['topActions'] = [];
    const seenSocial = new Set<string>();

    for (const link of links) {
      const normalized = normalizePreviewUrl(link.url);
      if (!normalized) {
        continue;
      }
      const inferred = inferLinkKeyFromTitle(link.title);
      const lowerTitle = link.title.toLowerCase();
      const isSocial =
        inferred === 'x' ||
        inferred === 'instagram' ||
        inferred === 'github' ||
        lowerTitle.includes('twitter') ||
        lowerTitle.includes('instagram') ||
        lowerTitle.includes('github');

      if (isSocial) {
        const platform =
          inferred === 'instagram'
            ? 'Instagram'
            : inferred === 'github'
              ? 'Github'
              : 'Twitter';
        if (!seenSocial.has(platform)) {
          seenSocial.add(platform);
          socials.push({
            platform,
            url: normalized,
            icon: platform.toLowerCase(),
          });
        }
        continue;
      }

      topActions.push({
        id: link.id,
        title: link.title,
        url: normalized,
      });
    }

    const products = monetization.products.map((item, index) => ({
      id: item.id,
      title: item.title,
      description: item.description || 'Digital release for your audience.',
      image: CREATOR_HUB_CATALOG[index % CREATOR_HUB_CATALOG.length]?.image ?? CREATOR_HUB_FEATURED_PRODUCT.image,
      price: item.priceUsd <= 0 ? 'Free' : `$${item.priceUsd.toFixed(0)}`,
      cta: 'View',
      featured: false,
    }));

    const fallbackFeatured = products[0] ?? {
      ...CREATOR_HUB_FEATURED_PRODUCT,
      featured: true,
    };
    const featuredRelease = {
      ...fallbackFeatured,
      id: CREATOR_HUB_FEATURED_CONTAINER_ID,
      title: creatorHubFeaturedContainer?.title || fallbackFeatured.title,
      description: creatorHubFeaturedContainer?.subtitle || fallbackFeatured.description,
      image: creatorHubFeaturedContainer?.mediaUrl || fallbackFeatured.image,
      cta: 'Get it now',
      featured: true,
    };

    const trustBadgeLabels =
      creatorHubProofContainers.length > 0
        ? creatorHubProofContainers.map((item) => item.title)
        : CREATOR_HUB_TRUST_BADGES.map((item) => item.label);

    const logEntries =
      creatorHubLogContainers.length > 0
        ? creatorHubLogContainers.map((item, index) => {
            const raw = item.subtitle ?? '';
            const [datePart, contentPart] = raw.includes('||') ? raw.split('||', 2) : ['', raw];
            return {
              id: item.id,
              date: (datePart || 'Recent Update').trim(),
              title: item.title,
              content: (contentPart || item.subtitle || 'New update published.').trim(),
            };
          })
        : CREATOR_HUB_TIMELINE.map((item, index) => ({
            id: `default-log-${index}`,
            date: item.date,
            title: item.title,
            content: item.content,
          }));

    return {
      socials,
      topActions,
      products,
      featuredRelease,
      trustBadgeLabels,
      logEntries,
      sections: creatorHubSectionBlocks.map((item) => ({
        key: item.key,
        label: item.label,
        visible: item.visible,
        position: item.position,
      })),
    };
  }, [
    creatorHubFeaturedContainer,
    creatorHubLogContainers,
    creatorHubProofContainers,
    creatorHubSectionBlocks,
    links,
    monetization.products,
  ]);
  const midnightZenithRenderModel = useMemo<MidnightZenithRenderModel>(() => {
    const navTabs = midnightNavContainers.map((item, index) => ({
      id: item.id || `midnight-nav-${index}`,
      label: item.title.trim(),
    })).filter((item) => item.label.length > 0);

    const gridTiles = midnightGridContainers.map((item, index) => {
      const decoded = decodeMidnightGridSubtitle(item.subtitle);
      const fallback = MIDNIGHT_GRID_ITEMS[index % MIDNIGHT_GRID_ITEMS.length];
      return {
        id: item.id || `midnight-grid-${index}`,
        type: midnightSizeToType(item.size),
        title: item.title.trim() || fallback.title,
        subtitle: decoded.subtitle || fallback.subtitle,
        category: decoded.category || 'ALL',
        live: decoded.live,
        videoUrl: item.url?.trim() || fallback.videoUrl,
        thumbnail: item.mediaUrl?.trim() || fallback.thumbnail,
        accentColor: fallback.accentColor,
      };
    }).filter((item) => item.title.length > 0 && item.videoUrl.length > 0);

    const footerSocials = midnightFooterSocialContainers.map((item, index) => ({
      id: item.id || `midnight-footer-social-${index}`,
      label: item.title.trim(),
      href: item.url?.trim() || '',
    })).filter((item) => item.label.length > 0 && item.href.length > 0);

    return {
      hero: {
        name: midnightHeroMeta.name,
        handle: midnightHeroMeta.handle,
        verified: midnightHeroMeta.verified,
        bio: midnightHeroMeta.bio,
        heroVideo: MIDNIGHT_PROFILE_DEFAULTS.heroVideo,
        profilePic: midnightHeroMeta.avatar,
      },
      navTabs,
      gridTiles,
      footer: {
        headline: midnightFooterMeta.headline,
        subheadline: midnightFooterMeta.subheadline,
        socials: footerSocials,
        tagline: midnightFooterMeta.tagline,
      },
      sections: midnightSectionBlocks.map((item) => ({
        key: item.key,
        label: item.label,
        visible: item.visible,
        position: item.position,
      })),
    };
  }, [
    midnightFooterMeta.headline,
    midnightFooterMeta.subheadline,
    midnightFooterMeta.tagline,
    midnightFooterSocialContainers,
    midnightGridContainers,
    midnightHeroMeta.avatar,
    midnightHeroMeta.bio,
    midnightHeroMeta.handle,
    midnightHeroMeta.name,
    midnightHeroMeta.verified,
    midnightNavContainers,
    midnightSectionBlocks,
  ]);

  useEffect(() => {
    setStreamBadge(1, monetization.products.length > 0 ? `${Math.min(99, monetization.products.length)} Listed` : undefined);
    setStreamBadge(2, monetization.tipJarEnabled ? 'ON' : 'OFF');
    if (!(monetization.brandCollabs?.enabled ?? true)) {
      setStreamBadge(3, 'OFF');
      return;
    }
    setStreamBadge(3, newBrandCollabCount > 0 ? `${Math.min(99, newBrandCollabCount)} New` : 'Ready');
  }, [monetization.products.length, monetization.tipJarEnabled, monetization.brandCollabs?.enabled, newBrandCollabCount]);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setIsPersistingMonetization(true);
      try {
        await saveCanvasOnboarding({
          claimedName: onboarding.claimedName,
          vanitySlug: effectiveSlug,
          profile: workspaceProfile,
          selectedTheme: selectedThemeId ?? onboarding.selectedTheme,
          selectedTemplateId: onboarding.selectedTemplateId,
          selectedSignals: onboarding.selectedSignals,
          links: previewLinksRecord,
          linkItems: serializedLinkItems,
          themeContainers: serializedThemeContainers,
          monetization,
          layout: layoutSchema,
        });
      } catch {
        if (!cancelled) {
          setMonetizeNotice('Could not sync monetization settings right now.');
        }
      } finally {
        if (!cancelled) {
          setIsPersistingMonetization(false);
        }
      }
    }, 450);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    layoutSchema,
    monetization,
    onboarding.claimedName,
    effectiveSlug,
    onboarding.selectedSignals,
    onboarding.selectedTemplateId,
    onboarding.selectedTheme,
    previewLinksRecord,
    serializedLinkItems,
    serializedThemeContainers,
    selectedThemeId,
    workspaceProfile,
  ]);

  const handleOpenLivePage = async () => {
    if (isOpeningLivePage) {
      return;
    }

    setIsOpeningLivePage(true);
    const liveSlug = effectiveSlug;
    const liveUrl = `https://vibejam.co/${liveSlug}`;
    const liveWindow = window.open(liveUrl, '_blank');

    const payload: CanvasOnboardingPayload = {
      claimedName: onboarding.claimedName,
      vanitySlug: liveSlug,
      profile: workspaceProfile,
      selectedTheme: selectedThemeId ?? onboarding.selectedTheme,
      selectedTemplateId: onboarding.selectedTemplateId,
      selectedSignals: onboarding.selectedSignals,
      links: previewLinksRecord,
      linkItems: serializedLinkItems,
      themeContainers: serializedThemeContainers,
      monetization,
      layout: layoutSchema,
    };

    try {
      const nextPublish = await saveCanvasOnboarding(payload);
      setWorkspaceSlug(sanitizeLiveSlug(nextPublish.slug || liveSlug) || liveSlug);
      if (nextPublish?.url && liveWindow && !liveWindow.closed) {
        liveWindow.location.replace(nextPublish.url);
      }
    } catch {
      if (!liveWindow) {
        window.location.assign(liveUrl);
      }
    } finally {
      setIsOpeningLivePage(false);
    }
  };

  const handleHeaderStartJam = () => {
    if (!onOpenStartJam) {
      setDashboardNotice('Start Jam is unavailable right now.');
      return;
    }
    onOpenStartJam();
  };

  const handleHeaderProfile = () => {
    if (!onOpenProfile) {
      setDashboardNotice('Profile is unavailable right now.');
      return;
    }
    onOpenProfile();
  };

  const handleHeaderNotifications = () => {
    setIsHeaderNotificationsOpen((prev) => !prev);
    onToggleNotifications?.();
  };

  const commandActions = [
    {
      id: 'go-canvas',
      label: 'Go To Canvas Tab',
      keywords: 'canvas links editor',
      run: () => setActiveTab('canvas'),
    },
    {
      id: 'go-themes',
      label: 'Open Design Studio',
      keywords: 'themes design studio',
      run: () => setActiveTab('themes'),
    },
    {
      id: 'go-monetize',
      label: 'Open Monetize Tab',
      keywords: 'monetize tip jar products',
      run: () => setActiveTab('monetize'),
    },
    {
      id: 'open-brand-collabs',
      label: 'Open Brand Collabs Pipeline',
      keywords: 'brand collabs sponsorship deals',
      run: () => {
        setActiveTab('monetize');
        setIsBrandCollabsModalOpen(true);
      },
    },
    {
      id: 'go-audience',
      label: 'Open Audience Tab',
      keywords: 'audience subscribers community',
      run: () => setActiveTab('audience'),
    },
    {
      id: 'go-analytics',
      label: 'Open Analytics Tab',
      keywords: 'analytics stats pulse',
      run: () => setActiveTab('analytics'),
    },
    {
      id: 'open-settings',
      label: 'Open Settings',
      keywords: 'profile slug avatar settings',
      run: openSettings,
    },
    {
      id: 'open-live-page',
      label: 'Open Live Page',
      keywords: 'live public page',
      run: () => {
        void handleOpenLivePage();
      },
    },
    {
      id: 'main-rankings',
      label: 'Switch To Rankings',
      keywords: 'top menu rankings',
      run: () => {
        onNavigateMainTab?.('Rankings');
        onClose();
      },
    },
    {
      id: 'main-marketplace',
      label: 'Switch To Marketplace',
      keywords: 'top menu marketplace',
      run: () => {
        onNavigateMainTab?.('Marketplace');
        onClose();
      },
    },
  ];

  const filteredCommandActions = commandActions.filter((item) => {
    const q = commandQuery.trim().toLowerCase();
    if (!q) {
      return true;
    }
    return `${item.label} ${item.keywords}`.toLowerCase().includes(q);
  });

  const renderThemeViewportForId = (themeId: string, mode: PreviewMode): React.ReactNode => {
    if (themeId === 'isometric-loft-profile') {
      return (
        <div className="h-full overflow-auto bg-[#050505]">
          <IsometricLoftApp forcedViewport={mode} />
        </div>
      );
    }

    if (themeId === 'kinetic-variable-profile') {
      return (
        <div className="h-full overflow-auto bg-[#050505]">
          <KineticVariableApp forcedViewport={mode} />
        </div>
      );
    }

    if (themeId === 'orbital-lens-spatial-link-in-bio') {
      return (
        <div className="h-full overflow-auto bg-[#050505]">
          <OrbitalLensApp
            forcedViewport={mode}
            profileOverride={{
              name: workspaceProfile.name,
              avatar: workspaceProfile.avatar,
              handle: `@${effectiveSlug}`,
            }}
          />
        </div>
      );
    }

    if (themeId === 'vapor-os') {
      return (
        <div className="h-full overflow-auto bg-[#050505]">
          <VaporOsApp forcedViewport={mode} />
        </div>
      );
    }

    if (themeId.startsWith('collection-')) {
      const collectionId = themeId.replace('collection-', '');
      switch (collectionId) {
        case 'gold-standard':
          return (
            <div className="h-full overflow-auto bg-[#050505]">
              <GoldStandardCollectionApp forcedViewport={mode} />
            </div>
          );
        case 'accordion-deck':
          return (
            <div className="h-full overflow-auto bg-[#050505]">
              <AccordionDeckCollectionApp forcedViewport={mode} />
            </div>
          );
        case 'collage-os':
          return (
            <div className="h-full overflow-auto bg-[#050505]">
              <CollageOsCollectionApp forcedViewport={mode} />
            </div>
          );
        case 'terrarium':
          return (
            <div className="h-full overflow-auto bg-[#050505]">
              <TerrariumCollectionApp forcedViewport={mode} />
            </div>
          );
        case 'prism-os':
          return (
            <div className="h-full overflow-auto bg-[#050505]">
              <PrismOsCollectionApp forcedViewport={mode} />
            </div>
          );
        case 'aero-canvas':
          return (
            <div className="h-full overflow-auto bg-[#050505]">
              <AeroCanvasCollectionApp forcedViewport={mode} />
            </div>
          );
        default:
          break;
      }
    }

    if (themeId === CREATOR_HUB_THEME_ID) {
      return (
        <div className="h-full overflow-auto bg-[#FDFBF7]">
          <CreatorHubApp
            forcedViewport={mode}
            profileOverride={{
              name: workspaceProfile.name,
              bio: workspaceProfile.bio,
              avatar: workspaceProfile.avatar,
            }}
            linksOverride={previewLinksRecord}
            slugOverride={effectiveSlug}
            creatorModel={creatorHubRenderModel}
          />
        </div>
      );
    }

    if (themeId === MIDNIGHT_THEME_ID) {
      return (
        <div className="h-full overflow-auto bg-[#050505]">
          <MidnightZenithApp
            forcedViewport={mode}
            profileOverride={{
              name: workspaceProfile.name,
              bio: workspaceProfile.bio,
              avatar: workspaceProfile.avatar,
              handle: `@${effectiveSlug}`,
            }}
            canvasModel={midnightZenithRenderModel}
          />
        </div>
      );
    }

    switch (getThemePreviewFamily(themeId)) {
      case 'editorial':
        return (
          <div className="h-full overflow-auto bg-[#F0F0F0]">
            <EditorialKineticProfile isMobilePreview={mode === 'mobile'} />
          </div>
        );
      case 'creator':
        return (
          <div className="h-full overflow-auto bg-[#FDFBF7]">
            <CreatorHubApp
              forcedViewport={mode}
              profileOverride={{
                name: workspaceProfile.name,
                bio: workspaceProfile.bio,
                avatar: workspaceProfile.avatar,
              }}
              linksOverride={previewLinksRecord}
              slugOverride={effectiveSlug}
              creatorModel={creatorHubRenderModel}
            />
          </div>
        );
      case 'aurora':
        return (
          <div className="h-full overflow-auto bg-[#060913]">
            <EtherealLiquidApp
              forcedViewport={mode}
              profileOverride={{
                name: workspaceProfile.name,
                bio: workspaceProfile.bio,
                avatar: workspaceProfile.avatar,
                handle: `@${effectiveSlug}`,
              }}
            />
          </div>
        );
      case 'glass':
        return (
          <div className="h-full overflow-auto bg-[#070712]">
            <GlassArtifactApp
              forcedViewport={mode}
              profileOverride={{
                name: workspaceProfile.name,
                bio: workspaceProfile.bio,
                avatar: workspaceProfile.avatar,
                handle: `@${effectiveSlug}`,
              }}
            />
          </div>
        );
      case 'midnight':
      default:
        return (
          <div className="h-full overflow-auto bg-[#050505]">
            <MidnightZenithApp
              forcedViewport={mode}
              profileOverride={{
                name: workspaceProfile.name,
                bio: workspaceProfile.bio,
                avatar: workspaceProfile.avatar,
                handle: `@${effectiveSlug}`,
              }}
              canvasModel={midnightZenithRenderModel}
            />
          </div>
        );
    }
  };

  const renderLiveThemeViewport = (mode: PreviewMode): React.ReactNode => {
    const activeThemeId = selectedThemeId ?? selectedTheme?.id ?? 'midnight-zenith';
    return renderThemeViewportForId(activeThemeId, mode);
  };

  const renderThemeCardThumbnail = (theme: CanvasTheme): React.ReactNode => (
    <div className="absolute inset-0 pointer-events-none isolate overflow-hidden [transform:translateZ(0)]">
      <div
        className="h-full w-full overflow-hidden [transform:translateZ(0)] [contain:layout_paint_style] [mask-image:linear-gradient(to_bottom,black_0%,black_58%,transparent_90%)]"
        style={{
          WebkitTransform: 'translateZ(0)',
          borderRadius: `${Math.max(8, overrides.cornerRadius + 4)}px`,
          boxShadow: `inset 0 0 0 1px ${hexToRgba(resolvedAccentColor, 0.15)}`,
        }}
      >
        <motion.div
          className="h-full w-full scale-[0.97] -translate-y-[2%]"
          animate={overrides.bouncyMode ? { y: [0, -3, 0, 2, 0] } : { y: 0 }}
          transition={overrides.bouncyMode ? { duration: 4.8, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.2 }}
        >
          {renderThemeViewportForId(theme.id, 'mobile')}
        </motion.div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/8 via-black/35 to-black/92" />
    </div>
  );

  const renderPhonePreview = () => {
    const showMonetizationOverlay = activeTab === 'monetize';
    return (
      <div className={`relative w-[300px] h-[610px] group ${fontClass}`}>
        <div className="absolute inset-0 bg-neutral-900 rounded-[3rem] border-[8px] border-neutral-800 shadow-[0_0_60px_-15px_rgba(0,0,0,1)] overflow-hidden">
          <div className={`relative h-full w-full overflow-hidden transition-all duration-700 ${isRebooting ? 'opacity-0 scale-95 blur-xl' : 'opacity-100 scale-100 blur-0'}`}>
            <div className="absolute inset-0 overflow-hidden bg-black">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-b-2xl z-50" />
              <motion.div
                className="relative h-full w-full"
                ref={mobileThemePreviewRef}
                style={{
                  borderRadius: `${Math.max(10, overrides.cornerRadius + 6)}px`,
                  boxShadow: `inset 0 0 0 1px ${hexToRgba(resolvedAccentColor, 0.22)}`,
                }}
                animate={overrides.bouncyMode ? { scale: [1, 1.008, 1] } : { scale: 1 }}
                transition={overrides.bouncyMode ? { duration: 2.6, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.2 }}
              >
                {renderLiveThemeViewport('mobile')}
                {showMonetizationOverlay && (
                  <div data-vj-ignore-edit>
                    <ThemeMonetizationOverlay
                      tipJarEnabled={Boolean(monetization.tipJarEnabled)}
                      tipJarUrl={monetization.tipJarUrl}
                      products={monetization.products}
                      brandCollabsEnabled={Boolean(monetization.brandCollabs?.enabled)}
                      onOpenProducts={() => setIsProductsSheetOpen(true)}
                      onOpenBrandCollabs={() => setIsBrandCollabsModalOpen(true)}
                    />
                  </div>
                )}
              </motion.div>
            </div>
          </div>

          <AnimatePresence>
            {isRebooting && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black z-50 flex items-center justify-center flex-col">
                <div className="w-12 h-0.5 bg-white/20 relative overflow-hidden">
                  <motion.div initial={{ left: '-100%' }} animate={{ left: '100%' }} transition={{ duration: 0.8, ease: 'easeInOut' }} className="absolute inset-0 bg-white" />
                </div>
                <span className="text-[8px] text-white/40 mt-4 tracking-widest uppercase">System Reboot</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  };

  const renderDesktopPopupPreview = () => {
    const showMonetizationOverlay = activeTab === 'monetize';
    return (
      <div className={`w-[min(94vw,1200px)] h-[min(86vh,820px)] bg-neutral-900 rounded-3xl border border-white/10 shadow-2xl overflow-hidden relative ${fontClass}`}>
        <div className="h-12 bg-black/50 border-b border-white/5 flex items-center px-4 gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/40" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/40" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/40" />
          </div>
          <div className="mx-auto flex items-center gap-2 px-3 py-1 bg-white/5 rounded-md text-[10px] text-white/30">
            vibejam.co/{effectiveSlug}
            <ExternalLink className="w-2 h-2" />
          </div>
        </div>
        <div className="relative h-[calc(100%-48px)] w-full overflow-hidden">
          <motion.div
            className="absolute inset-0 overflow-auto bg-black"
            style={{
              borderRadius: `${Math.max(10, overrides.cornerRadius + 2)}px`,
              boxShadow: `inset 0 0 0 1px ${hexToRgba(resolvedAccentColor, 0.18)}`,
            }}
            animate={overrides.bouncyMode ? { y: [0, -1, 0] } : { y: 0 }}
            transition={overrides.bouncyMode ? { duration: 2.2, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.2 }}
            >
              <div
                className="relative h-full"
                ref={desktopThemePreviewRef}
              >
                {renderLiveThemeViewport('desktop')}
                {showMonetizationOverlay && (
                  <div data-vj-ignore-edit>
                    <ThemeMonetizationOverlay
                    tipJarEnabled={Boolean(monetization.tipJarEnabled)}
                    tipJarUrl={monetization.tipJarUrl}
                    products={monetization.products}
                    brandCollabsEnabled={Boolean(monetization.brandCollabs?.enabled)}
                    onOpenProducts={() => setIsProductsSheetOpen(true)}
                    onOpenBrandCollabs={() => setIsBrandCollabsModalOpen(true)}
                  />
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    );
  };

  return (
    <div className={`fixed inset-0 z-[380] h-[100dvh] w-screen bg-[#050505] text-white overflow-hidden ${fontClass}`}>
      <div className="relative z-[430] h-16 border-b border-white/5 bg-black/80 backdrop-blur-xl px-4 md:px-8">
        <div className="h-full mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-extrabold tracking-tighter text-white">VibeJam</h1>
            <div className="hidden xs:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-bold text-green-500 tracking-wider">MARKET OPEN</span>
            </div>
          </div>
          <div className="hidden md:flex items-center bg-white/5 rounded-full p-1 border border-white/5">
            {['Rankings', 'Marketplace', 'Canvas'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  if (tab === 'Canvas') {
                    setActiveTab('canvas');
                    return;
                  }
                  onNavigateMainTab?.(tab as 'Rankings' | 'Marketplace' | 'Canvas');
                  onClose();
                }}
                className={`relative px-6 py-1.5 text-xs font-bold rounded-full transition-all duration-300 ${tab === 'Canvas' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                {tab}
                {tab === 'Canvas' && <span className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 w-8 h-[2px] bg-green-500" />}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4 sm:gap-6">
            <button
              type="button"
              onClick={() => {
                setCommandQuery('');
                setIsCommandPaletteOpen(true);
              }}
              className="text-zinc-400 hover:text-white transition-colors"
              aria-label="Open command palette"
            >
              <Search className="w-5 h-5" />
            </button>
            <div className="hidden xs:block w-[1px] h-4 bg-white/10" />
            <button
              type="button"
              onClick={handleHeaderStartJam}
              className="hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/20 text-xs font-bold hover:bg-white hover:text-black transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Start Jam
            </button>
            <div className="relative" ref={headerNotificationsRef}>
              <button
                type="button"
                onClick={handleHeaderNotifications}
                className="relative p-1 transition-transform hover:scale-110 active:scale-95"
              >
                <Bell className={`w-5 h-5 transition-colors ${isNotificationsOpen || isHeaderNotificationsOpen ? 'text-white' : 'text-zinc-400'}`} />
                {unreadCount > 0 && <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-cyan-400 border-2 border-black" />}
              </button>
              <AnimatePresence>
                {isHeaderNotificationsOpen && (
                  <>
                    <div className="fixed inset-0 z-[435]" onClick={() => setIsHeaderNotificationsOpen(false)} />
                    <NotificationCenter
                      notifications={canvasNotifications}
                      onClose={() => setIsHeaderNotificationsOpen(false)}
                      onMarkAllRead={() => setDashboardNotice('Marked all canvas notifications as read.')}
                      onSelectApp={() => setIsHeaderNotificationsOpen(false)}
                      getAppById={() => undefined}
                      position="fixed"
                      className="z-[520]"
                    />
                  </>
                )}
              </AnimatePresence>
            </div>
            <button
              type="button"
              onClick={handleHeaderProfile}
              className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 overflow-hidden cursor-pointer hover:border-white/30 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.05)]"
            >
              <img src={headerAvatar} alt={`${headerDisplayName} avatar`} className="w-full h-full object-cover" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100dvh-64px)] overflow-hidden">
        <AnimatePresence>
          {isSidebarOpen && (
            <>
              <motion.button
                type="button"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSidebarOpen(false)}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
              />
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-16 bottom-0 left-0 w-[280px] z-50 lg:hidden bg-[#0A0A0A] border-r border-white/5 flex flex-col"
              >
                <div className="h-14 px-4 flex items-center justify-end border-b border-white/5">
                  <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-white/5 rounded-lg">
                    <X className="w-6 h-6 text-white/40" />
                  </button>
                </div>
                <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setIsSidebarOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-white/10 text-white' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
                      >
                        {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-white" />}
                        <Icon className={`w-5 h-5 ${isActive ? item.color : ''}`} />
                        <span className="text-sm font-medium">{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
                <div className="p-4 border-t border-white/5 space-y-2">
                  <button
                    type="button"
                    onClick={openSettings}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/40 hover:bg-white/5 hover:text-white transition-all text-sm font-medium"
                  >
                    <Settings className="w-5 h-5" />
                    Settings
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenLivePage}
                    disabled={isOpeningLivePage}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white text-black hover:bg-white/90 transition-all text-sm font-bold"
                  >
                    <span className="flex items-center gap-3">
                      <ExternalLink className="w-5 h-5" />
                      {isOpeningLivePage ? 'Opening...' : 'Live Page'}
                    </span>
                    <span className="text-[10px] opacity-40">→</span>
                  </button>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        <aside className="hidden lg:flex w-[260px] bg-[#0A0A0A] border-r border-white/5 flex-col">
          <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative ${isActive ? 'bg-white/10 text-white' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
                >
                  {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-white" />}
                  <Icon className={`w-5 h-5 ${isActive ? item.color : ''}`} />
                  <span className="text-sm font-medium">{item.label}</span>
                  {item.id === 'monetize' && (
                    <span className={`ml-auto w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-emerald-500'}`} />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-white/5 space-y-2">
            <button
              type="button"
              onClick={openSettings}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/40 hover:bg-white/5 hover:text-white transition-all text-sm font-medium"
            >
              <Settings className="w-5 h-5" />
              Settings
            </button>
            <button
              type="button"
              onClick={handleOpenLivePage}
              disabled={isOpeningLivePage}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white text-black hover:bg-white/90 transition-all text-sm font-bold"
            >
              <span className="flex items-center gap-3">
                <ExternalLink className="w-5 h-5" />
                {isOpeningLivePage ? 'Opening...' : 'Live Page'}
              </span>
              <span className="text-[10px] opacity-40">→</span>
            </button>
          </div>
        </aside>

        <main className="flex-1 flex flex-col h-full overflow-hidden border-r border-white/5 relative bg-[#050505]">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden absolute top-4 left-4 z-20 p-2 rounded-lg bg-black/40 border border-white/10 hover:bg-white/10 transition-colors"
            aria-label="Open navigation"
          >
            <Menu className="w-5 h-5 text-white/70" />
          </button>
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="xl:hidden absolute top-4 right-4 z-20 p-2 rounded-lg bg-black/40 border border-white/10 hover:bg-white/10 transition-colors"
            aria-label="Open live preview"
          >
            <Smartphone className="w-5 h-5 text-white/70" />
          </button>

          <div className="flex-1 overflow-y-auto p-4 md:p-8 pt-16 md:pt-20 lg:pt-8">
            <AnimatePresence>
              {dashboardNotice && (
                <motion.div
                  initial={{ opacity: 0, y: -12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className="max-w-5xl mx-auto mb-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3"
                >
                  <p className="text-xs md:text-sm text-white/80">{dashboardNotice}</p>
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                className="max-w-5xl mx-auto h-full"
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        <aside className="hidden xl:flex w-[480px] bg-[#0A0A0A] flex-col h-full relative overflow-hidden border-l border-white/5">
          <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#0A0A0A]/50 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
              <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Live Viewport</h3>
            </div>
            <div className="flex p-1 bg-white/5 rounded-xl border border-white/5">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white text-black shadow-lg shadow-white/5 text-[10px] font-bold uppercase tracking-wider">
                <Smartphone className="w-3.5 h-3.5" />
                Mobile
              </div>
              <button
                onClick={() => setIsDesktopPreviewOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-[10px] font-bold uppercase tracking-wider text-white/60 hover:text-white"
              >
                <Monitor className="w-3.5 h-3.5" />
                Desktop
              </button>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center relative overflow-hidden p-8">
            <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_center,_rgba(168,85,247,0.1)_0%,_transparent_70%)]" />

            <motion.div
              key="mobile-canonical"
              initial={{ opacity: 0, scale: 0.9, rotateY: -10 }}
              animate={{ opacity: 1, scale: 0.85, rotateY: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              {renderPhonePreview()}
            </motion.div>
          </div>

          <div className="p-4 border-t border-white/5 bg-black/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[9px] text-emerald-500 uppercase font-black tracking-[0.2em]">Secure Tunnel</span>
              </div>
              <span className="text-[9px] text-white/20">RTT: 12ms</span>
            </div>
          </div>
        </aside>
      </div>

      <AnimatePresence>
        {isPreviewOpen && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPreviewOpen(false)}
              className="fixed inset-0 z-[360] bg-black/85 backdrop-blur-sm xl:hidden"
            />
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.96 }}
              className="fixed inset-x-4 top-20 bottom-6 z-[370] xl:hidden rounded-3xl border border-white/10 bg-[#0A0A0A] flex flex-col overflow-hidden"
            >
              <div className="h-14 border-b border-white/5 px-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 px-3 rounded-lg text-[10px] uppercase font-black tracking-widest bg-white text-black flex items-center">
                    Mobile
                  </div>
                  <button
                    onClick={() => setIsDesktopPreviewOpen(true)}
                    className="h-8 px-3 rounded-lg text-[10px] uppercase font-black tracking-widest bg-white/5 text-white/70"
                  >
                    Desktop
                  </button>
                </div>
                <button onClick={() => setIsPreviewOpen(false)} className="p-2 rounded-lg hover:bg-white/5">
                  <X className="w-4 h-4 text-white/60" />
                </button>
              </div>
              <div className="flex-1 p-4 flex items-center justify-center overflow-auto">
                {renderPhonePreview()}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isDesktopPreviewOpen && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDesktopPreviewOpen(false)}
              className="fixed inset-0 z-[392] bg-black/85 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              className="fixed inset-6 z-[393] flex flex-col rounded-3xl border border-white/10 bg-[#0A0A0A] overflow-hidden"
            >
              <div className="h-14 border-b border-white/5 px-4 md:px-6 flex items-center justify-between bg-black/40">
                <div className="flex items-center gap-3">
                  <Monitor className="w-4 h-4 text-white/60" />
                  <span className="text-xs font-black uppercase tracking-[0.18em] text-white/60">Desktop View</span>
                </div>
                <button onClick={() => setIsDesktopPreviewOpen(false)} className="p-2 rounded-lg hover:bg-white/5">
                  <X className="w-4 h-4 text-white/60" />
                </button>
              </div>
              <div className="flex-1 p-4 md:p-6 flex items-center justify-center overflow-hidden">
                {renderDesktopPopupPreview()}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCommandPaletteOpen && (
          <div className="fixed inset-0 z-[391] flex items-start justify-center p-4 md:p-8">
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCommandPaletteOpen(false)}
              className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              className="relative w-full max-w-2xl rounded-3xl border border-white/10 bg-[#0A0A0A] p-4 md:p-5"
            >
              <div className="flex items-center gap-3 border border-white/10 rounded-2xl bg-[#111] px-4 py-3">
                <Search className="w-4 h-4 text-white/40" />
                <input
                  value={commandQuery}
                  onChange={(event) => setCommandQuery(event.target.value)}
                  placeholder="Search commands..."
                  className="w-full bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setIsCommandPaletteOpen(false)}
                  className="text-xs text-white/40 hover:text-white"
                >
                  Esc
                </button>
              </div>
              <div className="mt-3 max-h-[52vh] overflow-auto space-y-2 pr-1">
                {filteredCommandActions.length === 0 && (
                  <p className="text-sm text-white/45 px-2 py-3">No commands found.</p>
                )}
                {filteredCommandActions.map((action) => (
                  <button
                    key={action.id}
                    type="button"
                    onClick={() => {
                      action.run();
                      setIsCommandPaletteOpen(false);
                    }}
                    className="w-full text-left rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 hover:bg-white/10 transition-colors"
                  >
                    <p className="text-sm font-semibold">{action.label}</p>
                    <p className="text-[11px] text-white/40 mt-1">{action.keywords}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-[391] flex items-center justify-center p-4">
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-[#0A0A0A] border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden"
            >
              <div className="p-6 md:p-8 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-black tracking-tight">Workspace Settings</h3>
                    <p className="text-white/40 text-sm mt-1">Control identity defaults used across all themes.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSettingsOpen(false)}
                    className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/40 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Display Name</label>
                    <input
                      value={settingsDraft.name}
                      onChange={(event) => setSettingsDraft((prev) => ({ ...prev, name: event.target.value }))}
                      className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400/60"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Live URL Slug</label>
                    <input
                      value={settingsDraft.slug}
                      onChange={(event) => setSettingsDraft((prev) => ({ ...prev, slug: sanitizeLiveSlug(event.target.value) }))}
                      className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400/60"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Bio</label>
                    <textarea
                      value={settingsDraft.bio}
                      onChange={(event) => setSettingsDraft((prev) => ({ ...prev, bio: event.target.value }))}
                      className="w-full min-h-[86px] bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400/60"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Avatar URL</label>
                    <input
                      value={settingsDraft.avatar}
                      onChange={(event) => setSettingsDraft((prev) => ({ ...prev, avatar: event.target.value }))}
                      className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400/60"
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <p className="text-xs text-white/55">
                    Live URL preview: <span className="text-white font-semibold">vibejam.co/{sanitizeLiveSlug(settingsDraft.slug) || 'beacons'}</span>
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsSettingsOpen(false)}
                    className="px-5 py-3 rounded-xl border border-white/10 text-sm font-bold hover:bg-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveWorkspaceSettings}
                    disabled={isSavingSettings}
                    className={`px-5 py-3 rounded-xl bg-white text-black text-sm font-black hover:bg-white/90 ${
                      isSavingSettings ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    {isSavingSettings ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isContainerEditorOpen && editingContainer && (
          <div className="fixed inset-0 z-[420] flex items-center justify-center p-4">
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsContainerEditorOpen(false);
                setEditingContainer(null);
              }}
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-xl bg-[#0A0A0A] border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden"
            >
              <div className="p-6 md:p-8 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-black tracking-tight">Edit Theme Container</h3>
                    <p className="text-white/40 text-sm mt-1">
                      Customize this container for {activePreviewThemeId.replace(/-/g, ' ')}.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsContainerEditorOpen(false);
                      setEditingContainer(null);
                    }}
                    className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/40 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="space-y-2">
                    <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Title</span>
                    <input
                      value={containerForm.title}
                      onChange={(event) => setContainerForm((prev) => ({ ...prev, title: event.target.value }))}
                      className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400/60"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Subtitle</span>
                    <input
                      value={containerForm.subtitle}
                      onChange={(event) => setContainerForm((prev) => ({ ...prev, subtitle: event.target.value }))}
                      className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400/60"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Type</span>
                    <select
                      value={containerForm.kind}
                      onChange={(event) =>
                        setContainerForm((prev) => ({ ...prev, kind: event.target.value as CanvasThemeContainerKind }))
                      }
                      className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400/60"
                    >
                      <option value="note">Note</option>
                      <option value="widget">Widget</option>
                      <option value="image">Image</option>
                    </select>
                  </label>
                  <label className="space-y-2">
                    <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Size</span>
                    <select
                      value={containerForm.size}
                      onChange={(event) =>
                        setContainerForm((prev) => ({ ...prev, size: event.target.value as CanvasThemeContainerSize }))
                      }
                      className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400/60"
                    >
                      <option value="full">Full</option>
                      <option value="standard">Standard</option>
                      <option value="profile">Profile</option>
                    </select>
                  </label>
                  <label className="space-y-2 md:col-span-2">
                    <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">URL (optional)</span>
                    <input
                      value={containerForm.url}
                      onChange={(event) => setContainerForm((prev) => ({ ...prev, url: event.target.value }))}
                      className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400/60"
                    />
                  </label>
                  <label className="space-y-2 md:col-span-2">
                    <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Media URL (optional)</span>
                    <input
                      value={containerForm.mediaUrl}
                      onChange={(event) => setContainerForm((prev) => ({ ...prev, mediaUrl: event.target.value }))}
                      className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400/60"
                    />
                  </label>
                </div>
                <div className="flex flex-wrap justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => removeContainer(editingContainer.id)}
                    className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-bold hover:bg-white/5"
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsContainerEditorOpen(false);
                      setEditingContainer(null);
                    }}
                    className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-bold hover:bg-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveContainerDraft}
                    className="px-4 py-2.5 rounded-xl bg-white text-black text-xs font-black hover:bg-white/90"
                  >
                    Save Container
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isMidnightGridModalOpen && (
          <div className="fixed inset-0 z-[421] flex items-center justify-center p-4">
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMidnightGridModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-[#0A0A0A] border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden"
            >
              <div className="p-6 md:p-8 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-black tracking-tight">{midnightGridForm.id ? 'Edit Grid Tile' : 'Add Grid Tile'}</h3>
                    <p className="text-white/40 text-sm mt-1">Canvas controls all Midnight Zenith grid cards.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMidnightGridModalOpen(false)}
                    className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/40 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    value={midnightGridForm.title}
                    onChange={(event) => setMidnightGridForm((prev) => ({ ...prev, title: event.target.value }))}
                    placeholder="Title"
                    className="w-full bg-[#111] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/40"
                  />
                  <input
                    value={midnightGridForm.subtitle}
                    onChange={(event) => setMidnightGridForm((prev) => ({ ...prev, subtitle: event.target.value }))}
                    placeholder="Subtitle"
                    className="w-full bg-[#111] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/40"
                  />
                  <select
                    value={midnightGridForm.category}
                    onChange={(event) => setMidnightGridForm((prev) => ({ ...prev, category: event.target.value }))}
                    className="w-full bg-[#111] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/40"
                  >
                    {[...new Set(['ALL', ...midnightNavContainers.map((item) => item.title.trim()).filter((item) => item.length > 0)])].map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  <select
                    value={midnightGridForm.type}
                    onChange={(event) => setMidnightGridForm((prev) => ({ ...prev, type: event.target.value as MidnightCardType }))}
                    className="w-full bg-[#111] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/40"
                  >
                    <option value="vertical">Vertical</option>
                    <option value="horizontal">Horizontal</option>
                    <option value="square">Square</option>
                  </select>
                  <input
                    type="url"
                    value={midnightGridForm.videoUrl}
                    onChange={(event) => setMidnightGridForm((prev) => ({ ...prev, videoUrl: event.target.value }))}
                    placeholder="Video URL"
                    className="w-full bg-[#111] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/40"
                  />
                  <input
                    type="url"
                    value={midnightGridForm.thumbnailUrl}
                    onChange={(event) => setMidnightGridForm((prev) => ({ ...prev, thumbnailUrl: event.target.value }))}
                    placeholder="Thumbnail URL (optional)"
                    className="w-full bg-[#111] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/40"
                  />
                </div>
                <label className="inline-flex items-center gap-3 text-sm text-white/70">
                  <input
                    type="checkbox"
                    checked={midnightGridForm.live}
                    onChange={(event) => setMidnightGridForm((prev) => ({ ...prev, live: event.target.checked }))}
                    className="h-4 w-4 rounded border-white/30 bg-[#111]"
                  />
                  Show LIVE badge
                </label>
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsMidnightGridModalOpen(false)}
                    className="px-5 py-3 rounded-xl border border-white/10 text-sm font-bold hover:bg-white/5"
                  >
                    Cancel
                  </button>
                  <button type="button" onClick={saveMidnightGridTile} className="px-5 py-3 rounded-xl bg-white text-black text-sm font-black hover:bg-blue-300">
                    {midnightGridForm.id ? 'Save Tile' : 'Add Tile'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isEditorOpen && (
          <div className="fixed inset-0 z-[390] flex items-center justify-center p-4">
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditorOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-[#0A0A0A] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-2xl font-black tracking-tight">{editingLink ? 'Edit Identity Anchor' : 'New Identity Anchor'}</h3>
                    <p className="text-white/40 text-sm mt-1">Configure your entry point.</p>
                  </div>
                  <button onClick={() => setIsEditorOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/40 hover:text-white">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={saveLink} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">Anchor Label</label>
                    <div className="relative">
                      <Edit3 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                      <input
                        type="text"
                        required
                        value={formState.title}
                        onChange={(event) => setFormState((prev) => ({ ...prev, title: event.target.value }))}
                        placeholder="e.g. My Portfolio"
                        className="w-full bg-[#111] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">Destination URL</label>
                    <div className="relative">
                      <ExternalLink className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                      <input
                        type="url"
                        required
                        value={formState.url}
                        onChange={(event) => setFormState((prev) => ({ ...prev, url: event.target.value }))}
                        placeholder="https://..."
                        className="w-full bg-[#111] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-purple-500/50 transition-all"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button type="button" onClick={() => setIsEditorOpen(false)} className="flex-1 px-8 py-4 rounded-2xl border border-white/5 font-bold text-sm hover:bg-white/5 transition-all">
                      Cancel
                    </button>
                    <button type="submit" className="flex-1 bg-white text-black px-8 py-4 rounded-2xl font-black hover:bg-blue-400 transition-all shadow-xl shadow-white/5">
                      Save
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isProductModalOpen && (
          <div className="fixed inset-0 z-[391] flex items-center justify-center p-4">
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsProductModalOpen(false);
                resetProductForm();
              }}
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-[#0A0A0A] border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden"
            >
              <div className="p-6 md:p-8 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-black tracking-tight">{editingProductId ? 'Edit Digital Product' : 'Add Digital Product'}</h3>
                    <p className="text-white/40 text-sm mt-1">Manage products that appear in Creator Hub and theme shelves.</p>
                  </div>
                  <button onClick={() => {
                    setIsProductModalOpen(false);
                    resetProductForm();
                  }} className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/40 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={productForm.title}
                    onChange={(event) => setProductForm((prev) => ({ ...prev, title: event.target.value }))}
                    placeholder="Product title"
                    className="w-full bg-[#111] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/40"
                  />
                  <select
                    value={productForm.category}
                    onChange={(event) => setProductForm((prev) => ({ ...prev, category: event.target.value as ProductFormState['category'] }))}
                    className="w-full bg-[#111] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/40"
                  >
                    <option value="files">Files</option>
                    <option value="presets">Presets</option>
                    <option value="code">Code</option>
                    <option value="digital">Digital Product</option>
                  </select>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={productForm.priceUsd}
                    onChange={(event) => setProductForm((prev) => ({ ...prev, priceUsd: event.target.value }))}
                    placeholder="Price (USD)"
                    className="w-full bg-[#111] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/40"
                  />
                  <input
                    type="url"
                    value={productForm.url}
                    onChange={(event) => setProductForm((prev) => ({ ...prev, url: event.target.value }))}
                    placeholder="Checkout or product URL"
                    className="w-full bg-[#111] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/40"
                  />
                </div>
                <textarea
                  value={productForm.description}
                  onChange={(event) => setProductForm((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder="Short description"
                  className="w-full min-h-[96px] bg-[#111] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/40"
                />
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProductModalOpen(false);
                      resetProductForm();
                    }}
                    className="px-5 py-3 rounded-xl border border-white/10 text-sm font-bold hover:bg-white/5"
                  >
                    Cancel
                  </button>
                  <button type="button" onClick={addProduct} className="px-5 py-3 rounded-xl bg-white text-black text-sm font-black hover:bg-blue-300">
                    {editingProductId ? 'Save Product' : 'Add Product'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isTipJarModalOpen && (
          <div className="fixed inset-0 z-[391] flex items-center justify-center p-4">
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTipJarModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-[#0A0A0A] border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden"
            >
              <div className="p-6 md:p-8 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-black tracking-tight">Tip Jar Settings</h3>
                    <p className="text-white/40 text-sm mt-1">Set the destination for supporter tips.</p>
                  </div>
                  <button onClick={() => setIsTipJarModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/40 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <input
                  type="url"
                  value={tipJarDraftUrl}
                  onChange={(event) => setTipJarDraftUrl(event.target.value)}
                  placeholder="Tip jar URL (Stripe, PayPal, etc.)"
                  className="w-full bg-[#111] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-rose-500/50"
                />
                <div className="flex items-center justify-between rounded-xl border border-white/10 px-4 py-3">
                  <span className="text-sm text-white/70">Enable Tip Jar</span>
                  <button
                    type="button"
                    onClick={handleToggleTipJar}
                    className={`w-12 h-6 rounded-full relative transition-colors ${
                      monetization.tipJarEnabled ? 'bg-emerald-500' : 'bg-zinc-700'
                    }`}
                  >
                    <motion.div
                      animate={{ x: monetization.tipJarEnabled ? 24 : 4 }}
                      transition={{ type: 'spring', stiffness: 460, damping: 30 }}
                      className="absolute top-1 w-4 h-4 bg-white rounded-full"
                    />
                  </button>
                </div>
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsTipJarModalOpen(false)}
                    className="px-5 py-3 rounded-xl border border-white/10 text-sm font-bold hover:bg-white/5"
                  >
                    Close
                  </button>
                  <button type="button" onClick={saveTipJarSettings} className="px-5 py-3 rounded-xl bg-white text-black text-sm font-black hover:bg-rose-200">
                    Save
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isBrandCollabsModalOpen && (
          <div className="fixed inset-0 z-[391] flex items-center justify-center p-4">
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBrandCollabsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-3xl bg-[#0A0A0A] border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden"
            >
              <div className="p-6 md:p-8 space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-black tracking-tight">Brand Collabs Command Center</h3>
                    <p className="text-white/40 text-sm mt-1">Control inbound sponsorships and keep your deal pipeline moving.</p>
                  </div>
                  <button onClick={() => setIsBrandCollabsModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/40 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">Collab Contact Email</span>
                    <input
                      type="email"
                      value={monetization.brandCollabs?.contactEmail ?? ''}
                      onChange={(event) => {
                        const next = event.target.value;
                        setMonetization((prev) => ({
                          ...prev,
                          brandCollabs: {
                            enabled: prev.brandCollabs?.enabled ?? true,
                            contactEmail: next,
                            rateCardUrl: prev.brandCollabs?.rateCardUrl || '',
                            minBudgetUsd: prev.brandCollabs?.minBudgetUsd ?? 500,
                            inbox: prev.brandCollabs?.inbox ?? [],
                          },
                        }));
                      }}
                      placeholder="you@yourbrand.com"
                      className="w-full bg-[#111] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/40"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">Rate Card URL</span>
                    <input
                      type="url"
                      value={monetization.brandCollabs?.rateCardUrl ?? ''}
                      onChange={(event) => {
                        const next = event.target.value;
                        setMonetization((prev) => ({
                          ...prev,
                          brandCollabs: {
                            enabled: prev.brandCollabs?.enabled ?? true,
                            contactEmail: prev.brandCollabs?.contactEmail || DEFAULT_BRAND_COLLAB_EMAIL,
                            rateCardUrl: next,
                            minBudgetUsd: prev.brandCollabs?.minBudgetUsd ?? 500,
                            inbox: prev.brandCollabs?.inbox ?? [],
                          },
                        }));
                      }}
                      placeholder="https://..."
                      className="w-full bg-[#111] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/40"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-white/10 px-4 py-3 flex items-center justify-between">
                    <span className="text-sm text-white/70">Enable Brand Collabs on Canvas</span>
                    <button
                      type="button"
                      onClick={toggleBrandCollabsEnabled}
                      className={`w-12 h-6 rounded-full relative transition-colors ${
                        monetization.brandCollabs?.enabled ?? true ? 'bg-emerald-500' : 'bg-zinc-700'
                      }`}
                    >
                      <motion.div
                        animate={{ x: (monetization.brandCollabs?.enabled ?? true) ? 24 : 4 }}
                        transition={{ type: 'spring', stiffness: 460, damping: 30 }}
                        className="absolute top-1 w-4 h-4 bg-white rounded-full"
                      />
                    </button>
                  </div>
                  <label className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">Minimum Budget (USD)</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={monetization.brandCollabs?.minBudgetUsd ?? 500}
                      onChange={(event) => {
                        const next = Number(event.target.value);
                        setMonetization((prev) => ({
                          ...prev,
                          brandCollabs: {
                            enabled: prev.brandCollabs?.enabled ?? true,
                            contactEmail: prev.brandCollabs?.contactEmail || DEFAULT_BRAND_COLLAB_EMAIL,
                            rateCardUrl: prev.brandCollabs?.rateCardUrl || '',
                            minBudgetUsd: Number.isFinite(next) ? Math.max(0, Math.round(next)) : 0,
                            inbox: prev.brandCollabs?.inbox ?? [],
                          },
                        }));
                      }}
                      className="w-full bg-[#111] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/40"
                    />
                  </label>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-4">
                  <div>
                    <h4 className="text-base font-bold">Log Incoming Sponsor Request</h4>
                    <p className="text-xs text-white/45">Use this to quickly add inbound deals as they arrive from your live canvas.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={brandCollabForm.brand}
                      onChange={(event) => setBrandCollabForm((prev) => ({ ...prev, brand: event.target.value }))}
                      placeholder="Brand name"
                      className="w-full bg-[#111] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/40"
                    />
                    <input
                      type="text"
                      value={brandCollabForm.campaign}
                      onChange={(event) => setBrandCollabForm((prev) => ({ ...prev, campaign: event.target.value }))}
                      placeholder="Campaign"
                      className="w-full bg-[#111] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/40"
                    />
                    <input
                      type="email"
                      value={brandCollabForm.contactEmail}
                      onChange={(event) => setBrandCollabForm((prev) => ({ ...prev, contactEmail: event.target.value }))}
                      placeholder="Contact email"
                      className="w-full bg-[#111] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/40"
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={brandCollabForm.budgetUsd}
                      onChange={(event) => setBrandCollabForm((prev) => ({ ...prev, budgetUsd: event.target.value }))}
                      placeholder="Budget (USD)"
                      className="w-full bg-[#111] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/40"
                    />
                    <input
                      type="text"
                      value={brandCollabForm.timeline}
                      onChange={(event) => setBrandCollabForm((prev) => ({ ...prev, timeline: event.target.value }))}
                      placeholder="Timeline"
                      className="w-full bg-[#111] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/40"
                    />
                    <input
                      type="text"
                      value={brandCollabForm.deliverables}
                      onChange={(event) => setBrandCollabForm((prev) => ({ ...prev, deliverables: event.target.value }))}
                      placeholder="Deliverables"
                      className="w-full bg-[#111] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/40"
                    />
                  </div>
                  <textarea
                    value={brandCollabForm.notes}
                    onChange={(event) => setBrandCollabForm((prev) => ({ ...prev, notes: event.target.value }))}
                    placeholder="Notes"
                    className="w-full min-h-[80px] bg-[#111] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/40"
                  />
                  <button
                    type="button"
                    onClick={addBrandCollabDeal}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black text-sm font-black hover:bg-emerald-200"
                  >
                    <Plus className="w-4 h-4" />
                    Add Request
                  </button>
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsBrandCollabsModalOpen(false)}
                    className="px-5 py-3 rounded-xl border border-white/10 text-sm font-bold hover:bg-white/5"
                  >
                    Close
                  </button>
                  <button type="button" onClick={saveBrandCollabSettings} className="px-5 py-3 rounded-xl bg-white text-black text-sm font-black hover:bg-emerald-200">
                    Save
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isProductsSheetOpen && (
          <div className="fixed inset-0 z-[391] flex items-end sm:items-center justify-center p-4">
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProductsSheetOpen(false)}
              className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-[#0A0A0A] p-5 md:p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg md:text-xl font-black">Digital Drops</h3>
                <button onClick={() => setIsProductsSheetOpen(false)} className="p-2 rounded-full hover:bg-white/5">
                  <X className="w-4 h-4 text-white/60" />
                </button>
              </div>
              <div className="space-y-3 max-h-[58vh] overflow-auto pr-1">
                {monetization.products.length === 0 && (
                  <p className="text-sm text-white/45">No products available yet.</p>
                )}
                {monetization.products.map((product) => (
                  <div key={product.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm md:text-base truncate">{product.title}</h4>
                        <p className="text-xs text-white/45 mt-1">{product.description || 'Digital drop'}</p>
                        <span className="inline-flex mt-2 px-2 py-1 rounded-full bg-white/10 text-[10px] uppercase tracking-wider">
                          {product.category}
                        </span>
                      </div>
                      <span className="font-black text-emerald-300">${product.priceUsd.toFixed(2)}</span>
                    </div>
                    <a
                      href={product.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex px-3 py-2 rounded-xl bg-white text-black text-xs font-bold hover:bg-white/90"
                    >
                      Buy Now
                    </a>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CanvasCommandDashboard;
