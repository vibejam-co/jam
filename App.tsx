
import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bell, Plus, ChevronDown, LayoutGrid, Globe, Zap, Heart, MessageSquare } from 'lucide-react';
import { APPS as INITIAL_APPS, NOTIFICATIONS as INITIAL_NOTIFICATIONS } from './constants';
import { VibeApp, Notification, InboxConversationSummary } from './types';
import FeedRow from './components/FeedRow';
import MarketRail from './components/MarketRail';
import JamDetailView from './components/JamDetailView';
import MarketplaceView from './components/MarketplaceView';
import StartJamModal from './components/StartJamModal';
import ListAppModal from './components/ListAppModal';
import ProfileView from './components/ProfileView';
import AuthModal from './components/AuthModal';
import NotificationCenter from './components/NotificationCenter';
import InboxQuickCenter from './components/InboxQuickCenter';
import NewsletterSection from './components/NewsletterSection';
import Footer from './components/Footer';
import LegalModal from './components/LegalModal';
import CanvasPublicPage from './components/CanvasPublicPage';
import DealRoomView from './components/DealRoomView';
import {
  addWishlistItem,
  connectMarketplaceAsset,
  createMarketplaceAssetDraft,
  deleteJam,
  fetchApps,
  fetchInboxConversations,
  fetchMyMarketplaceAssets,
  fetchNotifications,
  generateMarketplaceAssetDeck,
  fetchProfileMarketplaceSummary,
  publishMarketplaceAsset,
  publishApp,
  removeWishlistItem,
  updateMarketplaceAssetFinancials,
  updateMarketplaceAssetTraffic,
} from './lib/api';
import { supabase } from './lib/supabase-client';
import type { User } from '@supabase/supabase-js';

// Quick filters remain as the high-traffic entry points
const QUICK_FILTERS = ['All', 'AI', 'SaaS', 'Crypto', 'Marketplace'];

// The extensive list provided by the user
const ALL_CATEGORIES = [
  "Ai", "Analytics", "Community", "Content Creation", "Crypto", 
  "Customer Support", "Design Tools", "Developer Tools", "Ecommerce", 
  "Education", "Entertainment", "Fintech", "Games", "Health", 
  "IoT", "Legal", "Marketing", "Marketplace", "Mobile Apps", 
  "News & Magazines", "No-Code", "Productivity", "Real Estate", 
  "Recruiting & HR", "SaaS", "Sales", "Security", "Social Media", 
  "Travel", "Utilities"
];

const normalizeCategoryToken = (value: string): string =>
  String(value ?? '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');

const matchesCategoryToken = (candidate: string, selected: string): boolean => {
  const candidateNormalized = normalizeCategoryToken(candidate);
  const selectedNormalized = normalizeCategoryToken(selected);

  if (!candidateNormalized || !selectedNormalized) {
    return false;
  }

  if (candidateNormalized === selectedNormalized) {
    return true;
  }

  const compactCandidate = candidateNormalized.replace(/\s+/g, '');
  const compactSelected = selectedNormalized.replace(/\s+/g, '');

  return (
    compactCandidate === compactSelected
    || compactCandidate.includes(compactSelected)
    || compactSelected.includes(compactCandidate)
  );
};

const isMarketplaceRankedApp = (app: VibeApp): boolean => {
  const tags = Array.isArray(app.tags) ? app.tags : [];
  return Boolean(
    app.isForSale
    || app.publishToMarketplace
    || app.marketplaceAssetId
    || app.askingPrice
    || app.marketplaceAskingPriceUsd
    || tags.some((tag) => matchesCategoryToken(tag, 'for sale') || matchesCategoryToken(tag, 'marketplace'))
  );
};

const appMatchesRankingFilter = (app: VibeApp, activeFilter: string): boolean => {
  if (activeFilter === 'All') {
    return true;
  }

  if (activeFilter === 'Marketplace') {
    return isMarketplaceRankedApp(app);
  }

  const tagCandidates = Array.isArray(app.tags) ? app.tags : [];
  const candidates = [app.category, ...tagCandidates].filter(Boolean);
  return candidates.some((candidate) => matchesCategoryToken(candidate, activeFilter));
};

const RESERVED_PUBLIC_PATHS = new Set(['', 'rankings', 'marketplace', 'canvas']);

const isImageIconSource = (value: string | undefined | null): boolean => {
  const normalized = String(value ?? '').trim().toLowerCase();
  return (
    normalized.startsWith('data:image/')
    || normalized.startsWith('https://')
    || normalized.startsWith('http://')
    || normalized.startsWith('blob:')
    || normalized.startsWith('/')
  );
};

const extractPitchDeckCoverImage = (pitchDecks: VibeApp['pitchDecks'] | null | undefined): string | null => {
  if (!pitchDecks || !Array.isArray(pitchDecks.slides)) {
    return null;
  }
  const cover = pitchDecks.slides.find((slide) => typeof slide.imageUrl === 'string' && slide.imageUrl.trim().length > 0);
  return cover?.imageUrl ?? null;
};

const resolveMarketplaceProfitMarginPercent = (app: Partial<VibeApp>): number => {
  const direct = typeof app.profitMargin === 'number' && Number.isFinite(app.profitMargin)
    ? app.profitMargin
    : null;
  if (direct !== null) {
    return Math.max(0, Math.min(100, direct));
  }

  const fromBps = typeof app.profitMarginBps === 'number' && Number.isFinite(app.profitMarginBps)
    ? app.profitMarginBps / 100
    : null;
  if (fromBps !== null) {
    return Math.max(0, Math.min(100, fromBps));
  }

  return 0;
};

const getPublicSlugFromPath = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.location.pathname || '/';
  const cleaned = raw.replace(/^\/+|\/+$/g, '').toLowerCase();
  if (!cleaned || cleaned.includes('/') || RESERVED_PUBLIC_PATHS.has(cleaned) || cleaned.startsWith('api')) {
    return null;
  }
  if (!/^[a-z0-9-]+$/.test(cleaned)) {
    return null;
  }
  return cleaned;
};

const getDealRoomOfferIdFromPath = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const match = (window.location.pathname || '').match(/^\/deal-room\/([^/?#]+)$/i);
  if (!match || !match[1]) {
    return null;
  }

  return decodeURIComponent(match[1]).trim() || null;
};

const App: React.FC = () => {
  const [dealRoomOfferId] = useState<string | null>(() => getDealRoomOfferIdFromPath());
  const [publicSlug] = useState<string | null>(() => getPublicSlugFromPath());
  const [activeTab, setActiveTab] = useState<'Rankings' | 'Marketplace'>('Rankings');
  const [filter, setFilter] = useState<string>('All');
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<VibeApp | null>(null);
  const [apps, setApps] = useState<VibeApp[]>(INITIAL_APPS);
  const [wishlist, setWishlist] = useState<VibeApp[]>(INITIAL_APPS.slice(0, 2));
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const [isStartJamOpen, setIsStartJamOpen] = useState(false);
  const [isListAppOpen, setIsListAppOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileFocusConversationId, setProfileFocusConversationId] = useState<string | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isInboxQuickOpen, setIsInboxQuickOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [profileInboxBadgeCount, setProfileInboxBadgeCount] = useState(0);
  const [quickInboxThreads, setQuickInboxThreads] = useState<InboxConversationSummary[]>([]);
  const [quickInboxLoading, setQuickInboxLoading] = useState(false);
  const [quickInboxError, setQuickInboxError] = useState<string | null>(null);
  const visibleMainTabs: Array<'Rankings' | 'Marketplace'> = ['Rankings', 'Marketplace'];
  
  // Legal & Support State
  const [legalModalTab, setLegalModalTab] = useState<'Terms' | 'Privacy' | 'FAQ' | 'Support' | null>(null);

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      try {
        const [remoteApps, remoteNotifications] = await Promise.all([
          fetchApps(),
          fetchNotifications(),
        ]);

        if (cancelled) {
          return;
        }

        if (remoteApps.length > 0) {
          setApps(remoteApps);
          setWishlist(remoteApps.slice(0, 2));
        }

        if (remoteNotifications.length > 0) {
          setNotifications(remoteNotifications);
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : 'Failed to load backend data.');
        }
      }
    };

    hydrate();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) {
        return;
      }
      setAuthUser(data.session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null);
      if (session?.user) {
        setIsAuthOpen(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!authUser) {
      setProfileInboxBadgeCount(0);
      return;
    }

    let cancelled = false;

    const refreshInboxBadge = async () => {
      try {
        const response = await fetchProfileMarketplaceSummary();
        const unread = Number(response?.stats?.unreadInboxCount ?? 0);
        if (!cancelled) {
          setProfileInboxBadgeCount(Math.max(0, unread));
        }
      } catch {
        if (!cancelled) {
          setProfileInboxBadgeCount(0);
        }
      }
    };

    void refreshInboxBadge();
    const interval = window.setInterval(() => {
      void refreshInboxBadge();
    }, 15000);

    const handleRefresh = () => {
      void refreshInboxBadge();
    };

    window.addEventListener('profile:refresh-marketplace', handleRefresh as EventListener);
    window.addEventListener('marketplace:refresh', handleRefresh as EventListener);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener('profile:refresh-marketplace', handleRefresh as EventListener);
      window.removeEventListener('marketplace:refresh', handleRefresh as EventListener);
    };
  }, [authUser]);

  useEffect(() => {
    if (!authUser) {
      setQuickInboxThreads([]);
      setQuickInboxLoading(false);
      setQuickInboxError(null);
      setIsInboxQuickOpen(false);
      setIsNotificationsOpen(false);
      return;
    }

    let cancelled = false;

    const refreshQuickInbox = async (options?: { silent?: boolean }) => {
      if (!options?.silent) {
        setQuickInboxLoading(true);
      }
      try {
        const response = await fetchInboxConversations();
        if (cancelled) {
          return;
        }
        setQuickInboxThreads(Array.isArray(response.items) ? response.items : []);
        setQuickInboxError(null);
      } catch (error) {
        if (!cancelled) {
          setQuickInboxError(error instanceof Error ? error.message : 'Failed to load inbox.');
        }
      } finally {
        if (!cancelled && !options?.silent) {
          setQuickInboxLoading(false);
        }
      }
    };

    void refreshQuickInbox();

    const interval = window.setInterval(() => {
      void refreshQuickInbox({ silent: true });
    }, 15000);

    const handleRefresh = () => {
      void refreshQuickInbox({ silent: true });
    };

    window.addEventListener('profile:refresh-marketplace', handleRefresh as EventListener);
    window.addEventListener('marketplace:refresh', handleRefresh as EventListener);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener('profile:refresh-marketplace', handleRefresh as EventListener);
      window.removeEventListener('marketplace:refresh', handleRefresh as EventListener);
    };
  }, [authUser]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleProfileFocusConversation = (event: Event) => {
      const custom = event as CustomEvent<{ conversationId?: string }>;
      const nextConversationId = custom.detail?.conversationId ?? null;

      if (!authUser) {
        setIsAuthOpen(true);
        return;
      }

      setIsProfileOpen(true);
      setActiveTab('Marketplace');
      setProfileFocusConversationId(nextConversationId);
    };

    window.addEventListener('profile:focus-conversation', handleProfileFocusConversation as EventListener);
    return () => {
      window.removeEventListener('profile:focus-conversation', handleProfileFocusConversation as EventListener);
    };
  }, [authUser]);

  const filteredApps = useMemo(
    () => apps.filter((app) => appMatchesRankingFilter(app, filter)),
    [apps, filter],
  );

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const authEmail = authUser?.email ?? '';
  const avatarUrl =
    (authUser?.user_metadata?.avatar_url as string | undefined) ||
    (authUser?.user_metadata?.picture as string | undefined) ||
    'https://picsum.photos/id/64/100/100';
  const displayName =
    (authUser?.user_metadata?.full_name as string | undefined) ||
    (authUser?.user_metadata?.name as string | undefined) ||
    (authEmail ? authEmail.split('@')[0] : 'Guest');
  const handle = authEmail ? `@${authEmail.split('@')[0]}` : '@guest';
  const myProfileJams = useMemo(() => {
    if (!authUser) {
      return [] as VibeApp[];
    }

    const email = authEmail.trim().toLowerCase();
    const normalizedHandle = handle.trim().toLowerCase();
    const matched = apps.filter((app) => {
      const founderEmail = String(app?.founder?.email ?? '').trim().toLowerCase();
      const founderHandle = String(app?.founder?.handle ?? '').trim().toLowerCase();
      return Boolean(
        (email && founderEmail && founderEmail === email)
        || (normalizedHandle && founderHandle && founderHandle === normalizedHandle),
      );
    });

    const seen = new Set<string>();
    return matched.filter((app) => {
      const key = String(app.id || `${app.name}-${app.founder?.handle || ''}`).trim();
      if (!key || seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    }).map((app) => ({
      ...app,
      isOwnerListing: true,
    }));
  }, [apps, authEmail, authUser, handle]);

  const normalizeAssetKey = (value: string | undefined | null): string =>
    String(value ?? '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');

  const findExistingMarketplaceAssetId = async (sourceApp: VibeApp): Promise<string | null> => {
    try {
      const response = await fetchMyMarketplaceAssets();
      const items = Array.isArray(response.items) ? response.items : [];
      const sourceJamId = String(sourceApp.id ?? '').trim();

      if (sourceJamId) {
        const byJamId = items.find(
          (item) => String((item as any)?.jamId ?? '').trim() === sourceJamId,
        );
        if (byJamId?.id) {
          return String(byJamId.id);
        }
      }

      const targetName = normalizeAssetKey(sourceApp.name);
      if (targetName) {
        const byName = items.find((item) => normalizeAssetKey(item.name) === targetName);
        if (byName?.id) {
          return String(byName.id);
        }
      }
    } catch {
      return null;
    }

    return null;
  };

  const resolveMarketplaceAssetIdForPublish = async (
    sourceApp: VibeApp,
    founderEmail: string,
  ): Promise<string> => {
    const existingDraftId = String(sourceApp.marketplaceDraftAssetId ?? '').trim();
    if (existingDraftId) {
      return existingDraftId;
    }

    try {
      const draftResponse = await createMarketplaceAssetDraft({
        name: sourceApp.name,
        tagline: sourceApp.pitch || `${sourceApp.name} is now open for acquisition.`,
        description: sourceApp.solution || sourceApp.pitch || `${sourceApp.name} is now open for acquisition.`,
        logoUrl: isImageIconSource(sourceApp.icon) ? sourceApp.icon : undefined,
        category: sourceApp.category,
        founderName: sourceApp.founder.name,
        founderEmail,
        isAnonymous: Boolean(sourceApp.isAnonymous),
        visibility: sourceApp.marketplaceVisibility ?? 'public',
        techStack: sourceApp.techStack ?? [],
        jamId: sourceApp.id,
      });

      const draftAsset = draftResponse.asset as { id?: string } | undefined;
      const resolvedId = String(draftAsset?.id ?? '').trim();
      if (resolvedId) {
        return resolvedId;
      }
    } catch (error) {
      const existingAssetId = await findExistingMarketplaceAssetId(sourceApp);
      if (existingAssetId) {
        return existingAssetId;
      }
      throw error;
    }

    const existingAssetId = await findExistingMarketplaceAssetId(sourceApp);
    if (existingAssetId) {
      return existingAssetId;
    }

    throw new Error('Marketplace draft was created without an asset id.');
  };

  const publishJamToMarketplace = async (sourceApp: VibeApp) => {
    if (!authUser) {
      setLoadError('Sign in to publish this jam to Marketplace.');
      return;
    }

    const founderEmail = sourceApp.founder.email ?? authEmail;
    if (!founderEmail) {
      setLoadError('Founder email is required to publish this jam to Marketplace.');
      return;
    }

    setLoadError(null);

    const askingPriceUsd =
      sourceApp.marketplaceAskingPriceUsd
      || sourceApp.askingPrice?.replace(/[^0-9.]/g, '')
      || String(Math.max(5000, Math.round((sourceApp.monthlyRevenue || 0) * 48)));

    try {
      const draftAssetId = await resolveMarketplaceAssetIdForPublish(sourceApp, founderEmail);

      const publishResponse = await publishMarketplaceAsset(draftAssetId, {
        askingPriceUsd,
        profitMarginPercent: resolveMarketplaceProfitMarginPercent(sourceApp),
        tier: sourceApp.marketplaceBoostTierId ?? 'free',
        visibility: sourceApp.marketplaceVisibility ?? 'public',
      });

      if ('requiresPayment' in publishResponse && publishResponse.requiresPayment) {
        throw new Error('Boost payment is required before this marketplace listing can go live.');
      }

      const enrichedApp: VibeApp = {
        ...sourceApp,
        isForSale: true,
        marketplaceAssetId: publishResponse.assetId,
        askingPrice: `$${askingPriceUsd}`,
        marketplaceVerifiedStatus: publishResponse.verifiedStatus,
        valuationMultipleX100: publishResponse.valuationMultipleX100 ?? null,
        boostTier: 'Free',
        isOwnerListing: true,
      };

      setApps((prev) =>
        prev.map((item) => (item.id === sourceApp.id ? { ...item, ...enrichedApp } : item)),
      );
      setSelectedApp((prev) => (prev && prev.id === sourceApp.id ? { ...prev, ...enrichedApp } : prev));
      setActiveTab('Marketplace');

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('marketplace:refresh'));
        window.dispatchEvent(new CustomEvent('marketplace:listing-published'));
        window.dispatchEvent(new CustomEvent('profile:refresh-marketplace'));
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? `Marketplace publish failed: ${error.message}`
          : 'Marketplace publish failed due to an unknown error.';
      setLoadError(message);
      throw new Error(message);
    }
  };

  const handleDeleteJam = async (app: VibeApp) => {
    const jamId = String(app.id || '').trim();
    if (!jamId) {
      setLoadError('Missing jam id. Unable to delete this jam.');
      return;
    }

    setLoadError(null);

    try {
      const nextApps = await deleteJam(jamId);
      if (Array.isArray(nextApps) && nextApps.length > 0) {
        setApps(nextApps);
      } else {
        setApps((prev) => prev.filter((item) => item.id !== jamId));
      }
      setWishlist((prev) => prev.filter((item) => item.id !== jamId));
      setSelectedApp((prev) => (prev?.id === jamId ? null : prev));

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('marketplace:refresh'));
        window.dispatchEvent(new CustomEvent('profile:refresh-marketplace'));
      }
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Failed to delete jam.');
    }
  };

  const handlePublishJam = async (newApp: VibeApp) => {
    if (isPublishing) {
      return;
    }

    setIsPublishing(true);
    setLoadError(null);
    const shouldAttemptMarketplacePublish =
      newApp.publishSource === 'start-jam' && Boolean(newApp.publishToMarketplace);
    const startJamMarketplaceIntent: Partial<VibeApp> = shouldAttemptMarketplacePublish
      ? {
          publishSource: 'start-jam',
          publishToMarketplace: true,
          marketplaceAskingPriceUsd: newApp.marketplaceAskingPriceUsd,
          marketplaceVisibility: newApp.marketplaceVisibility,
          marketplaceFounderPublic: newApp.marketplaceFounderPublic,
          marketplaceProfitMarginPercent: newApp.marketplaceProfitMarginPercent,
          marketplaceBoostTierId: newApp.marketplaceBoostTierId,
          includePitchDeck: newApp.includePitchDeck,
          pitchDecks: newApp.pitchDecks,
          pitchDeckCoverImageUrl: newApp.pitchDeckCoverImageUrl,
          marketplaceDraftAssetId: newApp.marketplaceDraftAssetId,
        }
      : {};
    const rankingsPublishApp: VibeApp = shouldAttemptMarketplacePublish
      ? {
          ...newApp,
          isForSale: false,
          askingPrice: undefined,
          profitMargin: undefined,
          isAnonymous: undefined,
          boostTier: undefined,
          marketplaceAssetId: undefined,
          valuationMultipleX100: null,
          marketplaceVerifiedStatus: 'unverified',
          isOwnerListing: false,
        }
      : newApp;

    const upsertLocalApp = (incoming: VibeApp) => {
      setApps((prev) => {
        const withoutExisting = prev.filter((item) => item.id !== incoming.id);
        const next = [incoming, ...withoutExisting];
        return next.map((item, index) => ({
          ...item,
          rank: String(index + 1).padStart(2, '0'),
          rankValue: index + 1,
        }));
      });
    };

    let publishedApp: VibeApp = {
      ...newApp,
      ...rankingsPublishApp,
    };

    try {
      const publishedApps = await publishApp(rankingsPublishApp);
      if (publishedApps.length > 0) {
        setApps(publishedApps);
        const matched = publishedApps.find((item) => item.id === newApp.id || item.name === newApp.name);
        if (matched) {
          publishedApp = { ...newApp, ...matched, ...startJamMarketplaceIntent };
        }
      } else {
        upsertLocalApp(rankingsPublishApp);
      }
    } catch (error) {
      // Fallback to local state to avoid a dead-end UX when backend is unavailable.
      upsertLocalApp(rankingsPublishApp);
      setLoadError(error instanceof Error ? error.message : 'Publish failed on backend; saved locally only.');
    }

    const shouldPublishToMarketplace = shouldAttemptMarketplacePublish;

    if (shouldPublishToMarketplace) {
      const founderEmail = publishedApp.founder.email ?? authEmail;
      const askingPriceUsd =
        publishedApp.marketplaceAskingPriceUsd
        || publishedApp.askingPrice?.replace(/[^0-9.]/g, '')
        || String(Math.max(5000, Math.round((publishedApp.monthlyRevenue || 0) * 48)));

      if (!authUser) {
        setLoadError('Jam published to Rankings. Sign in to publish this jam to Marketplace.');
      } else if (!founderEmail) {
        setLoadError('Jam published to Rankings. Founder email is required for Marketplace listing.');
      } else {
        try {
          const draftAssetId = await resolveMarketplaceAssetIdForPublish(publishedApp, founderEmail);
          const provider = publishedApp.verificationProvider;
          const providerApiKey = String(publishedApp.verificationApiKey ?? '').trim();
          const providerAccountId = String(publishedApp.verificationProviderAccountId ?? '').trim();

          if (provider && providerApiKey) {
            const connectResponse = await connectMarketplaceAsset(draftAssetId, {
              provider,
              apiKey: providerApiKey,
              providerAccountId: providerAccountId || undefined,
              isAnonymous: Boolean(publishedApp.isAnonymous),
            });

            if (connectResponse.metrics) {
              publishedApp = {
                ...publishedApp,
                monthlyRevenue: Math.max(
                  0,
                  Math.round(Number(connectResponse.metrics.mrrCents || 0) / 100),
                ),
                growth: Number(
                  (Number(connectResponse.metrics.last30dGrowthBps || 0) / 100).toFixed(2),
                ),
                activeUsers: Math.max(
                  0,
                  Number(connectResponse.metrics.activeSubscribers || publishedApp.activeUsers || 0),
                ),
              };
            }
          }

          const publishResponse = await publishMarketplaceAsset(draftAssetId, {
            askingPriceUsd,
            profitMarginPercent: resolveMarketplaceProfitMarginPercent(publishedApp),
            tier: publishedApp.marketplaceBoostTierId ?? 'free',
            visibility: publishedApp.marketplaceVisibility ?? 'public',
          });

          if ('requiresPayment' in publishResponse && publishResponse.requiresPayment) {
            throw new Error('Boost payment is required before this marketplace listing can go live.');
          }

          const operatingExpensesUsd = Number(publishedApp.monthlyOperatingExpensesUsd);
          if (Number.isFinite(operatingExpensesUsd) && operatingExpensesUsd >= 0) {
            try {
              await updateMarketplaceAssetFinancials(draftAssetId, {
                operatingExpenses: operatingExpensesUsd,
                expenseBreakdown: '',
              });
            } catch {
              // Non-blocking metadata sync.
            }
          }

          const monthlyVisitors = Number(publishedApp.monthlyUniqueVisitors ?? publishedApp.activeUsers ?? 0);
          const analyticsProofUrl = String(publishedApp.analyticsProofUrl ?? '').trim();
          if ((Number.isFinite(monthlyVisitors) && monthlyVisitors > 0) || analyticsProofUrl) {
            try {
              await updateMarketplaceAssetTraffic(draftAssetId, {
                monthlyUniqueVisitors: Math.max(0, Math.round(monthlyVisitors || 0)),
                analyticsProofUrl: analyticsProofUrl || undefined,
              });
            } catch {
              // Non-blocking metadata sync.
            }
          }

          let pitchDeckCoverImageUrl =
            publishedApp.pitchDeckCoverImageUrl
            ?? extractPitchDeckCoverImage(publishedApp.pitchDecks);

          if (publishedApp.includePitchDeck && !pitchDeckCoverImageUrl) {
            try {
              const deckResponse = await generateMarketplaceAssetDeck(draftAssetId, { forceRegenerate: false });
              pitchDeckCoverImageUrl = extractPitchDeckCoverImage(deckResponse.pitchDecks);
              publishedApp = {
                ...publishedApp,
                pitchDecks: deckResponse.pitchDecks,
                pitchDeckCoverImageUrl,
              };
            } catch {
              // Non-blocking AI upsell fulfillment.
            }
          }

          const enrichedApp: VibeApp = {
            ...publishedApp,
            isForSale: true,
            marketplaceAssetId: publishResponse.assetId,
            askingPrice: `$${askingPriceUsd}`,
            marketplaceVerifiedStatus: publishResponse.verifiedStatus,
            valuationMultipleX100: publishResponse.valuationMultipleX100 ?? null,
            boostTier: 'Free',
            isOwnerListing: true,
            pitchDeckCoverImageUrl,
          };

          publishedApp = enrichedApp;
          upsertLocalApp(enrichedApp);

          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('marketplace:refresh'));
            window.dispatchEvent(new CustomEvent('marketplace:listing-published'));
            window.dispatchEvent(new CustomEvent('profile:refresh-marketplace'));
          }
        } catch (error) {
          setLoadError(
            error instanceof Error
              ? `Jam published to Rankings. Marketplace publish skipped: ${error.message}`
              : 'Jam published to Rankings. Marketplace publish skipped due to an unknown error.',
          );
        }
      }
    }

    // Final backend truth-sync so Rankings reflects the persisted source of record.
    try {
      const refreshedApps = await fetchApps();
      if (refreshedApps.length > 0) {
        setApps(refreshedApps);

        const targetName = String(newApp.name ?? '').trim().toLowerCase();
        const targetFounderEmail = String(newApp.founder?.email ?? '').trim().toLowerCase();
        const hasPublishedJam = refreshedApps.some((app) => {
          const appName = String(app.name ?? '').trim().toLowerCase();
          const appFounderEmail = String(app.founder?.email ?? '').trim().toLowerCase();
          if (targetFounderEmail) {
            return appName === targetName && appFounderEmail === targetFounderEmail;
          }
          return appName === targetName;
        });

        if (!hasPublishedJam) {
          setLoadError('Publish completed but backend has not confirmed this jam on Rankings yet. Please retry.');
        }
      }
    } catch {
      // Non-blocking: keep local state if refresh fails.
    }

    setIsPublishing(false);

    setIsStartJamOpen(false);
    setIsListAppOpen(false);

    if (publishedApp.publishSource === 'start-jam') {
      setActiveTab('Rankings');
    } else if (publishedApp.isForSale) {
      setActiveTab('Marketplace');
    } else {
      setActiveTab('Rankings');
    }
  };

  const handleToggleWishlist = (app: VibeApp) => {
    const wasInWishlist = wishlist.some((item) => item.id === app.id);
    setWishlist(prev => 
      prev.find(a => a.id === app.id) 
        ? prev.filter(a => a.id !== app.id) 
        : [...prev, app]
    );

    if (authUser && app.marketplaceAssetId) {
      const listingId = app.marketplaceAssetId;
      const request = wasInWishlist ? removeWishlistItem(listingId) : addWishlistItem(listingId);
      void request
        .then(() => {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('profile:refresh-marketplace'));
          }
        })
        .catch((error) => {
          setLoadError(error instanceof Error ? error.message : 'Unable to sync wishlist right now.');
        });
    }
  };

  const isAppInWishlist = (appId: string) => wishlist.some(a => a.id === appId);
  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  const getAppById = (appId: string) => apps.find(a => a.id === appId);
  const handleProfileClick = () => {
    if (authUser) {
      setIsProfileOpen(true);
      return;
    }

    setIsAuthOpen(true);
  };

  const handleSignOut = async () => {
    if (!supabase) {
      setLoadError('Auth is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
      return;
    }

    setIsSigningOut(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      setLoadError(error.message);
    }
    setIsSigningOut(false);
    setIsProfileOpen(false);
  };

  const openInboxConversationFromQuickPanel = (conversationId: string) => {
    setIsInboxQuickOpen(false);
    setIsNotificationsOpen(false);
    setIsProfileOpen(true);
    setActiveTab('Marketplace');
    setProfileFocusConversationId(conversationId);
  };

  const openFullInboxFromQuickPanel = () => {
    setIsInboxQuickOpen(false);
    setIsNotificationsOpen(false);
    setIsProfileOpen(true);
    setActiveTab('Marketplace');
    setProfileFocusConversationId(quickInboxThreads[0]?.id ?? null);
  };

  if (dealRoomOfferId) {
    return (
      <>
        <DealRoomView
          offerId={dealRoomOfferId}
          authUserId={authUser?.id ?? null}
          onRequireAuth={() => setIsAuthOpen(true)}
        />
        <AnimatePresence>
          {isAuthOpen && <AuthModal onClose={() => setIsAuthOpen(false)} />}
        </AnimatePresence>
      </>
    );
  }

  if (publicSlug) {
    return <CanvasPublicPage slug={publicSlug} />;
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white/20">
      
      {/* Navigation - The Stealth Glass */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-extrabold tracking-tighter text-white">VibeJam</h1>
            <div className="hidden xs:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-bold text-green-500 tracking-wider">MARKET OPEN</span>
            </div>
          </div>

          <div className="hidden md:flex items-center bg-white/5 rounded-full p-1 border border-white/5">
            {visibleMainTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`relative px-6 py-1.5 text-xs font-bold rounded-full transition-all duration-300
                  ${activeTab === tab ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                {tab}
                {activeTab === tab && (
                  <motion.div layoutId="activeTab" className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 w-8 h-[2px] bg-green-500" />
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            <button className="text-zinc-400 hover:text-white transition-colors"><Search className="w-5 h-5" /></button>
            <div className="hidden xs:block w-[1px] h-4 bg-white/10" />
            <button onClick={() => setIsStartJamOpen(true)} className="hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/20 text-xs font-bold hover:bg-white hover:text-black transition-all">
              <Plus className="w-3.5 h-3.5" /> Start Jam
            </button>
            {!authUser && (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/20 text-xs font-bold text-zinc-200 hover:bg-white hover:text-black transition-all"
              >
                Sign In
              </button>
            )}
            {authUser && (
              <div className="flex items-center gap-3 relative">
                <button
                  onClick={() => {
                    setIsInboxQuickOpen((prev) => {
                      const next = !prev;
                      if (next) {
                        setIsNotificationsOpen(false);
                      }
                      return next;
                    });
                  }}
                  className="relative p-1 transition-transform hover:scale-110 active:scale-95"
                  aria-label="Open inbox quick view"
                >
                  <MessageSquare className={`w-5 h-5 transition-colors ${isInboxQuickOpen ? 'text-white' : 'text-zinc-400'}`} />
                  {profileInboxBadgeCount > 0 && <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-cyan-400 border-2 border-black" />}
                </button>
                <button
                  onClick={() => {
                    setIsNotificationsOpen((prev) => {
                      const next = !prev;
                      if (next) {
                        setIsInboxQuickOpen(false);
                      }
                      return next;
                    });
                  }}
                  className="relative p-1 transition-transform hover:scale-110 active:scale-95"
                  aria-label="Open notifications"
                >
                  <Bell className={`w-5 h-5 transition-colors ${isNotificationsOpen ? 'text-white' : 'text-zinc-400'}`} />
                  {unreadCount > 0 && <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-cyan-400 border-2 border-black" />}
                </button>
                <AnimatePresence>
                  {isInboxQuickOpen && (
                    <>
                      <div className="fixed inset-0 z-[125]" onClick={() => setIsInboxQuickOpen(false)} />
                      <InboxQuickCenter
                        items={quickInboxThreads}
                        unreadCount={profileInboxBadgeCount}
                        isLoading={quickInboxLoading}
                        error={quickInboxError}
                        onClose={() => setIsInboxQuickOpen(false)}
                        onOpenConversation={openInboxConversationFromQuickPanel}
                        onOpenInbox={openFullInboxFromQuickPanel}
                      />
                    </>
                  )}
                </AnimatePresence>
                <AnimatePresence>
                  {isNotificationsOpen && (
                    <>
                      <div className="fixed inset-0 z-[125]" onClick={() => setIsNotificationsOpen(false)} />
                      <NotificationCenter notifications={notifications} onClose={() => setIsNotificationsOpen(false)} onMarkAllRead={markAllRead} getAppById={getAppById} onSelectApp={(id) => {
                        const app = getAppById(id);
                        if (app) { setSelectedApp(app); setIsNotificationsOpen(false); }
                      }} />
                    </>
                  )}
                </AnimatePresence>
                <button
                  type="button"
                  onClick={handleProfileClick}
                  className="relative cursor-pointer transition-transform hover:scale-[1.03] active:scale-[0.98]"
                  aria-label="Open profile"
                >
                  <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 overflow-hidden hover:border-white/30 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                    <img src={avatarUrl} alt={`${displayName} avatar`} className="w-full h-full object-cover" />
                  </div>
                  {profileInboxBadgeCount > 0 && (
                    <span className="pointer-events-none absolute -top-2 -right-2 min-w-[20px] h-5 px-1.5 rounded-full bg-gradient-to-b from-[#FF6B7A] via-[#FF3B5C] to-[#FF2D55] text-white text-[10px] font-black font-mono-data inline-flex items-center justify-center border border-white/35 shadow-[0_10px_24px_rgba(255,45,85,0.55),0_0_0_1px_rgba(0,0,0,0.55)] backdrop-blur-md">
                      {profileInboxBadgeCount > 99 ? '99+' : profileInboxBadgeCount}
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-40 md:pt-44 pb-20">
        <AnimatePresence mode="wait">
          {activeTab === 'Rankings' && (
            <motion.div key="rankings" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <header className="mb-12 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                <div>
                  <motion.h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tighter text-white mb-4 leading-[1.1]">
                    Most Profitable <br />
                    <span className="text-zinc-500">Vibe-Coded Apps</span>
                  </motion.h2>
                  <p className="text-zinc-500 text-base sm:text-lg font-medium">Real Businesses, Real Margins. No Fluff.</p>
                </div>

                <div className="flex items-center gap-2 pb-2 sm:pb-0 relative overflow-visible w-full lg:w-auto">
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-1 min-w-0">
                    {QUICK_FILTERS.map((item) => (
                      <button
                        key={item}
                        onClick={() => { setFilter(item); setIsCategoryMenuOpen(false); }}
                        className={`px-5 py-2 rounded-full text-xs font-bold transition-all border shrink-0
                          ${filter === item ? 'bg-white text-black border-white' : 'bg-transparent text-zinc-500 border-white/10 hover:border-white/30'}`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>

                  {/* Strategic Extension Filter */}
                  <div className="relative shrink-0">
                    <button
                      onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)}
                      className={`group flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all border
                        ${!QUICK_FILTERS.includes(filter) && filter !== 'All' ? 'bg-white text-black border-white' : 'bg-transparent text-zinc-500 border-white/10 hover:border-white/30'}`}
                    >
                      Explore 
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${isCategoryMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {isCategoryMenuOpen && (
                        <>
                          {/* Close layer for clicking outside */}
                          <div className="fixed inset-0 z-[60]" onClick={() => setIsCategoryMenuOpen(false)} />
                          
                          {/* World Class Dropdown Menu */}
                          <motion.div
                            initial={{ opacity: 0, y: 12, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.98 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="absolute right-0 top-full mt-4 z-[70] w-[300px] sm:w-[560px] bg-[#0A0A0A] border border-white/10 rounded-[32px] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.9)] overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
                            
                            <div className="relative z-10 flex flex-col gap-6">
                              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500 flex items-center gap-2">
                                  <LayoutGrid className="w-3 h-3" /> Industry Verticals
                                </h3>
                                <span className="text-[10px] font-mono-data text-zinc-700 tracking-widest">{ALL_CATEGORIES.length} TOTAL</span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1.5 max-h-[440px] overflow-y-auto no-scrollbar pr-2">
                                {ALL_CATEGORIES.map((cat) => (
                                  <button
                                    key={cat}
                                    onClick={() => { setFilter(cat); setIsCategoryMenuOpen(false); }}
                                    className={`text-left py-2.5 px-3 rounded-xl text-[11px] font-bold tracking-tight transition-all flex items-center justify-between group/cat
                                      ${filter === cat ? 'bg-white text-black' : 'text-zinc-500 hover:text-white hover:bg-white/[0.03]'}`}
                                  >
                                    {cat}
                                    <AnimatePresence>
                                      {filter === cat ? (
                                        <motion.div layoutId="catActive" className="w-1.5 h-1.5 rounded-full bg-black shadow-[0_0_8px_rgba(0,0,0,0.4)]" />
                                      ) : (
                                        <motion.div initial={{ opacity: 0 }} whileHover={{ opacity: 1 }} className="w-1.5 h-1.5 rounded-full bg-white/20" />
                                      )}
                                    </AnimatePresence>
                                  </button>
                                ))}
                              </div>
                              
                              <div className="pt-4 mt-2 border-t border-white/5 flex items-center justify-between">
                                <p className="text-[9px] font-medium text-zinc-600 leading-tight">
                                  Select a niche to filter verified <br />vibe-coded assets.
                                </p>
                                <button 
                                  onClick={() => { setFilter('All'); setIsCategoryMenuOpen(false); }}
                                  className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
                                >
                                  Reset All
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-12 lg:gap-16">
                <section className="flex flex-col min-w-0">
                  <div className="grid grid-cols-[3rem_1fr_auto] md:grid-cols-[4rem_1fr_11rem_10rem] items-center h-10 border-b border-white/5 text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em] px-2 sm:px-4">
                    <div className="text-center">#</div>
                    <div className="px-4 sm:px-6">Identity</div>
                    <div className="text-right pr-4 sm:pr-8">Performance</div>
                    <div className="hidden md:block text-right pr-8">Status</div>
                  </div>
                  <div className="flex flex-col">
                    {filteredApps.length > 0 ? filteredApps.map((app, i) => (
                      <FeedRow key={app.id} app={app} index={i} onClick={(a) => setSelectedApp(a)} onToggleWishlist={handleToggleWishlist} isInWishlist={isAppInWishlist(app.id)} />
                    )) : (
                      <div className="py-40 text-center space-y-6">
                         <div className="w-16 h-16 rounded-[24px] bg-white/[0.02] border border-white/5 flex items-center justify-center mx-auto mb-4">
                            <LayoutGrid className="w-8 h-8 text-zinc-800" />
                         </div>
                         <div className="space-y-2">
                           <p className="text-zinc-500 font-medium text-lg italic">No assets found in <span className="text-white font-bold not-italic">"{filter}"</span></p>
                           <button 
                            onClick={() => setFilter('All')}
                            className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-colors underline underline-offset-4"
                           >
                            Clear Filter
                           </button>
                         </div>
                      </div>
                    )}
                  </div>
                </section>
                <MarketRail
                  apps={apps}
                  onViewAllMarketplace={() => setActiveTab('Marketplace')}
                  onSelectApp={(app) => setSelectedApp(app)}
                />
              </div>

              {/* Newsletter Feature */}
              <NewsletterSection />

              {loadError && (
                <div className="mt-8 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 px-5 py-4 text-xs text-yellow-200">
                  Backend notice: {loadError}
                </div>
              )}

              {/* Rankings Footer */}
              <Footer onOpenLegal={(tab) => setLegalModalTab(tab)} />
            </motion.div>
          )}

          {activeTab === 'Marketplace' && (
            <motion.div key="marketplace" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <MarketplaceView
                apps={apps}
                onSelectApp={(a) => setSelectedApp(a)}
                onOpenListApp={() => setIsListAppOpen(true)}
                onOpenMembership={() => setIsAuthOpen(true)}
              />
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Modals & Overlays */}
      <AnimatePresence>
        {selectedApp && <JamDetailView app={selectedApp} onClose={() => setSelectedApp(null)} onToggleWishlist={handleToggleWishlist} isInWishlist={isAppInWishlist(selectedApp.id)} />}
      </AnimatePresence>
      <AnimatePresence>
        {isProfileOpen && (
          <ProfileView
            wishlist={wishlist}
            myJams={myProfileJams}
            displayName={displayName}
            handle={handle}
            avatarUrl={avatarUrl}
            isSigningOut={isSigningOut}
            onSignOut={handleSignOut}
            focusConversationId={profileFocusConversationId}
            onFocusConversationHandled={() => setProfileFocusConversationId(null)}
            onClose={() => setIsProfileOpen(false)}
            onSelectApp={(app) => {
              setIsProfileOpen(false);
              setSelectedApp(app);
            }}
            onDeleteJam={handleDeleteJam}
            onListJamOnMarketplace={publishJamToMarketplace}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isAuthOpen && <AuthModal onClose={() => setIsAuthOpen(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {isStartJamOpen && (
          <StartJamModal
            onClose={() => setIsStartJamOpen(false)}
            onPublish={handlePublishJam}
            defaultFounderName={displayName}
            defaultFounderEmail={authEmail}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isListAppOpen && <ListAppModal onClose={() => setIsListAppOpen(false)} onPublish={handlePublishJam} />}
      </AnimatePresence>
      
      {/* Legal & Support Modal */}
      <AnimatePresence>
        {legalModalTab && (
          <LegalModal 
            initialTab={legalModalTab} 
            onClose={() => setLegalModalTab(null)} 
          />
        )}
      </AnimatePresence>

      {/* Atmospheric Background Layers */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-blue-500/[0.03] rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-500/[0.03] rounded-full blur-[140px] pointer-events-none -z-10" />
    </div>
  );
};

export default App;
