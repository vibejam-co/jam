import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  ExternalLink,
  Info,
  DollarSign,
  Rocket,
  Mail,
  EyeOff,
  CreditCard,
  CheckCircle2,
  HelpCircle,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { MarketplacePitchDecks, VibeApp } from '../types';
import {
  connectMarketplaceAsset,
  createMarketplaceAssetDraft,
  updateMarketplaceAsset,
  generateMarketplaceAssetDeck,
  publishMarketplaceAsset,
  updateMarketplaceAssetFinancials,
  updateMarketplaceAssetTraffic,
} from '../lib/api';
import DeckViewer from './DeckViewer';

interface ListAppModalProps {
  onClose: () => void;
  onPublish: (app: VibeApp) => void | Promise<void>;
}

type RevenueProvider = 'Stripe' | 'LemonSqueezy' | 'Polar' | 'Dodo' | 'RevenueCat' | null;

const PROVIDERS = [
  { id: 'Stripe', label: 'Stripe', color: 'bg-[#635BFF]', beta: false },
  { id: 'LemonSqueezy', label: 'LemonSqueezy', color: 'bg-[#FFC233]', beta: true },
  { id: 'Polar', label: 'Polar', color: 'bg-[#43B2FF]', beta: true },
  { id: 'Dodo', label: 'Dodo Payments', color: 'bg-[#FF4A4A]', beta: true },
  { id: 'RevenueCat', label: 'RevenueCat', color: 'bg-[#F15A24]', beta: true },
] as const;

const PROVIDER_ID_MAP = {
  Stripe: 'stripe',
  LemonSqueezy: 'lemonsqueezy',
  Polar: 'polar',
  Dodo: 'dodo',
  RevenueCat: 'revenuecat',
} as const;

const BOOST_TIERS = [
  { id: 'Free', name: 'Free', price: '$0', desc: 'Standard listing forever.', perks: ['Verified Badge', 'Basic Search'] },
  { id: 'Pro', name: 'Pro', price: '$49', desc: 'Stand out from the crowd.', perks: ['2x Visibility', 'Featured Badge', 'Priority Support'] },
  { id: 'Elite', name: 'Elite', price: '$299', desc: 'Maximum acquisition speed.', perks: ['10x Visibility', 'Newsletter Spot', 'Canvas Showcase', 'Direct Outreach'] },
] as const;

const TIER_ID_MAP = {
  Free: 'free',
  Pro: 'pro',
  Elite: 'elite',
} as const;

const BOOST_TIERS_RESTORE_WORD = 'AURORA_RESTORE';
const hasPaidBoostsUnlocked = () =>
  String(import.meta.env.VITE_MARKETPLACE_BOOSTS_UNLOCK_WORD ?? '').trim() === BOOST_TIERS_RESTORE_WORD;

const CATEGORY_OPTIONS = [
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
] as const;

type PendingBoostCheckout = {
  tier: 'free' | 'pro' | 'elite';
  sessionId: string;
  checkoutUrl: string;
};

const ListAppModal: React.FC<ListAppModalProps> = ({ onClose, onPublish }) => {
  const [step, setStep] = useState(1);
  const [selectedProvider, setSelectedProvider] = useState<RevenueProvider>(null);
  const [selectedTier, setSelectedTier] = useState<'Free' | 'Pro' | 'Elite'>('Free');
  const [showAnonymityTooltip, setShowAnonymityTooltip] = useState(false);
  const [showStripeKeyTooltip, setShowStripeKeyTooltip] = useState(false);
  const [paidBoostsEnabled] = useState<boolean>(() => hasPaidBoostsUnlocked());

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftAssetId, setDraftAssetId] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [dodoStoreId, setDodoStoreId] = useState('');
  const [revenueCatProjectId, setRevenueCatProjectId] = useState('');
  const [iconUploadError, setIconUploadError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingBoostCheckout, setPendingBoostCheckout] = useState<PendingBoostCheckout | null>(null);
  const [deckPreviewLoading, setDeckPreviewLoading] = useState(false);
  const [deckPreviewStatus, setDeckPreviewStatus] = useState<string | null>(null);
  const [deckPreviewError, setDeckPreviewError] = useState<string | null>(null);
  const [deckPreviewData, setDeckPreviewData] = useState<MarketplacePitchDecks | null>(null);
  const [deckViewerOpen, setDeckViewerOpen] = useState(false);
  const iconFileInputRef = useRef<HTMLInputElement | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    website: '',
    pitch: '',
    category: 'SaaS' as string,
    icon: '💎',
    logoUrl: '',
    founderName: '',
    founderEmail: '',
    askingPrice: '',
    profitMargin: 80,
    monthlyOperatingExpenses: 0,
    activeUsers: 0,
    analyticsProofUrl: '',
    includePitchDeck: false,
    isAnonymous: false,
    techStack: '',
  });

  const resetMessages = () => {
    setStatusMessage(null);
    setErrorMessage(null);
  };

  const visibleBoostTiers = paidBoostsEnabled
    ? BOOST_TIERS
    : BOOST_TIERS.filter((tier) => tier.id === 'Free');

  useEffect(() => {
    if (!paidBoostsEnabled && selectedTier !== 'Free') {
      setSelectedTier('Free');
    }
    if (!paidBoostsEnabled) {
      setPendingBoostCheckout(null);
    }
  }, [paidBoostsEnabled, selectedTier]);

  useEffect(() => {
    if (!deckPreviewLoading) {
      setDeckPreviewStatus(null);
      return;
    }

    const startedAt = Date.now();
    const updateStatus = () => {
      const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
      let label = 'Analyzing VibeJam Financials...';

      if (elapsedSeconds >= 15) {
        label = 'Finalizing PDF...';
      } else if (elapsedSeconds >= 8) {
        label = 'Nano Banana 2 rendering slide visuals...';
      } else if (elapsedSeconds >= 3) {
        label = 'Gemini 3 Pro drafting M&A narrative...';
      }

      setDeckPreviewStatus(`${elapsedSeconds}s · ${label}`);
    };

    updateStatus();
    const timer = window.setInterval(updateStatus, 800);
    return () => window.clearInterval(timer);
  }, [deckPreviewLoading]);

  const nextStep = () => {
    resetMessages();
    setStep((s) => s + 1);
  };

  const prevStep = () => {
    resetMessages();
    setStep((s) => s - 1);
  };

  const ensureDraft = async (): Promise<string> => {
    if (draftAssetId) {
      return draftAssetId;
    }

    const techStackArray = formData.techStack
      ? formData.techStack.split(',').map((item) => item.trim()).filter(Boolean)
      : [];

    const response = await createMarketplaceAssetDraft({
      name: formData.name,
      tagline: formData.pitch || `${formData.name} is now open for acquisition.`,
      description: formData.pitch || `${formData.name} is now open for acquisition.`,
      logoUrl: formData.logoUrl.trim(),
      websiteUrl: formData.website.trim() || undefined,
      category: formData.category,
      founderName: formData.founderName,
      founderEmail: formData.founderEmail,
      isAnonymous: formData.isAnonymous,
      techStack: techStackArray,
    });

    const asset = response.asset as { id: string };
    setDraftAssetId(asset.id);
    return asset.id;
  };

  const syncDraftForDeckPreview = async (assetId: string): Promise<void> => {
    const techStackArray = formData.techStack
      ? formData.techStack.split(',').map((item) => item.trim()).filter(Boolean)
      : [];
    const normalizedOperatingExpenses = Math.max(0, Number(formData.monthlyOperatingExpenses || 0));
    const normalizedActiveUsers = Math.max(0, Number(formData.activeUsers || 0));
    const normalizedAnalyticsProofUrl = formData.analyticsProofUrl.trim();

    await updateMarketplaceAsset(assetId, {
      name: formData.name,
      tagline: formData.pitch || `${formData.name} is now open for acquisition.`,
      description: formData.pitch || `${formData.name} is now open for acquisition.`,
      websiteUrl: formData.website.trim() || undefined,
      category: formData.category,
      techStack: techStackArray,
      founderName: formData.founderName,
      founderEmail: formData.founderEmail,
      askingPriceUsd: formData.askingPrice.trim() || undefined,
      profitMarginPercent: Number.isFinite(formData.profitMargin) ? formData.profitMargin : null,
      isAnonymous: formData.isAnonymous,
      visibility: 'public',
    });

    await updateMarketplaceAssetFinancials(assetId, {
      operatingExpenses: normalizedOperatingExpenses,
      expenseBreakdown: '',
    });

    if (normalizedActiveUsers > 0 || normalizedAnalyticsProofUrl.length > 0) {
      await updateMarketplaceAssetTraffic(assetId, {
        monthlyUniqueVisitors: normalizedActiveUsers,
        analyticsProofUrl: normalizedAnalyticsProofUrl || undefined,
      });
    }
  };

  const handlePreviewPitchDeck = async () => {
    if (deckPreviewLoading || isSubmitting) {
      return;
    }

    setDeckPreviewError(null);
    resetMessages();
    setDeckPreviewLoading(true);

    try {
      const assetId = await ensureDraft();
      await syncDraftForDeckPreview(assetId);
      const deckResult = await generateMarketplaceAssetDeck(assetId, { forceRegenerate: true });
      setDeckPreviewData(deckResult.pitchDecks);
      setFormData((prev) => ({ ...prev, includePitchDeck: true }));
      setStatusMessage('AI pitch deck preview is ready.');
      setDeckViewerOpen(true);
    } catch (error) {
      setDeckPreviewError(error instanceof Error ? error.message : 'Unable to generate pitch deck preview right now.');
    } finally {
      setDeckPreviewLoading(false);
    }
  };

  const handleConnectProvider = async () => {
    if (isSubmitting) {
      return;
    }

    if (!selectedProvider) {
      setErrorMessage('Select a revenue provider first.');
      return;
    }

    if (!apiKey.trim()) {
      setErrorMessage('Enter your read-only API key to continue.');
      return;
    }
    if (selectedProvider === 'Dodo' && !dodoStoreId.trim()) {
      setErrorMessage('Enter your Dodo Store ID to continue.');
      return;
    }
    if (selectedProvider === 'RevenueCat' && !revenueCatProjectId.trim()) {
      setErrorMessage('Enter your RevenueCat Project ID to continue.');
      return;
    }

    setIsSubmitting(true);
    resetMessages();

    try {
      const assetId = await ensureDraft();
      const provider = PROVIDER_ID_MAP[selectedProvider];
      const providerAccountId =
        selectedProvider === 'Dodo'
          ? dodoStoreId.trim()
          : selectedProvider === 'RevenueCat'
            ? revenueCatProjectId.trim()
            : undefined;
      const result = await connectMarketplaceAsset(assetId, {
        provider,
        apiKey: apiKey.trim(),
        providerAccountId,
        isAnonymous: formData.isAnonymous,
      });

      if (result.metrics) {
        const mrr = Math.round(result.metrics.mrrCents / 100).toLocaleString();
        const rev = Math.round(result.metrics.last30dRevenueCents / 100).toLocaleString();
        setStatusMessage(`Metrics synced: $${mrr} MRR · $${rev} last 30d.`);
      } else if (result.warning) {
        setStatusMessage(result.warning);
      } else {
        setStatusMessage('Provider connected. Metrics verification is now in progress.');
      }

      setStep(4);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to connect provider.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublish = async () => {
    if (isSubmitting) {
      return;
    }

    if (!formData.askingPrice.trim()) {
      setErrorMessage('Asking price is required before publishing.');
      return;
    }

    setIsSubmitting(true);
    resetMessages();

    try {
      const assetId = await ensureDraft();
      const normalizedOperatingExpenses = Math.max(0, Number(formData.monthlyOperatingExpenses || 0));
      const normalizedActiveUsers = Math.max(0, Number(formData.activeUsers || 0));
      const normalizedAnalyticsProofUrl = formData.analyticsProofUrl.trim();

      const selectedTierId = paidBoostsEnabled ? TIER_ID_MAP[selectedTier] : 'free';
      const publishResult = await publishMarketplaceAsset(assetId, {
        askingPriceUsd: formData.askingPrice,
        profitMarginPercent: Number.isFinite(formData.profitMargin) ? formData.profitMargin : null,
        tier: selectedTierId,
        boostCheckoutSessionId:
          pendingBoostCheckout && pendingBoostCheckout.tier === selectedTierId
            ? pendingBoostCheckout.sessionId
            : undefined,
      });

      if (!publishResult.success && 'requiresPayment' in publishResult && publishResult.requiresPayment) {
        const nextPending: PendingBoostCheckout = {
          tier: publishResult.tier,
          sessionId: publishResult.boostCheckoutSessionId,
          checkoutUrl: publishResult.checkoutUrl,
        };
        setPendingBoostCheckout(nextPending);
        setStatusMessage('Complete secure boost checkout, then click "Verify Payment & Publish".');
        if (publishResult.checkoutUrl && typeof window !== 'undefined') {
          window.open(publishResult.checkoutUrl, '_blank', 'noopener,noreferrer');
        }
        setIsSubmitting(false);
        return;
      }

      if (!publishResult.success) {
        setErrorMessage('Unable to publish listing right now.');
        setIsSubmitting(false);
        return;
      }

      setPendingBoostCheckout(null);
      const normalizedMrrUsd = Math.max(0, Math.round(publishResult.mrrCents / 100));
      const normalizedNetProfitUsd = Math.max(0, normalizedMrrUsd - normalizedOperatingExpenses);
      const derivedProfitMargin = normalizedMrrUsd > 0
        ? Math.max(0, Math.min(100, Number(((normalizedNetProfitUsd / normalizedMrrUsd) * 100).toFixed(2))))
        : 0;
      const effectiveProfitMargin = Number.isFinite(formData.profitMargin)
        ? Math.max(0, Math.min(100, formData.profitMargin))
        : derivedProfitMargin;

      try {
        await updateMarketplaceAssetFinancials(assetId, {
          operatingExpenses: normalizedOperatingExpenses,
          expenseBreakdown: '',
        });
      } catch {
        // Non-blocking: listing remains live even if optional financial metadata save retries later.
      }

      if (normalizedActiveUsers > 0 || normalizedAnalyticsProofUrl.length > 0) {
        try {
          await updateMarketplaceAssetTraffic(assetId, {
            monthlyUniqueVisitors: normalizedActiveUsers,
            analyticsProofUrl: normalizedAnalyticsProofUrl || undefined,
          });
        } catch {
          // Non-blocking: listing remains live even if optional traffic metadata save retries later.
        }
      }

      let pitchDeckCoverImageUrl: string | null = null;
      if (formData.includePitchDeck) {
        try {
          const decks = deckPreviewData ?? (await generateMarketplaceAssetDeck(assetId, { forceRegenerate: true })).pitchDecks;
          pitchDeckCoverImageUrl = decks.slides.find((slide) => Boolean(slide.imageUrl))?.imageUrl ?? null;
        } catch {
          // Non-blocking: listing remains live even if AI deck generation retries later.
        }
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('marketplace:refresh'));
        window.dispatchEvent(new CustomEvent('marketplace:listing-published'));
      }

      const techStackArray = formData.techStack
        ? formData.techStack.split(',').map((item) => item.trim()).filter(Boolean)
        : [];

      await onPublish({
        id: `market-${assetId}`,
        rank: 'NEW',
        name: formData.isAnonymous ? 'Anonymous Asset' : formData.name,
        pitch: formData.pitch,
        websiteUrl: formData.website.trim() || undefined,
        icon: formData.isAnonymous ? '🛡️' : (formData.logoUrl.trim() || formData.icon),
        accentColor: '212, 175, 55',
        monthlyRevenue: normalizedMrrUsd,
        lifetimeRevenue: Math.max(0, Math.round((publishResult.last30dRevenueCents * 12) / 100)),
        activeUsers: normalizedActiveUsers,
        buildStreak: 0,
        growth: Number((publishResult.last30dGrowthBps / 100).toFixed(2)),
        tags: [formData.category, 'FOR SALE'],
        verified: publishResult.verifiedStatus === 'verified',
        category: formData.category,
        founder: {
          name: formData.isAnonymous ? 'Private Seller' : formData.founderName,
          handle: formData.isAnonymous ? '@private' : `@${formData.founderName.toLowerCase().replace(/\s/g, '')}`,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.founderName}`,
          email: formData.founderEmail,
        },
        techStack: techStackArray,
        problem: 'Owner is exploring strategic exits.',
        solution: 'Verified acquisition opportunity.',
        pricing: 'Acquisition Opportunity',
        revenueHistory: [
          { date: 'Last 30d', revenue: Math.max(0, Math.round(publishResult.last30dRevenueCents / 100)) },
          { date: 'MRR', revenue: Math.max(0, Math.round(publishResult.mrrCents / 100)) },
        ],
        isForSale: true,
        askingPrice: `$${formData.askingPrice}`,
        profitMargin: effectiveProfitMargin,
        isAnonymous: formData.isAnonymous,
        boostTier: selectedTier,
        marketplaceAssetId: assetId,
        isOwnerListing: true,
        netProfitCents: Math.round(normalizedNetProfitUsd * 100),
        monthlyOperatingExpensesUsd: normalizedOperatingExpenses,
        monthlyUniqueVisitors: normalizedActiveUsers,
        analyticsProofUrl: normalizedAnalyticsProofUrl || undefined,
        includePitchDeck: formData.includePitchDeck,
        pitchDeckCoverImageUrl,
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to publish listing.');
      setIsSubmitting(false);
    }
  };

  const handleIconFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setIconUploadError('Please upload an image file (PNG, JPG, WEBP, or SVG).');
      event.target.value = '';
      return;
    }

    const maxBytes = 3 * 1024 * 1024;
    if (file.size > maxBytes) {
      setIconUploadError('Icon is too large. Please keep it under 3MB.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!result.startsWith('data:image/')) {
        setIconUploadError('Unable to process this image. Try another file.');
        return;
      }
      setIconUploadError(null);
      setFormData((prev) => ({ ...prev, logoUrl: result }));
    };
    reader.onerror = () => {
      setIconUploadError('Unable to read this file. Try again.');
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const InstructionGuide = ({ title, link, guide }: { title: string; link: string; guide: React.ReactNode }) => (
    <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 mb-6">
      <h5 className="text-[10px] font-black tracking-widest text-zinc-500 uppercase mb-4 flex items-center gap-2">
        <Info className="w-3 h-3" /> {title} Guide
      </h5>
      <div className="text-sm text-zinc-300 space-y-4 mb-6 leading-relaxed">{guide}</div>
      <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-white hover:bg-white/10 transition-all">
        Open Dashboard <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  );

  const selectedProviderMeta = PROVIDERS.find((item) => item.id === selectedProvider);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] bg-black/98 flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0" onClick={onClose} />

      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} className="relative w-full max-w-3xl bg-[#030303] border border-yellow-500/20 rounded-[48px] shadow-[0_0_100px_rgba(212,175,55,0.05)] overflow-hidden flex flex-col max-h-[95vh]">
        <header className="px-10 py-8 border-b border-white/5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 text-[#D4AF37]">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white tracking-tight">List Your App</h3>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em]">Acquisition Onboarding • Step {step} of 4</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-all">
            <X className="w-7 h-7 text-zinc-400" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto no-scrollbar p-10">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">App Icon (iOS style)</label>
                  <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-5 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                      <button
                        type="button"
                        onClick={() => iconFileInputRef.current?.click()}
                        className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-[22px] border border-white/15 bg-white/[0.04] shadow-[0_10px_30px_rgba(0,0,0,0.35)] hover:border-yellow-500/40 transition-all"
                      >
                        {formData.logoUrl ? (
                          <img src={formData.logoUrl} alt="App icon preview" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-4xl text-zinc-500">◇</div>
                        )}
                        <div className="pointer-events-none absolute inset-0 rounded-[22px] ring-1 ring-inset ring-white/10 group-hover:ring-yellow-500/40 transition-all" />
                      </button>

                      <div className="min-w-0 flex-1 space-y-3">
                        <input
                          ref={iconFileInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/svg+xml"
                          onChange={handleIconFileChange}
                          className="hidden"
                        />
                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            onClick={() => iconFileInputRef.current?.click()}
                            className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-yellow-300 hover:bg-yellow-500/20 transition-all"
                          >
                            Upload Icon
                          </button>
                          {formData.logoUrl && (
                            <button
                              type="button"
                              onClick={() => setFormData((prev) => ({ ...prev, logoUrl: '' }))}
                              className="rounded-full border border-white/15 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white hover:border-white/30 transition-all"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                          Recommended 1024x1024 PNG/JPG/WEBP/SVG · Max 3MB
                        </p>
                        <input
                          type="url"
                          placeholder="Or paste icon URL (https://...)"
                          value={formData.logoUrl.startsWith('data:image/') ? '' : formData.logoUrl}
                          onChange={(e) => {
                            setIconUploadError(null);
                            setFormData((prev) => ({ ...prev, logoUrl: e.target.value.trim() }));
                          }}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-yellow-500/40"
                        />
                      </div>
                    </div>
                    {iconUploadError && (
                      <p className="mt-3 text-xs text-red-300">{iconUploadError}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Project Name</label>
                  <input type="text" placeholder="e.g. Prism OS" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-1 focus:ring-yellow-500/50" />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Founder Name</label>
                  <input type="text" placeholder="Full Name" value={formData.founderName} onChange={(e) => setFormData({ ...formData, founderName: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none" />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Website URL</label>
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-1 focus:ring-yellow-500/50"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center justify-between">
                  Founder Private Email <span className="text-yellow-500/50">Required</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
                    <input type="email" placeholder="email@founder.com" value={formData.founderEmail} onChange={(e) => setFormData({ ...formData, founderEmail: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl px-14 py-4 text-white focus:outline-none focus:ring-1 focus:ring-yellow-500/50" />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none"
                  >
                    {CATEGORY_OPTIONS.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-8 rounded-3xl bg-yellow-500/5 border border-yellow-500/10 flex items-start gap-4">
                  <div className="mt-1"><EyeOff className="w-6 h-6 text-[#D4AF37]" /></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className="flex items-center gap-2 cursor-help"
                        onMouseEnter={() => setShowAnonymityTooltip(true)}
                        onMouseLeave={() => setShowAnonymityTooltip(false)}
                      >
                        <h4 className="font-bold text-white">Anonymize Listing?</h4>
                        <HelpCircle className="w-3 h-3 text-zinc-500" />
                        <AnimatePresence>
                          {showAnonymityTooltip && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 10 }}
                              className="absolute z-50 bottom-full left-0 mb-4 w-64 p-3 bg-zinc-900 border border-white/10 rounded-xl text-[10px] text-zinc-300 font-medium shadow-2xl backdrop-blur-md"
                            >
                              Public cards hide founder identity, while buyers can still make platform-managed offers.
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      <button onClick={() => setFormData({ ...formData, isAnonymous: !formData.isAnonymous })} className={`w-12 h-6 rounded-full transition-all relative ${formData.isAnonymous ? 'bg-[#D4AF37]' : 'bg-white/10'}`}>
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.isAnonymous ? 'left-7' : 'left-1'}`} />
                      </button>
                    </div>
                    <p className="text-zinc-500 text-sm leading-relaxed">Enable stealth mode for high-value asset protection.</p>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                  {PROVIDERS.map((provider) => (
                    <button key={provider.id} onClick={() => { resetMessages(); setSelectedProvider(provider.id as RevenueProvider); }} className={`aspect-square rounded-[32px] border flex flex-col items-center justify-center gap-4 transition-all group relative ${selectedProvider === provider.id ? 'bg-yellow-500/10 border-yellow-500/40' : 'bg-white/[0.02] border-white/5 hover:border-yellow-500/40'}`}>
                      <div className={`w-16 h-16 rounded-2xl ${provider.color} flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform`}>
                        <CreditCard className="w-8 h-8 text-white" />
                      </div>
                      <span className={`text-sm font-bold ${selectedProvider === provider.id ? 'text-white' : 'text-zinc-500'}`}>{provider.label}</span>
                      {provider.beta && <span className="absolute top-3 right-3 text-[8px] font-black uppercase tracking-widest text-cyan-300">Beta</span>}
                    </button>
                  ))}
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-xs text-zinc-400 leading-relaxed">
                  Step 2 chooses your verification provider. On the next step you will add a read-only API key and run verification.
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                {!selectedProvider ? (
                  <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                    Select a provider in Step 2 before connecting a key.
                  </div>
                ) : (
                  <form
                    className="space-y-6"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void handleConnectProvider();
                    }}
                  >
                    <button onClick={() => setStep(2)} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-all text-xs font-black uppercase tracking-widest">
                      <ChevronLeft className="w-4 h-4" /> Change Source
                    </button>

                    {selectedProvider === 'Stripe' && (
                      <InstructionGuide
                        title="Stripe"
                        link="https://dashboard.stripe.com/apikeys"
                        guide={
                          <div className="space-y-4">
                            <h6 className="text-sm font-black tracking-tight text-white">Connect Stripe (100% Secure & Read-Only)</h6>
                            <p>VibeJam uses strict restricted keys to verify your revenue. We cannot charge customers, issue refunds, or access your payouts.</p>
                            <div className="space-y-2">
                              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">How to connect:</p>
                              <ol className="list-decimal pl-5 space-y-2">
                                <li>Go to your Stripe Dashboard -&gt; Developers -&gt; API Keys.</li>
                                <li>Click Create Restricted Key.</li>
                                <li>Name it "VibeJam Read-Only".</li>
                                <li>Grant Read access to: Charges, Subscriptions, and Invoices. Leave everything else blank.</li>
                                <li>Paste the key (rk_live_...) below.</li>
                              </ol>
                            </div>
                          </div>
                        }
                      />
                    )}
                    {selectedProvider === 'LemonSqueezy' && (
                      <InstructionGuide
                        title="LemonSqueezy"
                        link="https://app.lemonsqueezy.com/settings/api"
                        guide={
                          <div className="space-y-4">
                            <h6 className="text-sm font-black tracking-tight text-white">Connect LemonSqueezy</h6>
                            <p>VibeJam only uses read-only API calls for verification and stores keys with bank-level AES-256 encryption.</p>
                            <div className="space-y-2">
                              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">How to connect:</p>
                              <ol className="list-decimal pl-5 space-y-2">
                                <li>Go to LemonSqueezy Settings -&gt; API.</li>
                                <li>Click Create New API Key.</li>
                                <li>If permissions are shown, choose Read-Only for Subscriptions and Orders.</li>
                                <li>Paste the key below to run a live read-only ping test.</li>
                              </ol>
                            </div>
                          </div>
                        }
                      />
                    )}
                    {selectedProvider === 'Polar' && (
                      <InstructionGuide
                        title="Polar"
                        link="https://polar.sh/dashboard"
                        guide={
                          <div className="space-y-4">
                            <h6 className="text-sm font-black tracking-tight text-white">Connect Polar</h6>
                            <p>VibeJam validates Polar keys using read-only GET endpoints. We never send write requests (POST/PUT/DELETE) to your Polar account.</p>
                            <div className="space-y-2">
                              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">How to connect:</p>
                              <ol className="list-decimal pl-5 space-y-2">
                                <li>Open Polar Dashboard -&gt; Settings -&gt; API Tokens.</li>
                                <li>Create a Personal Access Token.</li>
                                <li>Select read scopes only (orders/subscriptions/metrics) and uncheck write scopes.</li>
                                <li>Paste the token below to verify permissions.</li>
                              </ol>
                            </div>
                          </div>
                        }
                      />
                    )}
                    {selectedProvider === 'Dodo' && (
                      <InstructionGuide
                        title="Dodo"
                        link="https://app.dodopayments.com"
                        guide={
                          <div className="space-y-4">
                            <h6 className="text-sm font-black tracking-tight text-white">Connect Dodo Payments</h6>
                            <p>VibeJam uses read-only GET calls to verify metrics and cannot move funds or modify payout settings.</p>
                            <div className="space-y-2">
                              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">How to connect:</p>
                              <ol className="list-decimal pl-5 space-y-2">
                                <li>Open Dodo Dashboard -&gt; Developer/API Keys.</li>
                                <li>Create a new key for VibeJam metrics sync.</li>
                                <li>Prefer read-only permissions whenever available.</li>
                                <li>Find your Store ID in Dodo Dashboard settings.</li>
                                <li>Paste the Store ID and key below to run a permission ping test.</li>
                              </ol>
                            </div>
                          </div>
                        }
                      />
                    )}
                    {selectedProvider === 'RevenueCat' && (
                      <InstructionGuide
                        title="RevenueCat"
                        link="https://app.revenuecat.com/login"
                        guide={
                          <div className="space-y-4">
                            <h6 className="text-sm font-black tracking-tight text-white">Connect RevenueCat</h6>
                            <p>RevenueCat keys are inherently safer than processor keys: they cannot process card payments or issue direct refunds.</p>
                            <div className="space-y-2">
                              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">How to connect:</p>
                              <ol className="list-decimal pl-5 space-y-2">
                                <li>Go to RevenueCat Project Settings -&gt; API Keys.</li>
                                <li>Create a new Secret Key (starts with <span className="font-mono">sk_</span>).</li>
                                <li>Copy your Project ID from the same RevenueCat project.</li>
                                <li>Use read-focused access for subscription analytics.</li>
                                <li>Paste Project ID and key below to verify access.</li>
                              </ol>
                            </div>
                          </div>
                        }
                      />
                    )}

                    <div className="space-y-3">
                      {selectedProvider === 'Dodo' && (
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                            Dodo Store ID
                          </label>
                          <input
                            type="text"
                            autoComplete="off"
                            placeholder="e.g., store_abc123"
                            value={dodoStoreId}
                            onChange={(e) => setDodoStoreId(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white font-mono-data"
                          />
                        </div>
                      )}
                      {selectedProvider === 'RevenueCat' && (
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                            RevenueCat Project ID
                          </label>
                          <input
                            type="text"
                            autoComplete="off"
                            placeholder="e.g., proj_abc123"
                            value={revenueCatProjectId}
                            onChange={(e) => setRevenueCatProjectId(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white font-mono-data"
                          />
                        </div>
                      )}
                      <div className="relative flex items-center justify-between">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                          {selectedProvider === 'Stripe' ? 'Stripe Connect API Key' : 'Verification Key'}
                        </label>
                        {selectedProvider === 'Stripe' && (
                          <div
                            className="relative"
                            onMouseEnter={() => setShowStripeKeyTooltip(true)}
                            onMouseLeave={() => setShowStripeKeyTooltip(false)}
                          >
                            <button
                              type="button"
                              className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/15 text-[10px] font-black text-zinc-300 hover:border-yellow-500/50 hover:text-yellow-300 transition-all"
                              aria-label="Stripe key security details"
                            >
                              ?
                            </button>
                            <AnimatePresence>
                              {showStripeKeyTooltip && (
                                <motion.div
                                  initial={{ opacity: 0, y: 8 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: 8 }}
                                  className="absolute right-0 top-8 z-50 w-80 rounded-xl border border-yellow-500/20 bg-[#080808] p-3 text-[10px] font-medium leading-relaxed text-zinc-300 shadow-2xl"
                                >
                                  VibeJam only accepts read-only Stripe restricted keys (`rk_live_...`) and rejects secret keys (`sk_live_...`).
                                  This connection is metrics-only and cannot charge customers, issue refunds, or modify payouts.
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}
                      </div>
                      <input
                        type="password"
                        autoComplete="off"
                        placeholder={
                          selectedProvider === 'Stripe'
                            ? 'rk_live_...'
                            : selectedProvider === 'RevenueCat'
                              ? 'sk_...'
                              : selectedProvider === 'Polar'
                                ? 'polar_...'
                                : selectedProvider === 'LemonSqueezy'
                                  ? 'ls_...'
                                  : selectedProvider === 'Dodo'
                                    ? 'live_...'
                                    : selectedProviderMeta?.beta
                                      ? 'Provider key (beta adapter)'
                                      : 'Read-only key'
                        }
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white font-mono-data"
                      />
                      <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Connection is validated with live read-only GET ping tests before save.
                      </p>
                    </div>
                  </form>
                )}
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Asking Price (USD)</label>
                    <div className="relative">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600 font-bold">$</span>
                      <input type="text" placeholder="450,000" value={formData.askingPrice} onChange={(e) => setFormData({ ...formData, askingPrice: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl px-12 py-5 text-white focus:outline-none" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                      Profit Margin (%) <HelpCircle className="w-3 h-3 text-zinc-700" />
                    </label>
                    <input type="number" placeholder="85" value={formData.profitMargin} onChange={(e) => setFormData({ ...formData, profitMargin: Number.parseInt(e.target.value || '0', 10) || 0 })} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white focus:outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Monthly Operating Expenses (USD)</label>
                    <p className="text-[10px] text-zinc-600">(AWS, Marketing, APIs. We use this to calculate your Profit Margin).</p>
                    <div className="relative">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600 font-bold">$</span>
                      <input
                        type="number"
                        min={0}
                        placeholder="0"
                        value={formData.monthlyOperatingExpenses}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            monthlyOperatingExpenses: Math.max(0, Number.parseInt(e.target.value || '0', 10) || 0),
                          }))
                        }
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-12 py-5 text-white focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Active Users</label>
                    <input
                      type="number"
                      min={0}
                      placeholder="0"
                      value={formData.activeUsers}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          activeUsers: Math.max(0, Number.parseInt(e.target.value || '0', 10) || 0),
                        }))
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Analytics Proof URL (Optional)</label>
                  <input
                    type="url"
                    placeholder="e.g., Public Plausible link or Loom video URL."
                    value={formData.analyticsProofUrl}
                    onChange={(e) => setFormData((prev) => ({ ...prev, analyticsProofUrl: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Acquisition Pitch</label>
                  <textarea placeholder="Briefly describe why an investor should buy this asset..." rows={3} value={formData.pitch} onChange={(e) => setFormData({ ...formData, pitch: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-3xl px-6 py-5 text-white focus:outline-none resize-none" />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Tech Stack (comma-separated)</label>
                  <input type="text" placeholder="React, Supabase, Stripe" value={formData.techStack} onChange={(e) => setFormData({ ...formData, techStack: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none" />
                </div>

                <div className="text-center mb-6">
                  <h4 className="text-white font-bold text-xl mb-2">Boost Your Listing</h4>
                  <p className="text-zinc-500 text-sm">
                    {paidBoostsEnabled
                      ? 'Select a tier to reach thousands of accredited buyers faster.'
                      : 'Free listing access is currently active for all sellers.'}
                  </p>
                </div>

                <div className={`grid grid-cols-1 ${paidBoostsEnabled ? 'md:grid-cols-3' : 'md:grid-cols-1'} gap-6`}>
                  {visibleBoostTiers.map((tier) => (
                    <button
                      key={tier.id}
                      onClick={() => {
                        setSelectedTier(tier.id);
                        const tierId = TIER_ID_MAP[tier.id];
                        setPendingBoostCheckout((prev) => (prev && prev.tier !== tierId ? null : prev));
                      }}
                      className={`p-8 rounded-[40px] border flex flex-col text-left transition-all ${selectedTier === tier.id ? 'bg-yellow-500/10 border-yellow-500 shadow-2xl shadow-yellow-500/10' : 'bg-white/[0.02] border-white/5 hover:border-white/20'}`}
                    >
                      <div className="flex justify-between items-start mb-6">
                        <span className={`text-[10px] font-black tracking-widest uppercase ${selectedTier === tier.id ? 'text-yellow-500' : 'text-zinc-500'}`}>{tier.name}</span>
                        <span className="text-xl font-black text-white">{tier.price}</span>
                      </div>
                      <p className="text-xs text-zinc-400 mb-8 leading-relaxed h-10">{tier.desc}</p>
                      <div className="space-y-3 mb-8">
                        {tier.perks.map((perk) => (
                          <div key={perk} className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase">
                            <CheckCircle2 className={`w-3 h-3 ${selectedTier === tier.id ? 'text-yellow-500' : 'text-zinc-700'}`} /> {perk}
                          </div>
                        ))}
                      </div>
                      {selectedTier === tier.id && <div className="mt-auto text-[10px] font-black text-yellow-500 uppercase tracking-widest text-center">SELECTED</div>}
                    </button>
                  ))}
                </div>

                {!paidBoostsEnabled && (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 text-xs text-zinc-400 text-center">
                    Pro and Elite boosts are temporarily unavailable during the free-listing rollout.
                  </div>
                )}

                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-4 mt-4"
                >
                  <motion.div
                    aria-hidden
                    className="pointer-events-none absolute -right-10 -top-14 h-44 w-44 rounded-full bg-gradient-to-br from-fuchsia-500/25 via-violet-500/15 to-cyan-400/20 blur-3xl"
                    animate={{ opacity: [0.45, 0.8, 0.45], scale: [1, 1.08, 1] }}
                    transition={{ duration: 4.6, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <div className="relative z-10 flex items-start justify-between gap-4">
                    <div>
                      <h5 className="text-sm font-black tracking-tight text-white flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-fuchsia-300" />
                        ✨ AI Pitch Deck Generator
                      </h5>
                      <p className="mt-2 text-xs leading-relaxed text-zinc-300 max-w-xl">
                        Let our AI Investment Banker instantly generate a 6-slide presentation deck
                        using your verified metrics, ready to send to buyers.
                      </p>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (deckPreviewData) {
                            setDeckViewerOpen(true);
                            return;
                          }
                          void handlePreviewPitchDeck();
                        }}
                        disabled={deckPreviewLoading}
                        className={`inline-flex h-8 items-center rounded-full border px-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                          deckPreviewData
                            ? 'border-cyan-400/45 bg-cyan-500/20 text-cyan-100'
                            : 'border-fuchsia-400/45 bg-fuchsia-500/20 text-fuchsia-100'
                        } ${deckPreviewLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        {deckPreviewLoading
                          ? 'Generating...'
                          : deckPreviewData
                            ? 'View Deck Preview'
                            : 'Generate Deck Preview'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, includePitchDeck: !prev.includePitchDeck }))}
                        className={`inline-flex h-7 items-center rounded-full border px-3 text-[9px] font-black uppercase tracking-widest transition-all ${
                          formData.includePitchDeck
                            ? 'border-fuchsia-400/45 bg-fuchsia-500/20 text-fuchsia-100'
                            : 'border-white/15 bg-black/20 text-zinc-300 hover:border-white/30'
                        }`}
                      >
                        {formData.includePitchDeck ? 'Included on Publish' : 'Skip on Publish'}
                      </button>
                    </div>
                  </div>
                  {deckPreviewError && (
                    <p className="relative z-10 mt-3 text-[11px] text-red-300">{deckPreviewError}</p>
                  )}
                  {!deckPreviewError && deckPreviewStatus && (
                    <p className="relative z-10 mt-3 text-[11px] text-cyan-200">{deckPreviewStatus}</p>
                  )}
                </motion.div>

                <div className="p-8 rounded-[32px] bg-black border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center"><Rocket className="w-6 h-6 text-white" /></div>
                    <div>
                      <p className="text-xs font-bold text-white uppercase tracking-widest">Ready to go live</p>
                      <p className="text-[10px] text-zinc-500 font-bold">Publishing creates a verified acquisition listing in Marketplace.</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {(errorMessage || statusMessage) && (
            <div className={`mt-8 rounded-2xl px-5 py-4 text-xs border ${errorMessage ? 'border-red-500/30 bg-red-500/10 text-red-200' : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-100'}`}>
              <div className="flex items-center gap-2">
                {errorMessage ? <AlertTriangle className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                <span>{errorMessage || statusMessage}</span>
              </div>
              {statusMessage && pendingBoostCheckout?.checkoutUrl && (
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.open(pendingBoostCheckout.checkoutUrl, '_blank', 'noopener,noreferrer');
                    }
                  }}
                  className="mt-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-400/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-cyan-100 hover:bg-cyan-400/20 transition-all"
                >
                  Open Checkout
                </button>
              )}
            </div>
          )}
        </div>

        <footer className="px-10 py-8 border-t border-white/5 flex items-center justify-between bg-[#050505] shrink-0">
          <button onClick={step === 1 ? onClose : prevStep} disabled={isSubmitting} className="text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-all disabled:opacity-50">
            {step === 1 ? 'Cancel' : 'Back'}
          </button>

          <button
            onClick={
              step === 3
                ? handleConnectProvider
                : step === 4
                  ? handlePublish
                  : nextStep
            }
            disabled={
              isSubmitting ||
              (step === 1 && (!formData.founderEmail || !formData.name || !formData.founderName)) ||
              (step === 2 && !selectedProvider) ||
              (step === 3 && (
                !selectedProvider
                || !apiKey.trim()
                || (selectedProvider === 'Dodo' && !dodoStoreId.trim())
                || (selectedProvider === 'RevenueCat' && !revenueCatProjectId.trim())
              )) ||
              (step === 4 && !formData.askingPrice.trim())
            }
            className={`px-10 py-4 rounded-full font-black uppercase tracking-widest text-xs flex items-center gap-3 transition-all ${
              isSubmitting ||
              (step === 1 && (!formData.founderEmail || !formData.name || !formData.founderName)) ||
              (step === 2 && !selectedProvider) ||
              (step === 3 && (
                !selectedProvider
                || !apiKey.trim()
                || (selectedProvider === 'Dodo' && !dodoStoreId.trim())
                || (selectedProvider === 'RevenueCat' && !revenueCatProjectId.trim())
              )) ||
              (step === 4 && !formData.askingPrice.trim())
                ? 'bg-white/5 text-zinc-800 cursor-not-allowed'
                : 'bg-white text-black hover:scale-105 active:scale-95 shadow-2xl shadow-white/5'
            }`}
          >
            {step === 3 ? (
              isSubmitting ? 'Validating...' : 'Validate & Continue'
            ) : step === 4 ? (
              isSubmitting
                ? 'Publishing...'
                : pendingBoostCheckout
                  ? 'Verify Payment & Publish'
                  : <>Publish Listing <Rocket className="w-4 h-4" /></>
            ) : (
              <>Continue <ChevronRight className="w-4 h-4" /></>
            )}
          </button>
        </footer>

        <AnimatePresence>
          {deckViewerOpen && deckPreviewData && (
            <DeckViewer
              assetName={formData.name || 'Untitled Asset'}
              decks={deckPreviewData}
              onClose={() => setDeckViewerOpen(false)}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default ListAppModal;
