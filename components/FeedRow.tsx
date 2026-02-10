
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ArrowUpRight, Heart, ExternalLink } from 'lucide-react';
import { VibeApp } from '../types';
import GemstoneIcon from './GemstoneIcon';
import RankingBadge from './RankingBadge';

interface FeedRowProps {
  app: VibeApp;
  index: number;
  onClick: (app: VibeApp) => void;
  onToggleWishlist?: (app: VibeApp) => void;
  isInWishlist?: boolean;
}

const FeedRow: React.FC<FeedRowProps> = ({ app, index, onClick, onToggleWishlist, isInWishlist }) => {
  const [isHovered, setIsHovered] = useState(false);

  const formattedRevenue = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
    notation: 'compact'
  }).format(app.monthlyRevenue);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onClick(app)}
      className="group relative grid grid-cols-[3rem_1fr_auto] md:grid-cols-[4rem_1fr_11rem_10rem] items-center h-24 sm:h-28 border-b border-[#111] transition-all duration-300 hover:bg-[#0A0A0A] hover:-translate-y-[2px] cursor-pointer px-2 sm:px-4"
    >
      {/* Rank */}
      <div className="flex justify-center">
        <span className="font-serif-rank text-2xl sm:text-3xl italic opacity-30 group-hover:opacity-50 transition-opacity">
          {app.rank}
        </span>
      </div>

      {/* Identity */}
      <div className="flex items-center gap-3 sm:gap-6 px-4 sm:px-6 min-w-0">
        <div className="shrink-0 scale-90 sm:scale-100">
          <GemstoneIcon 
            icon={app.icon} 
            accentColor={app.accentColor} 
            isHovered={isHovered} 
          />
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="text-white font-bold text-base sm:text-lg truncate tracking-tight">{app.name}</h3>
            <RankingBadge rank={app.rank} size="sm" />
          </div>
          <p className="text-zinc-500 text-xs sm:text-sm truncate max-w-full font-medium">
            {app.pitch}
          </p>
          <div className="hidden xs:flex gap-1.5 mt-2">
            {app.tags.slice(0, 2).map(tag => (
              <span key={tag} className="px-1.5 py-0.5 rounded-sm border border-white/5 bg-white/5 text-[9px] text-zinc-400 font-bold tracking-widest">
                {tag.toUpperCase()}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Financials */}
      <div className="flex flex-col items-end px-4 sm:px-8">
        <span className="font-mono-data text-[#00FF41] font-bold text-lg sm:text-xl tracking-tighter">
          {formattedRevenue}<span className="text-[10px] opacity-60 ml-0.5">/MO</span>
        </span>
        <div className="flex items-center gap-1 text-purple-400 text-[10px] font-bold tracking-widest whitespace-nowrap">
          <ArrowUpRight className="w-2.5 h-2.5" />
          {app.growth}% GROWTH
        </div>
      </div>

      {/* Verification / Slide-In Actions (Desktop Only) */}
      <div className="hidden md:flex relative justify-end items-center pr-8 overflow-hidden h-full">
        <AnimatePresence mode="wait">
          {!isHovered ? (
            <motion.div 
              key="verified"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex items-center gap-2 text-zinc-600 text-[10px] font-black uppercase tracking-widest"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
              Verified
            </motion.div>
          ) : (
            <motion.div
              key="actions"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              className="flex items-center gap-2.5"
            >
              <button className="px-4 py-1.5 rounded-full bg-white text-black text-[10px] font-black uppercase tracking-tight hover:bg-zinc-200 transition-colors flex items-center gap-1">
                Demo <ExternalLink className="w-3 h-3" />
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleWishlist?.(app);
                }}
                className={`p-2 rounded-full border transition-all ${isInWishlist ? 'border-red-500 bg-red-500/10' : 'border-white/10 hover:bg-white/5'}`}
              >
                <Heart className={`w-4 h-4 transition-colors ${isInWishlist ? 'text-red-500 fill-red-500' : 'text-white'}`} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default FeedRow;
