
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ChevronRight, ChevronLeft, Upload, 
  ShieldCheck, ExternalLink, Info, Globe, 
  DollarSign, Rocket, Mail, EyeOff, Zap,
  CreditCard, CheckCircle2, TrendingUp, HelpCircle
} from 'lucide-react';
import { VibeApp } from '../types';

interface ListAppModalProps {
  onClose: () => void;
  onPublish: (app: VibeApp) => void | Promise<void>;
}

type RevenueProvider = 'Stripe' | 'LemonSqueezy' | 'Polar' | 'Dodo' | 'RevenueCat' | null;

const PROVIDERS = [
  { id: 'Stripe', label: 'Stripe', color: 'bg-[#635BFF]' },
  { id: 'LemonSqueezy', label: 'LemonSqueezy', color: 'bg-[#FFC233]' },
  { id: 'Polar', label: 'Polar', color: 'bg-[#43B2FF]' },
  { id: 'Dodo', label: 'Dodo Payments', color: 'bg-[#FF4A4A]' },
  { id: 'RevenueCat', label: 'RevenueCat', color: 'bg-[#F15A24]' },
];

const BOOST_TIERS = [
  { id: 'Free', name: 'Free', price: '$0', desc: 'Standard listing forever.', perks: ['Verified Badge', 'Basic Search'] },
  { id: 'Pro', name: 'Pro', price: '$49', desc: 'Stand out from the crowd.', perks: ['2x Visibility', 'Featured Badge', 'Priority Support'] },
  { id: 'Elite', name: 'Elite', price: '$299', desc: 'Maximum acquisition speed.', perks: ['10x Visibility', 'Newsletter Spot', 'Canvas Showcase', 'Direct Outreach'] },
];

const ListAppModal: React.FC<ListAppModalProps> = ({ onClose, onPublish }) => {
  const [step, setStep] = useState(1);
  const [selectedProvider, setSelectedProvider] = useState<RevenueProvider>(null);
  const [selectedTier, setSelectedTier] = useState<'Free' | 'Pro' | 'Elite'>('Free');
  const [showAnonymityTooltip, setShowAnonymityTooltip] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    pitch: '',
    category: 'SaaS' as any,
    icon: '💎',
    monthlyRevenue: 0,
    activeUsers: 0,
    founderName: '',
    founderEmail: '',
    askingPrice: '',
    profitMargin: 80,
    isAnonymous: false,
    website: '',
    techStack: '',
  });

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const handlePublish = async () => {
    if (isSubmitting) {
      return;
    }

    const techStackArray = formData.techStack 
      ? formData.techStack.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    const newApp: VibeApp = {
      id: Math.random().toString(36).substr(2, 9),
      rank: 'NEW',
      name: formData.isAnonymous ? 'Anonymous Asset' : (formData.name || 'Untitled'),
      pitch: formData.isAnonymous ? 'Private high-revenue application.' : formData.pitch,
      icon: formData.isAnonymous ? '🛡️' : formData.icon,
      accentColor: '212, 175, 55',
      monthlyRevenue: formData.monthlyRevenue,
      lifetimeRevenue: formData.monthlyRevenue * 15,
      activeUsers: formData.activeUsers,
      buildStreak: 1,
      growth: 12,
      tags: [formData.category, 'FOR SALE'],
      verified: true,
      category: formData.category,
      founder: {
        name: formData.isAnonymous ? 'Private Seller' : formData.founderName,
        handle: formData.isAnonymous ? '@private' : `@${formData.founderName.toLowerCase().replace(/\s/g, '')}`,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.founderName}`,
        email: formData.founderEmail
      },
      techStack: techStackArray,
      problem: 'Market exit.',
      solution: 'Acquisition opportunity.',
      pricing: 'Exit',
      revenueHistory: [{ date: 'Today', revenue: formData.monthlyRevenue }],
      isForSale: true,
      askingPrice: `$${formData.askingPrice}`,
      profitMargin: formData.profitMargin,
      isAnonymous: formData.isAnonymous,
      boostTier: selectedTier
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
      <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-white hover:bg-white/10 transition-all">
        Open Dashboard <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] bg-black/98 flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0" onClick={onClose} />
      
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} className="relative w-full max-w-3xl bg-[#030303] border border-yellow-500/20 rounded-[48px] shadow-[0_0_100px_rgba(212,175,55,0.05)] overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Header */}
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

        {/* Scroll Body */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-10">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: FOUNDER IDENTITY */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Project Name</label>
                    <input type="text" placeholder="e.g. Prism OS" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-1 focus:ring-yellow-500/50" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Founder Name</label>
                    <input type="text" placeholder="Full Name" value={formData.founderName} onChange={e => setFormData({...formData, founderName: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none" />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center justify-between">
                    Founder Private Email <span className="text-yellow-500/50">Required</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
                    <input type="email" placeholder="email@founder.com" value={formData.founderEmail} onChange={e => setFormData({...formData, founderEmail: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-14 py-4 text-white focus:outline-none focus:ring-1 focus:ring-yellow-500/50" />
                  </div>
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
                               Your startup name, description, logo, website, and other details will be anonymized. Only revenue and MRR numbers will be displayed publicly.
                             </motion.div>
                           )}
                         </AnimatePresence>
                       </div>
                       <button onClick={() => setFormData({...formData, isAnonymous: !formData.isAnonymous})} className={`w-12 h-6 rounded-full transition-all relative ${formData.isAnonymous ? 'bg-[#D4AF37]' : 'bg-white/10'}`}>
                         <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.isAnonymous ? 'left-7' : 'left-1'}`} />
                       </button>
                    </div>
                    <p className="text-zinc-500 text-sm leading-relaxed">
                      Enable stealth mode for high-value asset protection.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: REVENUE TRACKING */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                {!selectedProvider ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                    {PROVIDERS.map(p => (
                      <button key={p.id} onClick={() => setSelectedProvider(p.id as RevenueProvider)} className="aspect-square rounded-[32px] bg-white/[0.02] border border-white/5 flex flex-col items-center justify-center gap-4 hover:border-yellow-500/40 transition-all group">
                        <div className={`w-16 h-16 rounded-2xl ${p.color} flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform`}>
                          <CreditCard className="w-8 h-8 text-white" />
                        </div>
                        <span className="text-sm font-bold text-zinc-500">{p.label}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <button onClick={() => setSelectedProvider(null)} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-all text-xs font-black uppercase tracking-widest">
                      <ChevronLeft className="w-4 h-4" /> Change Source
                    </button>

                    {selectedProvider === 'Stripe' && (
                      <InstructionGuide title="Stripe" link="https://dashboard.stripe.com/login?redirect=%2Fapikeys%2Fcreate%3Fname%3DTrustMRR%26permissions%255B%255D%3Drak_charge_read%26permissions%255B%255D%3Drak_subscription_read%26permissions%255B%255D%3Drak_plan_read%26permissions%255B%255D%3Drak_bucket_connect_read%26permissions%255B%255D%3Drak_file_read" guide={<p>Click below to create a read-only key. Don't change permissions. Don't delete key after publishing.</p>} />
                    )}
                    {selectedProvider === 'LemonSqueezy' && (
                      <InstructionGuide title="LemonSqueezy" link="https://app.lemonsqueezy.com/auth/redirect?url=https%3A%2F%2Fapp.lemonsqueezy.com%2Fsettings%2Fapi" guide={<p>Click +, set expiration to 10+ years, and copy-paste key below.</p>} />
                    )}
                    {selectedProvider === 'Polar' && (
                      <InstructionGuide title="Polar" link="https://polar.sh/login?return_to=%2Fdashboard" guide={<p>Create Organization Token in Settings &gt; Developer. Select orders:read, subscriptions:read, and organizations:read.</p>} />
                    )}

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Verification Key</label>
                      <input type="password" placeholder="sk_test_..." onChange={e => setFormData({...formData, monthlyRevenue: 12500})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white font-mono-data" />
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 3: MARKET DETAILS */}
            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Asking Price (USD)</label>
                    <div className="relative">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600 font-bold">$</span>
                      <input type="text" placeholder="450,000" value={formData.askingPrice} onChange={e => setFormData({...formData, askingPrice: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-12 py-5 text-white focus:outline-none" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                      Profit Margin (%) <HelpCircle className="w-3 h-3 text-zinc-700" />
                    </label>
                    <input type="number" placeholder="85" value={formData.profitMargin} onChange={e => setFormData({...formData, profitMargin: parseInt(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white focus:outline-none" />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Acquisition Pitch</label>
                  <textarea placeholder="Briefly describe why an investor should buy this asset..." rows={3} value={formData.pitch} onChange={e => setFormData({...formData, pitch: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-3xl px-6 py-5 text-white focus:outline-none resize-none" />
                </div>
              </motion.div>
            )}

            {/* STEP 4: BOOST & PUBLISH */}
            {step === 4 && (
              <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                <div className="text-center mb-6">
                   <h4 className="text-white font-bold text-xl mb-2">Boost Your Listing</h4>
                   <p className="text-zinc-500 text-sm">Select a tier to reach thousands of accredited buyers faster.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {BOOST_TIERS.map(tier => (
                    <button key={tier.id} onClick={() => setSelectedTier(tier.id as any)} className={`p-8 rounded-[40px] border flex flex-col text-left transition-all ${selectedTier === tier.id ? 'bg-yellow-500/10 border-yellow-500 shadow-2xl shadow-yellow-500/10' : 'bg-white/[0.02] border-white/5 hover:border-white/20'}`}>
                      <div className="flex justify-between items-start mb-6">
                        <span className={`text-[10px] font-black tracking-widest uppercase ${selectedTier === tier.id ? 'text-yellow-500' : 'text-zinc-500'}`}>{tier.name}</span>
                        <span className="text-xl font-black text-white">{tier.price}</span>
                      </div>
                      <p className="text-xs text-zinc-400 mb-8 leading-relaxed h-10">{tier.desc}</p>
                      <div className="space-y-3 mb-8">
                        {tier.perks.map(perk => (
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
                        <p className="text-[10px] text-zinc-500 font-bold">BY CLICKING PUBLISH YOU AGREE TO OUR EXIT TERMS.</p>
                      </div>
                   </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Footer */}
        <footer className="px-10 py-8 border-t border-white/5 flex items-center justify-between bg-[#050505] shrink-0">
          <button onClick={step === 1 ? onClose : prevStep} disabled={isSubmitting} className="text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-all">
            {step === 1 ? 'Cancel' : 'Back'}
          </button>
          
          <button onClick={step === 4 ? handlePublish : nextStep} disabled={isSubmitting || (step === 1 && (!formData.founderEmail || !formData.name))} className={`px-10 py-4 rounded-full font-black uppercase tracking-widest text-xs flex items-center gap-3 transition-all ${isSubmitting || (step === 1 && (!formData.founderEmail || !formData.name)) ? 'bg-white/5 text-zinc-800 cursor-not-allowed' : 'bg-white text-black hover:scale-105 active:scale-95 shadow-2xl shadow-white/5'}`}>
            {step === 4 ? (isSubmitting ? <>Publishing...</> : <>Publish Listing <Rocket className="w-4 h-4" /></>) : <>Continue <ChevronRight className="w-4 h-4" /></>}
          </button>
        </footer>

      </motion.div>
    </motion.div>
  );
};

export default ListAppModal;
