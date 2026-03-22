import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShoppingBag,
  ArrowUpRight,
  ShieldCheck,
  Lock,
  Sparkles,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { VibeApp, MarketplaceAssetCard } from '../types';
import GemstoneIcon from './GemstoneIcon';
import ProfitMarginBadge from './ProfitMarginBadge';
import TrafficBadge from './TrafficBadge';
import { createMarketplaceBuyerAlert, fetchMarketplaceAssets } from '../lib/api';
import MarketplaceFilters, { ChurnFilterOption } from './MarketplaceFilters';

interface MarketplaceViewProps {
  apps: VibeApp[];
  onSelectApp: (app: VibeApp) => void;
  onOpenListApp: () => void;
  onOpenMembership?: () => void;
}

type SortMode = 'latest' | 'mrr' | 'rev30' | 'multiple';

const churnOptionToBps = (option: ChurnFilterOption): number | undefined => {
  if (option === 'lt5') return 500;
  if (option === 'lt10') return 1000;
  if (option === 'lt20') return 2000;
  return undefined;
};

const formatCurrencyCompact = (cents: number): string => {
  const dollars = (cents || 0) / 100;
  if (!Number.isFinite(dollars)) {
    return '$0';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
    notation: 'compact',
  }).format(dollars);
};

const formatCurrencyFull = (cents: number): string => {
  const dollars = (cents || 0) / 100;
  if (!Number.isFinite(dollars)) {
    return '$0';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(dollars);
};

const formatPercent = (value: number): string => {
  if (!Number.isFinite(value)) {
    return '0%';
  }
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded.toFixed(0)}%` : `${rounded.toFixed(1)}%`;
};

const churnBadgeMeta = (churnBps: number | null | undefined): {
  label: string;
  className: string;
} => {
  if (typeof churnBps !== 'number' || !Number.isFinite(churnBps) || churnBps < 0) {
    return {
      label: 'Churn: N/A',
      className: 'border-zinc-700/60 bg-zinc-900/70 text-zinc-400',
    };
  }

  const churnPercent = churnBps / 100;
  if (churnPercent < 5) {
    return {
      label: `Low Churn: ${formatPercent(churnPercent)}`,
      className: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300',
    };
  }

  if (churnPercent <= 10) {
    return {
      label: `Medium Churn: ${formatPercent(churnPercent)}`,
      className: 'border-yellow-500/40 bg-yellow-500/15 text-yellow-200',
    };
  }

  return {
    label: `High Churn: ${formatPercent(churnPercent)}`,
    className: 'border-red-500/40 bg-red-500/15 text-red-200',
  };
};

const isIconImageSource = (value: string | null | undefined): boolean => {
  const normalized = String(value ?? '').trim().toLowerCase();
  return (
    normalized.startsWith('data:image/')
    || normalized.startsWith('https://')
    || normalized.startsWith('http://')
    || normalized.startsWith('blob:')
    || normalized.startsWith('/')
  );
};

const mapAssetToVibeApp = (asset: MarketplaceAssetCard, sourceApp?: VibeApp): VibeApp => {
  const mrrDollars = Math.round(asset.mrrCents / 100);
  const rev30Dollars = Math.round(asset.last30dRevenueCents / 100);
  const growthPercent = Number((asset.last30dGrowthBps / 100).toFixed(2));
  const askingPriceLabel = formatCurrencyCompact(asset.askingPriceCents);
  const netProfitCents =
    typeof asset.profitMarginBps === 'number' && Number.isFinite(asset.profitMarginBps)
      ? Math.round(asset.mrrCents * (asset.profitMarginBps / 10_000))
      : null;

  const resolvedMarketplaceAssetId = asset.marketplaceAssetId
    ?? (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(asset.id) ? asset.id : undefined);
  const resolvedActiveUsersFromApp =
    typeof sourceApp?.activeUsers === 'number' && Number.isFinite(sourceApp.activeUsers)
      ? Math.max(0, Math.round(sourceApp.activeUsers))
      : 0;
  const resolvedActiveUsersFromSubscribers =
    typeof asset.activeSubscribers === 'number' && Number.isFinite(asset.activeSubscribers)
      ? Math.max(0, Math.round(asset.activeSubscribers))
      : 0;
  const resolvedActiveUsers = Math.max(resolvedActiveUsersFromApp, resolvedActiveUsersFromSubscribers);

  return {
    id: `market-${asset.id}`,
    rank: 'MK',
    name: asset.name,
    pitch: asset.tagline,
    icon: isIconImageSource(asset.logoUrl) ? String(asset.logoUrl) : '💎',
    accentColor: '212, 175, 55',
    monthlyRevenue: mrrDollars,
    lifetimeRevenue: Math.max(rev30Dollars * 12, mrrDollars * 12),
    activeUsers: resolvedActiveUsers,
    buildStreak: 0,
    growth: growthPercent,
    tags: [asset.category],
    verified: asset.verifiedStatus === 'verified',
    category: asset.category,
    founder: {
      name: asset.isAnonymous ? 'Private Seller' : 'Founder',
      handle: asset.isAnonymous ? '@private' : '@verified-founder',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MarketplaceSeller',
    },
    techStack: asset.techStack,
    problem: 'Owner is exploring strategic exits.',
    solution: 'Acquire a verified revenue asset via structured pipeline.',
    pricing: 'Acquisition Opportunity',
    revenueHistory: [
      { date: 'Last 30d', revenue: rev30Dollars },
      { date: 'MRR', revenue: mrrDollars },
    ],
    isForSale: true,
    askingPrice: askingPriceLabel,
    profitMargin: asset.profitMarginPercent ?? undefined,
    isAnonymous: asset.isAnonymous,
    marketplaceAssetId: resolvedMarketplaceAssetId,
    valuationMultipleX100: asset.valuationMultipleX100,
    marketplaceVerifiedStatus: asset.verifiedStatus,
    isOwnerListing: Boolean(asset.isOwner),
    netProfitCents,
    profitMarginBps:
      typeof asset.profitMarginBps === 'number' && Number.isFinite(asset.profitMarginBps)
        ? Math.round(asset.profitMarginBps)
        : null,
    monthlyUniqueVisitors:
      typeof asset.monthlyUniqueVisitors === 'number' && Number.isFinite(asset.monthlyUniqueVisitors)
        ? Math.max(0, Math.round(asset.monthlyUniqueVisitors))
        : null,
    churnBps:
      typeof asset.churnBps === 'number' && Number.isFinite(asset.churnBps)
        ? Math.round(asset.churnBps)
        : null,
  };
};

const mapFallbackApps = (apps: VibeApp[]): MarketplaceAssetCard[] =>
  apps
    .filter((app) => app.isForSale)
    .slice(0, 12)
    .map((app, index) => ({
      id: app.marketplaceAssetId || `jam-${app.id || `fallback-${index}`}`,
      marketplaceAssetId: app.marketplaceAssetId,
      slug: (app.name || `asset-${index}`).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name: app.name,
      tagline: app.pitch,
      logoUrl: isIconImageSource(app.icon) ? app.icon : null,
      category: app.category,
      subcategory: null,
      techStack: app.techStack,
      askingPriceCents: Number(String(app.askingPrice || '').replace(/[^0-9]/g, '')) * 100 || Math.max(1500000, app.monthlyRevenue * 250),
      currency: 'USD',
      verifiedStatus: app.marketplaceVerifiedStatus ?? (app.verified ? 'verified' : 'unverified'),
      visibility: 'public',
      isAnonymous: Boolean(app.isAnonymous),
      mrrCents: Math.max(0, Math.round(app.monthlyRevenue * 100)),
      last30dRevenueCents: Math.max(0, Math.round(app.monthlyRevenue * 100)),
      last30dGrowthBps: Math.round((app.growth || 0) * 100),
      monthlyUniqueVisitors: Math.max(
        0,
        Math.round(Number(typeof app.monthlyUniqueVisitors === 'number' ? app.monthlyUniqueVisitors : 0)),
      ),
      analyticsProofUrl: null,
      activeSubscribers: 0,
      churnBps:
        typeof app.churnBps === 'number' && Number.isFinite(app.churnBps)
          ? Math.round(app.churnBps)
          : null,
      metricsProvider: null,
      profitMarginPercent: app.profitMargin ?? null,
      profitMarginBps:
        typeof app.profitMarginBps === 'number' && Number.isFinite(app.profitMarginBps)
          ? Math.round(app.profitMarginBps)
          : typeof app.profitMargin === 'number' && Number.isFinite(app.profitMargin)
          ? Math.round(app.profitMargin * 100)
          : null,
      valuationMultipleX100: app.valuationMultipleX100 ?? null,
      metricsUpdatedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isOwner: false,
    }));

const normalizeToken = (value: string | null | undefined): string =>
  String(value ?? '')
    .trim()
    .toLowerCase();

const statusCopy: Record<string, { label: string; className: string }> = {
  verified: { label: 'Verified', className: 'text-[#D4AF37]' },
  pending: { label: 'Pending', className: 'text-cyan-400' },
  error: { label: 'Needs Attention', className: 'text-red-400' },
  unverified: { label: 'Unverified', className: 'text-zinc-500' },
};

const MarketplaceView: React.FC<MarketplaceViewProps> = ({
  apps,
  onSelectApp,
  onOpenListApp,
  onOpenMembership,
}) => {
  const [assets, setAssets] = useState<MarketplaceAssetCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requiresMembership, setRequiresMembership] = useState(false);
  const [lockedCount, setLockedCount] = useState(0);
  const [sortMode, setSortMode] = useState<SortMode>('latest');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [category, setCategory] = useState<string>('All');
  const [minMrr, setMinMrr] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minProfitMarginPct, setMinProfitMarginPct] = useState(0);
  const [maxChurnOption, setMaxChurnOption] = useState<ChurnFilterOption>('any');
  const [minTraffic, setMinTraffic] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isCreatingAlert, setIsCreatingAlert] = useState(false);
  const [alertToast, setAlertToast] = useState<{
    kind: 'success' | 'error';
    message: string;
  } | null>(null);

  const fallbackAssets = useMemo(() => mapFallbackApps(apps), [apps]);
  const categories = useMemo(() => {
    const set = new Set<string>();
    [...assets, ...fallbackAssets].forEach((item) => {
      if (item.category) {
        set.add(item.category);
      }
    });
    return ['All', ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [assets, fallbackAssets]);

  const loadAssets = async (nextPage: number, append = false) => {
    setIsLoading(true);
    setError(null);

    try {
      const minProfitMarginBps = Math.max(0, Math.round(minProfitMarginPct * 100));
      const maxChurnBps = churnOptionToBps(maxChurnOption);
      const minTrafficCount = minTraffic ? Number(minTraffic) : undefined;
      const response = await fetchMarketplaceAssets({
        page: nextPage,
        pageSize: 12,
        sort: sortMode,
        category: category === 'All' ? undefined : category,
        verified_only: verifiedOnly,
        min_mrr: minMrr ? Number(minMrr) : undefined,
        max_price: maxPrice ? Number(maxPrice) : undefined,
        minProfitMarginBps: minProfitMarginBps > 0 ? minProfitMarginBps : undefined,
        maxChurnBps,
        minTraffic:
          typeof minTrafficCount === 'number' && Number.isFinite(minTrafficCount) && minTrafficCount > 0
            ? Math.round(minTrafficCount)
            : undefined,
      });

      const incoming = response.items || [];
      setAssets((prev) => (append ? [...prev, ...incoming] : incoming));
      setHasMore(response.hasMore);
      setRequiresMembership(Boolean(response.meta?.requiresMembership));
      setLockedCount(Math.max(0, Number(response.meta?.lockedCount || 0)));
      setPage(nextPage);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Failed to load marketplace assets.');
      setAssets(fallbackAssets);
      setHasMore(false);
      setRequiresMembership(false);
      setLockedCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadAssets(1, false);
    }, 280);

    return () => {
      window.clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortMode, verifiedOnly, category, minMrr, maxPrice, minProfitMarginPct, maxChurnOption, minTraffic]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleRefresh = () => {
      loadAssets(1, false);
    };
    const handleListingPublished = () => {
      setVerifiedOnly(false);
      setSortMode('latest');
      setCategory('All');
      setMinMrr('');
      setMaxPrice('');
      setMinProfitMarginPct(0);
      setMaxChurnOption('any');
      setMinTraffic('');
      setPage(1);
      loadAssets(1, false);
    };

    window.addEventListener('marketplace:refresh', handleRefresh as EventListener);
    window.addEventListener('marketplace:listing-published', handleListingPublished as EventListener);
    return () => {
      window.removeEventListener('marketplace:refresh', handleRefresh as EventListener);
      window.removeEventListener('marketplace:listing-published', handleListingPublished as EventListener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortMode, verifiedOnly, category, minMrr, maxPrice, minProfitMarginPct, maxChurnOption, minTraffic]);

  const visibleAssets = useMemo(() => {
    const seeded = [...assets];
    const seen = new Set(
      seeded.map((asset) => `${normalizeToken(asset.name)}::${normalizeToken(asset.category)}`),
    );

    const minMrrCents = minMrr ? Number(minMrr) * 100 : null;
    const maxPriceCents = maxPrice ? Number(maxPrice) * 100 : null;
    const minTrafficCount = minTraffic ? Number(minTraffic) : null;
    const minProfitMarginBps = Math.max(0, Math.round(minProfitMarginPct * 100));
    const maxChurnBps = churnOptionToBps(maxChurnOption);

    for (const fallback of fallbackAssets) {
      if (category !== 'All' && normalizeToken(fallback.category) !== normalizeToken(category)) {
        continue;
      }
      if (verifiedOnly && fallback.verifiedStatus !== 'verified') {
        continue;
      }
      if (typeof minMrrCents === 'number' && Number.isFinite(minMrrCents) && fallback.mrrCents < minMrrCents) {
        continue;
      }
      if (typeof maxPriceCents === 'number' && Number.isFinite(maxPriceCents) && fallback.askingPriceCents > maxPriceCents) {
        continue;
      }
      if (typeof minTrafficCount === 'number' && Number.isFinite(minTrafficCount) && minTrafficCount > 0) {
        const visitors = Math.max(0, Number(fallback.monthlyUniqueVisitors ?? 0));
        if (visitors < minTrafficCount) {
          continue;
        }
      }
      if (minProfitMarginBps > 0) {
        const marginBps =
          typeof fallback.profitMarginBps === 'number' && Number.isFinite(fallback.profitMarginBps)
            ? Math.round(fallback.profitMarginBps)
            : null;
        if (marginBps === null || marginBps < minProfitMarginBps) {
          continue;
        }
      }
      if (typeof maxChurnBps === 'number') {
        const churnBps =
          typeof fallback.churnBps === 'number' && Number.isFinite(fallback.churnBps)
            ? Math.round(fallback.churnBps)
            : null;
        if (churnBps === null || churnBps > maxChurnBps) {
          continue;
        }
      }

      const key = `${normalizeToken(fallback.name)}::${normalizeToken(fallback.category)}`;
      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      seeded.push(fallback);
    }

    return seeded;
  }, [assets, fallbackAssets, category, verifiedOnly, minMrr, maxPrice, minTraffic, minProfitMarginPct, maxChurnOption]);

  const lockedPlaceholders = useMemo(() => {
    if (!requiresMembership || lockedCount <= 0) {
      return [] as Array<{ id: string; isLocked: true }>;
    }

    const count = Math.min(lockedCount, 8);
    return Array.from({ length: count }).map((_, index) => ({
      id: `locked-${index}`,
      isLocked: true as const,
    }));
  }, [lockedCount, requiresMembership]);

  const activeFilterPills = useMemo(() => {
    const pills: Array<{ key: string; label: string; onClear: () => void }> = [];

    if (category !== 'All') {
      pills.push({
        key: 'category',
        label: `Category: ${category}`,
        onClear: () => setCategory('All'),
      });
    }
    if (verifiedOnly) {
      pills.push({
        key: 'verified',
        label: 'Verified Only',
        onClear: () => setVerifiedOnly(false),
      });
    }
    if (minMrr) {
      pills.push({
        key: 'min-mrr',
        label: `Min MRR: $${Number(minMrr || 0).toLocaleString('en-US')}`,
        onClear: () => setMinMrr(''),
      });
    }
    if (maxPrice) {
      pills.push({
        key: 'max-price',
        label: `Max Price: $${Number(maxPrice || 0).toLocaleString('en-US')}`,
        onClear: () => setMaxPrice(''),
      });
    }
    if (minProfitMarginPct > 0) {
      pills.push({
        key: 'min-margin',
        label: `Profit Margin >= ${minProfitMarginPct}%`,
        onClear: () => setMinProfitMarginPct(0),
      });
    }
    if (maxChurnOption !== 'any') {
      const label =
        maxChurnOption === 'lt5' ? 'Churn < 5%' : maxChurnOption === 'lt10' ? 'Churn < 10%' : 'Churn < 20%';
      pills.push({
        key: 'max-churn',
        label,
        onClear: () => setMaxChurnOption('any'),
      });
    }
    if (minTraffic) {
      pills.push({
        key: 'min-traffic',
        label: `Traffic >= ${Number(minTraffic || 0).toLocaleString('en-US')}/mo`,
        onClear: () => setMinTraffic(''),
      });
    }
    if (sortMode !== 'latest') {
      const label = sortMode === 'mrr' ? 'Sort: Top MRR' : sortMode === 'rev30' ? 'Sort: Top 30D Rev' : 'Sort: Lowest Multiple';
      pills.push({
        key: 'sort',
        label,
        onClear: () => setSortMode('latest'),
      });
    }

    return pills;
  }, [category, maxChurnOption, maxPrice, minMrr, minProfitMarginPct, minTraffic, sortMode, verifiedOnly]);

  const handleResetAllFilters = () => {
    setCategory('All');
    setVerifiedOnly(false);
    setSortMode('latest');
    setMinMrr('');
    setMaxPrice('');
    setMinProfitMarginPct(0);
    setMaxChurnOption('any');
    setMinTraffic('');
  };

  const handleCreateAlertForSearch = async () => {
    setIsCreatingAlert(true);
    setAlertToast(null);

    try {
      const minMrrCents = minMrr ? Math.max(0, Math.round(Number(minMrr) * 100)) : 0;
      const maxPriceCents = maxPrice ? Math.max(0, Math.round(Number(maxPrice) * 100)) : null;
      const minProfitMarginBps = Math.max(0, Math.round(minProfitMarginPct * 100));
      const maxChurnBps = churnOptionToBps(maxChurnOption) ?? null;
      const minTrafficThreshold = minTraffic ? Math.max(0, Math.round(Number(minTraffic))) : null;
      const normalizedCategory = category === 'All' ? null : category;

      const response = await createMarketplaceBuyerAlert({
        minMrrCents,
        maxPriceCents,
        minProfitMarginBps,
        category: normalizedCategory,
        verifiedOnly,
        maxChurnBps,
        minTraffic: minTrafficThreshold,
        includeAlphaDigest: true,
        digestFrequency: 'weekly',
      });

      setAlertToast({
        kind: 'success',
        message: response.alreadyExisted
          ? 'Alert already active for this search.'
          : 'Alert active. Matching deals and weekly Alpha Intelligence updates are now personalized to this search.',
      });
    } catch (nextError) {
      const rawMessage = nextError instanceof Error ? nextError.message : 'Unable to create alert right now.';
      const message = rawMessage.toLowerCase().includes('authentication')
        ? 'Sign in to create buyer alerts for your search.'
        : rawMessage;
      setAlertToast({
        kind: 'error',
        message,
      });
    } finally {
      setIsCreatingAlert(false);
    }
  };

  useEffect(() => {
    if (!alertToast) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setAlertToast(null);
    }, 3500);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [alertToast]);

  return (
    <div className="space-y-12">
      <header className="mb-16 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="space-y-2">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 mb-1"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] shadow-[0_0_8px_#D4AF37]" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#D4AF37]">Premium Liquidity</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tighter text-white leading-[1.1]"
          >
            App <span className="text-zinc-600">Acquisitions</span>
          </motion.h2>
          <p className="text-zinc-500 text-lg font-medium max-w-xl">
            Vetted assets for the next generation of digital owners.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:self-end pb-1">
          <div className="hidden xs:flex items-center gap-4 bg-white/[0.03] border border-white/5 p-1 rounded-full backdrop-blur-md">
            <div className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-400">Live Deal Flow</div>
            <div className="h-4 w-[1px] bg-white/10" />
            <div className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white font-mono-data">
              {visibleAssets.length.toLocaleString()} ASSETS
            </div>
          </div>

          <button
            onClick={onOpenListApp}
            className="group relative h-14 px-8 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/5 text-[#D4AF37] font-black uppercase tracking-widest text-[11px] flex items-center gap-3 hover:bg-[#D4AF37] hover:text-black transition-all duration-500 hover:shadow-[0_0_30px_rgba(212,175,55,0.2)] active:scale-95 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
            <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
            List Your Asset
          </button>
        </div>
      </header>

      <MarketplaceFilters
        categories={categories}
        category={category}
        onCategoryChange={setCategory}
        verifiedOnly={verifiedOnly}
        onToggleVerified={() => setVerifiedOnly((prev) => !prev)}
        sortMode={sortMode}
        onSortModeChange={setSortMode}
        minMrr={minMrr}
        onMinMrrChange={setMinMrr}
        maxPrice={maxPrice}
        onMaxPriceChange={setMaxPrice}
        minProfitMarginPct={minProfitMarginPct}
        onMinProfitMarginPctChange={setMinProfitMarginPct}
        maxChurnOption={maxChurnOption}
        onMaxChurnOptionChange={setMaxChurnOption}
        minTraffic={minTraffic}
        onMinTrafficChange={setMinTraffic}
        onApplyTrafficPreset={(visitors) => setMinTraffic(String(visitors))}
        onCreateAlertForSearch={handleCreateAlertForSearch}
        isCreatingAlert={isCreatingAlert}
        activePills={activeFilterPills}
        onResetAll={handleResetAllFilters}
      />

      {alertToast && (
        <div
          className={`rounded-2xl border px-4 py-3 text-[11px] font-black uppercase tracking-[0.12em] ${
            alertToast.kind === 'success'
              ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-200'
              : 'border-red-500/35 bg-red-500/10 text-red-200'
          }`}
        >
          {alertToast.kind === 'success' ? '🔔' : '⚠️'} {alertToast.message}
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 px-5 py-4 text-xs text-yellow-200">
          Backend notice: {error}
        </div>
      )}

      <div className="relative">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {visibleAssets.map((asset, i) => {
            const status = statusCopy[asset.verifiedStatus] ?? statusCopy.unverified;
            const multipleLabel = asset.valuationMultipleX100 && asset.valuationMultipleX100 > 0
              ? `${(asset.valuationMultipleX100 / 100).toFixed(2)}x`
              : '—';
            const churnMeta = churnBadgeMeta(asset.churnBps);
            const cardIcon = isIconImageSource(asset.logoUrl) ? String(asset.logoUrl) : '💎';
            const normalizedAssetMarketplaceId = String(asset.marketplaceAssetId ?? asset.id ?? '').trim().toLowerCase();
            const normalizedAssetJamId = String(asset.jamId ?? '').trim().toLowerCase();
            const linkedApp = apps.find((candidate) => {
              const candidateMarketplaceId = String(candidate.marketplaceAssetId ?? '').trim().toLowerCase();
              if (normalizedAssetMarketplaceId && candidateMarketplaceId && candidateMarketplaceId === normalizedAssetMarketplaceId) {
                return true;
              }

              const candidateId = String(candidate.id ?? '').trim().toLowerCase();
              return Boolean(normalizedAssetJamId && candidateId && candidateId === normalizedAssetJamId);
            });

            return (
              <motion.div
                key={asset.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (i % 12) * 0.05 }}
                onClick={() => onSelectApp(mapAssetToVibeApp(asset, linkedApp))}
                className="group relative p-6 rounded-[24px] bg-white/[0.02] border border-white/5 transition-all duration-500 flex flex-col h-full hover:border-yellow-500/30 cursor-pointer"
              >
                <div className="flex justify-between items-start mb-6">
                  <GemstoneIcon icon={cardIcon} accentColor="212, 175, 55" isHovered={true} />
                  <div className="text-right space-y-2">
                    <span className="block text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Asking Price</span>
                    <span className="block text-2xl font-mono-data text-[#D4AF37] font-bold tracking-tighter">
                      {formatCurrencyCompact(asset.askingPriceCents)}
                    </span>
                    <span
                      className={`inline-flex rounded-full border px-2 py-1 text-[9px] font-black uppercase tracking-widest ${churnMeta.className}`}
                    >
                      {churnMeta.label}
                    </span>
                  </div>
                </div>

                <div className="mb-6 flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-bold text-white tracking-tight">{asset.name}</h3>
                    <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                  </div>
                  <p className="text-zinc-500 text-sm leading-relaxed line-clamp-2">{asset.tagline}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 border-y border-white/5 mb-6">
                  <div>
                    <span className="block text-[9px] text-zinc-600 font-black uppercase tracking-widest mb-1">Monthly Rev</span>
                    <span className="block text-sm font-mono-data text-[#00FF41] font-bold">
                      {formatCurrencyFull(asset.mrrCents)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[9px] text-zinc-600 font-black uppercase tracking-widest mb-1">Valuation Multiple</span>
                    <span className="block text-sm font-mono-data text-white font-bold">{multipleLabel}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-auto">
                  <div className="flex gap-2 items-center">
                    <span className="px-2 py-0.5 rounded-full border border-white/10 bg-white/5 text-[9px] text-zinc-400 font-bold tracking-widest uppercase">
                      {asset.category}
                    </span>
                    <TrafficBadge monthlyUniqueVisitors={asset.monthlyUniqueVisitors} />
                    <ProfitMarginBadge profitMarginBps={asset.profitMarginBps} />
                    <span className={`text-[9px] font-black uppercase tracking-widest ${status.className}`}>
                      {status.label}
                    </span>
                  </div>
                  <button className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#D4AF37] group-hover:text-white transition-colors">
                    View Deal <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </button>
                </div>

                <div className="absolute inset-0 rounded-[24px] opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none bg-yellow-500" />
              </motion.div>
            );
          })}

          {lockedPlaceholders.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (index % 12) * 0.05 }}
              className="group relative p-6 rounded-[24px] bg-white/[0.02] border border-white/5 transition-all duration-500 flex flex-col h-full opacity-40 grayscale blur-[2px] pointer-events-none"
            >
              <div className="flex justify-between items-start mb-6">
                <GemstoneIcon icon="🔒" accentColor="80, 80, 80" isHovered={false} />
                <div className="text-right">
                  <span className="block text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Asking Price</span>
                  <span className="block text-2xl font-mono-data text-zinc-500 font-bold tracking-tighter">Locked</span>
                </div>
              </div>
              <div className="mb-6 flex-1">
                <div className="h-5 bg-zinc-800/70 rounded w-2/3 mb-3" />
                <div className="h-3 bg-zinc-900/80 rounded w-full mb-2" />
                <div className="h-3 bg-zinc-900/70 rounded w-4/5" />
              </div>
              <div className="h-16 rounded-xl border border-white/5 bg-black/30" />
            </motion.div>
          ))}
        </div>

        {isLoading && (
          <div className="mt-8 text-center text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">
            Loading Marketplace
          </div>
        )}

        {!isLoading && hasMore && (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={() => loadAssets(page + 1, true)}
              className="h-12 px-8 rounded-full border border-white/15 text-xs font-black uppercase tracking-widest text-zinc-300 hover:bg-white hover:text-black transition-all"
            >
              Load More Assets
            </button>
          </div>
        )}

        {requiresMembership && lockedCount > 0 && (
          <div className="absolute inset-x-0 bottom-0 h-[600px] flex items-end justify-center pb-32">
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none" />

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative z-10 w-full max-w-2xl mx-auto px-6 text-center"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/20 mb-8 backdrop-blur-xl">
                <Lock className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4AF37]">Proprietary Deal Flow</span>
              </div>

              <h3 className="text-3xl md:text-5xl font-extrabold text-white tracking-tighter mb-6 leading-tight">
                Unlock the <span className="italic font-serif-rank text-[#D4AF37]">Full Vault.</span>
              </h3>

              <p className="text-zinc-500 text-lg md:text-xl font-medium mb-12 max-w-lg mx-auto leading-relaxed">
                Gain access to <span className="text-zinc-300">{lockedCount.toLocaleString()} additional members-only assets</span> and deeper due diligence streams.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => onOpenMembership?.()}
                  className="h-16 px-10 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-xs flex items-center gap-3 hover:scale-105 transition-all shadow-[0_0_60px_rgba(255,255,255,0.2)] active:scale-95"
                >
                  Unlock Member Access <ChevronRight className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2 px-6 py-4 rounded-2xl border border-white/10 text-zinc-400 text-[10px] font-black uppercase tracking-widest">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Member Access Only
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>

      <section className="mt-24 p-12 rounded-[40px] bg-gradient-to-br from-[#0A0A0A] to-[#000000] border border-white/5 flex flex-col md:flex-row items-center justify-between gap-12 overflow-hidden relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

        <div className="relative z-10">
          <h3 className="text-3xl font-extrabold text-white mb-4 tracking-tighter">Ready to <span className="text-[#D4AF37]">Exit?</span></h3>
          <p className="text-zinc-500 max-w-md font-medium text-lg leading-relaxed">
            List your vibe-coded application on the Midnight Zenith marketplace and connect with thousands of accredited investors globally.
          </p>
        </div>

        <button
          onClick={onOpenListApp}
          className="relative z-10 h-16 px-12 rounded-full bg-white text-black font-black uppercase tracking-widest text-xs hover:bg-[#D4AF37] hover:scale-105 transition-all shadow-[0_20px_40px_rgba(0,0,0,0.4)] active:scale-95 flex items-center gap-3"
        >
          Begin Listing Process <ArrowUpRight className="w-4 h-4" />
        </button>

        <ShoppingBag className="absolute -right-8 -bottom-8 w-64 h-64 text-white/[0.02] rotate-12 pointer-events-none" />
      </section>
    </div>
  );
};

export default MarketplaceView;
