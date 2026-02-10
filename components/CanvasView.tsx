
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  LayoutTemplate, 
  Share2, 
  BarChart3, 
  ArrowRight, 
  Eye, 
  Rocket,
  ChevronRight,
  Users,
  X,
  ExternalLink,
  Instagram,
  Twitter,
  Music,
  ShoppingBag,
  Zap,
  ShieldCheck,
  CreditCard
} from 'lucide-react';
import CanvasOnboarding from './CanvasOnboarding';
import { saveCanvasOnboarding } from '../lib/api';

const THEMES = [
  {
    id: 'aurora',
    name: 'Aurora Crystal Bento',
    desc: 'Glassy, glowing, futuristic',
    previewColor: 'from-cyan-500/20 via-blue-500/10 to-transparent',
    accent: 'cyan-400',
    icon: '✨'
  },
  {
    id: 'editorial',
    name: 'Editorial Pop Poster',
    desc: 'Bold typography, creative confidence',
    previewColor: 'from-yellow-500/20 via-orange-500/10 to-transparent',
    accent: 'yellow-400',
    icon: '🗞️'
  },
  {
    id: 'neon',
    name: 'Neon Artifact Night',
    desc: 'Dark, cinematic, late-night energy',
    previewColor: 'from-purple-500/20 via-pink-500/10 to-transparent',
    accent: 'purple-500',
    icon: '🌙'
  },
  {
    id: 'luxe',
    name: 'Soft Luxe Storefront',
    desc: 'Warm, cozy, conversion-friendly',
    previewColor: 'from-rose-500/20 via-stone-500/10 to-transparent',
    accent: 'rose-400',
    icon: '🧸'
  },
  {
    id: 'sonic',
    name: 'Sonic Gradient Stage',
    desc: 'Music-first, immersive, rhythmic',
    previewColor: 'from-green-500/20 via-emerald-500/10 to-transparent',
    accent: 'green-400',
    icon: '🎵'
  }
];

const TEMPLATES = [
  { name: 'Indie Page', type: 'Solopreneur', author: 'Marc Lou', color: 'bg-[#2D3139]' },
  { name: 'Editorial Kinetic', type: 'Fashion', author: 'Mikel Janssen', color: 'bg-[#F2D022]' },
  { name: 'Collage OS', type: 'Creative', author: 'MSCHF Style', color: 'bg-[#E5E1D5]' },
  { name: 'Terrarium', type: 'Nature', author: 'Botanist', color: 'bg-[#FDF6E3]' },
  { name: 'Prism OS', type: 'Refractive', author: 'Alex DRV', color: 'bg-[#0F1115]' },
  { name: 'Aero Spatial', type: 'Desk', author: 'Alex Vibe', color: 'bg-[#FAFAFA]' },
];

/**
 * Aurora Crystal Bento Preview Component
 * Epic design implementation based on the provided creative brief.
 */
const AuroraCrystalBentoPreview: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-[#020408] overflow-hidden flex flex-col font-sans selection:bg-cyan-500/30"
    >
      {/* 1) ATMOSPHERE: DRFTING AURORA GRADIENT */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            x: [0, 50, -50, 0],
            y: [0, -30, 30, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[20%] -left-[10%] w-[120%] h-[120%] bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.15),rgba(124,58,237,0.1),rgba(236,72,153,0.05),transparent_70%)] blur-[100px]"
        />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] contrast-150 brightness-150" />
      </div>

      {/* TOP NAV OVERLAY (Minimal) */}
      <div className="relative z-20 flex justify-between items-center px-6 py-6 lg:px-12">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 shadow-[0_0_20px_rgba(6,182,212,0.4)]" />
          <span className="text-white font-bold tracking-tighter text-lg uppercase">Aurora</span>
        </div>
        <button 
          onClick={onClose}
          className="p-2 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all backdrop-blur-md"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* MAIN CONTENT SCROLL AREA */}
      <div className="flex-1 overflow-y-auto no-scrollbar relative z-10 px-6 lg:px-12 pb-32">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 pt-12">
          
          {/* LEFT: THE HERO CRYSTAL CARD */}
          <motion.div 
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: "spring", damping: 20 }}
            className="lg:w-[400px] shrink-0"
          >
            <div className="sticky top-12 p-8 rounded-[40px] bg-white/[0.03] border border-white/20 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_2px_10px_rgba(255,255,255,0.1)] relative overflow-hidden group">
              {/* Card light sweep */}
              <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
              
              <div className="relative z-10">
                <div className="w-24 h-24 rounded-full border-2 border-cyan-400/30 p-1 mb-8">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex" alt="Avatar" className="w-full h-full rounded-full object-cover shadow-2xl" />
                </div>
                <h1 className="text-4xl font-extrabold text-white tracking-tighter mb-2 leading-none">Alex Rivera</h1>
                <p className="text-cyan-400 font-medium tracking-wide text-sm uppercase mb-8">Digital Artisan & Explorer</p>
                
                <p className="text-zinc-400 text-lg leading-relaxed mb-10">
                  Crafting high-fidelity digital diamonds from a sunny studio in the void. Shipping weekly.
                </p>

                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <span className="text-zinc-500 text-xs font-bold tracking-widest uppercase">Verified</span>
                    <ShieldCheck className="w-5 h-5 text-cyan-400" />
                  </div>
                </div>

                {/* DESKTOP ACQUIRE BUTTON PLACEMENT */}
                <div className="hidden lg:block mt-12">
                   <button className="w-full h-16 rounded-full bg-white/5 border border-white/20 backdrop-blur-xl text-white font-black uppercase tracking-widest relative overflow-hidden group shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98]">
                      <span className="relative z-10">Acquire Theme</span>
                      {/* Sheen Animation */}
                      <motion.div 
                        animate={{ x: ['-200%', '200%'] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent skew-x-[-20deg]"
                      />
                   </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* RIGHT: THE BENTO GRID */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[160px]">
            
            {/* LARGE BOX: HIGHLIGHTED PROJECT */}
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="md:col-span-2 row-span-2 rounded-[32px] bg-white/[0.03] border border-white/20 backdrop-blur-xl p-8 flex flex-col justify-between group cursor-pointer shadow-xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8">
                <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
                  <Zap className="w-6 h-6 text-cyan-400" />
                </div>
              </div>
              <div>
                <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[10px] text-cyan-400 font-black tracking-widest uppercase mb-4 inline-block">Featured</span>
                <h3 className="text-3xl font-bold text-white tracking-tight mb-2">Luminal Cognitive V3</h3>
                <p className="text-zinc-400 max-w-sm">The world's first localized design agent powered by proof-of-iteration.</p>
              </div>
              <div className="flex items-center gap-2 text-white font-black text-xs uppercase tracking-widest group-hover:gap-4 transition-all">
                Explore Project <ArrowRight className="w-4 h-4" />
              </div>
              <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-cyan-500/10 blur-[80px] rounded-full" />
            </motion.div>

            {/* SMALL BOX: STATS */}
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="row-span-1 rounded-[32px] bg-white/[0.03] border border-white/20 backdrop-blur-xl p-6 flex flex-col justify-between"
            >
              <Users className="w-5 h-5 text-zinc-500" />
              <div>
                <h4 className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">Active Users</h4>
                <p className="text-2xl font-black text-white font-mono-data tracking-tighter">14,202</p>
              </div>
            </motion.div>

            {/* SMALL BOX: REVENUE */}
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="row-span-1 rounded-[32px] bg-white/[0.03] border border-white/20 backdrop-blur-xl p-6 flex flex-col justify-between"
            >
              <CreditCard className="w-5 h-5 text-cyan-400" />
              <div>
                <h4 className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">Monthly Rev</h4>
                <p className="text-2xl font-black text-[#00FF41] font-mono-data tracking-tighter">$215,000</p>
              </div>
            </motion.div>

            {/* LONG BOX: SOCIALS */}
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="md:col-span-2 row-span-1 rounded-[32px] bg-white/[0.03] border border-white/20 backdrop-blur-xl p-8 flex items-center justify-between"
            >
              <div className="flex items-center gap-6">
                {[Instagram, Twitter, ExternalLink].map((Icon, idx) => (
                  <div key={idx} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all cursor-pointer">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                ))}
              </div>
              <div className="text-right">
                <h4 className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">Connected Networks</h4>
                <p className="text-sm font-bold text-white">3 Verified Profiles</p>
              </div>
            </motion.div>

            {/* MEDIUM BOX: SHOP */}
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="row-span-2 rounded-[32px] bg-[#0c0e12] border border-white/20 backdrop-blur-xl p-8 flex flex-col justify-between relative overflow-hidden group"
            >
              <div className="relative z-10">
                <ShoppingBag className="w-8 h-8 text-cyan-400 mb-6" />
                <h3 className="text-xl font-bold text-white tracking-tight mb-2">Boutique Shelf</h3>
                <p className="text-zinc-500 text-sm">Limited edition digital assets for builders.</p>
              </div>
              <button className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all">Visit Store</button>
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400/5 blur-[40px] group-hover:bg-cyan-400/10 transition-all" />
            </motion.div>

            {/* BOX: MUSIC */}
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="md:col-span-2 row-span-1 rounded-[32px] bg-white/[0.03] border border-white/20 backdrop-blur-xl p-8 flex items-center justify-between group"
            >
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Music className="w-6 h-6 text-white" />
                 </div>
                 <div>
                   <h4 className="text-white font-bold tracking-tight">Vibe Radio</h4>
                   <p className="text-zinc-500 text-xs font-mono-data">Now Spinning: Midnight Theory</p>
                 </div>
               </div>
               <div className="flex gap-1 items-end h-4">
                  {[2, 4, 3, 5, 2].map((h, i) => (
                    <motion.div 
                      key={i} 
                      animate={{ height: ['20%', '100%', '20%'] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1 }}
                      className="w-1 bg-cyan-400 rounded-full" 
                    />
                  ))}
               </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* MOBILE FLOATING ACQUIRE BUTTON */}
      <div className="lg:hidden fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full px-6">
         <button className="w-full h-16 rounded-full bg-white/5 border border-white/20 backdrop-blur-2xl text-white font-black uppercase tracking-widest relative overflow-hidden shadow-2xl active:scale-95 transition-transform flex items-center justify-center gap-3">
            Acquire Theme
            <motion.div 
              animate={{ x: ['-200%', '200%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent skew-x-[-20deg]"
            />
         </button>
      </div>

    </motion.div>
  );
};

const CanvasView: React.FC = () => {
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [previewTheme, setPreviewTheme] = useState<string | null>(null);
  const [claimedUsername, setClaimedUsername] = useState('');
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [, setIsSavingOnboarding] = useState(false);

  return (
    <div className="space-y-32 pb-32">
      
      {/* 1) HERO SECTION */}
      <section className="relative pt-12 text-center md:text-left">
        <div className="max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-8"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
            <span className="text-[10px] font-black tracking-[0.2em] uppercase text-zinc-400">Introducing Canvas</span>
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-8xl font-extrabold tracking-tighter text-white mb-8 leading-[0.9]"
          >
            Claim your <br />
            <span className="text-zinc-600 italic font-serif-rank">Canvas.</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-zinc-500 text-lg md:text-2xl font-medium max-w-2xl mb-12"
          >
            Your unique journey, showcased. 20k+ creators are already remarkable. <span className="text-zinc-400">It's time you stood out from the crowd.</span>
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-4"
          >
            <div className="relative w-full sm:w-80 group">
              <input 
                type="text" 
                placeholder="vibejam.me/yourname"
                value={claimedUsername}
                onChange={(e) => setClaimedUsername(e.target.value)}
                className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-white font-mono-data focus:outline-none focus:ring-1 focus:ring-white/30 transition-all"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 opacity-50 group-hover:opacity-100 transition-opacity">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="text-[8px] font-bold tracking-widest uppercase">Available</span>
              </div>
            </div>
            <button 
              onClick={() => claimedUsername && setIsOnboarding(true)}
              className="h-14 px-8 rounded-2xl bg-white text-black font-black uppercase tracking-tight hover:bg-zinc-200 transition-all flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              Claim My Canvas <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>

        {/* Floating Preview Asset (Mobile Mockup-like) */}
        <div className="hidden xl:block absolute -right-20 top-0 w-[500px] h-[700px] pointer-events-none">
          <div className="relative w-full h-full bg-[#111] rounded-[48px] border-[12px] border-[#222] overflow-hidden shadow-2xl rotate-3">
             <div className="absolute top-0 w-full h-24 bg-gradient-to-b from-black/80 to-transparent z-10" />
             <div className="p-8 pt-16">
                <div className="w-16 h-16 rounded-full bg-zinc-800 mb-4" />
                <div className="w-32 h-4 bg-white/20 rounded-full mb-2" />
                <div className="w-24 h-3 bg-white/10 rounded-full mb-8" />
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/10 h-24" />
                  ))}
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* 2) THEME GALLERY: "CHOOSE YOUR VIBE" */}
      <section className="space-y-16">
        <div className="text-center md:text-left">
          <h3 className="text-3xl md:text-5xl font-extrabold tracking-tighter text-white mb-4">Choose Your Vibe</h3>
          <p className="text-zinc-500 text-lg font-medium">Your page will look great by default. <span className="text-zinc-400">You can always tweak it later.</span></p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {THEMES.map((theme, i) => (
            <motion.div
              key={theme.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              onClick={() => setSelectedTheme(theme.id)}
              className={`group relative flex flex-col h-[500px] rounded-[32px] overflow-hidden cursor-pointer transition-all duration-500 border-2 
                ${selectedTheme === theme.id ? 'border-white ring-4 ring-white/10 scale-105' : 'border-white/10 hover:border-white/30'} bg-zinc-950`}
            >
              {/* Theme Preview Mini Window */}
              <div className={`flex-1 w-full bg-gradient-to-br ${theme.previewColor} relative p-6 flex flex-col justify-center items-center overflow-hidden`}>
                <div className="absolute top-4 left-4 text-2xl opacity-40 group-hover:opacity-100 transition-opacity">{theme.icon}</div>
                <div className="w-full h-32 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 flex flex-col p-4 shadow-xl transition-transform group-hover:scale-110">
                   <div className="w-12 h-1 bg-white/20 rounded-full mb-2" />
                   <div className="w-8 h-1 bg-white/10 rounded-full mb-4" />
                   <div className="flex-1 grid grid-cols-2 gap-2">
                     <div className="bg-white/5 rounded-md" />
                     <div className="bg-white/5 rounded-md" />
                   </div>
                </div>
                
                {/* Ambient Animation Inside */}
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
                  transition={{ duration: 5, repeat: Infinity }}
                  className="absolute inset-0 bg-white/5 blur-[40px] pointer-events-none"
                />
              </div>

              {/* Theme Details */}
              <div className="p-6 bg-black/40 backdrop-blur-md border-t border-white/5">
                <h4 className="text-white font-bold text-lg tracking-tight mb-1">{theme.name}</h4>
                <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest leading-tight">{theme.desc}</p>
                
                <div className="mt-6 flex gap-2">
                   <button 
                     onClick={(e) => { e.stopPropagation(); setPreviewTheme(theme.id); }}
                     className="flex-1 py-2 text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all"
                   >
                     Preview
                   </button>
                   <button 
                     onClick={(e) => { e.stopPropagation(); setSelectedTheme(theme.id); }}
                     className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all
                       ${selectedTheme === theme.id ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}
                   >
                     {selectedTheme === theme.id ? 'Selected' : 'Select'}
                   </button>
                </div>
              </div>

              {/* Glow when selected */}
              <AnimatePresence>
                {selectedTheme === theme.id && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`absolute inset-0 shadow-[0_0_60px_-10px_rgba(255,255,255,0.2)] pointer-events-none`}
                  />
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Global Acquire Action */}
        <AnimatePresence>
          {selectedTheme && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-center"
            >
              <button className="px-12 py-4 rounded-full bg-white text-black font-black uppercase tracking-widest hover:scale-105 transition-all shadow-2xl flex items-center gap-3">
                Acquire Theme <ChevronRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* 3) FEATURE LANDING: "SHARE & ANALYZE" */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { 
            title: 'Share Anywhere', 
            icon: Share2, 
            desc: 'Your link works perfectly in Instagram bios, X profiles, and LinkedIn. It\'s the only business card you need.',
            color: 'text-blue-400'
          },
          { 
            title: 'Analyze Audience', 
            icon: Users, 
            desc: 'Understand exactly who is visiting. Location, device, and source tracking built-in for precision.',
            color: 'text-purple-400'
          },
          { 
            title: 'Real-time Metrics', 
            icon: BarChart3, 
            desc: 'Watch your growth live. Pulse tracking shows engagement heatmaps and conversion velocity.',
            color: 'text-green-400'
          }
        ].map((feat, i) => (
          <div key={feat.title} className="p-10 rounded-[40px] bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all flex flex-col gap-6">
            <div className={`w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center ${feat.color}`}>
              <feat.icon className="w-7 h-7" />
            </div>
            <h4 className="text-2xl font-bold text-white tracking-tight">{feat.title}</h4>
            <p className="text-zinc-500 leading-relaxed">{feat.desc}</p>
          </div>
        ))}
      </section>

      {/* 4) TEMPLATE LOOKBOOK */}
      <section className="space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
             <h3 className="text-3xl md:text-5xl font-extrabold tracking-tighter text-white mb-2">The Collection</h3>
             <p className="text-zinc-500 text-lg font-medium">Curated design frameworks for every digital craftsman.</p>
          </div>
          <button className="text-zinc-400 font-bold hover:text-white transition-colors flex items-center gap-2 text-xs uppercase tracking-widest">
            View All Frameworks <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {TEMPLATES.map((tmpl, i) => (
            <motion.div 
              key={tmpl.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="group cursor-pointer"
            >
              <div className={`aspect-[3/4] rounded-2xl ${tmpl.color} mb-3 relative overflow-hidden transition-transform group-hover:-translate-y-2`}>
                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Eye className="w-6 h-6 text-white" />
                </div>
                {/* Minimal preview mockup */}
                <div className="absolute inset-4 rounded-lg bg-black/5 border border-black/5 flex flex-col p-3">
                   <div className="w-1/2 h-2 bg-black/10 rounded-full mb-2" />
                   <div className="flex-1 rounded bg-black/5" />
                </div>
              </div>
              <p className="text-xs font-bold text-white tracking-tight mb-0.5">{tmpl.name}</p>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{tmpl.type} • {tmpl.author}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Final CTA Strip */}
      <div className="p-12 md:p-20 rounded-[48px] bg-gradient-to-br from-white/[0.05] via-black to-black border border-white/5 flex flex-col items-center text-center">
         <div className="w-20 h-20 rounded-3xl bg-white text-black flex items-center justify-center mb-10 shadow-[0_0_50px_rgba(255,255,255,0.2)]">
            <LayoutTemplate className="w-10 h-10" />
         </div>
         <h2 className="text-4xl md:text-6xl font-extrabold text-white tracking-tighter mb-6 leading-tight">Your digital storefront, <br />vibe-coded in seconds.</h2>
         <p className="text-zinc-500 text-lg md:text-xl max-w-xl mb-12 font-medium italic">Stop building landing pages from scratch. Claim your canvas and let your work do the talking.</p>
         <button className="px-12 py-5 rounded-2xl bg-white text-black font-black uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-3">
           Start My Canvas For Free <Rocket className="w-5 h-5" />
         </button>
      </div>

      {/* FULL-SCREEN THEME PREVIEW OVERLAY */}
      <AnimatePresence>
        {previewTheme === 'aurora' && (
          <AuroraCrystalBentoPreview onClose={() => setPreviewTheme(null)} />
        )}
      </AnimatePresence>

      {/* ONBOARDING FLOW OVERLAY */}
      <AnimatePresence>
        {isOnboarding && (
          <CanvasOnboarding 
            claimedName={claimedUsername} 
            onClose={() => setIsOnboarding(false)}
            onComplete={async (data) => {
              setIsSavingOnboarding(true);
              try {
                await saveCanvasOnboarding(data);
              } catch (error) {
                console.error('Failed to save Canvas onboarding:', error);
              } finally {
                setIsSavingOnboarding(false);
                setIsOnboarding(false);
              }
            }}
          />
        )}
      </AnimatePresence>

    </div>
  );
};

export default CanvasView;
