
import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Heart, ExternalLink, ShieldCheck, Flame, Users, 
  TrendingUp, CreditCard, Layout, Zap, ArrowRight, User, PencilLine
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from 'recharts';
import { VibeApp } from '../types';
import GemstoneIcon from './GemstoneIcon';
import RankingBadge from './RankingBadge';
import { startInboxConversation, submitMarketplaceOffer } from '../lib/api';
import { supabase } from '../lib/supabase-client';
import ListingEditModal, { ListingEditSeed } from './ListingEditModal';

interface JamDetailViewProps {
  app: VibeApp | null;
  onClose: () => void;
  onToggleWishlist?: (app: VibeApp) => void;
  isInWishlist?: boolean;
}

const normalizeWebsiteUrl = (input: unknown): string | null => {
  if (typeof input !== 'string') {
    return null;
  }
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  if (/^[a-z0-9.-]+\.[a-z]{2,}/i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return null;
};

const JamDetailView: React.FC<JamDetailViewProps> = ({ app, onClose, onToggleWishlist, isInWishlist }) => {
  if (!app) return null;
  const canShowDealActions = Boolean(app.isForSale) && !Boolean(app.isOwnerListing);
  const canSendOfferNow = canShowDealActions && Boolean(app.marketplaceAssetId);
  const [isOfferOpen, setIsOfferOpen] = useState(false);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [isContactComposerOpen, setIsContactComposerOpen] = useState(false);
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);
  const [isContactingSeller, setIsContactingSeller] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [offerError, setOfferError] = useState<string | null>(null);
  const [offerSuccess, setOfferSuccess] = useState<string | null>(null);

  const listingEditSeed: ListingEditSeed | null = useMemo(() => {
    if (!app.marketplaceAssetId || !app.isOwnerListing) {
      return null;
    }

    const askingDigits = String(app.askingPrice || '').replace(/[^0-9]/g, '');
    return {
      id: app.marketplaceAssetId,
      name: app.name,
      tagline: app.pitch,
      description: app.solution || app.pitch,
      category: app.category,
      techStack: app.techStack,
      founderName: app.founder?.name,
      founderEmail: app.founder?.email,
      askingPriceCents: askingDigits ? Number(askingDigits) * 100 : 0,
      profitMarginPercent: typeof app.profitMargin === 'number' ? app.profitMargin : null,
      isAnonymous: Boolean(app.isAnonymous),
      visibility: 'public',
    };
  }, [app]);

  const websiteUrl = useMemo(() => {
    const candidates = [
      normalizeWebsiteUrl((app as any).websiteUrl),
      normalizeWebsiteUrl((app as any).website),
    ];

    for (const candidate of candidates) {
      if (candidate) {
        return candidate;
      }
    }

    return 'https://www.vibejam.co';
  }, [app]);

  const formattedLifetime = new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1
  }).format(app.lifetimeRevenue);

  const formattedMonthly = new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1
  }).format(app.monthlyRevenue);

  const handleSubmitOffer = async () => {
    if (!app.marketplaceAssetId) {
      return;
    }

    if (!supabase) {
      setOfferError('Auth is not configured. Unable to submit offer.');
      return;
    }

    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setOfferError('Sign in to submit an offer.');
      return;
    }

    if (!offerPrice.trim()) {
      setOfferError('Enter an offer price.');
      return;
    }

    if (!offerMessage.trim() || offerMessage.trim().length < 4) {
      setOfferError('Add a short message (4+ characters).');
      return;
    }

    setIsSubmittingOffer(true);
    setOfferError(null);
    setOfferSuccess(null);

    try {
      const result = await submitMarketplaceOffer({
        assetId: app.marketplaceAssetId,
        offerPriceUsd: offerPrice,
        message: offerMessage,
      });
      const inboxStatus = result.inboxStatus ?? (result.conversationId ? 'created' : 'skipped');
      const emailStatus = result.emailStatus;
      let successCopy = 'Offer sent.';
      if (inboxStatus === 'created' && emailStatus === 'sent') {
        successCopy = 'Offer sent. Seller inbox and email were notified.';
      } else if (inboxStatus === 'created') {
        successCopy = 'Offer sent. Seller inbox was updated.';
      } else if (emailStatus === 'sent') {
        successCopy = 'Offer sent. Seller email was notified.';
      } else {
        successCopy = 'Offer sent. Seller notifications will sync shortly.';
      }
      setOfferSuccess(successCopy);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('profile:refresh-marketplace'));
      }
      if (result.conversationId && typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('profile:focus-conversation', {
            detail: { conversationId: result.conversationId },
          }),
        );
      }
      setOfferPrice('');
      setOfferMessage('');
      setIsOfferOpen(false);
    } catch (error) {
      setOfferError(error instanceof Error ? error.message : 'Failed to send offer.');
    } finally {
      setIsSubmittingOffer(false);
    }
  };

  const handleContactSeller = async () => {
    if (!app.marketplaceAssetId || isContactingSeller) {
      return;
    }

    if (!supabase) {
      setOfferError('Auth is not configured. Unable to start conversation.');
      return;
    }

    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setOfferError('Sign in to contact the seller.');
      return;
    }

    const initialMessage = contactMessage.trim();
    if (initialMessage.length < 4) {
      setOfferError('Add a short message (4+ characters) before contacting the seller.');
      return;
    }

    setIsContactingSeller(true);
    setOfferError(null);
    setOfferSuccess(null);

    try {
      const result = await startInboxConversation({
        listingId: app.marketplaceAssetId,
        initialMessage,
      });
      setOfferSuccess('Message sent. Open Profile > Inbox to continue.');
      setContactMessage('');
      setIsContactComposerOpen(false);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('profile:refresh-marketplace'));
        window.dispatchEvent(
          new CustomEvent('profile:focus-conversation', {
            detail: { conversationId: result.conversationId },
          }),
        );
      }
    } catch (error) {
      setOfferError(error instanceof Error ? error.message : 'Failed to contact seller.');
    } finally {
      setIsContactingSeller(false);
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/90 border border-white/10 p-3 rounded-lg backdrop-blur-md shadow-2xl">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">{payload[0].payload.date}</p>
          <p className="text-sm font-mono-data text-[#00FF41] font-bold">
            ${payload[0].value.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6"
    >
      {/* Background Click Close */}
      <div className="absolute inset-0" onClick={onClose} />

      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative w-full max-w-5xl h-[92vh] md:h-auto md:max-h-[90vh] bg-[#050505] border-t md:border border-white/10 md:rounded-[32px] overflow-hidden flex flex-col shadow-[0_-20px_80px_-20px_rgba(0,0,0,0.8)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header: The Action Bar */}
        <header className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center gap-4">
            <GemstoneIcon icon={app.icon} accentColor={app.accentColor} isHovered={true} />
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-extrabold text-white tracking-tight">{app.name}</h2>
                <RankingBadge rank={app.rankValue ?? app.rank} tier={app.rankTier} size="md" />
              </div>
              <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest">The Deal Room</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(event) => event.stopPropagation()}
              className="px-5 py-2 rounded-full bg-white text-black text-xs font-bold hover:bg-zinc-200 transition-colors flex items-center gap-2"
            >
              Website <ExternalLink className="w-3.5 h-3.5" />
            </a>
            {canShowDealActions && (
              <button
                onClick={() => {
                  setOfferError(null);
                  setOfferSuccess(null);
                  if (!canSendOfferNow) {
                    setOfferError('Seller has not activated this listing for live offers yet.');
                    setIsOfferOpen(true);
                    return;
                  }
                  setIsContactComposerOpen(false);
                  setIsOfferOpen((prev) => !prev);
                }}
                className="px-5 py-2 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#D4AF37] text-xs font-bold hover:bg-[#D4AF37] hover:text-black transition-colors"
              >
                Make Offer
              </button>
            )}
            {canShowDealActions && (
              <button
                onClick={
                  canSendOfferNow
                    ? () => {
                      setOfferError(null);
                      setOfferSuccess(null);
                      setIsOfferOpen(true);
                      setIsContactComposerOpen(true);
                    }
                    : undefined
                }
                disabled={isContactingSeller || !canSendOfferNow}
                className="px-4 py-2 rounded-full border border-white/20 text-zinc-300 text-xs font-bold hover:bg-white hover:text-black transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Contact Seller
              </button>
            )}
            {listingEditSeed && (
              <button
                onClick={() => setIsEditOpen(true)}
                className="px-4 py-2 rounded-full border border-cyan-400/40 bg-cyan-400/10 text-cyan-300 text-xs font-bold hover:bg-cyan-300 hover:text-black transition-colors inline-flex items-center gap-2"
              >
                <PencilLine className="w-3.5 h-3.5" />
                Edit
              </button>
            )}
            <button 
              onClick={() => onToggleWishlist?.(app)}
              className={`p-2.5 rounded-full border transition-all group ${isInWishlist ? 'border-red-500 bg-red-500/10' : 'border-white/10 hover:bg-white/5'}`}
            >
              <Heart className={`w-5 h-5 transition-all ${isInWishlist ? 'text-red-500 fill-red-500' : 'text-white group-hover:fill-white'}`} />
            </button>
            <div className="w-[1px] h-6 bg-white/10 mx-1" />
            <button 
              onClick={onClose}
              className="p-2.5 rounded-full hover:bg-white/5 transition-colors"
            >
              <X className="w-6 h-6 text-zinc-400" />
            </button>
          </div>
        </header>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-6 md:p-10 space-y-12">
          {canShowDealActions && (
            <section className="p-6 rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/5">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Acquisition Offer Desk</h3>
                  <p className="text-zinc-500 text-xs">Submit a private offer directly to the seller.</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setIsOfferOpen((prev) => {
                      const next = !prev;
                      if (!next) {
                        setIsContactComposerOpen(false);
                      }
                      return next;
                    })
                  }
                  className="px-4 py-2 rounded-full border border-white/20 text-[10px] font-black uppercase tracking-widest text-zinc-300 hover:bg-white hover:text-black transition-all"
                >
                  {isOfferOpen ? 'Close' : 'Open'}
                </button>
              </div>

              {isOfferOpen && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Offer Price (USD)</label>
                      <input
                        type="text"
                        value={offerPrice}
                        onChange={(event) => setOfferPrice(event.target.value)}
                        placeholder="e.g. 450,000"
                        className="w-full h-12 rounded-xl bg-white/5 border border-white/10 px-4 text-white focus:outline-none focus:border-white/30"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Message</label>
                      <input
                        type="text"
                        value={offerMessage}
                        onChange={(event) => setOfferMessage(event.target.value)}
                        placeholder="Introduce your intent and close timeline"
                        className="w-full h-12 rounded-xl bg-white/5 border border-white/10 px-4 text-white focus:outline-none focus:border-white/30"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                      Offers create a pipeline stage and notify seller instantly.
                    </div>
                    <button
                      type="button"
                      onClick={handleSubmitOffer}
                      disabled={isSubmittingOffer || !canSendOfferNow}
                      className="h-11 px-6 rounded-full bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all disabled:opacity-60"
                    >
                      {isSubmittingOffer ? 'Sending...' : canSendOfferNow ? 'Send Offer' : 'Unavailable'}
                    </button>
                  </div>

                  {isContactComposerOpen && (
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
                      <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                        Contact Seller
                      </div>
                      <input
                        type="text"
                        value={contactMessage}
                        onChange={(event) => setContactMessage(event.target.value)}
                        placeholder="Write your message to the seller"
                        className="w-full h-12 rounded-xl bg-black/40 border border-white/10 px-4 text-white focus:outline-none focus:border-white/30"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsContactComposerOpen(false);
                            setContactMessage('');
                            setOfferError(null);
                          }}
                          className="h-10 px-4 rounded-full border border-white/20 text-zinc-300 text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleContactSeller}
                          disabled={isContactingSeller || contactMessage.trim().length < 4}
                          className="h-10 px-4 rounded-full bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all disabled:opacity-60"
                        >
                          {isContactingSeller ? 'Sending...' : 'Send Message'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {offerError && <p className="mt-4 text-xs text-red-400">{offerError}</p>}
              {offerSuccess && <p className="mt-4 text-xs text-emerald-400">{offerSuccess}</p>}
            </section>
          )}
          
          {/* SECTION A: THE METRICS GRID (The 4 Pillars) */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Lifetime Revenue', value: formattedLifetime, color: 'text-[#D4AF37]', icon: CreditCard },
              { label: 'Monthly (Verified)', value: formattedMonthly, color: 'text-[#00FF41]', icon: ShieldCheck, badge: 'STRIPE' },
              { label: 'Active Users', value: app.activeUsers.toLocaleString(), color: 'text-cyan-400', icon: Users },
              { label: 'Build Streak', value: `${app.buildStreak} Days`, color: 'text-orange-500', icon: Flame, animate: true }
            ].map((metric, i) => (
              <div key={i} className="relative group p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/20 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-2 rounded-lg bg-white/5 ${metric.color}`}>
                    <metric.icon className={`w-5 h-5 ${metric.animate ? 'animate-pulse' : ''}`} />
                  </div>
                  {metric.badge && (
                    <span className="text-[8px] font-black tracking-widest bg-white/10 px-1.5 py-0.5 rounded text-white">
                      {metric.badge}
                    </span>
                  )}
                </div>
                <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">{metric.label}</p>
                <h4 className={`text-2xl md:text-3xl font-black tracking-tighter ${metric.color}`}>
                  {metric.value}
                </h4>
              </div>
            ))}
          </section>

          {/* SECTION B: REVENUE SPINE */}
          <section className="p-8 rounded-[24px] bg-white/[0.02] border border-white/5">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight mb-1">Revenue History</h3>
                <p className="text-zinc-500 text-xs font-medium">Monthly recurring performance</p>
              </div>
              <div className="flex bg-white/5 rounded-full p-1 border border-white/5">
                {['30D', '90D', 'ALL'].map(t => (
                  <button key={t} className={`px-4 py-1 rounded-full text-[10px] font-bold tracking-widest ${t === 'ALL' ? 'bg-white text-black' : 'text-zinc-500 hover:text-zinc-300'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={app.revenueHistory}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00FF41" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#00FF41" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#00FF41" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorRev)" 
                    animationDuration={2000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* SECTION C: FOUNDER & CANVAS */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Founder Card */}
            <div className="p-8 rounded-3xl bg-gradient-to-br from-white/[0.05] to-transparent border border-white/5 flex flex-col justify-between group">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-full border-2 border-white/10 overflow-hidden bg-zinc-800">
                  <img src={app.founder.avatar} alt={app.founder.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-lg mb-0.5">Built by {app.founder.name}</h4>
                  <p className="text-purple-400 text-sm font-mono-data">{app.founder.handle}</p>
                </div>
              </div>
              <div className="mt-8">
                <button className="w-full py-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 font-bold text-sm hover:bg-purple-500/20 transition-all flex items-center justify-center gap-2 shadow-[0_0_40px_-10px_rgba(168,85,247,0.2)]">
                  View Founder Canvas <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Tech Stack Orbs */}
            <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5">
              <h4 className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-6">Built With</h4>
              <div className="flex flex-wrap gap-4">
                {app.techStack.map(tool => (
                  <div key={tool} className="flex flex-col items-center gap-2 group cursor-default">
                    <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-md group-hover:border-white/30 transition-all group-hover:bg-white/10 icon-inset-shadow">
                      <Layout className="w-6 h-6 text-zinc-400 group-hover:text-white transition-colors" />
                    </div>
                    <span className="text-[10px] text-zinc-500 font-bold tracking-widest group-hover:text-zinc-300 transition-colors uppercase">{tool}</span>
                  </div>
                ))}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 rounded-full border border-dashed border-white/10 flex items-center justify-center text-zinc-600">
                    <Zap className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION D: INSIGHTS */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-4 pb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-1 h-4 bg-red-500 rounded-full" />
                <h4 className="text-sm font-bold uppercase tracking-widest text-white">The Problem</h4>
              </div>
              <p className="text-zinc-400 leading-relaxed text-lg font-medium">
                {app.problem}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-1 h-4 bg-green-500 rounded-full" />
                <h4 className="text-sm font-bold uppercase tracking-widest text-white">The Solution</h4>
              </div>
              <p className="text-zinc-200 leading-relaxed text-lg font-bold">
                {app.solution}
              </p>
              <div className="mt-6 inline-flex items-center gap-3 px-4 py-2 rounded-lg bg-zinc-900 border border-white/5">
                <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Pricing</span>
                <span className="text-sm font-mono-data text-white font-bold">{app.pricing}</span>
              </div>
            </div>
          </section>

        </div>
      </motion.div>

      <AnimatePresence>
        {isEditOpen && listingEditSeed && (
          <ListingEditModal
            seed={listingEditSeed}
            onClose={() => setIsEditOpen(false)}
            onSaved={() => {
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('marketplace:refresh'));
                window.dispatchEvent(new CustomEvent('profile:refresh-marketplace'));
              }
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default JamDetailView;
