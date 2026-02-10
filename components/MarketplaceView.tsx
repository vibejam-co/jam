
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ArrowUpRight, ShieldCheck, CreditCard, DollarSign, Lock, Sparkles, ChevronRight, Plus } from 'lucide-react';
import { VibeApp } from '../types';
import GemstoneIcon from './GemstoneIcon';

interface MarketplaceViewProps {
  apps: VibeApp[];
  onSelectApp: (app: VibeApp) => void;
  onOpenListApp: () => void;
}

const MarketplaceView: React.FC<MarketplaceViewProps> = ({ apps, onSelectApp, onOpenListApp }) => {
  const marketSource = apps.filter((app) => app.isForSale);
  const fallbackApp: VibeApp = {
    id: 'fallback',
    rank: '01',
    name: 'VibeJam Launch Asset',
    pitch: 'Your first listed artifact will appear here.',
    icon: '💎',
    accentColor: '212, 175, 55',
    monthlyRevenue: 0,
    lifetimeRevenue: 0,
    activeUsers: 0,
    buildStreak: 0,
    growth: 0,
    tags: ['SaaS'],
    verified: true,
    category: 'SaaS',
    founder: {
      name: 'VibeJam',
      handle: '@vibejam',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=VibeJam'
    },
    techStack: [],
    problem: '',
    solution: '',
    pricing: '',
    revenueHistory: [],
    isForSale: true,
    askingPrice: '$250k',
  };
  const baseSource = (marketSource.length > 0 ? marketSource : apps).length > 0
    ? (marketSource.length > 0 ? marketSource : apps)
    : [fallbackApp];

  // Keep the premium gate experience: 12 visible + locked tail.
  const allMarketApps = Array.from({ length: Math.max(20, baseSource.length) }).map((_, i) => {
    const baseApp = baseSource[i % baseSource.length];
    const inferredPrice = `$${Math.max(50, Math.round(baseApp.monthlyRevenue * 0.024))}k`;
    return {
      ...baseApp,
      id: `market-${i}`,
      askingPrice: baseApp.askingPrice || inferredPrice,
      multiple: `${(Math.random() * 5 + 4).toFixed(1)}x`,
      isLocked: i >= 12
    };
  });

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <div className="space-y-12">
      {/* Strategic Header: Dual Entry Point */}
      <header className="mb-16 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="space-y-2">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 mb-1"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] shadow-[0_0_8px_#D4AF37]" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#D4AF37]">Premium Liquidity</span>
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tighter text-white leading-[1.1]"
          >
            App <span className="text-zinc-600">Acquisitions</span>
          </motion.h2>
          <p className="text-zinc-500 text-lg font-medium max-w-xl">
            Vetted assets for the next generation of digital owners.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:self-end pb-1">
          {/* Live Data Chip */}
          <div className="hidden xs:flex items-center gap-4 bg-white/[0.03] border border-white/5 p-1 rounded-full backdrop-blur-md">
             <div className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-400">Live Deal Flow</div>
             <div className="h-4 w-[1px] bg-white/10" />
             <div className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white font-mono-data">1,248 ASSETS</div>
          </div>

          {/* Minimalist Seller Entry Point */}
          <button 
            onClick={onOpenListApp}
            className="group relative h-14 px-8 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/5 text-[#D4AF37] font-black uppercase tracking-widest text-[11px] flex items-center gap-3 hover:bg-[#D4AF37] hover:text-black transition-all duration-500 hover:shadow-[0_0_30px_rgba(212,175,55,0.2)] active:scale-95 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
            <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
            List Your Asset
          </button>
        </div>
      </header>

      <div className="relative">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {allMarketApps.map((app, i) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (i % 12) * 0.05 }}
              onClick={() => !app.isLocked && onSelectApp(app as any)}
              className={`group relative p-6 rounded-[24px] bg-white/[0.02] border transition-all duration-500 flex flex-col h-full
                ${app.isLocked 
                  ? 'border-white/5 opacity-40 grayscale blur-[4px] pointer-events-none' 
                  : 'border-white/5 hover:border-yellow-500/30 cursor-pointer'}`}
            >
              {/* Top Row: Icon & Asking Price */}
              <div className="flex justify-between items-start mb-6">
                <GemstoneIcon icon={app.icon} accentColor={app.accentColor} isHovered={!app.isLocked} />
                <div className="text-right">
                  <span className="block text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Asking Price</span>
                  <span className="block text-2xl font-mono-data text-[#D4AF37] font-bold tracking-tighter">{app.askingPrice}</span>
                </div>
              </div>

              {/* Title & Pitch */}
              <div className="mb-6 flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xl font-bold text-white tracking-tight">{app.name}</h3>
                  <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                </div>
                <p className="text-zinc-500 text-sm leading-relaxed line-clamp-2">
                  {app.pitch}
                </p>
              </div>

              {/* Metrics Row */}
              <div className="grid grid-cols-2 gap-4 py-4 border-y border-white/5 mb-6">
                <div>
                  <span className="block text-[9px] text-zinc-600 font-black uppercase tracking-widest mb-1">Monthly Rev</span>
                  <span className="block text-sm font-mono-data text-[#00FF41] font-bold">
                    ${app.monthlyRevenue.toLocaleString()}
                  </span>
                </div>
                <div className="text-right">
                  <span className="block text-[9px] text-zinc-600 font-black uppercase tracking-widest mb-1">Valuation Multiple</span>
                  <span className="block text-sm font-mono-data text-white font-bold">{app.multiple}</span>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between mt-auto">
                <div className="flex gap-2">
                  {app.tags.slice(0, 2).map(tag => (
                    <span key={tag} className="px-2 py-0.5 rounded-full border border-white/10 bg-white/5 text-[9px] text-zinc-400 font-bold tracking-widest uppercase">
                      {tag}
                    </span>
                  ))}
                </div>
                <button className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#D4AF37] group-hover:text-white transition-colors">
                  View Deal <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
              </div>

              {!app.isLocked && (
                <div 
                  className="absolute inset-0 rounded-[24px] opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none"
                  style={{ backgroundColor: `rgb(${app.accentColor})` }}
                />
              )}
            </motion.div>
          ))}
        </div>

        {/* The Luxury Gating Overlay */}
        {!isLoggedIn && (
          <div className="absolute inset-x-0 bottom-0 h-[600px] flex items-end justify-center pb-32">
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none" />
            
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative z-10 w-full max-w-2xl mx-auto px-6 text-center"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/20 mb-8 backdrop-blur-xl">
                 <Lock className="w-3.5 h-3.5 text-[#D4AF37]" />
                 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4AF37]">Proprietary Deal Flow</span>
              </div>
              
              <h3 className="text-3xl md:text-5xl font-extrabold text-white tracking-tighter mb-6 leading-tight">
                Unlock the <span className="italic font-serif-rank text-[#D4AF37]">Full Vault.</span>
              </h3>
              
              <p className="text-zinc-500 text-lg md:text-xl font-medium mb-12 max-w-lg mx-auto leading-relaxed">
                Gain unfiltered access to <span className="text-zinc-300">1,200+ high-velocity digital assets</span> and private deal rooms. Join the inner circle of accredited vibe-coded investors.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button 
                  onClick={() => setIsLoggedIn(true)}
                  className="h-16 px-10 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-xs flex items-center gap-3 hover:scale-105 transition-all shadow-[0_0_60px_rgba(255,255,255,0.2)] active:scale-95"
                >
                  Join the Inner Circle <ChevronRight className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2 px-6 py-4 rounded-2xl border border-white/10 text-zinc-400 text-[10px] font-black uppercase tracking-widest">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Member Access Only
                </div>
              </div>
              
              <p className="mt-8 text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
                Trusted by 4,500+ institutional and boutique buyers worldwide.
              </p>
            </motion.div>
          </div>
        )}
      </div>
      
      {/* Featured Banner - Bottom Retention */}
      <section className="mt-24 p-12 rounded-[40px] bg-gradient-to-br from-[#0A0A0A] to-[#000000] border border-white/5 flex flex-col md:flex-row items-center justify-between gap-12 overflow-hidden relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
        
        <div className="relative z-10">
          <h3 className="text-3xl font-extrabold text-white mb-4 tracking-tighter">Ready to <span className="text-[#D4AF37]">Exit?</span></h3>
          <p className="text-zinc-500 max-w-md font-medium text-lg leading-relaxed">
            List your vibe-coded application on the Midnight Zenith marketplace and connect with thousands of accredited investors globally.
          </p>
        </div>
        
        <button 
          onClick={onOpenListApp}
          className="relative z-10 h-16 px-12 rounded-full bg-white text-black font-black uppercase tracking-widest text-xs hover:bg-[#D4AF37] hover:scale-105 transition-all shadow-[0_20px_40px_rgba(0,0,0,0.4)] active:scale-95 flex items-center gap-3"
        >
          Begin Listing Process <ArrowUpRight className="w-4 h-4" />
        </button>
        
        {/* Subtle Decorative Icon */}
        <ShoppingBag className="absolute -right-8 -bottom-8 w-64 h-64 text-white/[0.02] rotate-12 pointer-events-none" />
      </section>
    </div>
  );
};

export default MarketplaceView;
