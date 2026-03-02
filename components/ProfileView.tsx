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
  FileText,
  Download,
  Link2,
  FolderOpen,
  Lock,
  Loader2,
  Trash2,
} from 'lucide-react';
import { VibeApp, MarketplaceOwnerAsset, AcquireStage, DealRoomData, DealRoomStatus } from '../types';
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
  fetchDealRoom,
  initiateDealRoomEscrow,
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
  onDeleteJam?: (app: VibeApp) => Promise<void> | void;
  onListJamOnMarketplace?: (app: VibeApp) => Promise<void> | void;
}

type ProfileTab = 'Inbox' | 'Acquire' | 'Wishlist' | 'My Jams' | 'Settings';
type ProfileMode = 'buyer' | 'seller';

const ACQUIRE_PROGRESS_ORDER: AcquireStage[] = [
  'WATCHLISTED',
  'OFFER_SENT',
  'LOI_SIGNED',
  'DUE_DILIGENCE',
  'APA_SIGNED',
  'ESCROW_FUNDED',
  'CLOSED',
];
const ACQUIRE_STAGE_ORDER: AcquireStage[] = ACQUIRE_PROGRESS_ORDER.filter((stage) => stage !== 'WATCHLISTED');

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
  const index = ACQUIRE_PROGRESS_ORDER.indexOf(stage);
  if (index === -1 || index >= ACQUIRE_PROGRESS_ORDER.length - 1) {
    return null;
  }
  return ACQUIRE_PROGRESS_ORDER[index + 1];
};

const stageButtonLabel = (stage: AcquireStage): string => {
  switch (stage) {
    case 'OFFER_SENT':
      return 'Move to Offer Sent';
    case 'LOI_SIGNED':
      return 'Move to LOI Signed';
    case 'DUE_DILIGENCE':
      return 'Move to Due Diligence';
    case 'APA_SIGNED':
      return 'Move to APA Signed';
    case 'ESCROW_FUNDED':
      return 'Move to Escrow Funded';
    case 'CLOSED':
      return 'Mark Closed';
    default:
      return 'Advance';
  }
};

const DEAL_DOC_LINKS = {
  loi: '/templates/loi-template.pdf',
  apa: '/templates/apa-template.pdf',
};

const DEAL_ROOM_FLOW: DealRoomStatus[] = [
  'ACCEPTED',
  'LOI_SIGNED',
  'DUE_DILIGENCE',
  'APA_SIGNED',
  'ESCROW_FUNDED',
  'ASSETS_TRANSFERRED',
  'CLOSED',
];

const LOCKED_STEP_COPY = 'Locked (Requires previous step completion)';

const toDealRoomStatusFromAcquireStage = (stage?: AcquireStage | null): DealRoomStatus => {
  switch (stage) {
    case 'LOI_SIGNED':
      return 'LOI_SIGNED';
    case 'DUE_DILIGENCE':
      return 'DUE_DILIGENCE';
    case 'APA_SIGNED':
      return 'APA_SIGNED';
    case 'ESCROW_FUNDED':
      return 'ESCROW_FUNDED';
    case 'CLOSED':
      return 'CLOSED';
    default:
      return 'PENDING';
  }
};

const isValidHttpsUrl = (value: string): boolean => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const linkifyMessageBody = (value: string): React.ReactNode[] => {
  const lines = String(value ?? '').split('\n');
  return lines.map((line, lineIndex) => {
    const parts = line.split(/(https?:\/\/[^\s]+)/g).filter(Boolean);
    return (
      <React.Fragment key={`line-${lineIndex}`}>
        {parts.map((part, index) => {
          if (/^https?:\/\/[^\s]+$/i.test(part)) {
            return (
              <a
                key={`part-${lineIndex}-${index}`}
                href={part}
                target="_blank"
                rel="noreferrer"
                className="text-cyan-300 underline underline-offset-2 break-all hover:text-cyan-200"
              >
                {part}
              </a>
            );
          }
          return <React.Fragment key={`part-${lineIndex}-${index}`}>{part}</React.Fragment>;
        })}
        {lineIndex < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });
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
  onDeleteJam,
  onListJamOnMarketplace,
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
  const [selectedDealRoom, setSelectedDealRoom] = useState<DealRoomData | null>(null);
  const [conversationMessages, setConversationMessages] = useState<any[]>([]);
  const [messageDraft, setMessageDraft] = useState('');
  const [signedDocUrl, setSignedDocUrl] = useState('');
  const [signedDocType, setSignedDocType] = useState<'LOI' | 'APA' | 'DOC'>('LOI');
  const [signedDocNote, setSignedDocNote] = useState('');
  const [inboxError, setInboxError] = useState<string | null>(null);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isInitiatingEscrow, setIsInitiatingEscrow] = useState(false);

  const [pipeline, setPipeline] = useState<any>({ items: [], stages: [] });
  const [pipelineError, setPipelineError] = useState<string | null>(null);
  const [stageUpdatingListingId, setStageUpdatingListingId] = useState<string | null>(null);

  const [myMarketplaceAssets, setMyMarketplaceAssets] = useState<MarketplaceOwnerAsset[]>([]);
  const [editingListingSeed, setEditingListingSeed] = useState<ListingEditSeed | null>(null);
  const [jamActionError, setJamActionError] = useState<string | null>(null);
  const [listingJamId, setListingJamId] = useState<string | null>(null);
  const [deletingJamId, setDeletingJamId] = useState<string | null>(null);

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
    if (profileMode !== 'buyer' || activeTab !== 'Acquire') {
      return;
    }

    const intervalId = window.setInterval(() => {
      void Promise.allSettled([refreshPipeline(), refreshConversations(), refreshSummary()]);
    }, 8000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [activeTab, profileMode]);

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
      setSelectedDealRoom(null);
      setConversationMessages([]);
      setSignedDocUrl('');
      setSignedDocNote('');
      setSignedDocType('LOI');
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

  const pipelineItemByListingId = useMemo(() => {
    const map = new Map<string, any>();
    for (const item of Array.isArray(pipeline?.items) ? pipeline.items : []) {
      if (item?.listingId) {
        map.set(String(item.listingId), item);
      }
    }
    return map;
  }, [pipeline]);

  const selectedPipelineItem = useMemo(() => {
    const listingId = selectedConversation?.listingId ? String(selectedConversation.listingId) : '';
    if (!listingId) {
      return null;
    }
    return pipelineItemByListingId.get(listingId) ?? null;
  }, [pipelineItemByListingId, selectedConversation?.listingId]);

  useEffect(() => {
    const offerId = String(selectedConversation?.dealOfferId ?? '').trim();
    if (!offerId) {
      setSelectedDealRoom(null);
      return;
    }

    let cancelled = false;
    const loadDeal = async () => {
      try {
        const response = await fetchDealRoom(offerId);
        if (!cancelled) {
          setSelectedDealRoom(response.deal);
        }
      } catch {
        if (!cancelled) {
          setSelectedDealRoom(null);
        }
      }
    };

    void loadDeal();
    return () => {
      cancelled = true;
    };
  }, [selectedConversation?.dealOfferId]);

  const progressiveDealStatus = useMemo<DealRoomStatus>(() => {
    if (selectedDealRoom?.status) {
      return selectedDealRoom.status;
    }
    return toDealRoomStatusFromAcquireStage(selectedPipelineItem?.stage as AcquireStage | undefined);
  }, [selectedDealRoom?.status, selectedPipelineItem?.stage]);

  const progressiveIndex = useMemo(() => {
    return DEAL_ROOM_FLOW.findIndex((status) => status === progressiveDealStatus);
  }, [progressiveDealStatus]);

  const pushConversationMessage = async (body: string): Promise<boolean> => {
    if (!selectedConversationId || !body.trim() || isSendingMessage) {
      return false;
    }

    setIsSendingMessage(true);
    setInboxError(null);

    try {
      const response = await sendInboxMessage({
        conversationId: selectedConversationId,
        body: body.trim(),
      });

      setConversationMessages((prev) => [...prev, response.message]);
      if (response.conversationId && response.conversationId !== selectedConversationId) {
        setSelectedConversationId(response.conversationId);
      }
      await refreshConversations();
      return true;
    } catch (error) {
      setInboxError(error instanceof Error ? error.message : 'Failed to send message.');
      return false;
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleSendMessage = async () => {
    const nextBody = messageDraft.trim();
    if (!nextBody) {
      return;
    }
    const sent = await pushConversationMessage(nextBody);
    if (sent) {
      setMessageDraft('');
    }
  };

  const handleShareSignedDocument = async () => {
    const normalizedUrl = signedDocUrl.trim();
    if (!selectedConversationId || !normalizedUrl) {
      return;
    }
    if (!isValidHttpsUrl(normalizedUrl)) {
      setInboxError('Signed document link must be a valid https:// URL.');
      return;
    }

    const note = signedDocNote.trim();
    const body =
      `Signed ${signedDocType} document ready for review:\n${normalizedUrl}`
      + (note ? `\n\nNotes: ${note}` : '');

    const sent = await pushConversationMessage(body);
    if (sent) {
      setSignedDocUrl('');
      setSignedDocNote('');
    }
  };

  const handleInitiateEscrowFromProfile = async () => {
    const offerId = String(selectedConversation?.dealOfferId ?? '').trim();
    if (!offerId || isInitiatingEscrow) {
      return;
    }

    setIsInitiatingEscrow(true);
    setInboxError(null);

    try {
      const response = await initiateDealRoomEscrow(offerId);
      if (response.deal) {
        setSelectedDealRoom(response.deal);
      }
      const landingPage = String(response.landingPage ?? '').trim();
      if (landingPage) {
        window.location.href = landingPage;
        return;
      }
      setInboxError('Escrow vault was created, but no redirect link was returned yet.');
    } catch (error) {
      setInboxError(error instanceof Error ? error.message : 'Failed to initiate escrow.');
    } finally {
      setIsInitiatingEscrow(false);
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
    mrrCents: asset.mrrCents,
    operatingExpensesCents: 0,
    expenseBreakdown: '',
    monthlyUniqueVisitors: Math.max(0, Number(asset.monthlyUniqueVisitors ?? 0)),
    analyticsProofUrl: typeof asset.analyticsProofUrl === 'string' ? asset.analyticsProofUrl : '',
    isAnonymous: asset.isAnonymous,
    visibility: asset.visibility,
  });

  const handleListJamOnMarketplace = async (app: VibeApp) => {
    if (!onListJamOnMarketplace || listingJamId || deletingJamId) {
      return;
    }

    const jamId = String(app.id ?? '').trim();
    if (!jamId) {
      setJamActionError('Missing jam id. Unable to publish this jam to Marketplace.');
      return;
    }

    setJamActionError(null);
    setListingJamId(jamId);
    try {
      await onListJamOnMarketplace(app);
      await Promise.allSettled([refreshAll({ silent: true })]);
    } catch (error) {
      setJamActionError(error instanceof Error ? error.message : 'Failed to list jam on Marketplace.');
    } finally {
      setListingJamId(null);
    }
  };

  const handleDeleteJam = async (app: VibeApp) => {
    if (!onDeleteJam || deletingJamId || listingJamId) {
      return;
    }

    const jamId = String(app.id ?? '').trim();
    if (!jamId) {
      setJamActionError('Missing jam id. Unable to delete this jam.');
      return;
    }

    setJamActionError(null);
    setDeletingJamId(jamId);
    try {
      await onDeleteJam(app);
      await Promise.allSettled([refreshAll({ silent: true })]);
    } catch (error) {
      setJamActionError(error instanceof Error ? error.message : 'Failed to delete jam.');
    } finally {
      setDeletingJamId(null);
    }
  };

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
                        {selectedPipelineItem?.stageLabel && (
                          <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest truncate mt-1">
                            Stage: {selectedPipelineItem.stageLabel}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Deal Documents</p>
                        {selectedConversation?.dealOfferId && (
                          <a
                            href={`/deal-room/${encodeURIComponent(String(selectedConversation.dealOfferId))}`}
                            className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-cyan-200 hover:border-cyan-400/45 transition-all"
                          >
                            <FolderOpen className="w-3.5 h-3.5" />
                            Open Deal Room
                          </a>
                        )}
                      </div>

                      <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Current Deal Status</p>
                        <p className="text-xs font-bold text-white mt-1">{progressiveDealStatus.replace(/_/g, ' ')}</p>
                      </div>

                      <div className="space-y-2">
                        {DEAL_ROOM_FLOW.slice(0, 5).map((status, index) => {
                          const isCompleted = progressiveIndex >= index && progressiveIndex >= 0;
                          const isCurrent = progressiveDealStatus === status;
                          const isLocked = progressiveIndex === -1 ? true : index > progressiveIndex;
                          return (
                            <div
                              key={status}
                              className={`rounded-xl border px-3 py-2 ${isCompleted ? 'border-cyan-500/25 bg-cyan-500/5' : 'border-white/10 bg-black/30'}`}
                            >
                              <p className={`text-[10px] font-black uppercase tracking-widest ${isCompleted ? 'text-cyan-200' : 'text-zinc-400'}`}>
                                {status.replace(/_/g, ' ')} {isCurrent ? '• Current' : ''}
                              </p>
                              {isLocked && !isCurrent && (
                                <p className="text-[10px] text-zinc-500 mt-1">{LOCKED_STEP_COPY}</p>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {progressiveDealStatus === 'ACCEPTED' && (
                        <>
                          <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-3 space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Buyer & Seller Emails</p>
                            <p className="text-xs text-zinc-300 break-all">Buyer: {selectedDealRoom?.buyer.email ?? 'Not available yet'}</p>
                            <p className="text-xs text-zinc-300 break-all">Seller: {selectedDealRoom?.seller.email ?? 'Not available yet'}</p>
                          </div>
                          <a
                            href={DEAL_DOC_LINKS.loi}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center gap-2 h-10 rounded-xl border border-white/15 bg-black/40 text-[10px] font-black uppercase tracking-widest text-zinc-200 hover:border-white/30 transition-all px-3"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download LOI
                          </a>
                          <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-[10px] text-zinc-500 inline-flex items-center gap-2">
                            <Lock className="w-3.5 h-3.5" /> APA Locked (Requires previous step completion)
                          </div>
                          <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-[10px] text-zinc-500 inline-flex items-center gap-2">
                            <Lock className="w-3.5 h-3.5" /> Escrow Locked (Requires previous step completion)
                          </div>
                        </>
                      )}

                      {progressiveDealStatus === 'LOI_SIGNED' && (
                        <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-3 py-3 space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-cyan-300">Due Diligence Checklist</p>
                          <p className="text-xs text-zinc-300">Seller must share read-only GitHub and analytics access before proceeding.</p>
                          <p className="text-[10px] text-zinc-400">1. GitHub repository read-only access.</p>
                          <p className="text-[10px] text-zinc-400">2. Google Analytics/Plausible read-only access.</p>
                          <p className="text-[10px] text-zinc-400">3. Subscription/revenue dashboard read-only access.</p>
                        </div>
                      )}

                      {progressiveDealStatus === 'DUE_DILIGENCE' && (
                        <a
                          href={DEAL_DOC_LINKS.apa}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center gap-2 h-10 rounded-xl border border-white/15 bg-black/40 text-[10px] font-black uppercase tracking-widest text-zinc-200 hover:border-white/30 transition-all px-3"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download APA
                        </a>
                      )}

                      {progressiveDealStatus === 'APA_SIGNED' && (
                        <button
                          type="button"
                          onClick={() => void handleInitiateEscrowFromProfile()}
                          disabled={isInitiatingEscrow || !selectedConversation?.dealOfferId}
                          className="h-10 px-4 rounded-full bg-white text-black text-[10px] font-black uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-200 transition-all inline-flex items-center gap-2"
                        >
                          {isInitiatingEscrow ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Initiating Escrow...
                            </>
                          ) : (
                            <>
                              <Link2 className="w-3.5 h-3.5" />
                              Fund Escrow
                            </>
                          )}
                        </button>
                      )}

                      {progressiveDealStatus === 'ESCROW_FUNDED' && (
                        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-3 space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300">Transfer Checklist</p>
                          <p className="text-[10px] text-zinc-300">Seller must transfer:</p>
                          <p className="text-[10px] text-zinc-400">1. Domain EPP/Auth codes.</p>
                          <p className="text-[10px] text-zinc-400">2. GitHub admin ownership.</p>
                          <p className="text-[10px] text-zinc-400">3. Stripe ownership transfer.</p>
                        </div>
                      )}

                      {(progressiveDealStatus === 'ACCEPTED' || progressiveDealStatus === 'LOI_SIGNED' || progressiveDealStatus === 'DUE_DILIGENCE') && (
                        <div className="rounded-xl border border-white/10 bg-black/30 p-3 space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Exchange Signed Documents</p>
                          <div className="grid grid-cols-1 sm:grid-cols-[90px,1fr] gap-2">
                            <select
                              value={signedDocType}
                              onChange={(event) => setSignedDocType(event.target.value as 'LOI' | 'APA' | 'DOC')}
                              className="h-9 rounded-lg border border-white/10 bg-black/40 px-2 text-[10px] font-black uppercase tracking-widest text-zinc-200 focus:outline-none focus:border-white/25"
                            >
                              <option value="LOI">LOI</option>
                              <option value="APA">APA</option>
                              <option value="DOC">DOC</option>
                            </select>
                            <input
                              type="url"
                              value={signedDocUrl}
                              onChange={(event) => setSignedDocUrl(event.target.value)}
                              placeholder="https://... signed PDF link"
                              className="h-9 rounded-lg border border-white/10 bg-black/40 px-3 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/25"
                            />
                          </div>
                          <input
                            type="text"
                            value={signedDocNote}
                            onChange={(event) => setSignedDocNote(event.target.value)}
                            placeholder="Optional note for counterparty"
                            className="w-full h-9 rounded-lg border border-white/10 bg-black/40 px-3 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/25"
                          />
                          <button
                            type="button"
                            disabled={isSendingMessage || !signedDocUrl.trim()}
                            onClick={() => void handleShareSignedDocument()}
                            className="h-9 px-4 rounded-full bg-white text-black text-[10px] font-black uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-200 transition-all inline-flex items-center gap-2"
                          >
                            <Link2 className="w-3.5 h-3.5" />
                            {isSendingMessage ? 'Sharing' : 'Share Signed Doc'}
                          </button>
                        </div>
                      )}
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
                            <p className="whitespace-pre-wrap break-words">{linkifyMessageBody(message.body)}</p>
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
                        const dealStatusForItem = toDealRoomStatusFromAcquireStage(item.stage as AcquireStage);

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

                            <div className="flex flex-wrap items-center gap-2">
                              {dealStatusForItem === 'PENDING' && (
                                <div className="h-7 px-3 rounded-full border border-white/10 bg-black/40 text-[9px] font-black uppercase tracking-widest text-zinc-500 inline-flex items-center gap-1.5">
                                  <Lock className="w-3 h-3" />
                                  {LOCKED_STEP_COPY}
                                </div>
                              )}
                              {(dealStatusForItem === 'ACCEPTED' || dealStatusForItem === 'LOI_SIGNED') && (
                                <a
                                  href={DEAL_DOC_LINKS.loi}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="h-7 px-3 rounded-full border border-white/15 bg-white/[0.02] text-[9px] font-black uppercase tracking-widest text-zinc-300 hover:border-white/30 transition-all inline-flex items-center gap-1.5"
                                >
                                  <FileText className="w-3 h-3" />
                                  Download LOI
                                </a>
                              )}
                              {dealStatusForItem === 'LOI_SIGNED' && (
                                <div className="h-7 px-3 rounded-full border border-cyan-500/25 bg-cyan-500/10 text-[9px] font-black uppercase tracking-widest text-cyan-200 inline-flex items-center gap-1.5">
                                  Due Diligence Checklist
                                </div>
                              )}
                              {dealStatusForItem === 'DUE_DILIGENCE' && (
                                <a
                                  href={DEAL_DOC_LINKS.apa}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="h-7 px-3 rounded-full border border-white/15 bg-white/[0.02] text-[9px] font-black uppercase tracking-widest text-zinc-300 hover:border-white/30 transition-all inline-flex items-center gap-1.5"
                                >
                                  <FileText className="w-3 h-3" />
                                  Download APA
                                </a>
                              )}
                              {dealStatusForItem === 'APA_SIGNED' && (
                                <div className="h-7 px-3 rounded-full border border-white/15 bg-white/[0.02] text-[9px] font-black uppercase tracking-widest text-zinc-300 inline-flex items-center gap-1.5">
                                  Open Inbox to Fund Escrow
                                </div>
                              )}
                              {dealStatusForItem === 'ESCROW_FUNDED' && (
                                <div className="h-7 px-3 rounded-full border border-emerald-500/25 bg-emerald-500/10 text-[9px] font-black uppercase tracking-widest text-emerald-200 inline-flex items-center gap-1.5">
                                  Transfer Checklist Active
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={() => void handleContactFromPipeline(item.listingId)}
                                className="h-7 px-3 rounded-full border border-cyan-500/25 bg-cyan-500/10 text-[9px] font-black uppercase tracking-widest text-cyan-200 hover:border-cyan-400/45 transition-all inline-flex items-center gap-1.5"
                              >
                                <Link2 className="w-3 h-3" />
                                Open Inbox
                              </button>
                            </div>

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
                      <div className="mb-4 flex flex-wrap items-center gap-2">
                        {!app.marketplaceAssetId && (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              void handleListJamOnMarketplace(app);
                            }}
                            disabled={listingJamId === app.id || deletingJamId !== null}
                            className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/35 bg-cyan-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-cyan-200 hover:border-cyan-300/60 hover:text-cyan-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {listingJamId === app.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Rocket className="w-3 h-3" />}
                            {listingJamId === app.id ? 'Listing...' : 'List on Marketplace'}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onSelectApp(app);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.03] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-zinc-300 hover:border-white/30 hover:text-white transition-all"
                        >
                          <PencilLine className="w-3 h-3" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleDeleteJam(app);
                          }}
                          disabled={deletingJamId === app.id || listingJamId !== null}
                          className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-red-200 hover:border-red-400/60 hover:text-red-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deletingJamId === app.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                          {deletingJamId === app.id ? 'Deleting...' : 'Delete'}
                        </button>
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

                {jamActionError && (
                  <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-200">
                    {jamActionError}
                  </div>
                )}

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
