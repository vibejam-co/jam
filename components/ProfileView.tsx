import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Rocket,
  ShieldCheck,
  ChevronRight,
  LogOut,
  Bell,
  Key,
  CreditCard,
  Heart,
  ArrowUpRight,
  Globe,
  Github,
  TrendingUp,
  MessageSquare,
  Send,
  ChevronLeft,
  PencilLine,
} from 'lucide-react';
import { VibeApp, MarketplaceOwnerAsset, AcquireStage } from '../types';
import GemstoneIcon from './GemstoneIcon';
import ListingEditModal, { ListingEditSeed } from './ListingEditModal';
import {
  fetchProfileMarketplaceSummary,
  fetchInboxConversations,
  fetchInboxMessages,
  sendInboxMessage,
  fetchAcquirePipeline,
  updateAcquireStage,
  startInboxConversation,
  fetchMyMarketplaceAssets,
} from '../lib/api';

interface ProfileViewProps {
  onClose: () => void;
  wishlist: VibeApp[];
  myJams: VibeApp[];
  onSelectApp: (app: VibeApp) => void;
  displayName: string;
  handle: string;
  avatarUrl: string;
  onSignOut: () => void;
  isSigningOut?: boolean;
  focusConversationId?: string | null;
  onFocusConversationHandled?: () => void;
}

type ProfileTab = 'Inbox' | 'Acquire' | 'Wishlist' | 'My Jams' | 'Settings';
type ProfileMode = 'buyer' | 'seller';

const ACQUIRE_STAGE_ORDER: AcquireStage[] = [
  'WATCHLISTED',
  'OFFER_SENT',
  'LOI_SIGNED',
  'DUE_DILIGENCE',
  'APA_SIGNED',
  'ESCROW_FUNDED',
  'CLOSED',
];

const formatMoney = (cents: number) => {
  const value = Number(cents ?? 0) / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
};

const formatMoneyFull = (cents: number) => {
  const value = Number(cents ?? 0) / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
};

const formatMultiple = (value: number | null | undefined): string => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return '—';
  }
  return `${(value / 100).toFixed(1)}x`;
};

const formatRelativeTime = (iso: string): string => {
  if (!iso) {
    return 'just now';
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return 'just now';
  }

  const delta = Math.max(0, Date.now() - date.getTime());
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (delta < minute) {
    return 'just now';
  }
  if (delta < hour) {
    return `${Math.floor(delta / minute)}m ago`;
  }
  if (delta < day) {
    return `${Math.floor(delta / hour)}h ago`;
  }
  return `${Math.floor(delta / day)}d ago`;
};

const getInitials = (value: string): string => {
  const parts = String(value || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) {
    return '?';
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 1).toUpperCase();
  }
  return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`.toUpperCase();
};

const nextStageFor = (stage: AcquireStage): AcquireStage | null => {
  const index = ACQUIRE_STAGE_ORDER.indexOf(stage);
  if (index === -1 || index >= ACQUIRE_STAGE_ORDER.length - 1) {
    return null;
  }
  return ACQUIRE_STAGE_ORDER[index + 1];
};

const stageButtonLabel = (stage: AcquireStage): string => {
  switch (stage) {
    case 'OFFER_SENT':
      return 'Move to Offer';
    case 'LOI_SIGNED':
      return 'Move to LOI';
    case 'DUE_DILIGENCE':
      return 'Move to Due Diligence';
    case 'APA_SIGNED':
      return 'Move to APA';
    case 'ESCROW_FUNDED':
      return 'Move to Escrow';
    case 'CLOSED':
      return 'Mark Closed';
    default:
      return 'Advance';
  }
};

const ProfileView: React.FC<ProfileViewProps> = ({
  onClose,
  wishlist,
  myJams,
  onSelectApp,
  displayName,
  handle,
  avatarUrl,
  onSignOut,
  isSigningOut = false,
  focusConversationId = null,
  onFocusConversationHandled,
}) => {
  const [activeTab, setActiveTab] = useState<ProfileTab>('Inbox');
  const [profileMode, setProfileMode] = useState<ProfileMode>('buyer');
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [hasBootstrapped, setHasBootstrapped] = useState(false);
  const [hasInitializedProfileMode, setHasInitializedProfileMode] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [profileSummary, setProfileSummary] = useState<any>(null);
  const [inboxThreads, setInboxThreads] = useState<any[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<any | null>(null);
  const [conversationMessages, setConversationMessages] = useState<any[]>([]);
  const [messageDraft, setMessageDraft] = useState('');
  const [inboxError, setInboxError] = useState<string | null>(null);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  const [pipeline, setPipeline] = useState<any>({ items: [], stages: [] });
  const [pipelineError, setPipelineError] = useState<string | null>(null);
  const [stageUpdatingListingId, setStageUpdatingListingId] = useState<string | null>(null);

  const [myMarketplaceAssets, setMyMarketplaceAssets] = useState<MarketplaceOwnerAsset[]>([]);
  const [editingListingSeed, setEditingListingSeed] = useState<ListingEditSeed | null>(null);

  const profileModeStorageKey = useMemo(
    () => `vibejam:profile-mode:${String(handle || displayName || 'guest').trim().toLowerCase()}`,
    [displayName, handle],
  );

  useEffect(() => {
    setHasInitializedProfileMode(false);
  }, [profileModeStorageKey]);

  const refreshConversations = async () => {
    try {
      const response = await fetchInboxConversations();
      setInboxThreads(Array.isArray(response.items) ? response.items : []);
    } catch (error) {
      setInboxError(error instanceof Error ? error.message : 'Failed to load inbox.');
    }
  };

  const refreshPipeline = async () => {
    try {
      const response = await fetchAcquirePipeline();
      setPipeline(response);
      setPipelineError(null);
    } catch (error) {
      setPipelineError(error instanceof Error ? error.message : 'Failed to load acquisition pipeline.');
      setPipeline({ items: [], stages: [] });
    }
  };

  const refreshSummary = async () => {
    try {
      const response = await fetchProfileMarketplaceSummary();
      setProfileSummary(response);
    } catch {
      setProfileSummary({
        roles: { seller: false, buyer: true, buyerEnabled: false },
        stats: {
          activeListingsCount: 0,
          listingsCount: 0,
          portfolioValueCents: 0,
          offersCount: 0,
          pipelineCount: 0,
          wishlistCount: 0,
          conversationsCount: 0,
          unreadInboxCount: 0,
        },
      });
    }
  };

  const refreshMyAssets = async () => {
    try {
      const response = await fetchMyMarketplaceAssets();
      setMyMarketplaceAssets(Array.isArray(response.items) ? response.items : []);
    } catch {
      // Keep previous state on transient failures to avoid UI jitter.
    }
  };

  const refreshAll = async (options?: { silent?: boolean }) => {
    if (!options?.silent && !hasBootstrapped) {
      setIsLoadingData(true);
    }
    setLoadError(null);
    const results = await Promise.allSettled([
      refreshSummary(),
      refreshConversations(),
      refreshPipeline(),
      refreshMyAssets(),
    ]);
    const hasRejection = results.some((result) => result.status === 'rejected');
    if (hasRejection) {
      setLoadError('Some profile modules are temporarily unavailable.');
    }
    if (!hasBootstrapped) {
      setHasBootstrapped(true);
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    void refreshAll();

    if (typeof window === 'undefined') {
      return;
    }

    const handleRefresh = () => {
      void refreshAll({ silent: true });
    };

    window.addEventListener('marketplace:refresh', handleRefresh as EventListener);
    window.addEventListener('marketplace:listing-published', handleRefresh as EventListener);
    window.addEventListener('profile:refresh-marketplace', handleRefresh as EventListener);

    return () => {
      window.removeEventListener('marketplace:refresh', handleRefresh as EventListener);
      window.removeEventListener('marketplace:listing-published', handleRefresh as EventListener);
      window.removeEventListener('profile:refresh-marketplace', handleRefresh as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!focusConversationId) {
      return;
    }

    setActiveTab('Inbox');
    setSelectedConversationId(focusConversationId);
    onFocusConversationHandled?.();
  }, [focusConversationId, onFocusConversationHandled]);

  useEffect(() => {
    if (!selectedConversationId) {
      setSelectedConversation(null);
      setConversationMessages([]);
      return;
    }

    let cancelled = false;

    const loadMessages = async () => {
      try {
        setInboxError(null);
        const response = await fetchInboxMessages(selectedConversationId);
        if (cancelled) {
          return;
        }
        if (response.conversation?.id && response.conversation.id !== selectedConversationId) {
          setSelectedConversationId(response.conversation.id);
        }
        setSelectedConversation(response.conversation);
        setConversationMessages(Array.isArray(response.messages) ? response.messages : []);
        await refreshConversations();
      } catch (error) {
        if (!cancelled) {
          setInboxError(error instanceof Error ? error.message : 'Failed to load conversation.');
        }
      }
    };

    void loadMessages();

    return () => {
      cancelled = true;
    };
  }, [selectedConversationId]);

  const hasPublishedSellerSurface = useMemo(() => {
    const activeListings = Number(profileSummary?.stats?.activeListingsCount ?? 0);
    return activeListings > 0 || myJams.length > 0;
  }, [myJams.length, profileSummary?.stats?.activeListingsCount]);

  useEffect(() => {
    if (!hasBootstrapped || hasInitializedProfileMode) {
      return;
    }

    let nextMode: ProfileMode = hasPublishedSellerSurface ? 'seller' : 'buyer';
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem(profileModeStorageKey);
      if (saved === 'buyer' || saved === 'seller') {
        if (!hasPublishedSellerSurface && saved === 'seller') {
          nextMode = 'buyer';
          window.localStorage.setItem(profileModeStorageKey, 'buyer');
        } else {
          nextMode = saved;
        }
      }
    }

    setProfileMode(nextMode);
    setHasInitializedProfileMode(true);
  }, [hasBootstrapped, hasInitializedProfileMode, hasPublishedSellerSurface, profileModeStorageKey]);

  const handleProfileModeChange = (nextMode: ProfileMode) => {
    setProfileMode(nextMode);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(profileModeStorageKey, nextMode);
    }
  };

  const tabs = useMemo(() => {
    if (profileMode === 'seller') {
      return ['Inbox', 'My Jams', 'Settings'] as ProfileTab[];
    }
    return ['Inbox', 'Acquire', 'Wishlist', 'Settings'] as ProfileTab[];
  }, [profileMode]);

  useEffect(() => {
    if (!tabs.includes(activeTab)) {
      setActiveTab(tabs[0]);
    }
  }, [activeTab, tabs]);

  const totalJams = useMemo(() => {
    return myJams.length + (profileSummary?.stats?.listingsCount ?? 0);
  }, [myJams.length, profileSummary?.stats?.listingsCount]);

  const unreadInboxCount = useMemo(() => {
    const localUnread = inboxThreads.reduce((sum, thread) => sum + Number(thread.unreadCount ?? 0), 0);
    const remoteUnread = Number(profileSummary?.stats?.unreadInboxCount ?? 0);
    return Math.max(localUnread, remoteUnread);
  }, [inboxThreads, profileSummary?.stats?.unreadInboxCount]);

  const portfolioValueLabel = formatMoney(profileSummary?.stats?.portfolioValueCents ?? 0);
  const pipelineByStage = useMemo(() => {
    const grouped = new Map<AcquireStage, any[]>();
    for (const stage of ACQUIRE_STAGE_ORDER) {
      grouped.set(stage, []);
    }

    for (const item of Array.isArray(pipeline?.items) ? pipeline.items : []) {
      const stage = item.stage as AcquireStage;
      if (!grouped.has(stage)) {
        grouped.set(stage, []);
      }
      grouped.get(stage)!.push(item);
    }

    return grouped;
  }, [pipeline]);

  const handleSendMessage = async () => {
    if (!selectedConversationId || !messageDraft.trim() || isSendingMessage) {
      return;
    }

    setIsSendingMessage(true);
    setInboxError(null);

    try {
      const response = await sendInboxMessage({
        conversationId: selectedConversationId,
        body: messageDraft.trim(),
      });

      setConversationMessages((prev) => [...prev, response.message]);
      if (response.conversationId && response.conversationId !== selectedConversationId) {
        setSelectedConversationId(response.conversationId);
      }
      setMessageDraft('');
      await refreshConversations();
    } catch (error) {
      setInboxError(error instanceof Error ? error.message : 'Failed to send message.');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleAdvanceStage = async (listingId: string, nextStage: AcquireStage) => {
    if (stageUpdatingListingId) {
      return;
    }

    setStageUpdatingListingId(listingId);
    setPipelineError(null);

    try {
      await updateAcquireStage({ listingId, stage: nextStage });
      await Promise.all([refreshPipeline(), refreshConversations(), refreshSummary()]);
    } catch (error) {
      setPipelineError(error instanceof Error ? error.message : 'Failed to update stage.');
    } finally {
      setStageUpdatingListingId(null);
    }
  };

  const handleContactFromPipeline = async (listingId: string) => {
    setPipelineError(null);
    try {
      const response = await startInboxConversation({ listingId });
      await refreshConversations();
      setActiveTab('Inbox');
      setSelectedConversationId(response.conversationId);
    } catch (error) {
      setPipelineError(error instanceof Error ? error.message : 'Failed to open conversation.');
    }
  };

  const toListingEditSeed = (asset: MarketplaceOwnerAsset): ListingEditSeed => ({
    id: asset.id,
    name: asset.name,
    tagline: asset.tagline,
    description: asset.tagline,
    category: asset.category,
    subcategory: asset.subcategory ?? '',
    techStack: asset.techStack ?? [],
    logoUrl: asset.logoUrl ?? '',
    askingPriceCents: asset.askingPriceCents,
    profitMarginPercent: asset.profitMarginPercent ?? null,
    isAnonymous: asset.isAnonymous,
    visibility: asset.visibility,
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[410] bg-black/90 backdrop-blur-xl flex justify-end"
    >
      <div className="absolute inset-0" onClick={onClose} />

      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative w-full max-w-lg bg-[#050505] border-l border-white/10 h-full flex flex-col shadow-[-20px_0_80px_rgba(0,0,0,0.8)]"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="px-8 pt-12 pb-8 border-b border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
          <div className="flex justify-between items-start mb-8">
            <div className="relative group">
              <div className="w-20 h-20 rounded-[28px] overflow-hidden border-2 border-white/10 group-hover:border-white/30 transition-all shadow-2xl">
                <img src={avatarUrl} alt={`${displayName} avatar`} className="w-full h-full object-cover" />
              </div>
              {unreadInboxCount > 0 && (
                <span className="pointer-events-none absolute -top-2 -right-2 min-w-[24px] h-6 px-2 rounded-full bg-gradient-to-b from-[#FF6B7A] via-[#FF3B5C] to-[#FF2D55] text-white text-[10px] font-black font-mono-data inline-flex items-center justify-center border border-white/35 shadow-[0_12px_24px_rgba(255,45,85,0.5),0_0_0_1px_rgba(0,0,0,0.55)] backdrop-blur-md">
                  {unreadInboxCount > 99 ? '99+' : unreadInboxCount}
                </span>
              )}
              <div className="absolute -bottom-2 -right-2 p-1.5 rounded-xl bg-green-500 border-4 border-[#050505] shadow-lg">
                <ShieldCheck className="w-3.5 h-3.5 text-black" />
              </div>
            </div>
            <button onClick={onClose} className="p-2.5 rounded-full hover:bg-white/5 transition-all">
              <X className="w-6 h-6 text-zinc-500" />
            </button>
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-black text-white tracking-tight">{displayName}</h2>
            <p className="text-zinc-500 text-sm font-medium">{handle} • Creator</p>
          </div>

          <div className="flex gap-4 mt-8">
            <div className="flex-1 p-3 rounded-2xl bg-white/[0.03] border border-white/10">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Portfolio Value</p>
              <p className="text-lg font-mono-data text-white font-bold">{portfolioValueLabel}</p>
            </div>
            <div className="flex-1 p-3 rounded-2xl bg-white/[0.03] border border-white/10">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Total Jams</p>
              <p className="text-lg font-mono-data text-white font-bold">{totalJams}</p>
            </div>
          </div>

          <div className="mt-5">
            <div className="inline-flex rounded-full border border-white/10 bg-white/[0.03] p-1">
              <button
                type="button"
                onClick={() => handleProfileModeChange('seller')}
                className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                  profileMode === 'seller'
                    ? 'bg-white text-black'
                    : 'text-zinc-500 hover:text-zinc-200'
                }`}
              >
                Seller
              </button>
              <button
                type="button"
                onClick={() => handleProfileModeChange('buyer')}
                className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                  profileMode === 'buyer'
                    ? 'bg-white text-black'
                    : 'text-zinc-500 hover:text-zinc-200'
                }`}
              >
                Buyer
              </button>
            </div>
          </div>
        </header>

        <nav className="flex px-8 border-b border-white/5 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative py-4 px-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap ${
                activeTab === tab ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab}
              {tab === 'Inbox' && unreadInboxCount > 0 && (
                <span className="ml-2 inline-flex min-w-[18px] h-[18px] px-1.5 items-center justify-center rounded-full bg-gradient-to-b from-[#FF6B7A] via-[#FF3B5C] to-[#FF2D55] border border-white/30 text-white text-[9px] font-black font-mono-data shadow-[0_6px_18px_rgba(255,45,85,0.5)]">
                  {unreadInboxCount > 99 ? '99+' : unreadInboxCount}
                </span>
              )}
              {activeTab === tab && (
                <motion.div
                  layoutId="profileTabLine"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-white"
                />
              )}
            </button>
          ))}
        </nav>

        <div className="flex-1 overflow-y-auto no-scrollbar p-8">
          {isLoadingData && !hasBootstrapped && (
            <div className="py-10 text-center text-zinc-500 text-xs font-bold uppercase tracking-widest">
              Loading Profile Data
            </div>
          )}

          {loadError && (
            <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-200">
              {loadError}
            </div>
          )}

          <AnimatePresence mode="wait">
            {activeTab === 'Inbox' && (
              <motion.div
                key="inbox"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-5"
              >
                {!selectedConversationId && (
                  <div className="space-y-2">
                    {isLoadingData && !hasBootstrapped ? (
                      Array.from({ length: 4 }).map((_, index) => (
                        <div
                          key={`inbox-skeleton-${index}`}
                          className="w-full rounded-2xl bg-white/[0.02] border border-white/5 p-4 animate-pulse"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-full bg-white/10" />
                            <div className="flex-1 space-y-2">
                              <div className="h-3 w-40 rounded bg-white/10" />
                              <div className="h-3 w-full rounded bg-white/10" />
                            </div>
                          </div>
                        </div>
                      ))
                    ) : inboxThreads.length === 0 ? (
                      <div className="py-20 text-center">
                        <MessageSquare className="w-10 h-10 text-zinc-800 mx-auto mb-4" />
                        <p className="text-zinc-500 text-sm font-medium">No conversations yet.</p>
                      </div>
                    ) : (
                      inboxThreads.map((thread) => (
                        <button
                          key={thread.id}
                          type="button"
                          onClick={() => {
                            setSelectedConversationId(thread.id);
                            setInboxError(null);
                          }}
                          className="w-full text-left rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/15 transition-all px-4 py-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              {thread.counterpartAvatarUrl ? (
                                <img
                                  src={thread.counterpartAvatarUrl}
                                  alt={thread.counterpartName}
                                  className="w-11 h-11 rounded-full object-cover border border-white/15"
                                />
                              ) : (
                                <div className="w-11 h-11 rounded-full border border-white/15 bg-white/[0.04] text-zinc-200 text-xs font-black uppercase tracking-wider inline-flex items-center justify-center">
                                  {getInitials(thread.counterpartName)}
                                </div>
                              )}
                              {thread.unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 inline-flex min-w-[18px] h-[18px] px-1 items-center justify-center rounded-full bg-gradient-to-b from-[#FF6B7A] via-[#FF3B5C] to-[#FF2D55] border border-white/35 text-[9px] text-white font-black font-mono-data shadow-[0_6px_18px_rgba(255,45,85,0.45)]">
                                  {thread.unreadCount > 99 ? '99+' : thread.unreadCount}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm text-white font-bold truncate">{thread.counterpartName}</p>
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest whitespace-nowrap">
                                  {formatRelativeTime(thread.lastMessageAt)}
                                </p>
                              </div>
                              <p className="text-[10px] text-cyan-300 font-black uppercase tracking-widest mt-0.5 truncate">
                                {thread.listingName}
                              </p>
                              <p className="text-xs text-zinc-400 mt-1 truncate">{thread.lastMessagePreview}</p>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}

                {selectedConversationId && (
                  <div className="space-y-4">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedConversationId(null);
                        setInboxError(null);
                      }}
                      className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" /> Back to Inbox
                    </button>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 flex items-center gap-3">
                      {selectedConversation?.counterpartAvatarUrl ? (
                        <img
                          src={selectedConversation.counterpartAvatarUrl}
                          alt={selectedConversation?.counterpartName ?? 'Member'}
                          className="w-10 h-10 rounded-full object-cover border border-white/15"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full border border-white/15 bg-white/[0.04] text-zinc-200 text-xs font-black uppercase tracking-wider inline-flex items-center justify-center">
                          {getInitials(selectedConversation?.counterpartName ?? 'Member')}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="text-white font-bold text-sm tracking-tight truncate">
                          {selectedConversation?.counterpartName ?? 'Marketplace Member'}
                        </h4>
                        <p className="text-[10px] text-cyan-300 font-black uppercase tracking-widest truncate">
                          {selectedConversation?.listingName ?? 'Listing'}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/40 px-3 py-4 space-y-3 max-h-[360px] overflow-y-auto no-scrollbar">
                      {conversationMessages.length === 0 && (
                        <div className="rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-6 text-center text-xs text-zinc-500">
                          No messages yet.
                        </div>
                      )}

                      {conversationMessages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex items-end gap-2 ${message.isMine ? 'justify-end' : 'justify-start'}`}
                        >
                          {!message.isMine && (
                            selectedConversation?.counterpartAvatarUrl ? (
                              <img
                                src={selectedConversation.counterpartAvatarUrl}
                                alt={selectedConversation?.counterpartName ?? 'Member'}
                                className="w-8 h-8 rounded-full object-cover border border-white/15"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full border border-white/15 bg-white/[0.04] text-zinc-200 text-[10px] font-black uppercase inline-flex items-center justify-center">
                                {getInitials(selectedConversation?.counterpartName ?? 'M')}
                              </div>
                            )
                          )}

                          <div
                            className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed border ${
                              message.isMine
                                ? 'bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/8 border-[#D4AF37]/35 text-[#F4E8C4]'
                                : 'bg-white/[0.05] border-white/10 text-zinc-100'
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words">{message.body}</p>
                            <p className="mt-2 text-[9px] uppercase tracking-widest text-zinc-500">
                              {formatRelativeTime(message.createdAt)}
                            </p>
                          </div>

                          {message.isMine && (
                            <img
                              src={avatarUrl}
                              alt={displayName}
                              className="w-8 h-8 rounded-full object-cover border border-white/15"
                            />
                          )}
                        </div>
                      ))}
                    </div>

                    <form
                      className="rounded-2xl border border-white/10 bg-white/[0.02] p-2 flex items-center gap-2"
                      onSubmit={(event) => {
                        event.preventDefault();
                        void handleSendMessage();
                      }}
                    >
                      <input
                        type="text"
                        value={messageDraft}
                        onChange={(event) => setMessageDraft(event.target.value)}
                        placeholder="Type a reply..."
                        className="flex-1 h-10 rounded-xl bg-black/40 border border-white/10 px-4 text-white text-sm focus:outline-none focus:border-white/20"
                      />
                      <button
                        type="submit"
                        disabled={isSendingMessage || !messageDraft.trim()}
                        className="h-10 px-4 rounded-full bg-white text-black text-[10px] font-black uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-200 transition-all inline-flex items-center gap-2"
                      >
                        <Send className="w-3.5 h-3.5" />
                        {isSendingMessage ? 'Sending' : 'Reply'}
                      </button>
                    </form>
                  </div>
                )}

                {inboxError && (
                  <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-200">
                    {inboxError}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'Acquire' && (
              <motion.div
                key="acquire"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-5"
              >
                {ACQUIRE_STAGE_ORDER.map((stage) => {
                  const items = pipelineByStage.get(stage) ?? [];
                  const stageLabel =
                    Array.isArray(pipeline?.stages)
                      ? pipeline.stages.find((entry: any) => entry.stage === stage)?.label
                      : stage.replace(/_/g, ' ');

                  return (
                    <section key={stage} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black uppercase tracking-widest text-white">{stageLabel}</h4>
                        <span className="text-[10px] font-mono-data text-zinc-500">{items.length}</span>
                      </div>

                      {items.length === 0 && (
                        <div className="text-xs text-zinc-600 border border-white/5 rounded-xl px-3 py-3">
                          No items in this stage.
                        </div>
                      )}

                      {items.map((item: any) => {
                        const nextStage = nextStageFor(item.stage as AcquireStage);

                        return (
                          <div key={item.id} className="rounded-xl border border-white/10 bg-black/40 px-3 py-3 space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h5 className="text-sm font-bold text-white tracking-tight">{item.listing.name}</h5>
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">
                                  {item.listing.category}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Asking</p>
                                <p className="text-sm font-mono-data text-[#D4AF37] font-bold">
                                  {formatMoneyFull(item.listing.askingPriceCents)}
                                </p>
                              </div>
                            </div>

                            <p className="text-xs text-zinc-400 line-clamp-2">{item.listing.tagline}</p>

                            <div className="flex items-center justify-between gap-2">
                              <button
                                type="button"
                                onClick={() => void handleContactFromPipeline(item.listingId)}
                                className="h-8 px-3 rounded-full border border-white/15 text-[10px] font-black uppercase tracking-widest text-zinc-300 hover:bg-white hover:text-black transition-all"
                              >
                                Open Inbox
                              </button>

                              {nextStage && (
                                <button
                                  type="button"
                                  onClick={() => void handleAdvanceStage(item.listingId, nextStage)}
                                  disabled={stageUpdatingListingId === item.listingId}
                                  className="h-8 px-3 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[10px] font-black uppercase tracking-widest text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black transition-all disabled:opacity-60"
                                >
                                  {stageUpdatingListingId === item.listingId ? 'Updating' : stageButtonLabel(nextStage)}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </section>
                  );
                })}

                {pipelineError && (
                  <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-200">
                    {pipelineError}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'Wishlist' && (
              <motion.div
                key="wishlist"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <div className="space-y-4">
                  {wishlist.length > 0 ? (
                    wishlist.map((app) => (
                      <div
                        key={app.id}
                        onClick={() => onSelectApp(app)}
                        className="group p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all cursor-pointer flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <GemstoneIcon icon={app.icon} accentColor={app.accentColor} size="sm" isHovered={true} />
                          <div>
                            <h4 className="text-white font-bold text-sm tracking-tight">{app.name}</h4>
                            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                              ${app.monthlyRevenue.toLocaleString()} / mo
                            </p>
                          </div>
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-zinc-700 group-hover:text-white transition-all" />
                      </div>
                    ))
                  ) : (
                    <div className="py-20 text-center">
                      <Heart className="w-10 h-10 text-zinc-800 mx-auto mb-4" />
                      <p className="text-zinc-500 text-sm font-medium">Your wishlist is empty.</p>
                    </div>
                  )}
                </div>

                {wishlist.length > 0 && (
                  <div className="pt-8 border-t border-white/5">
                    <h5 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <TrendingUp className="w-3 h-3" /> Potential Yield
                    </h5>
                    <div className="p-4 rounded-2xl bg-green-500/5 border border-green-500/10">
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Based on your wishlist, your curated portfolio represents{' '}
                        <span className="text-green-500 font-bold">$420k+</span> in verified MRR.
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'My Jams' && (
              <motion.div
                key="my-jams"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-8"
              >
                {myJams.length === 0 && myMarketplaceAssets.length === 0 && (
                  <div className="py-20 text-center">
                    <Rocket className="w-10 h-10 text-zinc-800 mx-auto mb-4" />
                    <p className="text-zinc-500 text-sm font-medium">No jams or listed apps yet.</p>
                  </div>
                )}
                <div className="space-y-4">
                  {myJams.map((app) => (
                    <div
                      key={app.id}
                      onClick={() => onSelectApp(app)}
                      className="p-5 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all cursor-pointer"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <GemstoneIcon icon={app.icon} accentColor={app.accentColor} size="sm" isHovered={true} />
                          <div>
                            <h4 className="text-white font-bold tracking-tight">{app.name}</h4>
                            <span className="text-[9px] font-black text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded tracking-widest uppercase">
                              Live
                            </span>
                          </div>
                        </div>
                        <Rocket className="w-4 h-4 text-zinc-500" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">Revenue</p>
                          <p className="text-sm font-mono-data text-white font-bold">${app.monthlyRevenue.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">Growth</p>
                          <p className="text-sm font-mono-data text-cyan-400 font-bold">+{app.growth}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {myMarketplaceAssets.length > 0 && (
                  <div className="space-y-4">
                    {myMarketplaceAssets.slice(0, 8).map((asset) => (
                      <div
                        key={asset.id}
                        className="p-5 rounded-3xl bg-white/[0.02] border border-white/10 hover:bg-white/[0.04] transition-all"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="space-y-1.5">
                            <h4 className="text-white font-bold tracking-tight">{asset.name}</h4>
                            <p className="text-xs text-zinc-500 line-clamp-2">{asset.tagline}</p>
                            <span className="inline-flex items-center rounded-full border border-cyan-400/35 bg-cyan-400/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-cyan-300">
                              Listed App
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setEditingListingSeed(toListingEditSeed(asset))}
                            className="w-8 h-8 rounded-full border border-white/15 text-zinc-300 hover:bg-white hover:text-black transition-all inline-flex items-center justify-center"
                            aria-label={`Edit ${asset.name}`}
                          >
                            <PencilLine className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">Asking</p>
                            <p className="text-sm font-mono-data text-[#D4AF37] font-bold">{formatMoneyFull(asset.askingPriceCents)}</p>
                          </div>
                          <div>
                            <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">MRR</p>
                            <p className="text-sm font-mono-data text-[#00FF41] font-bold">{formatMoneyFull(asset.mrrCents)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">Multiple</p>
                            <p className="text-sm font-mono-data text-white font-bold">{formatMultiple(asset.valuationMultipleX100)}</p>
                          </div>
                        </div>

                        {asset.metricsProvider === 'stripe' && (
                          <div className="mt-4 rounded-2xl border border-cyan-400/20 bg-cyan-500/5 p-3">
                            <div className="mb-3 flex items-center justify-between">
                              <p className="text-[8px] font-black text-cyan-300 uppercase tracking-widest">Stripe Synced Metrics</p>
                              <span className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-cyan-200">
                                Live
                              </span>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Net Rev (30d)</p>
                                <p className="text-sm font-mono-data text-white font-bold">{formatMoneyFull(asset.last30dRevenueCents)}</p>
                              </div>
                              <div>
                                <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">MRR</p>
                                <p className="text-sm font-mono-data text-[#00FF41] font-bold">{formatMoneyFull(asset.mrrCents)}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Active Subs</p>
                                <p className="text-sm font-mono-data text-cyan-300 font-bold">
                                  {Math.max(0, Number(asset.activeSubscribers ?? 0)).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

              </motion.div>
            )}

            {activeTab === 'Settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <h5 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Account</h5>
                  <div className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden divide-y divide-white/5">
                    {[
                      { icon: Key, label: 'Security & Keys', detail: 'Manage API tokens' },
                      { icon: Bell, label: 'Notifications', detail: 'Real-time alerts' },
                      { icon: Globe, label: 'Public Profile', detail: 'On / Private' },
                    ].map((item) => (
                      <button
                        key={item.label}
                        className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/5 transition-all text-left group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-xl bg-white/5 text-zinc-400 group-hover:text-white group-hover:bg-white/10 transition-all">
                            <item.icon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">{item.label}</p>
                            <p className="text-[10px] font-medium text-zinc-500">{item.detail}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-zinc-700" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h5 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Connected</h5>
                  <div className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden divide-y divide-white/5">
                    {[
                      { icon: CreditCard, label: 'Billing', detail: 'Visa ending in 4242' },
                      { icon: Github, label: 'GitHub', detail: 'alexvibe-dev' },
                    ].map((item) => (
                      <button
                        key={item.label}
                        className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/5 transition-all text-left group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-xl bg-white/5 text-zinc-400 group-hover:text-white transition-all">
                            <item.icon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">{item.label}</p>
                            <p className="text-[10px] font-medium text-zinc-500">{item.detail}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-zinc-700" />
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <footer className="p-8 border-t border-white/5 bg-[#070707]">
          <button
            onClick={onSignOut}
            disabled={isSigningOut}
            className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 text-zinc-500 hover:text-white hover:border-red-500/30 hover:bg-red-500/5 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogOut className="w-4 h-4" /> {isSigningOut ? 'Signing Out...' : 'Sign Out'}
          </button>
        </footer>

      </motion.div>

      <AnimatePresence>
        {editingListingSeed && (
          <ListingEditModal
            seed={editingListingSeed}
            onClose={() => setEditingListingSeed(null)}
            onSaved={async () => {
              setEditingListingSeed(null);
              await Promise.all([refreshMyAssets(), refreshSummary()]);
            }}
            onDeleted={async () => {
              setEditingListingSeed(null);
              await Promise.all([refreshMyAssets(), refreshSummary(), refreshConversations()]);
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ProfileView;
