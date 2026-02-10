
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ChevronRight, ChevronLeft, Sparkles, 
  Instagram, Twitter, Youtube, Globe, Music, 
  ShoppingBag, Check, Search, Camera, Wand2,
  Share2, ShieldCheck, Zap, ArrowRight, Smartphone,
  Layout, Eye, Rocket, Send
} from 'lucide-react';
import { CanvasOnboardingPayload } from '../types';

interface CanvasOnboardingProps {
  claimedName: string;
  onClose: () => void;
  onComplete: (data: CanvasOnboardingPayload) => void | Promise<void>;
}

const VIBE_FRAMEWORKS = [
  { 
    id: 'midnight-zenith', 
    name: 'Midnight Zenith', 
    desc: 'Bento-style architecture with glass-morphism.',
    previewImg: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=600',
    accent: 'cyan-400',
    bg: 'bg-black'
  },
  { 
    id: 'editorial-kinetic', 
    name: 'Editorial Kinetic', 
    desc: 'Bold Swiss typography and high-contrast layouts.',
    previewImg: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&q=80&w=600',
    accent: 'yellow-400',
    bg: 'bg-[#FDF6E3]'
  },
  { 
    id: 'concrete-vibe', 
    name: 'Concrete Vibe', 
    desc: 'Brutalist minimalism with raw textures.',
    previewImg: 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?auto=format&fit=crop&q=80&w=600',
    accent: 'rose-500',
    bg: 'bg-zinc-900'
  },
  { 
    id: 'aurora-bento', 
    name: 'Aurora Bento', 
    desc: 'Soft gradients and organic liquid shapes.',
    previewImg: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=600',
    accent: 'purple-500',
    bg: 'bg-zinc-950'
  },
  { 
    id: 'glass-artifact', 
    name: 'Glass Artifact', 
    desc: 'Pure transparency for ultra-clean storefronts.',
    previewImg: 'https://images.unsplash.com/photo-1633167606207-d840b5070fc2?auto=format&fit=crop&q=80&w=600',
    accent: 'blue-400',
    bg: 'bg-black'
  },
  { 
    id: 'retro-grid', 
    name: 'Retro Grid', 
    desc: 'Structured 8-bit energy for builders.',
    previewImg: 'https://images.unsplash.com/photo-1618556450991-2f1af64e8191?auto=format&fit=crop&q=80&w=600',
    accent: 'green-400',
    bg: 'bg-[#0F1115]'
  }
];

const SIGNALS = [
  { id: 'instagram', name: 'Instagram', icon: Instagram, color: '#E4405F' },
  { id: 'x', name: 'X (Twitter)', icon: Twitter, color: '#ffffff' },
  { id: 'tiktok', name: 'TikTok', icon: Music, color: '#000000' },
  { id: 'youtube', name: 'YouTube', icon: Youtube, color: '#FF0000' },
  { id: 'spotify', name: 'Spotify', icon: Music, color: '#1DB954' },
  { id: 'github', name: 'GitHub', icon: Globe, color: '#ffffff' },
  { id: 'website', name: 'Portfolio', icon: Globe, color: '#ffffff' },
  { id: 'store', name: 'Storefront', icon: ShoppingBag, color: '#D4AF37' },
];

const CanvasOnboarding: React.FC<CanvasOnboardingProps> = ({ claimedName, onClose, onComplete }) => {
  const [step, setStep] = useState(1);
  const [selectedTheme, setSelectedTheme] = useState('midnight-zenith');
  const [selectedSignals, setSelectedSignals] = useState<string[]>([]);
  const [links, setLinks] = useState<Record<string, string>>({});
  const [profile, setProfile] = useState({
    name: claimedName,
    bio: 'Digital Artisan • Exploring the boundary between high-fidelity code and organic vibes.',
    avatar: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${claimedName}`
  });

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const toggleSignal = (id: string) => {
    setSelectedSignals(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleLinkChange = (id: string, val: string) => {
    setLinks(prev => ({ ...prev, [id]: val }));
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[250] bg-black text-white font-sans overflow-hidden select-none"
    >
      {/* Premium Background Ambient Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-white/[0.01] blur-[120px] rounded-full" />
      </div>

      {/* Persistent Navigation Header */}
      <header className="relative z-50 flex items-center justify-between px-8 py-8 lg:px-12">
        <div className="flex items-center gap-8">
          <button onClick={onClose} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 hover:text-white transition-colors group">
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Exit
          </button>
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10">
            <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37]">Securing {claimedName}</span>
          </div>
        </div>
        
        {/* Step Indicator */}
        <div className="flex items-center gap-3">
          {[1, 2, 3, 4, 5].map(s => (
            <div 
              key={s} 
              className={`h-1 rounded-full transition-all duration-500 ${step >= s ? 'w-8 bg-white' : 'w-4 bg-white/10'}`} 
            />
          ))}
        </div>

        <button onClick={onClose} className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 hover:text-white transition-colors">
          Help
        </button>
      </header>

      {/* Main Experience Stage */}
      <main className="relative z-10 max-w-7xl mx-auto px-8 lg:px-12 pt-8 pb-32 h-[calc(100vh-160px)] overflow-y-auto no-scrollbar">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: FRAMEWORK SELECTION */}
          {step === 1 && (
            <motion.div 
              key="step-framework"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-16"
            >
              <div className="text-center max-w-3xl mx-auto">
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6">
                  <Layout className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Step 01 • Design Framework</span>
                </motion.div>
                <h2 className="text-4xl md:text-6xl font-extrabold tracking-tighter text-white mb-6 leading-[1.1]">
                  Select your <br/><span className="italic font-serif-rank text-[#D4AF37]">Visual Framework</span>
                </h2>
                <p className="text-zinc-500 text-lg font-medium">Choose a high-fidelity starting point for your digital artifact.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {VIBE_FRAMEWORKS.map(f => (
                  <button
                    key={f.id}
                    onClick={() => setSelectedTheme(f.id)}
                    className={`group relative aspect-[4/5] rounded-[48px] overflow-hidden border-2 transition-all duration-700
                      ${selectedTheme === f.id ? 'border-white scale-[1.02] shadow-[0_0_80px_rgba(255,255,255,0.1)]' : 'border-white/5 hover:border-white/20'}`}
                  >
                    <img 
                      src={f.previewImg} 
                      className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 
                        ${selectedTheme === f.id ? 'grayscale-0 scale-105' : 'grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-80'}`} 
                      alt={f.name} 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                    <div className="absolute bottom-10 left-10 right-10 text-left">
                       <h4 className="text-white font-black uppercase tracking-widest text-lg mb-2">{f.name}</h4>
                       <p className="text-zinc-400 text-xs font-medium leading-relaxed group-hover:text-zinc-200 transition-colors">{f.desc}</p>
                    </div>
                    {selectedTheme === f.id && (
                      <motion.div layoutId="active-check" className="absolute top-10 right-10 w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-2xl">
                        <Check className="w-6 h-6" />
                      </motion.div>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 2: SIGNAL SELECTION (PLATFORMS) */}
          {step === 2 && (
            <motion.div 
              key="step-signals"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto text-center"
            >
              <div className="text-center mb-16">
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6 mx-auto">
                  <Zap className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Step 02 • Pulse Signals</span>
                </motion.div>
                <h2 className="text-4xl md:text-6xl font-extrabold tracking-tighter text-white mb-6">
                  Where do you <br/><span className="italic font-serif-rank text-zinc-500">broadcast?</span>
                </h2>
                <p className="text-zinc-500 text-lg">Select up to five signals to broadcast on your Canvas.</p>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {SIGNALS.map(s => (
                  <button
                    key={s.id}
                    onClick={() => toggleSignal(s.id)}
                    className={`group relative aspect-square rounded-[40px] border transition-all duration-500 flex flex-col items-center justify-center gap-4
                      ${selectedSignals.includes(s.id) 
                        ? 'bg-white border-white scale-105' 
                        : 'bg-white/[0.02] border-white/5 hover:border-white/20'}`}
                  >
                    <s.icon className={`w-8 h-8 transition-colors ${selectedSignals.includes(s.id) ? 'text-black' : 'text-zinc-500'}`} />
                    <span className={`text-[10px] font-black uppercase tracking-widest ${selectedSignals.includes(s.id) ? 'text-black' : 'text-zinc-600'}`}>{s.name}</span>
                    {selectedSignals.includes(s.id) && (
                      <motion.div layoutId="check-signal" className="absolute top-6 right-6 p-1 rounded-full bg-black text-white">
                        <Check className="w-3.5 h-3.5" />
                      </motion.div>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 3: SIGNAL MAPPING (LINKS) */}
          {step === 3 && (
            <motion.div 
              key="step-mapping"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto"
            >
              <div className="text-center mb-16">
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6">
                  <Share2 className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Step 03 • Mapping Signals</span>
                </motion.div>
                <h2 className="text-4xl md:text-6xl font-extrabold tracking-tighter text-white mb-6">
                  Finalize <span className="italic font-serif-rank text-[#D4AF37]">Connections</span>
                </h2>
                <p className="text-zinc-500 text-lg">Input your handles to activate the signal flow.</p>
              </div>

              <div className="space-y-4">
                {selectedSignals.map(id => {
                  const s = SIGNALS.find(item => item.id === id);
                  return (
                    <div key={id} className="relative group">
                      <div className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-500 flex items-center gap-3">
                        {s && <s.icon className="w-5 h-5" />}
                      </div>
                      <input 
                        type="text" 
                        value={links[id] || ''}
                        onChange={e => handleLinkChange(id, e.target.value)}
                        placeholder={`@username or unique handle`}
                        className="w-full h-18 bg-white/[0.03] border border-white/10 rounded-[28px] pl-16 pr-8 text-white font-medium focus:outline-none focus:ring-1 focus:ring-white/20 transition-all placeholder:text-zinc-700"
                      />
                    </div>
                  );
                })}
                {selectedSignals.length === 0 && (
                  <div className="text-center py-20 bg-white/[0.01] border border-dashed border-white/10 rounded-[40px]">
                    <p className="text-zinc-600 text-sm font-medium">No signals selected. You can add them later in your dashboard.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* STEP 4: IDENTITY & PROFILE */}
          {step === 4 && (
            <motion.div 
              key="step-identity"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto"
            >
              <div className="text-center mb-16">
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6">
                  <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Step 04 • High-Fidelity Identity</span>
                </motion.div>
                <h2 className="text-4xl md:text-6xl font-extrabold tracking-tighter text-white mb-6">
                  Refine <span className="italic font-serif-rank text-zinc-500">Identity</span>
                </h2>
                <p className="text-zinc-500 text-lg">Your public profile reflects your curated vibe.</p>
              </div>

              <div className="flex flex-col items-center gap-12">
                 <div className="relative group">
                    <div className="w-40 h-40 rounded-[52px] border-2 border-white/20 overflow-hidden bg-zinc-900 shadow-2xl relative">
                      <img src={profile.avatar} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" alt="Avatar" />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                    </div>
                    <button className="absolute -bottom-2 -right-2 p-4 rounded-2xl bg-white text-black hover:scale-110 transition-transform shadow-xl">
                      <Camera className="w-6 h-6" />
                    </button>
                 </div>

                 <div className="w-full space-y-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2">Artifact Owner</label>
                      <input 
                        type="text" 
                        value={profile.name}
                        onChange={e => setProfile({...profile, name: e.target.value})}
                        className="w-full h-18 bg-white/[0.03] border border-white/10 rounded-[28px] px-8 text-white font-bold text-2xl focus:outline-none focus:border-white/30 transition-all"
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between px-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Signal Bio</label>
                        <button className="text-[9px] font-black text-[#D4AF37] uppercase tracking-widest flex items-center gap-1.5 hover:text-white transition-colors">
                           <Wand2 className="w-3.5 h-3.5" /> AI Rewrite
                        </button>
                      </div>
                      <textarea 
                        value={profile.bio}
                        onChange={e => setProfile({...profile, bio: e.target.value})}
                        rows={3}
                        className="w-full bg-white/[0.03] border border-white/10 rounded-[32px] p-8 text-zinc-300 font-medium leading-relaxed focus:outline-none focus:border-white/30 transition-all resize-none"
                      />
                    </div>
                 </div>
              </div>
            </motion.div>
          )}

          {/* STEP 5: PREVIEW & PUBLISH */}
          {step === 5 && (
            <motion.div 
              key="step-preview"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="max-w-6xl mx-auto flex flex-col items-center"
            >
              <div className="text-center mb-16">
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6">
                  <Eye className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Step 05 • Final Signal Preview</span>
                </motion.div>
                <h2 className="text-4xl md:text-6xl font-extrabold tracking-tighter text-white mb-6">
                  Artifact <span className="italic font-serif-rank text-[#D4AF37]">Preview</span>
                </h2>
                <p className="text-zinc-500 text-lg">Verify your broadcast settings before going live.</p>
              </div>

              {/* High Fidelity Preview Mockup */}
              <div className="w-full max-w-md aspect-[9/16] bg-black rounded-[60px] border-[12px] border-[#1a1a1a] shadow-[0_50px_100px_rgba(0,0,0,1)] relative overflow-hidden flex flex-col items-center pt-20 px-10 text-center">
                 {/* Preview Theme Background Artifact */}
                 <div className={`absolute inset-0 opacity-20 pointer-events-none`}>
                    <img src={VIBE_FRAMEWORKS.find(f => f.id === selectedTheme)?.previewImg} className="w-full h-full object-cover grayscale" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                 </div>

                 <div className="relative z-10 w-full flex flex-col items-center">
                    <div className="w-24 h-24 rounded-[32px] border-2 border-white/20 overflow-hidden mb-6 shadow-2xl">
                       <img src={profile.avatar} className="w-full h-full object-cover" />
                    </div>
                    <h3 className="text-2xl font-black text-white tracking-tighter mb-2">{profile.name}</h3>
                    <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-6 px-4 leading-relaxed">
                      {profile.bio.substring(0, 80)}...
                    </p>

                    <div className="flex gap-4 mb-10">
                       {selectedSignals.map(id => {
                         const s = SIGNALS.find(item => item.id === id);
                         return s && <s.icon key={id} className="w-5 h-5 text-white/40" />;
                       })}
                    </div>

                    <div className="w-full space-y-3">
                       {[1, 2, 3].map(i => (
                         <div key={i} className="w-full h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                           <div className="w-1/3 h-1 bg-white/10 rounded-full" />
                         </div>
                       ))}
                    </div>
                 </div>

                 {/* Success Badge */}
                 <div className="absolute bottom-12 flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Signal Strong</span>
                 </div>
              </div>

              <div className="mt-16 flex flex-col items-center gap-6">
                 <button 
                  onClick={() => onComplete({ claimedName, profile, selectedTheme, selectedSignals, links })}
                  className="h-20 px-16 rounded-[32px] bg-white text-black font-black uppercase tracking-widest text-sm flex items-center gap-4 hover:scale-105 transition-all shadow-[0_20px_60px_rgba(255,255,255,0.2)] active:scale-95 group"
                 >
                   Broadcast Final Artifact <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                 </button>
                 <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-[0.3em]">Institutional Grade Deployment</p>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Footer Controls */}
      {step < 5 && (
        <footer className="fixed bottom-0 inset-x-0 p-8 lg:p-12 flex justify-center pointer-events-none z-[60]">
          <div className="w-full max-w-7xl flex justify-between items-center pointer-events-auto bg-black/50 backdrop-blur-3xl rounded-[40px] p-6 border border-white/5 shadow-2xl">
            <button 
              onClick={step === 1 ? onClose : prevStep}
              className="h-14 px-8 rounded-2xl border border-white/10 text-zinc-500 hover:text-white font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-2 group"
            >
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              {step === 1 ? 'Cancel Setup' : 'Previous Protocol'}
            </button>
            
            <button 
              onClick={nextStep}
              className="h-14 px-12 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-[10px] flex items-center gap-3 hover:scale-[1.02] transition-all shadow-2xl shadow-white/5 active:scale-95"
            >
              {step === 4 ? 'Generate Preview' : 'Advance Signal'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </footer>
      )}
    </motion.div>
  );
};

export default CanvasOnboarding;
