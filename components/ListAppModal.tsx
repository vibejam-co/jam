import React, { useState } from 'react';
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
} from 'lucide-react';
import { VibeApp } from '../types';
import {
  connectMarketplaceAsset,
  createMarketplaceAssetDraft,
  publishMarketplaceAsset,
} from '../lib/api';

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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftAssetId, setDraftAssetId] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingBoostCheckout, setPendingBoostCheckout] = useState<PendingBoostCheckout | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    pitch: '',
    category: 'SaaS' as string,
    icon: '💎',
    founderName: '',
    founderEmail: '',
    askingPrice: '',
    profitMargin: 80,
    isAnonymous: false,
    techStack: '',
  });

  const resetMessages = () => {
    setStatusMessage(null);
    setErrorMessage(null);
  };

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

    setIsSubmitting(true);
    resetMessages();

    try {
      const assetId = await ensureDraft();
      const provider = PROVIDER_ID_MAP[selectedProvider];
      const result = await connectMarketplaceAsset(assetId, {
        provider,
        apiKey: apiKey.trim(),
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

      const selectedTierId = TIER_ID_MAP[selectedTier];
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
        icon: formData.isAnonymous ? '🛡️' : formData.icon,
        accentColor: '212, 175, 55',
        monthlyRevenue: Math.max(0, Math.round(publishResult.mrrCents / 100)),
        lifetimeRevenue: Math.max(0, Math.round((publishResult.last30dRevenueCents * 12) / 100)),
        activeUsers: 0,
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
        profitMargin: formData.profitMargin,
        isAnonymous: formData.isAnonymous,
        boostTier: selectedTier,
        marketplaceAssetId: assetId,
        isOwnerListing: true,
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to publish listing.');
      setIsSubmitting(false);
    }
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
                  <input type="text" placeholder="SaaS" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none" />
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
                                <li>Paste the key below to run a permission ping test.</li>
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
                                <li>Use read-focused access for subscription analytics.</li>
                                <li>Paste the key below to verify it.</li>
                              </ol>
                            </div>
                          </div>
                        }
                      />
                    )}

                    <div className="space-y-3">
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
                  <p className="text-zinc-500 text-sm">Select a tier to reach thousands of accredited buyers faster.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {BOOST_TIERS.map((tier) => (
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
              (step === 3 && (!selectedProvider || !apiKey.trim())) ||
              (step === 4 && !formData.askingPrice.trim())
            }
            className={`px-10 py-4 rounded-full font-black uppercase tracking-widest text-xs flex items-center gap-3 transition-all ${
              isSubmitting ||
              (step === 1 && (!formData.founderEmail || !formData.name || !formData.founderName)) ||
              (step === 2 && !selectedProvider) ||
              (step === 3 && (!selectedProvider || !apiKey.trim())) ||
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
      </motion.div>
    </motion.div>
  );
};

export default ListAppModal;
