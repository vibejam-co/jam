import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, PencilLine, ShieldCheck } from 'lucide-react';
import { MarketplaceVisibility } from '../types';
import {
  deleteMarketplaceAsset,
  fetchMarketplaceAssetFinancials,
  fetchMarketplaceAssetTraffic,
  fetchMarketplaceAssetDetail,
  updateMarketplaceAsset,
  updateMarketplaceAssetFinancials,
  updateMarketplaceAssetTraffic,
} from '../lib/api';
import AssetFinancialsForm, { AssetFinancialsDraft } from './AssetFinancialsForm';
import AssetTrafficForm, { AssetTrafficDraft } from './AssetTrafficForm';

export interface ListingEditSeed {
  id: string;
  name: string;
  tagline: string;
  description?: string;
  category: string;
  subcategory?: string;
  techStack?: string[];
  founderName?: string;
  founderEmail?: string;
  logoUrl?: string;
  askingPriceCents: number;
  mrrCents: number;
  operatingExpensesCents?: number;
  expenseBreakdown?: string;
  monthlyUniqueVisitors?: number;
  analyticsProofUrl?: string;
  isAnonymous: boolean;
  visibility: MarketplaceVisibility;
}

interface ListingEditModalProps {
  seed: ListingEditSeed;
  onClose: () => void;
  onSaved?: (updatedAsset?: any) => void | Promise<void>;
  onDeleted?: (assetId: string) => void | Promise<void>;
}

const fromCentsToUsdInput = (cents: number): string => {
  const dollars = Number(cents ?? 0) / 100;
  if (!Number.isFinite(dollars) || dollars <= 0) {
    return '';
  }
  return Math.round(dollars).toLocaleString('en-US');
};

const ListingEditModal: React.FC<ListingEditModalProps> = ({ seed, onClose, onSaved, onDeleted }) => {
  const [name, setName] = useState(seed.name);
  const [tagline, setTagline] = useState(seed.tagline);
  const [description, setDescription] = useState(seed.description ?? '');
  const [category, setCategory] = useState(seed.category);
  const [subcategory, setSubcategory] = useState(seed.subcategory ?? '');
  const [techStackInput, setTechStackInput] = useState((seed.techStack ?? []).join(', '));
  const [founderName, setFounderName] = useState(seed.founderName ?? '');
  const [founderEmail, setFounderEmail] = useState(seed.founderEmail ?? '');
  const [logoUrl, setLogoUrl] = useState(seed.logoUrl ?? '');
  const [askingPrice, setAskingPrice] = useState(fromCentsToUsdInput(seed.askingPriceCents));
  const [mrrCents, setMrrCents] = useState(Math.max(0, Number(seed.mrrCents ?? 0)));
  const [operatingExpensesCents, setOperatingExpensesCents] = useState(
    Math.max(0, Number(seed.operatingExpensesCents ?? 0)),
  );
  const [expenseBreakdown, setExpenseBreakdown] = useState(seed.expenseBreakdown ?? '');
  const [financialDraft, setFinancialDraft] = useState<AssetFinancialsDraft | null>(null);
  const [monthlyUniqueVisitors, setMonthlyUniqueVisitors] = useState(
    Math.max(0, Number(seed.monthlyUniqueVisitors ?? 0)),
  );
  const [analyticsProofUrl, setAnalyticsProofUrl] = useState(seed.analyticsProofUrl ?? '');
  const [trafficDraft, setTrafficDraft] = useState<AssetTrafficDraft | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(Boolean(seed.isAnonymous));
  const [visibility, setVisibility] = useState<MarketplaceVisibility>(seed.visibility);

  const [isHydrating, setIsHydrating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizedPrice = useMemo(() => askingPrice.replace(/[^0-9.]/g, ''), [askingPrice]);
  const parsedTechStack = useMemo(
    () =>
      techStackInput
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    [techStackInput],
  );

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      setIsHydrating(true);
      try {
        const [response, financials, traffic] = await Promise.all([
          fetchMarketplaceAssetDetail(seed.id),
          fetchMarketplaceAssetFinancials(seed.id).catch(() => null),
          fetchMarketplaceAssetTraffic(seed.id).catch(() => null),
        ]);
        if (cancelled || response.locked) {
          return;
        }
        const asset = response.asset as any;
        setName(asset.name ?? seed.name);
        setTagline(asset.tagline ?? seed.tagline);
        setDescription(asset.description ?? seed.description ?? '');
        setCategory(asset.category ?? seed.category);
        setSubcategory(asset.subcategory ?? '');
        setTechStackInput(Array.isArray(asset.techStack) ? asset.techStack.join(', ') : (seed.techStack ?? []).join(', '));
        setFounderName(asset?.founder?.name ?? seed.founderName ?? '');
        setFounderEmail(asset?.founder?.email ?? seed.founderEmail ?? '');
        setLogoUrl(asset?.logoUrl ?? seed.logoUrl ?? '');
        const resolvedMrr = Math.max(
          0,
          Number(financials?.mrrCents ?? asset?.mrrCents ?? seed.mrrCents ?? 0),
        );
        setMrrCents(resolvedMrr);
        setOperatingExpensesCents(
          Math.max(
            0,
            Number(financials?.operatingExpensesCents ?? asset?.operatingExpensesCents ?? seed.operatingExpensesCents ?? 0),
          ),
        );
        setExpenseBreakdown(
          typeof financials?.expenseBreakdown === 'string'
            ? financials.expenseBreakdown
            : typeof asset?.expenseBreakdown === 'string'
              ? asset.expenseBreakdown
              : (seed.expenseBreakdown ?? ''),
        );
        setMonthlyUniqueVisitors(
          Math.max(
            0,
            Number(
              (traffic as any)?.monthlyUniqueVisitors
              ?? (response as any)?.asset?.monthlyUniqueVisitors
              ?? (response as any)?.asset?.monthly_unique_visitors
              ?? (seed.monthlyUniqueVisitors ?? 0),
            ),
          ),
        );
        setAnalyticsProofUrl(
          typeof (traffic as any)?.analyticsProofUrl === 'string'
            ? (traffic as any).analyticsProofUrl
            : typeof (response as any)?.asset?.analyticsProofUrl === 'string'
              ? (response as any).asset.analyticsProofUrl
              : typeof (response as any)?.asset?.analytics_proof_url === 'string'
                ? (response as any).asset.analytics_proof_url
                : (seed.analyticsProofUrl ?? ''),
        );
        setAskingPrice(fromCentsToUsdInput(Number(asset.askingPriceCents ?? seed.askingPriceCents)));
        setIsAnonymous(Boolean(asset.isAnonymous ?? seed.isAnonymous));
        setVisibility((asset.visibility as MarketplaceVisibility) ?? seed.visibility);
      } catch {
        // Keep seed values when hydration fails.
      } finally {
        if (!cancelled) {
          setIsHydrating(false);
        }
      }
    };

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [seed]);

  const handleSave = async () => {
    if (isSaving || isDeleting) {
      return;
    }

    setError(null);

    if (!name.trim() || !tagline.trim() || !category.trim()) {
      setError('Name, tagline, and category are required.');
      return;
    }

    if (!normalizedPrice) {
      setError('Asking price is required.');
      return;
    }

    setIsSaving(true);

    try {
      const response = await updateMarketplaceAsset(seed.id, {
        name: name.trim(),
        tagline: tagline.trim(),
        description: description.trim(),
        logoUrl: logoUrl.trim(),
        category: category.trim(),
        subcategory: subcategory.trim(),
        techStack: parsedTechStack,
        founderName: founderName.trim() || undefined,
        founderEmail: founderEmail.trim() || undefined,
        askingPriceUsd: normalizedPrice,
        isAnonymous,
        visibility,
      });

      const sideEffects: Array<Promise<any>> = [];
      if (financialDraft?.hasChanges) {
        sideEffects.push(
          updateMarketplaceAssetFinancials(seed.id, {
            operatingExpenses: financialDraft.operatingExpenses,
            expenseBreakdown: financialDraft.expenseBreakdown,
          }),
        );
      }
      if (trafficDraft?.hasChanges) {
        sideEffects.push(
          updateMarketplaceAssetTraffic(seed.id, {
            monthlyUniqueVisitors: trafficDraft.monthlyUniqueVisitorsCount,
            analyticsProofUrl: trafficDraft.analyticsProofUrl,
          }),
        );
      }
      if (sideEffects.length > 0) {
        await Promise.all(sideEffects);
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('marketplace:refresh'));
        window.dispatchEvent(new CustomEvent('profile:refresh-marketplace'));
      }

      await onSaved?.((response as any)?.asset);
      onClose();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Failed to update listing.');
      setIsSaving(false);
      return;
    }

    setIsSaving(false);
  };

  const handleDelete = async () => {
    if (isSaving || isDeleting || isHydrating) {
      return;
    }

    const confirmed = typeof window === 'undefined'
      ? true
      : window.confirm('Delete this listing? This action cannot be undone.');

    if (!confirmed) {
      return;
    }

    setError(null);
    setIsDeleting(true);

    try {
      await deleteMarketplaceAsset(seed.id);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('marketplace:refresh'));
        window.dispatchEvent(new CustomEvent('profile:refresh-marketplace'));
      }

      await onDeleted?.(seed.id);
      onClose();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Failed to delete listing.');
      setIsDeleting(false);
      return;
    }

    setIsDeleting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[460] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4"
    >
      <div className="absolute inset-0" onClick={onClose} />

      <motion.div
        initial={{ scale: 0.96, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96, y: 20 }}
        className="relative w-full max-w-2xl rounded-[36px] border border-[#D4AF37]/20 bg-[#050505] shadow-[0_0_120px_rgba(0,0,0,0.7)] overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="px-8 py-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37]">
              <PencilLine className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-white text-2xl font-black tracking-tight">Edit Listing</h3>
              <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.25em]">Owner Controls</p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5 transition-colors">
            <X className="w-6 h-6 text-zinc-500" />
          </button>
        </header>

        <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <label className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Listing Name</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-white focus:outline-none focus:border-white/30"
              />
            </label>

            <label className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Asking Price (USD)</span>
              <input
                value={askingPrice}
                onChange={(event) => setAskingPrice(event.target.value)}
                className="w-full h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-white font-mono-data focus:outline-none focus:border-white/30"
                placeholder="e.g. 250,000"
              />
            </label>
          </div>

          <label className="space-y-2 block">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Tagline</span>
            <input
              value={tagline}
              onChange={(event) => setTagline(event.target.value)}
              className="w-full h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-white focus:outline-none focus:border-white/30"
            />
          </label>

          <label className="space-y-2 block">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Category</span>
            <input
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="w-full h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-white focus:outline-none focus:border-white/30"
            />
          </label>

          <label className="space-y-2 block">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Subcategory</span>
            <input
              value={subcategory}
              onChange={(event) => setSubcategory(event.target.value)}
              className="w-full h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-white focus:outline-none focus:border-white/30"
              placeholder="Optional"
            />
          </label>

          <label className="space-y-2 block">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Description</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:outline-none focus:border-white/30"
            />
          </label>

          <label className="space-y-2 block">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Tech Stack (Comma-Separated)</span>
            <input
              value={techStackInput}
              onChange={(event) => setTechStackInput(event.target.value)}
              className="w-full h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-white focus:outline-none focus:border-white/30"
              placeholder="React, Supabase, Stripe"
            />
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <label className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Founder Name</span>
              <input
                value={founderName}
                onChange={(event) => setFounderName(event.target.value)}
                className="w-full h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-white focus:outline-none focus:border-white/30"
              />
            </label>
            <label className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Founder Email</span>
              <input
                value={founderEmail}
                onChange={(event) => setFounderEmail(event.target.value)}
                className="w-full h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-white focus:outline-none focus:border-white/30"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-5">
            <label className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Logo URL</span>
              <input
                value={logoUrl}
                onChange={(event) => setLogoUrl(event.target.value)}
                className="w-full h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-white focus:outline-none focus:border-white/30"
                placeholder="https://..."
              />
            </label>
          </div>

          <AssetFinancialsForm
            mrrCents={mrrCents}
            initialOperatingExpensesCents={operatingExpensesCents}
            initialExpenseBreakdown={expenseBreakdown}
            disabled={isSaving || isDeleting || isHydrating}
            onDraftChange={setFinancialDraft}
          />

          <AssetTrafficForm
            initialMonthlyUniqueVisitors={monthlyUniqueVisitors}
            initialAnalyticsProofUrl={analyticsProofUrl}
            disabled={isSaving || isDeleting || isHydrating}
            onDraftChange={setTrafficDraft}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Visibility</span>
              <select
                value={visibility}
                onChange={(event) => setVisibility(event.target.value as MarketplaceVisibility)}
                className="w-full h-12 rounded-2xl border border-white/10 bg-[#0D0D0D] px-4 text-white focus:outline-none focus:border-white/30"
              >
                <option value="public">Public</option>
                <option value="members_only">Members Only</option>
                <option value="private">Private</option>
              </select>
            </label>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Anonymize</p>
                <p className="text-xs text-zinc-400">Hide founder identity on public cards.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAnonymous((prev) => !prev)}
                className={`w-12 h-6 rounded-full transition-all relative ${isAnonymous ? 'bg-[#D4AF37]' : 'bg-white/10'}`}
              >
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isAnonymous ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-200">
              {error}
            </div>
          )}

          {isHydrating && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 text-xs text-zinc-400">
              Loading listing details...
            </div>
          )}

          <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 text-xs text-cyan-200 inline-flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            Live listings can be edited without unpublishing.
          </div>
        </div>

        <footer className="px-8 py-6 border-t border-white/10 bg-[#060606] flex justify-between gap-3">
          <button
            type="button"
            onClick={() => void handleDelete()}
            disabled={isSaving || isDeleting || isHydrating}
            className="h-11 px-5 rounded-full border border-red-500/35 text-xs font-black uppercase tracking-widest text-red-300 hover:bg-red-500/15 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isDeleting ? 'Deleting…' : 'Delete Listing'}
          </button>

          <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-11 px-5 rounded-full border border-white/15 text-xs font-black uppercase tracking-widest text-zinc-300 hover:bg-white hover:text-black transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSaving || isHydrating || isDeleting}
            className="h-11 px-6 rounded-full bg-white text-black text-xs font-black uppercase tracking-widest hover:bg-zinc-200 transition-all disabled:opacity-60"
          >
            {isSaving ? 'Saving…' : 'Save Listing'}
          </button>
          </div>
        </footer>
      </motion.div>
    </motion.div>
  );
};

export const ListingEditModalPortal: React.FC<ListingEditModalProps> = (props) => (
  <AnimatePresence>
    <ListingEditModal {...props} />
  </AnimatePresence>
);

export default ListingEditModal;
