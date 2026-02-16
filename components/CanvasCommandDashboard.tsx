import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  Bell,
  Box,
  Check,
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
import type { CanvasOnboardingPayload, CanvasPublishResult, CanvasTheme } from '../types';
import { saveCanvasOnboarding } from '../lib/api';

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

const RECENT_TRANSACTIONS = [
  { id: '1', user: 'Alex Rivera', amount: '$49.00', type: 'Digital Drop', status: 'completed', date: '2 mins ago' },
  { id: '2', user: 'Sarah Chen', amount: '$15.00', type: 'Tip Jar', status: 'completed', date: '1 hour ago' },
  { id: '3', user: 'Marko Polo', amount: '$299.00', type: 'Brand Collab', status: 'pending', date: '3 hours ago' },
  { id: '4', user: 'Elena Wu', amount: '$12.50', type: 'Affiliate', status: 'completed', date: '5 hours ago' },
  { id: '5', user: 'Jordan Lee', amount: '$49.00', type: 'Digital Drop', status: 'failed', date: 'Yesterday' },
] as const;

const INITIAL_MONETIZE_STREAMS: MonetizeStream[] = [
  { id: 1, title: 'Digital Drops', desc: 'Sell files, presets, or code.', icon: ShoppingBag, color: 'bg-blue-500/10 text-blue-500', action: 'Add Product' },
  { id: 2, title: 'The Tip Jar', desc: 'Accept support from fans.', icon: Heart, color: 'bg-rose-500/10 text-rose-500', action: 'Configure', toggle: true, badge: 'ON' },
  { id: 3, title: 'Brand Collabs', desc: 'Get inbound sponsorship offers.', icon: Target, color: 'bg-emerald-500/10 text-emerald-500', action: 'View Deals', badge: '2 New' },
  { id: 4, title: 'Affiliate Hub', desc: 'Recommend tools and earn.', icon: TrendingUp, color: 'bg-amber-500/10 text-amber-500', action: 'Marketplace' },
];

const INITIAL_MONETIZE_REVENUE = 12400;

const formatUsd = (value: number): string => {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const SUBSCRIBERS = [
  { id: '1', name: 'James Wilson', email: 'james.w@example.com', source: 'Tip Jar', ltv: '$145.00', avatar: 'https://i.pravatar.cc/150?u=1' },
  { id: '2', name: 'Sophia Loren', email: 'sophia.l@example.com', source: 'Digital Drop', ltv: '$49.00', avatar: 'https://i.pravatar.cc/150?u=2' },
  { id: '3', name: 'David Beckham', email: 'db7@example.com', source: 'Affiliate', ltv: '$0.00', avatar: 'https://i.pravatar.cc/150?u=3' },
  { id: '4', name: 'Mila Kunis', email: 'mila@example.com', source: 'Tip Jar', ltv: '$880.00', avatar: 'https://i.pravatar.cc/150?u=4' },
  { id: '5', name: 'Chris Evans', email: 'cap@example.com', source: 'Digital Drop', ltv: '$120.00', avatar: 'https://i.pravatar.cc/150?u=5' },
] as const;

const clickPresets = ['2.4k', '1.8k', '942', '811', '620'];

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
  if (t.includes('website') || t.includes('portfolio') || t.includes('live canvas') || t.includes('live page')) {
    return 'website';
  }
  return null;
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

  const [isTuning, setIsTuning] = useState(false);
  const [isRebooting, setIsRebooting] = useState(false);
  const [overrides, setOverrides] = useState<ThemeOverrides>({
    accentColor: resolveAccentColor(themes.find((item) => item.id === onboarding.selectedTheme)?.accent ?? '#a855f7'),
    fontFamily: 'Inter',
    cornerRadius: 16,
    bouncyMode: true,
  });
  const [monetizeStreams, setMonetizeStreams] = useState<MonetizeStream[]>(INITIAL_MONETIZE_STREAMS);
  const [monetizeTransactions, setMonetizeTransactions] = useState<MonetizeTransaction[]>(
    RECENT_TRANSACTIONS.map((entry) => ({ ...entry })),
  );
  const [monetizeRevenue, setMonetizeRevenue] = useState(INITIAL_MONETIZE_REVENUE);
  const [isTipJarEnabled, setIsTipJarEnabled] = useState(true);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [monetizeNotice, setMonetizeNotice] = useState<string | null>(null);
  const resolvedAccentColor = resolveAccentColor(overrides.accentColor);
  const accentRingSoft = hexToRgba(resolvedAccentColor, 0.32);
  const accentRingStrong = hexToRgba(resolvedAccentColor, 0.55);

  const profile = useMemo<DashboardProfile>(
    () => ({
      displayName: onboarding.profile.name || onboarding.claimedName,
      handle: `@${(publish.slug || onboarding.vanitySlug || onboarding.claimedName).replace(/^@/, '')}`,
      bio: onboarding.profile.bio || 'Creator, builder, and storyteller.',
      avatar: onboarding.profile.avatar,
    }),
    [onboarding, publish],
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

  const navItems = [
    { id: 'canvas' as const, label: 'Canvas', icon: Layers, color: 'text-blue-400' },
    { id: 'themes' as const, label: 'Themes', icon: Palette, color: 'text-purple-400' },
    { id: 'monetize' as const, label: 'Monetize', icon: DollarSign, color: 'text-emerald-400' },
    { id: 'audience' as const, label: 'Audience', icon: Users, color: 'text-orange-400' },
    { id: 'analytics' as const, label: 'Analytics', icon: BarChart3, color: 'text-blue-400' },
  ];

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isDesktopPreviewOpen) {
          setIsDesktopPreviewOpen(false);
          return;
        }
        if (isPreviewOpen) {
          setIsPreviewOpen(false);
          return;
        }
        if (isEditorOpen) {
          setIsEditorOpen(false);
          return;
        }
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isDesktopPreviewOpen, isEditorOpen, isPreviewOpen, onClose]);

  const handleThemeChange = (theme: CanvasTheme) => {
    setIsRebooting(true);
    setSelectedThemeId(theme.id);
    setOverrides((prev) => ({ ...prev, accentColor: resolveAccentColor(theme.accent) }));
    window.setTimeout(() => setIsRebooting(false), 450);
  };

  const updateOverride = <K extends keyof ThemeOverrides>(key: K, value: ThemeOverrides[K]) => {
    setOverrides((prev) => ({ ...prev, [key]: value }));
  };

  const pushDemoTransaction = (entry: Omit<MonetizeTransaction, 'id'>) => {
    const next: MonetizeTransaction = {
      ...entry,
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
    };
    setMonetizeTransactions((prev) => [next, ...prev].slice(0, 8));
  };

  const setStreamBadge = (streamId: MonetizeStream['id'], badge?: string) => {
    setMonetizeStreams((prev) =>
      prev.map((stream) => (stream.id === streamId ? { ...stream, badge } : stream)),
    );
  };

  const handleToggleTipJar = () => {
    setIsTipJarEnabled((prev) => {
      const next = !prev;
      setStreamBadge(2, next ? 'ON' : 'OFF');
      setMonetizeNotice(next ? 'Tip Jar activated for fans.' : 'Tip Jar paused.');
      return next;
    });
  };

  const handleMonetizeStreamAction = (streamId: MonetizeStream['id']) => {
    if (streamId === 1) {
      pushDemoTransaction({
        user: 'New Buyer',
        amount: '$49.00',
        type: 'Digital Drop',
        status: 'completed',
        date: 'Just now',
      });
      setMonetizeRevenue((prev) => prev + 49);
      setStreamBadge(1, '1 Added');
      setMonetizeNotice('Demo product added to Digital Drops.');
      return;
    }

    if (streamId === 2) {
      handleToggleTipJar();
      return;
    }

    if (streamId === 3) {
      pushDemoTransaction({
        user: 'Brand Partner',
        amount: '$299.00',
        type: 'Brand Collab',
        status: 'pending',
        date: 'Just now',
      });
      setMonetizeNotice('Opened collab pipeline. New inbound deal added.');
      setStreamBadge(3, '1 New');
      return;
    }

    pushDemoTransaction({
      user: 'Affiliate Network',
      amount: '$12.50',
      type: 'Affiliate',
      status: 'completed',
      date: 'Just now',
    });
    setMonetizeRevenue((prev) => prev + 12.5);
    setMonetizeNotice('Affiliate marketplace synced with demo payout.');
  };

  const handleWithdrawFunds = () => {
    if (isWithdrawing) {
      return;
    }

    setIsWithdrawing(true);
    setMonetizeNotice('Processing payout transfer...');

    const pendingId = `${Date.now()}-withdraw`;
    const pendingEntry: MonetizeTransaction = {
      id: pendingId,
      user: 'VibeJam Payout',
      amount: '$2,000.00',
      type: 'Withdrawal',
      status: 'pending',
      date: 'Just now',
    };
    setMonetizeTransactions((prev) => [pendingEntry, ...prev].slice(0, 8));

    window.setTimeout(() => {
      setMonetizeTransactions((prev) =>
        prev.map((item) => (item.id === pendingId ? { ...item, status: 'completed', date: 'A few seconds ago' } : item)),
      );
      setMonetizeRevenue((prev) => Math.max(0, prev - 2000));
      setIsWithdrawing(false);
      setMonetizeNotice('Payout completed successfully.');
    }, 1000);
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

  const previewLinks = links.slice(0, 5);

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

      <div className="space-y-4">
        {links.length > 0 ? (
          links.map((link, i) => (
            <motion.div
              key={link.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex flex-col sm:flex-row sm:items-center gap-4 md:gap-6 p-5 md:p-6 rounded-3xl bg-[#111] border border-white/5 hover:border-white/20 transition-all group"
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
    const growthValue = 12 + Math.round(((monetizeRevenue - INITIAL_MONETIZE_REVENUE) / Math.max(1, INITIAL_MONETIZE_REVENUE)) * 100);
    const growthLabel = `${growthValue >= 0 ? '+' : ''}${growthValue}% vs last`;

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
            disabled={isWithdrawing}
            className={`w-full md:w-auto bg-white text-black font-black px-8 py-4 rounded-2xl transition-all shadow-[0_20px_40px_-10px_rgba(255,255,255,0.1)] text-sm md:text-base ${
              isWithdrawing ? 'opacity-70 cursor-not-allowed' : 'hover:bg-emerald-400'
            }`}
          >
            {isWithdrawing ? 'Processing...' : 'Withdraw Funds'}
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
                      ? (isTipJarEnabled ? 'bg-emerald-500/20 text-emerald-500' : 'bg-zinc-500/20 text-zinc-300')
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
                      isTipJarEnabled ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-zinc-700'
                    }`}
                  >
                    <motion.div
                      animate={{ x: isTipJarEnabled ? 24 : 4 }}
                      transition={{ type: 'spring', stiffness: 460, damping: 30 }}
                      className="absolute top-1 w-4 h-4 bg-white rounded-full"
                    />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-bold">Recent Transactions</h3>
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
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition-all font-bold text-sm">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-purple-600 text-white transition-all font-bold text-sm shadow-xl shadow-purple-500/20 hover:bg-purple-500">
            <Mail className="w-4 h-4" />
            Send Blast
          </button>
        </div>
      </header>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#0A0A0A] border border-white/5 rounded-2xl gap-4">
        <div className="flex items-center gap-5 overflow-x-auto whitespace-nowrap">
          <div className="flex items-center gap-2 text-white/40 text-[10px] font-bold uppercase tracking-widest cursor-pointer hover:text-white">
            <Filter className="w-3 h-3" />
            Filters
          </div>
          <div className="h-4 w-px bg-white/10 hidden sm:block" />
          <div className="flex gap-2">
            {['All', 'Buyers', 'Waitlist', 'Subscribers'].map((item) => (
              <span key={item} className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter cursor-pointer transition-colors ${item === 'All' ? 'bg-white text-black' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
                {item}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 text-white/30 text-[10px] uppercase font-bold">
          <UserPlus className="w-3 h-3" />
          42,902 Total
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
              {SUBSCRIBERS.map((sub) => (
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
                    <button className="p-2 rounded-lg hover:bg-white/5 text-white/20 hover:text-white transition-colors">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-6 md:p-8 border-t border-white/5 flex justify-center">
          <button className="text-[10px] uppercase font-black tracking-[0.3em] text-white/30 hover:text-white transition-colors">
            Load More Commandos
          </button>
        </div>
      </div>
    </div>
  );

  const renderAnalyticsView = () => {
    const stats = [
      { label: 'Total Views', value: '482.1k', change: '+24%', icon: Eye, color: 'text-blue-400' },
      { label: 'Avg. Clicks', value: '12.4k', change: '+8%', icon: MousePointer2, color: 'text-purple-400' },
      { label: 'Retention', value: '64%', change: '+2%', icon: Clock, color: 'text-emerald-400' },
      { label: 'New Subs', value: '1,204', change: '+15%', icon: Users, color: 'text-amber-400' },
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
              <p className="text-xs text-white/30">Daily traffic volume vs user engagement.</p>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 rounded-full bg-white text-black text-[10px] font-bold uppercase tracking-widest">7 Days</button>
              <button className="px-4 py-2 rounded-full bg-white/5 text-white/40 text-[10px] font-bold uppercase tracking-widest hover:text-white transition-colors">30 Days</button>
            </div>
          </div>

          <div className="h-[280px] md:h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ANALYTICS_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
  const previewFamily = useMemo(
    () => getThemePreviewFamily(selectedThemeId ?? selectedTheme?.id ?? 'midnight-zenith'),
    [selectedTheme?.id, selectedThemeId],
  );
  const previewLinksRecord = useMemo(() => {
    const next: Record<string, string> = { ...onboarding.links };

    for (const link of links) {
      const normalized = normalizePreviewUrl(link.url);
      if (!normalized) {
        continue;
      }

      const inferredKey = inferLinkKeyFromTitle(link.title);
      if (inferredKey) {
        next[inferredKey] = normalized;
      }

      // Keep at least one generic destination in sync with the canvas list.
      if (!next.website) {
        next.website = normalized;
      }
    }

    if (!next.website) {
      next.website = publish.url;
    }

    return next;
  }, [links, onboarding.links, publish.url]);

  const handleOpenLivePage = async () => {
    if (isOpeningLivePage) {
      return;
    }

    setIsOpeningLivePage(true);
    const liveSlug = sanitizeLiveSlug(publish.slug || onboarding.vanitySlug || onboarding.claimedName);
    const liveUrl = `https://vibejam.co/${liveSlug || 'beacons'}`;
    const liveWindow = window.open(liveUrl, '_blank');

    const payload: CanvasOnboardingPayload = {
      claimedName: onboarding.claimedName,
      vanitySlug: publish.slug || onboarding.vanitySlug || onboarding.claimedName,
      profile: onboarding.profile,
      selectedTheme: selectedThemeId ?? onboarding.selectedTheme,
      selectedTemplateId: onboarding.selectedTemplateId,
      selectedSignals: onboarding.selectedSignals,
      links: previewLinksRecord,
    };

    try {
      const nextPublish = await saveCanvasOnboarding(payload);
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

  const renderThemeViewportForId = (themeId: string, mode: PreviewMode): React.ReactNode => {
    if (themeId === 'isometric-loft-profile') {
      return (
        <div className="h-full overflow-auto bg-[#f8f1e5]">
          <IsometricLoftApp forcedViewport={mode} />
        </div>
      );
    }
    if (themeId === 'kinetic-variable-profile') {
      return (
        <div className="h-full overflow-auto bg-black">
          <KineticVariableApp forcedViewport={mode} />
        </div>
      );
    }
    if (themeId === 'orbital-lens-spatial-link-in-bio') {
      return (
        <div className="h-full overflow-auto bg-[#07071a]">
          <OrbitalLensApp forcedViewport={mode} />
        </div>
      );
    }
    if (themeId === 'vapor-os') {
      return (
        <div className="h-full overflow-auto bg-[#210938]">
          <VaporOsApp forcedViewport={mode} />
        </div>
      );
    }

    if (themeId.startsWith('collection-')) {
      const collectionId = themeId.replace('collection-', '');
      switch (collectionId) {
        case 'gold-standard':
          return (
            <div className="h-full overflow-auto bg-[#0A0A0A]">
              <GoldStandardCollectionApp forcedViewport={mode} />
            </div>
          );
        case 'accordion-deck':
          return (
            <div className="h-full overflow-auto bg-[#A9A8AF]">
              <AccordionDeckCollectionApp forcedViewport={mode} />
            </div>
          );
        case 'collage-os':
          return (
            <div className="h-full overflow-auto bg-[#E5E1D5]">
              <CollageOsCollectionApp forcedViewport={mode} />
            </div>
          );
        case 'terrarium':
          return (
            <div className="h-full overflow-auto bg-[#F7EFC8]">
              <TerrariumCollectionApp forcedViewport={mode} />
            </div>
          );
        case 'prism-os':
          return (
            <div className="h-full overflow-auto bg-[#0F1115]">
              <PrismOsCollectionApp forcedViewport={mode} />
            </div>
          );
        case 'aero-canvas':
          return (
            <div className="h-full overflow-auto bg-[#FAFAFA]">
              <AeroCanvasCollectionApp forcedViewport={mode} />
            </div>
          );
        default:
          break;
      }
    }

    const family = getThemePreviewFamily(themeId);
    switch (family) {
      case 'editorial':
        return (
          <div className={`h-full ${mode === 'mobile' ? 'overflow-hidden' : 'overflow-auto'} bg-[#F0F0F0]`}>
            <EditorialKineticProfile isMobilePreview={mode === 'mobile'} />
          </div>
        );
      case 'creator':
        return (
          <div className="h-full overflow-auto bg-[#FDFBF7]">
            <CreatorHubApp
              forcedViewport={mode}
              profileOverride={{
                name: onboarding.profile.name,
                bio: onboarding.profile.bio,
                avatar: onboarding.profile.avatar,
              }}
              linksOverride={previewLinksRecord}
              slugOverride={publish.slug}
            />
          </div>
        );
      case 'aurora':
        return (
          <div className="h-full overflow-auto bg-[#F0F4F8]">
            <EtherealLiquidApp forcedViewport={mode} />
          </div>
        );
      case 'glass':
        return (
          <div className="h-full overflow-auto bg-[#050505]">
            <GlassArtifactApp forcedViewport={mode} />
          </div>
        );
      case 'midnight':
      default:
        return (
          <div className="h-full overflow-auto bg-[#050505]">
            <MidnightZenithApp forcedViewport={mode} />
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
    return (
      <div className={`relative w-[300px] h-[610px] group ${fontClass}`}>
        <div className="absolute inset-0 bg-neutral-900 rounded-[3rem] border-[8px] border-neutral-800 shadow-[0_0_60px_-15px_rgba(0,0,0,1)] overflow-hidden">
          <div className={`relative h-full w-full overflow-hidden transition-all duration-700 ${isRebooting ? 'opacity-0 scale-95 blur-xl' : 'opacity-100 scale-100 blur-0'}`}>
            <div className="absolute inset-0 overflow-hidden bg-black">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-b-2xl z-50" />
              <motion.div
                className="h-full w-full"
                style={{
                  borderRadius: `${Math.max(10, overrides.cornerRadius + 6)}px`,
                  boxShadow: `inset 0 0 0 1px ${hexToRgba(resolvedAccentColor, 0.22)}`,
                }}
                animate={overrides.bouncyMode ? { scale: [1, 1.008, 1] } : { scale: 1 }}
                transition={overrides.bouncyMode ? { duration: 2.6, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.2 }}
              >
                {renderLiveThemeViewport('mobile')}
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
    return (
      <div className={`w-[min(94vw,1200px)] h-[min(86vh,820px)] bg-neutral-900 rounded-3xl border border-white/10 shadow-2xl overflow-hidden relative ${fontClass}`}>
        <div className="h-12 bg-black/50 border-b border-white/5 flex items-center px-4 gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/40" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/40" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/40" />
          </div>
          <div className="mx-auto flex items-center gap-2 px-3 py-1 bg-white/5 rounded-md text-[10px] text-white/30">
            vibejam.co/{publish.slug}
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
            {renderLiveThemeViewport('desktop')}
          </motion.div>
        </div>
      </div>
    );
  };

  return (
    <div className={`fixed inset-0 z-[380] h-[100dvh] w-screen bg-[#050505] text-white overflow-hidden ${fontClass}`}>
      <div className="h-16 border-b border-white/5 bg-black/80 backdrop-blur-xl px-4 md:px-8">
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
            <button type="button" className="text-zinc-400 hover:text-white transition-colors">
              <Search className="w-5 h-5" />
            </button>
            <div className="hidden xs:block w-[1px] h-4 bg-white/10" />
            <button
              type="button"
              onClick={onOpenStartJam}
              className="hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/20 text-xs font-bold hover:bg-white hover:text-black transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Start Jam
            </button>
            <button
              type="button"
              onClick={onToggleNotifications}
              className="relative p-1 transition-transform hover:scale-110 active:scale-95"
            >
              <Bell className={`w-5 h-5 transition-colors ${isNotificationsOpen ? 'text-white' : 'text-zinc-400'}`} />
              {unreadCount > 0 && <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-cyan-400 border-2 border-black" />}
            </button>
            <button
              type="button"
              onClick={onOpenProfile}
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
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/40 hover:bg-white/5 hover:text-white transition-all text-sm font-medium">
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
    </div>
  );
};

export default CanvasCommandDashboard;
