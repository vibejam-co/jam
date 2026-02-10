
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ChevronRight, ChevronLeft, Upload, 
  ShieldCheck, ExternalLink, Info, Globe, 
  Layout, HelpCircle, Rocket, DollarSign,
  TrendingUp, Users, Smartphone, Zap
} from 'lucide-react';
import { VibeApp } from '../types';

interface StartJamModalProps {
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

const CATEGORIES = [
  "Ai", "Analytics", "Community", "Content Creation", "Crypto", 
  "Customer Support", "Design Tools", "Developer Tools", "Ecommerce", 
  "Education", "Entertainment", "Fintech", "Games", "Health", 
  "IoT", "Legal", "Marketing", "Marketplace", "Mobile Apps", 
  "News & Magazines", "No-Code", "Productivity", "Real Estate", 
  "Recruiting & HR", "SaaS", "Sales", "Security", "Social Media", 
  "Travel", "Utilities"
];

const StartJamModal: React.FC<StartJamModalProps> = ({ onClose, onPublish }) => {
  const [step, setStep] = useState(1);
  const [selectedProvider, setSelectedProvider] = useState<RevenueProvider>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    pitch: '',
    category: 'Ai',
    icon: '✨',
    monthlyRevenue: 0,
    activeUsers: 0,
    founderName: '',
    website: '',
    techStack: '',
    problem: '',
    solution: '',
    pricing: '',
  });

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const handlePublish = async () => {
    if (isSubmitting) {
      return;
    }

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
      verified: true,
      category: formData.category,
      founder: {
        name: formData.founderName || 'Founder',
        handle: `@${(formData.founderName || 'founder').toLowerCase().replace(/\s/g, '')}`,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.founderName}`
      },
      techStack: formData.techStack.split(',').map(s => s.trim()),
      problem: formData.problem || 'Market inefficiency.',
      solution: formData.solution || 'Streamlined experience.',
      pricing: formData.pricing || 'Freemium',
      revenueHistory: [
        { date: 'Month 1', revenue: formData.monthlyRevenue }
      ]
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
      className="fixed inset-0 z-[110] bg-black/95 flex items-center justify-center p-4 sm:p-6 overflow-hidden"
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
                        link="https://dashboard.stripe.com/login?redirect=%2Fapikeys%2Fcreate%3Fname%3DTrustMRR%26permissions%255B%255D%3Drak_charge_read%26permissions%255B%255D%3Drak_subscription_read%26permissions%255B%255D%3Drak_plan_read%26permissions%255B%255D%3Drak_bucket_connect_read%26permissions%255B%255D%3Drak_file_read"
                        guide={
                          <>
                            <p>1. Click the button below to create a <strong>read-only</strong> API key.</p>
                            <p>2. Scroll down and click <strong>'Create key'</strong>.</p>
                            <p>3. <strong>Don't change the permissions</strong> — we need specific read access to verify your revenue.</p>
                            <p className="text-zinc-500">Note: Don't delete the key or we can't refresh revenue updates.</p>
                          </>
                        }
                      />
                    )}

                    {selectedProvider === 'LemonSqueezy' && (
                      <InstructionGuide 
                        title="LemonSqueezy Verification"
                        link="https://app.lemonsqueezy.com/auth/redirect?url=https%3A%2F%2Fapp.lemonsqueezy.com%2Fsettings%2Fapi"
                        guide={
                          <>
                            <p>1. Click the button below to open your LemonSqueezy API settings.</p>
                            <p>2. Click the <strong>+</strong> icon next to <strong>"API Keys"</strong>.</p>
                            <p>3. Set the <strong>expiration date</strong> to 10+ years from now.</p>
                            <p>4. Copy the generated key and paste it below.</p>
                          </>
                        }
                      />
                    )}

                    {selectedProvider === 'Polar' && (
                      <>
                        <InstructionGuide 
                          title="Polar Verification"
                          link="https://polar.sh/login?return_to=%2Fdashboard"
                          guide={
                            <>
                              <p>1. Click <strong>'Settings'</strong> on the left sidebar, then <strong>'General'</strong>.</p>
                              <p>2. Scroll to bottom and click <strong>'New Token'</strong> button in 'Developer' section.</p>
                              <p>3. Choose <strong>'No expiration'</strong>.</p>
                              <p>4. Select <strong>'orders:read'</strong>, <strong>'subscriptions:read'</strong>, and <strong>'organizations:read'</strong> permissions.</p>
                            </>
                          }
                        />
                        <div className="space-y-4">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Organization Identifier</label>
                             <input type="text" placeholder="Found in Settings > General" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white" />
                          </div>
                        </div>
                      </>
                    )}

                    {selectedProvider === 'RevenueCat' && (
                      <div className="space-y-6">
                        <InstructionGuide 
                          title="RevenueCat Secret Key"
                          link="https://app.revenuecat.com/login"
                          guide={<p>Go to <strong>'API Keys'</strong> section. Create a new <strong>Secret API key</strong> (V2 API version + 'Read only' permissions for all).</p>}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Project ID</label>
                              <input type="text" placeholder="Found in Project Settings" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white" />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Share URL Slug</label>
                              <input type="text" placeholder="Verified page slug" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white" />
                           </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Paste API Key Here</label>
                       <input 
                        type="password" 
                        placeholder="sk_..." 
                        onChange={(e) => setFormData({...formData, monthlyRevenue: Math.floor(Math.random() * 50000) + 1000})} // Mock success
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono-data" 
                       />
                       <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest mt-2 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> Encrypted & Secure
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
            disabled={isSubmitting || (step === 1 && !formData.name)}
            className={`px-8 py-2.5 rounded-full font-black uppercase tracking-widest text-xs flex items-center gap-2 transition-all
              ${isSubmitting || (step === 1 && !formData.name) ? 'bg-white/5 text-zinc-700 cursor-not-allowed' : 'bg-white text-black hover:scale-105 shadow-xl shadow-white/5'}`}
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
