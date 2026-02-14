
import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, ChevronLeft,
  Instagram, Twitter, Youtube, Globe, Music,
  ShoppingBag, Check, Camera, Wand2,
  Share2, ShieldCheck, Zap, Monitor,
  Layout, Eye, Send, Smartphone
} from 'lucide-react';
import { CanvasOnboardingPayload, CanvasTheme } from '../types';

interface CanvasOnboardingProps {
  claimedName: string;
  vanitySlug: string;
  frameworks: CanvasTheme[];
  initialThemeId?: string;
  selectedTemplateId?: string;
  isPublishing?: boolean;
  publishError?: string | null;
  onClose: () => void;
  onComplete: (data: CanvasOnboardingPayload) => void | Promise<void>;
}

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

const CanvasOnboarding: React.FC<CanvasOnboardingProps> = ({
  claimedName,
  vanitySlug,
  frameworks,
  initialThemeId,
  selectedTemplateId,
  isPublishing = false,
  publishError = null,
  onClose,
  onComplete,
}) => {
  const [step, setStep] = useState(1);
  const [isMobileLaunch, setIsMobileLaunch] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(initialThemeId ?? frameworks[0]?.id ?? 'midnight-zenith');
  const [selectedSignals, setSelectedSignals] = useState<string[]>([]);
  const [links, setLinks] = useState<Record<string, string>>({});
  const [profile, setProfile] = useState({
    name: claimedName,
    bio: 'Creator, builder, and storyteller. Follow my latest work and favorite links.',
    avatar: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${claimedName}`
  });

  const activeTheme = useMemo(
    () => frameworks.find((theme) => theme.id === selectedTheme) ?? frameworks[0],
    [frameworks, selectedTheme],
  );

  useEffect(() => {
    if (frameworks.length === 0) {
      return;
    }

    if (!frameworks.some((theme) => theme.id === selectedTheme)) {
      setSelectedTheme(frameworks[0].id);
    }
  }, [frameworks, selectedTheme]);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalOverscroll = document.body.style.overscrollBehavior;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.overscrollBehavior = originalOverscroll;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const sync = () => setIsMobileLaunch(mediaQuery.matches);
    sync();

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', sync);
      return () => mediaQuery.removeEventListener('change', sync);
    }

    mediaQuery.addListener(sync);
    return () => mediaQuery.removeListener(sync);
  }, []);

  const nextStep = () => setStep((current) => Math.min(5, current + 1));
  const prevStep = () => setStep((current) => Math.max(1, current - 1));

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
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[520px] bg-white/[0.01] blur-[120px] rounded-full" />
        <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[70vw] h-[320px] bg-white/[0.02] blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 flex h-[100dvh] flex-col">
        {/* Persistent Navigation Header */}
        <header className="flex items-center justify-between border-b border-white/5 bg-black/60 px-4 py-5 backdrop-blur-xl sm:px-8 lg:px-12">
          <div className="flex items-center gap-5">
            <button onClick={onClose} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 hover:text-white transition-colors group">
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Exit
            </button>
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10">
              <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37]">Setting up vibejam.co/{vanitySlug}</span>
            </div>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center gap-2 sm:gap-3">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`h-1 rounded-full transition-all duration-500 ${step >= s ? 'w-7 sm:w-8 bg-white' : 'w-3 sm:w-4 bg-white/10'}`}
              />
            ))}
          </div>

          <button onClick={onClose} className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 hover:text-white transition-colors">
            Help
          </button>
        </header>

        {/* Main Experience Stage */}
        <main className="flex-1 overflow-y-auto no-scrollbar">
          <div className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-8 lg:px-12 lg:py-10">
            <AnimatePresence mode="wait">
          
          {/* STEP 1: FRAMEWORK SELECTION */}
          {step === 1 && (
            <motion.div 
              key="step-framework"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-10"
            >
              <div className="text-center max-w-3xl mx-auto">
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6">
                  <Layout className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Step 01 • Visual Style</span>
                </motion.div>
                <h2 className="text-4xl md:text-6xl font-extrabold tracking-tighter text-white mb-6 leading-[1.1]">
                  Select your <br/><span className="italic font-serif-rank text-[#D4AF37]">Visual Framework</span>
                </h2>
                <p className="text-zinc-400 text-lg font-medium">Pick the look you want. You can change it any time.</p>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {frameworks.length === 0 && (
                  <div className="col-span-full rounded-[32px] border border-white/10 bg-white/[0.02] px-8 py-16 text-center text-zinc-400">
                    No themes available right now.
                  </div>
                )}
                {frameworks.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setSelectedTheme(f.id)}
                    className={`group relative aspect-[7/8] rounded-[36px] overflow-hidden border-2 transition-all duration-700
                      ${selectedTheme === f.id ? 'border-white scale-[1.01] shadow-[0_0_60px_rgba(255,255,255,0.1)]' : 'border-white/5 hover:border-white/20'}`}
                  >
                    <img
                      src={f.previewImg}
                      className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000
                        ${selectedTheme === f.id ? 'grayscale-0 scale-105' : 'grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-90'}`}
                      alt={f.name}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />
                    <div className="absolute bottom-7 left-7 right-7 text-left">
                      <h4 className="text-white font-black uppercase tracking-widest text-base sm:text-lg mb-2">{f.name}</h4>
                      <p className="text-zinc-300 text-xs font-medium leading-relaxed group-hover:text-zinc-100 transition-colors">{f.desc}</p>
                    </div>
                    {selectedTheme === f.id && (
                      <motion.div layoutId="active-check" className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-2xl">
                        <Check className="w-5 h-5" />
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
              <div className="text-center mb-12">
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6 mx-auto">
                  <Zap className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Step 02 • Links</span>
                </motion.div>
                <h2 className="text-4xl md:text-6xl font-extrabold tracking-tighter text-white mb-6">
                  Where should people <br/><span className="italic font-serif-rank text-zinc-500">find you?</span>
                </h2>
                <p className="text-zinc-400 text-lg">Choose up to five links to show on your Canvas.</p>
                <p className="mt-3 text-[11px] uppercase tracking-[0.25em] text-zinc-600">{selectedSignals.length}/5 selected</p>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {SIGNALS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      if (!selectedSignals.includes(s.id) && selectedSignals.length >= 5) {
                        return;
                      }
                      toggleSignal(s.id);
                    }}
                    className={`group relative aspect-square rounded-[40px] border transition-all duration-500 flex flex-col items-center justify-center gap-4
                      ${selectedSignals.includes(s.id) 
                        ? 'bg-white border-white scale-105' 
                        : 'bg-white/[0.02] border-white/5 hover:border-white/20'}`}
                  >
                    <s.icon className={`w-8 h-8 transition-colors ${selectedSignals.includes(s.id) ? 'text-black' : 'text-zinc-500'}`} />
                    <span className={`text-[10px] font-black uppercase tracking-widest ${selectedSignals.includes(s.id) ? 'text-black' : 'text-zinc-600'}`}>{s.name}</span>
                      {selectedSignals.includes(s.id) && (
                      <motion.div layoutId="check-signal" className="absolute top-5 right-5 p-1 rounded-full bg-black text-white">
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
              <div className="text-center mb-12">
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6">
                  <Share2 className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Step 03 • Link Details</span>
                </motion.div>
                <h2 className="text-4xl md:text-6xl font-extrabold tracking-tighter text-white mb-6">
                  Add your <span className="italic font-serif-rank text-[#D4AF37]">links</span>
                </h2>
                <p className="text-zinc-400 text-lg">Paste usernames or full URLs for each one.</p>
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
                        placeholder="@username or https://"
                        className="w-full h-14 bg-white/[0.03] border border-white/10 rounded-2xl pl-16 pr-8 text-white font-medium focus:outline-none focus:ring-1 focus:ring-white/20 transition-all placeholder:text-zinc-700"
                      />
                    </div>
                  );
                })}
                {selectedSignals.length === 0 && (
                  <div className="text-center py-16 bg-white/[0.01] border border-dashed border-white/10 rounded-[28px]">
                    <p className="text-zinc-500 text-sm font-medium">No links selected yet. You can add them later.</p>
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
              <div className="text-center mb-12">
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6">
                  <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Step 04 • Profile</span>
                </motion.div>
                <h2 className="text-4xl md:text-6xl font-extrabold tracking-tighter text-white mb-6">
                  Make it <span className="italic font-serif-rank text-zinc-500">yours</span>
                </h2>
                <p className="text-zinc-400 text-lg">Add your photo, display name, and a short bio.</p>
              </div>

              <div className="flex flex-col items-center gap-10">
                 <div className="relative group">
                    <div className="w-36 h-36 rounded-[42px] border-2 border-white/20 overflow-hidden bg-zinc-900 shadow-2xl relative">
                      <img src={profile.avatar} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" alt="Avatar" />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                    </div>
                    <button className="absolute -bottom-2 -right-2 p-3 rounded-xl bg-white text-black hover:scale-110 transition-transform shadow-xl">
                      <Camera className="w-5 h-5" />
                    </button>
                 </div>

                 <div className="w-full space-y-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2">Display Name</label>
                      <input 
                        type="text" 
                        value={profile.name}
                        onChange={e => setProfile({...profile, name: e.target.value})}
                        className="w-full h-14 bg-white/[0.03] border border-white/10 rounded-2xl px-6 text-white font-bold text-2xl focus:outline-none focus:border-white/30 transition-all"
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between px-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Bio</label>
                        <button className="text-[9px] font-black text-[#D4AF37] uppercase tracking-widest flex items-center gap-1.5 hover:text-white transition-colors">
                           <Wand2 className="w-3.5 h-3.5" /> Rewrite
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
              <div className="text-center mb-10">
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6">
                  <Eye className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Step 05 • Preview</span>
                </motion.div>
                <h2 className="text-4xl md:text-6xl font-extrabold tracking-tighter text-white mb-6">
                  Preview your <span className="italic font-serif-rank text-[#D4AF37]">page</span>
                </h2>
                <p className="text-zinc-400 text-lg">See your Canvas on desktop and mobile before you publish.</p>
              </div>

              <div
                className={`w-full grid grid-cols-1 gap-8 ${
                  isMobileLaunch ? 'max-w-sm mx-auto' : 'lg:grid-cols-[1.15fr_0.85fr]'
                }`}
              >
                {!isMobileLaunch && (
                <div className="rounded-[36px] border border-white/10 bg-white/[0.02] p-4 sm:p-6">
                  <div className="rounded-[26px] border border-white/10 overflow-hidden bg-black/80 shadow-[0_30px_80px_rgba(0,0,0,0.8)]">
                    <div className="h-10 border-b border-white/10 bg-black/70 px-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
                        <span className="w-2.5 h-2.5 rounded-full bg-yellow-300/70" />
                        <span className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
                      </div>
                      <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">desktop preview</p>
                    </div>
                    <div className="relative min-h-[340px] sm:min-h-[400px] p-8">
                      <img
                        src={activeTheme?.previewImg}
                        className="absolute inset-0 w-full h-full object-cover opacity-25 grayscale"
                        alt={activeTheme?.name ?? 'Theme preview'}
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/65 to-black/95" />
                      <div className="relative z-10 h-full flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-4 mb-6">
                            <img src={profile.avatar} className="w-16 h-16 rounded-2xl border border-white/20 bg-zinc-900" alt="Avatar" />
                            <div>
                              <h3 className="text-3xl font-black tracking-tight text-white">{profile.name || claimedName}</h3>
                              <p className="text-zinc-400 text-sm mt-1 line-clamp-2">{profile.bio}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {selectedSignals.slice(0, 4).map((id) => {
                              const signal = SIGNALS.find((item) => item.id === id);
                              if (!signal) {
                                return null;
                              }
                              return (
                                <div key={id} className="h-12 rounded-xl border border-white/10 bg-black/40 px-4 flex items-center justify-between">
                                  <span className="text-[10px] font-black tracking-[0.2em] uppercase text-zinc-300">{signal.name}</span>
                                  <signal.icon className="w-4 h-4 text-zinc-400" />
                                </div>
                              );
                            })}
                            {selectedSignals.length === 0 && (
                              <div className="sm:col-span-2 h-12 rounded-xl border border-dashed border-white/15 bg-black/30 px-4 flex items-center justify-center text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                                Add links to see them here
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="h-14 rounded-2xl border border-white/10 bg-black/35 px-6 flex items-center justify-between">
                          <span className="text-xs font-bold text-zinc-300">vibejam.co/{vanitySlug}</span>
                          <span className="text-[10px] uppercase tracking-[0.24em] text-zinc-500">Live</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-zinc-500">
                    <Monitor className="w-4 h-4" /> Desktop view
                  </div>
                </div>
                )}

                <div className="mx-auto w-full max-w-sm rounded-[36px] border border-white/10 bg-white/[0.02] p-5">
                  <div className="aspect-[9/16] bg-black rounded-[44px] border-[10px] border-[#1a1a1a] shadow-[0_35px_90px_rgba(0,0,0,0.95)] relative overflow-hidden flex flex-col items-center pt-16 px-6 text-center">
                    <img
                      src={activeTheme?.previewImg}
                      className="absolute inset-0 w-full h-full object-cover opacity-20 grayscale"
                      alt={activeTheme?.name ?? 'Theme preview'}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-black/15" />

                    <div className="relative z-10 w-full flex flex-col items-center">
                      <div className="w-20 h-20 rounded-3xl border-2 border-white/20 overflow-hidden mb-5 shadow-2xl">
                        <img src={profile.avatar} className="w-full h-full object-cover" alt="Avatar" />
                      </div>
                      <h3 className="text-2xl font-black text-white tracking-tighter mb-1">{profile.name || claimedName}</h3>
                      <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest mb-6 px-3 leading-relaxed line-clamp-3">
                        {profile.bio}
                      </p>

                      <div className="flex gap-3 mb-8">
                        {selectedSignals.slice(0, 5).map((id) => {
                          const signal = SIGNALS.find((item) => item.id === id);
                          return signal ? <signal.icon key={id} className="w-4 h-4 text-white/55" /> : null;
                        })}
                      </div>

                      <div className="w-full space-y-2.5">
                        {[1, 2, 3].map((item) => (
                          <div key={item} className="w-full h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                            <div className="w-1/3 h-1 bg-white/10 rounded-full" />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="absolute bottom-8 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]" />
                      <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Ready</span>
                    </div>
                  </div>
                  <div className="mt-4 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-zinc-500">
                    <Smartphone className="w-4 h-4" /> Mobile view
                  </div>
                </div>
              </div>

               <div className="mt-12 flex flex-col items-center gap-5">
                 <button
                  disabled={isPublishing}
                  onClick={() => onComplete({ claimedName, vanitySlug, profile, selectedTheme, selectedTemplateId, selectedSignals, links })}
                  className="h-16 px-12 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-xs sm:text-sm flex items-center gap-3 hover:scale-105 transition-all shadow-[0_20px_60px_rgba(255,255,255,0.2)] active:scale-95 group"
                 >
                   {isPublishing ? 'Publishing...' : 'Publish Canvas'} <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                 </button>
                 <p className="text-zinc-500 text-xs font-medium">Your page will go live at https://vibejam.co/{vanitySlug}</p>
                 {publishError && <p className="text-red-300 text-xs">{publishError}</p>}
                 <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-[0.3em]">Ready for launch</p>
              </div>
            </motion.div>
          )}

            </AnimatePresence>
          </div>
        </main>

        {/* Footer Controls */}
        {step < 5 && (
          <footer className="border-t border-white/5 bg-black/70 backdrop-blur-2xl px-4 py-4 sm:px-8 lg:px-12">
            <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                onClick={step === 1 ? onClose : prevStep}
                className="h-12 px-6 rounded-xl border border-white/10 text-zinc-400 hover:text-white font-black uppercase tracking-[0.2em] text-[10px] transition-all flex items-center justify-center gap-2 group"
              >
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                {step === 1 ? 'Exit' : 'Back'}
              </button>

              <button
                onClick={nextStep}
                className="h-12 px-8 rounded-xl bg-white text-black font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2.5 hover:scale-[1.01] transition-all shadow-xl shadow-white/10 active:scale-95"
              >
                {step === 4 ? 'Generate Preview' : 'Next'}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </footer>
        )}
      </div>
    </motion.div>
  );
};

export default CanvasOnboarding;
