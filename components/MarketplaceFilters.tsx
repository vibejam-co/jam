import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BellRing, ChevronDown, Filter, SlidersHorizontal, TrendingUp, Users, X } from 'lucide-react';

export type MarketplaceSortMode = 'latest' | 'mrr' | 'rev30' | 'multiple';
export type ChurnFilterOption = 'any' | 'lt5' | 'lt10' | 'lt20';

export interface ActiveFilterPill {
  key: string;
  label: string;
  onClear: () => void;
}

interface MarketplaceFiltersProps {
  categories: string[];
  category: string;
  onCategoryChange: (category: string) => void;
  verifiedOnly: boolean;
  onToggleVerified: () => void;
  sortMode: MarketplaceSortMode;
  onSortModeChange: (mode: MarketplaceSortMode) => void;
  minMrr: string;
  onMinMrrChange: (value: string) => void;
  maxPrice: string;
  onMaxPriceChange: (value: string) => void;
  minProfitMarginPct: number;
  onMinProfitMarginPctChange: (value: number) => void;
  maxChurnOption: ChurnFilterOption;
  onMaxChurnOptionChange: (option: ChurnFilterOption) => void;
  minTraffic: string;
  onMinTrafficChange: (value: string) => void;
  onApplyTrafficPreset: (visitors: number) => void;
  onCreateAlertForSearch: () => void;
  isCreatingAlert: boolean;
  activePills: ActiveFilterPill[];
  onResetAll: () => void;
}

const churnOptions: Array<{ value: ChurnFilterOption; label: string }> = [
  { value: 'any', label: 'Any Churn' },
  { value: 'lt5', label: '< 5%' },
  { value: 'lt10', label: '< 10%' },
  { value: 'lt20', label: '< 20%' },
];

const sortOptions: Array<{ value: MarketplaceSortMode; label: string }> = [
  { value: 'latest', label: 'Latest' },
  { value: 'mrr', label: 'Top MRR' },
  { value: 'rev30', label: 'Top 30D Rev' },
  { value: 'multiple', label: 'Lowest Multiple' },
];

const normalizeCategoryToken = (value: string): string => value.trim().toLowerCase();

const EXPLORE_CATEGORIES = [
  'Ai',
  'Analytics',
  'Community',
  'Content Creation',
  'Crypto',
  'Customer Support',
  'Design Tools',
  'Developer Tools',
  'Ecommerce',
  'Education',
  'Entertainment',
  'Fintech',
  'Games',
  'Health',
  'IoT',
  'Legal',
  'Marketing',
  'Marketplace',
  'Mobile Apps',
  'News & Magazines',
  'No-Code',
  'Productivity',
  'Real Estate',
  'Recruiting & HR',
  'SaaS',
  'Sales',
  'Security',
  'Social Media',
  'Travel',
  'Utilities',
];

const MarketplaceFilters: React.FC<MarketplaceFiltersProps> = ({
  categories,
  category,
  onCategoryChange,
  verifiedOnly,
  onToggleVerified,
  sortMode,
  onSortModeChange,
  minMrr,
  onMinMrrChange,
  maxPrice,
  onMaxPriceChange,
  minProfitMarginPct,
  onMinProfitMarginPctChange,
  maxChurnOption,
  onMaxChurnOptionChange,
  minTraffic,
  onMinTrafficChange,
  onApplyTrafficPreset,
  onCreateAlertForSearch,
  isCreatingAlert,
  activePills,
  onResetAll,
}) => {
  const [isExploreOpen, setIsExploreOpen] = useState(false);
  const exploreRef = useRef<HTMLDivElement | null>(null);
  const categoryOptions = useMemo(
    () =>
      Array.from(
        new Set(
          [...EXPLORE_CATEGORIES, ...categories]
            .map((item) => item.trim())
            .filter((item) => item.length > 0 && normalizeCategoryToken(item) !== 'all'),
        ),
      ),
    [categories],
  );
  const saasCategory = useMemo(
    () => categoryOptions.find((item) => normalizeCategoryToken(item) === 'saas') ?? 'SaaS',
    [categoryOptions],
  );
  const isAllSelected = normalizeCategoryToken(category) === 'all';
  const isSaasSelected = normalizeCategoryToken(category) === normalizeCategoryToken(saasCategory);
  const isExploreSelected = !isAllSelected && !isSaasSelected;

  useEffect(() => {
    if (!isExploreOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (!exploreRef.current) {
        return;
      }
      if (!exploreRef.current.contains(event.target as Node)) {
        setIsExploreOpen(false);
      }
    };

    window.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExploreOpen]);

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.02] px-4 py-4 sm:px-6 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
          <Filter className="w-3.5 h-3.5" />
          Marketplace Filters
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCreateAlertForSearch}
            disabled={isCreatingAlert}
            className="h-8 px-3 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-[10px] font-black uppercase tracking-widest text-cyan-200 hover:border-cyan-300/40 hover:text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
          >
            <BellRing className="w-3.5 h-3.5" />
            {isCreatingAlert ? 'Saving Alert...' : '🔔 Create Alert for this Search'}
          </button>
          {activePills.length > 0 && (
            <button
              type="button"
              onClick={onResetAll}
              className="h-8 px-3 rounded-full border border-white/10 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:border-white/30 hover:text-zinc-100 transition-all"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onCategoryChange('All')}
          className={`px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all ${
            isAllSelected
              ? 'bg-white text-black border-white'
              : 'bg-transparent text-zinc-500 border-white/10 hover:border-white/25'
          }`}
        >
          All
        </button>

        <button
          type="button"
          onClick={() => onCategoryChange(saasCategory)}
          className={`px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all ${
            isSaasSelected
              ? 'bg-white text-black border-white'
              : 'bg-transparent text-zinc-500 border-white/10 hover:border-white/25'
          }`}
        >
          SaaS
        </button>

        <div ref={exploreRef} className="relative">
          <button
            type="button"
            onClick={() => setIsExploreOpen((prev) => !prev)}
            className={`px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all inline-flex items-center gap-1.5 ${
              isExploreSelected || isExploreOpen
                ? 'bg-white text-black border-white'
                : 'bg-transparent text-zinc-500 border-white/10 hover:border-white/25'
            }`}
          >
            Explore
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExploreOpen ? 'rotate-180' : ''}`} />
          </button>

          {isExploreOpen && (
            <div className="absolute left-0 top-[calc(100%+8px)] z-30 min-w-[180px] rounded-2xl border border-white/10 bg-[#0B0B0B] p-2 shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
              <div className="max-h-64 overflow-auto pr-1 space-y-1">
                {categoryOptions.map((item) => {
                  const isItemSelected = normalizeCategoryToken(category) === normalizeCategoryToken(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        onCategoryChange(item);
                        setIsExploreOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        isItemSelected
                          ? 'bg-cyan-500/20 text-cyan-100 border border-cyan-400/40'
                          : 'text-zinc-300 hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onToggleVerified}
          className={`px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all ${
            verifiedOnly
              ? 'bg-yellow-500/15 text-[#D4AF37] border-yellow-500/30'
              : 'bg-transparent text-zinc-500 border-white/10 hover:border-white/25'
          }`}
        >
          Verified Only
        </button>

        {sortOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onSortModeChange(option.value)}
            className={`px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all ${
              sortMode === option.value
                ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                : 'bg-transparent text-zinc-500 border-white/10 hover:border-white/25'
            }`}
          >
            {option.label}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2">
          <input
            type="number"
            min={0}
            value={minMrr}
            onChange={(event) => onMinMrrChange(event.target.value)}
            placeholder="Min MRR ($)"
            className="h-9 w-28 rounded-full bg-black/60 border border-white/10 px-3 text-[10px] font-black uppercase tracking-widest text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-white/25"
          />
          <input
            type="number"
            min={0}
            value={maxPrice}
            onChange={(event) => onMaxPriceChange(event.target.value)}
            placeholder="Max Price ($)"
            className="h-9 w-32 rounded-full bg-black/60 border border-white/10 px-3 text-[10px] font-black uppercase tracking-widest text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-white/25"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">
            <span className="inline-flex items-center gap-2"><SlidersHorizontal className="w-3.5 h-3.5" /> Profit Margin</span>
            <span className="text-zinc-300">{minProfitMarginPct}%+</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={minProfitMarginPct}
            onChange={(event) => onMinProfitMarginPctChange(Number(event.target.value))}
            className="w-full accent-emerald-400"
          />
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
          <label className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">
            <span className="inline-flex items-center gap-2"><TrendingUp className="w-3.5 h-3.5" /> Max Churn</span>
          </label>
          <select
            value={maxChurnOption}
            onChange={(event) => onMaxChurnOptionChange(event.target.value as ChurnFilterOption)}
            className="h-10 w-full rounded-xl border border-white/10 bg-[#0D0D0D] px-3 text-[11px] font-black uppercase tracking-widest text-zinc-200 focus:outline-none focus:border-white/30"
          >
            {churnOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">
            <span className="inline-flex items-center gap-2"><Users className="w-3.5 h-3.5" /> Minimum Traffic</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            {[5000, 10000, 25000].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => onApplyTrafficPreset(preset)}
                className="h-7 px-2 rounded-full border border-white/10 text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:border-white/25 hover:text-white transition-all"
              >
                {preset >= 1000 ? `${preset / 1000}k+` : preset}
              </button>
            ))}
          </div>
          <input
            type="number"
            min={0}
            value={minTraffic}
            onChange={(event) => onMinTrafficChange(event.target.value)}
            placeholder="Min Visits / Month"
            className="h-10 w-full rounded-xl border border-white/10 bg-[#0D0D0D] px-3 text-[11px] font-black uppercase tracking-widest text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-white/30"
          />
        </div>
      </div>

      {activePills.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {activePills.map((pill) => (
            <button
              key={pill.key}
              type="button"
              onClick={pill.onClear}
              className="inline-flex items-center gap-1 rounded-full border border-cyan-500/35 bg-cyan-500/15 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-cyan-200 hover:border-cyan-300/50 hover:text-white transition-all"
            >
              {pill.label}
              <X className="w-3 h-3" />
            </button>
          ))}
        </div>
      )}
    </section>
  );
};

export default MarketplaceFilters;
