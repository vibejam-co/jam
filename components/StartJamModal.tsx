
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ChevronRight, ChevronLeft, Upload, 
  ShieldCheck, ExternalLink, Info, Globe, 
  HelpCircle, Rocket, DollarSign,
  Users, Mail, Zap
} from 'lucide-react';
import { VibeApp } from '../types';

interface StartJamModalProps {
  onClose: () => void;
  onPublish: (app: VibeApp) => void | Promise<void>;
  defaultFounderName?: string;
  defaultFounderEmail?: string;
}

type RevenueProvider = 'Stripe' | 'LemonSqueezy' | 'Polar' | 'Dodo' | 'RevenueCat' | null;

const PROVIDERS = [
  { id: 'Stripe', label: 'Stripe', color: 'bg-[#635BFF]' },
  { id: 'LemonSqueezy', label: 'LemonSqueezy', color: 'bg-[#FFC233]' },
  { id: 'Polar', label: 'Polar', color: 'bg-[#43B2FF]' },
  { id: 'Dodo', label: 'Dodo Payments', color: 'bg-[#FF4A4A]' },
  { id: 'RevenueCat', label: 'RevenueCat', color: 'bg-[#F15A24]' },
];

const CATEGORIES = [
  "Ai", "Analytics", "Community", "Content Creation", "Crypto", 
  "Customer Support", "Design Tools", "Developer Tools", "Ecommerce", 
  "Education", "Entertainment", "Fintech", "Games", "Health", 
  "IoT", "Legal", "Marketing", "Marketplace", "Mobile Apps", 
  "News & Magazines", "No-Code", "Productivity", "Real Estate", 
  "Recruiting & HR", "SaaS", "Sales", "Security", "Social Media", 
  "Travel", "Utilities"
];

const StartJamModal: React.FC<StartJamModalProps> = ({
  onClose,
  onPublish,
  defaultFounderName = '',
  defaultFounderEmail = '',
}) => {
  const [step, setStep] = useState(1);
  const [selectedProvider, setSelectedProvider] = useState<RevenueProvider>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [providerApiKey, setProviderApiKey] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    pitch: '',
    category: 'Ai',
    icon: '✨',
    monthlyRevenue: 0,
    activeUsers: 0,
    founderName: defaultFounderName,
    founderEmail: defaultFounderEmail,
    website: '',
    techStack: '',
    problem: '',
    solution: '',
    pricing: '',
    publishToMarketplace: false,
    marketplaceAskingPrice: '',
    marketplaceProfitMargin: 70,
    marketplaceVisibility: 'public' as 'public' | 'members_only' | 'private',
    marketplaceIsAnonymous: false,
  });

  const founderEmailValid =
    !formData.founderEmail.trim()
      ? false
      : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.founderEmail.trim());

  const marketplaceReady = !formData.publishToMarketplace
    || (founderEmailValid && (formData.marketplaceAskingPrice.trim().length > 0 || formData.monthlyRevenue > 0));

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const handlePublish = async () => {
    if (isSubmitting) {
      return;
    }

    const shouldPublishMarketplace = formData.publishToMarketplace;
    const derivedAskingPrice = formData.marketplaceAskingPrice.trim() || String(Math.max(5000, formData.monthlyRevenue * 48));

    const newApp: VibeApp = {
      id: Math.random().toString(36).substr(2, 9),
      rank: 'NEW',
      name: formData.name || 'Untitled Project',
      pitch: formData.pitch || 'A new vibe-coded masterpiece.',
      icon: formData.icon,
      accentColor: '124, 58, 237',
      monthlyRevenue: formData.monthlyRevenue,
      lifetimeRevenue: formData.monthlyRevenue * 12, // Simple mock
      activeUsers: formData.activeUsers,
      buildStreak: 1,
      growth: 0,
      tags: [formData.category],
      verified: Boolean(selectedProvider),
      category: formData.category,
      founder: {
        name: formData.founderName || 'Founder',
        handle: `@${(formData.founderName || 'founder').toLowerCase().replace(/\s/g, '')}`,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.founderName}`,
        email: formData.founderEmail.trim() || undefined,
      },
      techStack: formData.techStack.split(',').map(s => s.trim()),
      problem: formData.problem || 'Market inefficiency.',
      solution: formData.solution || 'Streamlined experience.',
      pricing: formData.pricing || 'Freemium',
      revenueHistory: [
        { date: 'Month 1', revenue: formData.monthlyRevenue }
      ],
      isForSale: shouldPublishMarketplace,
      askingPrice: shouldPublishMarketplace ? `$${derivedAskingPrice}` : undefined,
      profitMargin: shouldPublishMarketplace ? formData.marketplaceProfitMargin : undefined,
      isAnonymous: shouldPublishMarketplace ? formData.marketplaceIsAnonymous : undefined,
      boostTier: shouldPublishMarketplace ? 'Free' : undefined,
      publishSource: 'start-jam',
      publishToMarketplace: shouldPublishMarketplace,
      marketplaceAskingPriceUsd: shouldPublishMarketplace ? derivedAskingPrice : undefined,
      marketplaceVisibility: shouldPublishMarketplace ? formData.marketplaceVisibility : undefined,
      marketplaceBoostTierId: shouldPublishMarketplace ? 'free' : undefined,
      websiteUrl: formData.website.trim() || undefined,
    };

    setIsSubmitting(true);
    try {
      await onPublish(newApp);
    } finally {
      setIsSubmitting(false);
    }
  };

  const InstructionGuide = ({ title, link, guide }: { title: string; link: string; guide: React.ReactNode }) => (
    <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 mb-6">
      <h5 className="text-[10px] font-black tracking-widest text-zinc-500 uppercase mb-4 flex items-center gap-2">
        <Info className="w-3 h-3" /> Instruction Guide
      </h5>
      <div className="text-sm text-zinc-300 space-y-4 mb-6 leading-relaxed">
        {guide}
      </div>
      <a 
        href={link} 
        target="_blank" 
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-white hover:bg-white/10 transition-all"
      >
        Open Dashboard <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[410] bg-black/95 flex items-center justify-center p-4 sm:p-6 overflow-hidden"
    >
      <div className="absolute inset-0" onClick={onClose} />
      
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="relative w-full max-w-2xl bg-[#050505] border border-white/10 rounded-[40px] shadow-[0_40px_120px_-20px_rgba(0,0,0,1)] overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <header className="px-8 py-6 border-b border-white/5 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">Start Your Jam</h3>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Step {step} of 4</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-all">
            <X className="w-6 h-6 text-zinc-400" />
          </button>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-8">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: IDENTITY */}
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="flex flex-col items-center gap-6 mb-12">
                   <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-24 h-24 rounded-[24px] bg-white/[0.03] border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer hover:border-white/30 transition-all group"
                   >
                     {formData.icon ? (
                       <span className="text-4xl">{formData.icon}</span>
                     ) : (
                       <Upload className="w-6 h-6 text-zinc-500 group-hover:text-white" />
                     )}
                     <input 
                      type="file" 
                      className="hidden" 
                      ref={fileInputRef} 
                      onChange={(e) => setFormData({...formData, icon: '🚀'})} // Mock upload
                     />
                   </div>
                   <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Project Logo or Emoji</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Project Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Luminal AI"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-white/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Category</label>
                    <select 
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-white/30"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Elevator Pitch</label>
                  <textarea 
                    placeholder="One sentence that captures the magic..."
                    value={formData.pitch}
                    onChange={(e) => setFormData({...formData, pitch: e.target.value})}
                    rows={2}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-white/30 resize-none"
                  />
                </div>
              </motion.div>
            )}

            {/* STEP 2: REVENUE VERIFICATION */}
            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                {!selectedProvider ? (
                  <>
                    <div className="text-center mb-10">
                      <h4 className="text-white font-bold text-lg mb-2">Verify Revenue Source</h4>
                      <p className="text-zinc-500 text-sm">Select your primary payment processor to fetch verified MRR.</p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {PROVIDERS.map(p => (
                        <button
                          key={p.id}
                          onClick={() => setSelectedProvider(p.id as RevenueProvider)}
                          className="aspect-square rounded-3xl bg-white/[0.03] border border-white/10 flex flex-col items-center justify-center gap-4 hover:bg-white/[0.07] transition-all group"
                        >
                          <div className={`w-12 h-12 rounded-xl ${p.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                            <DollarSign className="w-6 h-6 text-white" />
                          </div>
                          <span className="text-xs font-bold text-zinc-400">{p.label}</span>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="space-y-6">
                    <button 
                      onClick={() => setSelectedProvider(null)}
                      className="flex items-center gap-2 text-zinc-500 hover:text-white transition-all text-xs font-bold uppercase tracking-widest"
                    >
                      <ChevronLeft className="w-4 h-4" /> Change Provider
                    </button>

                    {selectedProvider === 'Stripe' && (
                      <InstructionGuide 
                        title="Stripe Verification"
                        link="https://dashboard.stripe.com/apikeys"
                        guide={
                          <>
                            <p><strong>Connect Stripe (100% Secure &amp; Read-Only)</strong></p>
                            <p>VibeJam accepts only <strong>rk_live_</strong> restricted keys for Stripe, not full secret keys.</p>
                            <p>1. Go to Stripe Dashboard -&gt; Developers -&gt; API Keys.</p>
                            <p>2. Click <strong>Create Restricted Key</strong>.</p>
                            <p>3. Name it <strong>"VibeJam Read-Only"</strong>.</p>
                            <p>4. Enable read access for Charges, Subscriptions, and Invoices only.</p>
                          </>
                        }
                      />
                    )}

                    {selectedProvider === 'LemonSqueezy' && (
                      <InstructionGuide 
                        title="LemonSqueezy Verification"
                        link="https://app.lemonsqueezy.com/settings/api"
                        guide={
                          <>
                            <p><strong>Connect LemonSqueezy</strong></p>
                            <p>1. Open LemonSqueezy Settings -&gt; API.</p>
                            <p>2. Click Create New API Key.</p>
                            <p>3. If permission controls are available, choose read-only Orders and Subscriptions scopes.</p>
                            <p>4. Paste the key below. VibeJam stores it with AES-256 encryption.</p>
                          </>
                        }
                      />
                    )}

                    {selectedProvider === 'Polar' && (
                      <>
                        <InstructionGuide 
                          title="Polar Verification"
                          link="https://polar.sh/dashboard"
                          guide={
                            <>
                              <p><strong>Connect Polar</strong></p>
                              <p>1. Open Polar -&gt; Settings -&gt; API Tokens.</p>
                              <p>2. Create a personal access token.</p>
                              <p>3. Select read scopes only (orders/subscriptions/metrics).</p>
                              <p>4. Leave write scopes unchecked, then paste token below.</p>
                            </>
                          }
                        />
                      </>
                    )}

                    {selectedProvider === 'Dodo' && (
                      <InstructionGuide
                        title="Dodo Verification"
                        link="https://app.dodopayments.com"
                        guide={
                          <>
                            <p><strong>Connect Dodo Payments</strong></p>
                            <p>1. Open Dodo Dashboard -&gt; Developer/API Keys.</p>
                            <p>2. Create a dedicated VibeJam metrics key.</p>
                            <p>3. Prefer read-only scopes when available.</p>
                            <p>4. Paste key below for a read-only ping test.</p>
                          </>
                        }
                      />
                    )}

                    {selectedProvider === 'RevenueCat' && (
                      <InstructionGuide 
                        title="RevenueCat Secret Key"
                        link="https://app.revenuecat.com/login"
                        guide={
                          <>
                            <p><strong>Connect RevenueCat</strong></p>
                            <p>1. Go to RevenueCat Project Settings -&gt; API Keys.</p>
                            <p>2. Create a Secret Key (starts with <span className="font-mono">sk_</span>).</p>
                            <p>3. RevenueCat does not directly move payout funds, so this key is used for subscription insights.</p>
                            <p>4. Paste key below to verify.</p>
                          </>
                        }
                      />
                    )}

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Paste API Key Here</label>
                       <input 
                        type="password" 
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
                                    : 'Read-only key (optional for ranking publish)'
                        } 
                        value={providerApiKey}
                        onChange={(e) => setProviderApiKey(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono-data" 
                       />
                       <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest mt-2 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> VibeJam validates keys via read-only GET ping tests before encrypted storage.
                       </p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 3: METRICS & FOUNDER */}
            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Monthly Revenue (USD)</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        min={0}
                        placeholder="0"
                        value={formData.monthlyRevenue}
                        onChange={(e) => setFormData({...formData, monthlyRevenue: Math.max(0, parseInt(e.target.value, 10) || 0)})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white pl-10"
                      />
                      <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Active Users</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        placeholder="0"
                        value={formData.activeUsers}
                        onChange={(e) => setFormData({...formData, activeUsers: parseInt(e.target.value) || 0})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white pl-10"
                      />
                      <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Founder Name</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Full Name"
                        value={formData.founderName}
                        onChange={(e) => setFormData({...formData, founderName: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white pl-10"
                      />
                      <Rocket className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Founder Email</label>
                    <div className="relative">
                      <input 
                        type="email" 
                        placeholder="name@company.com"
                        value={formData.founderEmail}
                        onChange={(e) => setFormData({...formData, founderEmail: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white pl-10"
                      />
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Project Website (URL)</label>
                  <div className="relative">
                    <input 
                      type="url" 
                      placeholder="https://..."
                      value={formData.website}
                      onChange={(e) => setFormData({...formData, website: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white pl-10"
                    />
                    <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Tech Stack (Optional)</label>
                  <input 
                    type="text" 
                    placeholder="React, Stripe, AWS..."
                    value={formData.techStack}
                    onChange={(e) => setFormData({...formData, techStack: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
                  />
                  <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">Comma separated</p>
                </div>
              </motion.div>
            )}

            {/* STEP 4: INSIGHTS CANVAS */}
            {step === 4 && (
              <motion.div 
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <HelpCircle className="w-3 h-3" /> The Problem (Optional)
                  </label>
                  <textarea 
                    placeholder="What friction exists in the world today?"
                    value={formData.problem}
                    onChange={(e) => setFormData({...formData, problem: e.target.value})}
                    rows={2}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <Zap className="w-3 h-3" /> The Solution (Optional)
                  </label>
                  <textarea 
                    placeholder="How does your Jam solve it with elegance?"
                    value={formData.solution}
                    onChange={(e) => setFormData({...formData, solution: e.target.value})}
                    rows={2}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Pricing Model (Optional)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. $29/mo seat, Usage-based, Freemium..."
                    value={formData.pricing}
                    onChange={(e) => setFormData({...formData, pricing: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
                  />
                </div>

                <div className="p-6 rounded-3xl bg-green-500/5 border border-green-500/10 mt-8">
                   <div className="flex items-center gap-3 mb-2">
                      <ShieldCheck className="w-5 h-5 text-green-500" />
                      <h4 className="font-bold text-white text-sm tracking-tight">Ready for Verification</h4>
                   </div>
                   <p className="text-zinc-500 text-xs">By publishing, your revenue data will be verified via {selectedProvider || 'manual entry'} and appear in the global rankings.</p>
                </div>

                <div className="p-6 rounded-3xl bg-[#D4AF37]/5 border border-[#D4AF37]/20 space-y-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-white text-sm tracking-tight">Also publish this Jam on Marketplace?</h4>
                      <p className="text-zinc-500 text-xs mt-1">
                        Optional. Keep Rankings-only, or list this same Jam for acquisition.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, publishToMarketplace: !prev.publishToMarketplace }))}
                      className={`w-12 h-6 rounded-full transition-all relative ${
                        formData.publishToMarketplace ? 'bg-[#D4AF37]' : 'bg-white/10'
                      }`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.publishToMarketplace ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>

                  {formData.publishToMarketplace && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Asking Price (USD)</label>
                        <input
                          type="number"
                          min={0}
                          placeholder={String(Math.max(5000, formData.monthlyRevenue * 48))}
                          value={formData.marketplaceAskingPrice}
                          onChange={(e) => setFormData((prev) => ({ ...prev, marketplaceAskingPrice: e.target.value }))}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Profit Margin (%)</label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={formData.marketplaceProfitMargin}
                          onChange={(e) => setFormData((prev) => ({ ...prev, marketplaceProfitMargin: Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 0)) }))}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Visibility</label>
                        <select
                          value={formData.marketplaceVisibility}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              marketplaceVisibility: e.target.value as 'public' | 'members_only' | 'private',
                            }))
                          }
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
                        >
                          <option value="public">Public</option>
                          <option value="members_only">Members Only</option>
                          <option value="private">Private</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Seller Identity</label>
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, marketplaceIsAnonymous: !prev.marketplaceIsAnonymous }))}
                          className="w-full h-[50px] rounded-xl bg-white/5 border border-white/10 px-4 text-left flex items-center justify-between"
                        >
                          <span className="text-sm text-white">{formData.marketplaceIsAnonymous ? 'Anonymous Listing' : 'Public Founder Profile'}</span>
                          <span className={`w-10 h-5 rounded-full relative transition-all ${formData.marketplaceIsAnonymous ? 'bg-[#D4AF37]' : 'bg-white/15'}`}>
                            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${formData.marketplaceIsAnonymous ? 'left-5' : 'left-0.5'}`} />
                          </span>
                        </button>
                      </div>
                    </div>
                  )}

                  {formData.publishToMarketplace && !founderEmailValid && (
                    <p className="text-[11px] text-red-300">
                      Founder email is required to publish to Marketplace.
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        <footer className="px-8 py-6 border-t border-white/5 flex items-center justify-between shrink-0 bg-[#070707]">
          <button 
            onClick={step === 1 ? onClose : prevStep}
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-full border border-white/10 text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-all"
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </button>
          
          <button 
            onClick={step === 4 ? handlePublish : nextStep}
            disabled={isSubmitting || (step === 1 && !formData.name) || (step === 4 && !marketplaceReady)}
            className={`px-8 py-2.5 rounded-full font-black uppercase tracking-widest text-xs flex items-center gap-2 transition-all
              ${isSubmitting || (step === 1 && !formData.name) || (step === 4 && !marketplaceReady) ? 'bg-white/5 text-zinc-700 cursor-not-allowed' : 'bg-white text-black hover:scale-105 shadow-xl shadow-white/5'}`}
          >
            {step === 4 ? (
              isSubmitting ? <>Publishing...</> : <>Publish Jam <Rocket className="w-3.5 h-3.5" /></>
            ) : (
              <>Continue <ChevronRight className="w-3.5 h-3.5" /></>
            )}
          </button>
        </footer>
      </motion.div>
    </motion.div>
  );
};

export default StartJamModal;
