
import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, Crown, ShieldCheck, Award, Zap, Hexagon } from 'lucide-react';

interface RankingBadgeProps {
  rank: string | number;
  size?: 'sm' | 'md' | 'lg';
}

const RankingBadge: React.FC<RankingBadgeProps> = ({ rank, size = 'md' }) => {
  const numericRank = typeof rank === 'string' ? parseInt(rank, 10) : rank;
  if (isNaN(numericRank)) return null;

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'h-5 px-2 text-[8px] gap-1';
      case 'lg': return 'h-10 px-5 text-[11px] gap-2.5';
      default: return 'h-7 px-3 text-[9px] gap-1.5';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm': return 10;
      case 'lg': return 16;
      default: return 12;
    }
  };

  // Tier Definitions
  if (numericRank <= 3) {
    return (
      <motion.div 
        whileHover={{ scale: 1.05 }}
        className={`relative flex items-center justify-center font-black uppercase tracking-[0.2em] rounded-full border border-[#D4AF37]/40 bg-gradient-to-br from-[#B8860B] via-[#D4AF37] to-[#8B6508] text-black overflow-hidden ${getSizeClasses()}`}
        style={{
          boxShadow: '0 0 15px rgba(212,175,55,0.25), inset 0 1px 1px rgba(255,255,255,0.4)',
        }}
      >
        {/* Subtle Heartbeat Glow */}
        <motion.div 
          animate={{ 
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.05, 1]
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="absolute inset-0 bg-[#FFD700] mix-blend-overlay"
        />

        <Crown size={getIconSize()} strokeWidth={3} className="relative z-10" />
        <span className="relative z-10">TOP 3</span>

        {/* The World-Class "Sweep" Shine */}
        <motion.div 
          initial={{ x: '-250%' }}
          animate={{ x: '250%' }}
          transition={{ 
            duration: 3, 
            repeat: Infinity, 
            ease: [0.4, 0, 0.2, 1], 
            repeatDelay: 2 
          }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent skew-x-[-30deg] z-20"
        />

        {/* Minimalist Glint */}
        <motion.div 
          animate={{ 
            opacity: [0, 1, 0],
            scale: [0.5, 1.2, 0.5],
            rotate: [0, 90]
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity, 
            repeatDelay: 5 
          }}
          className="absolute top-0 right-2 w-1.5 h-1.5 bg-white blur-[0.5px] rounded-full z-30"
        />
      </motion.div>
    );
  }

  if (numericRank <= 10) {
    return (
      <div className={`relative flex items-center justify-center font-black uppercase tracking-[0.2em] rounded-full border border-cyan-400/30 bg-black/40 backdrop-blur-md text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)] ${getSizeClasses()}`}>
        <Star size={getIconSize()} fill="currentColor" />
        TOP 10
      </div>
    );
  }

  if (numericRank <= 50) {
    return (
      <div className={`relative flex items-center justify-center font-black uppercase tracking-[0.2em] rounded-full border border-purple-500/30 bg-black/40 backdrop-blur-md text-purple-400 ${getSizeClasses()}`}>
        <Trophy size={getIconSize()} />
        TOP 50
      </div>
    );
  }

  if (numericRank <= 100) {
    return (
      <div className={`relative flex items-center justify-center font-black uppercase tracking-[0.15em] rounded-full border border-emerald-500/30 bg-black/20 text-emerald-400 ${getSizeClasses()}`}>
        <Zap size={getIconSize()} fill="currentColor" />
        TOP 100
      </div>
    );
  }

  if (numericRank <= 1000) {
    return (
      <div className={`relative flex items-center justify-center font-black uppercase tracking-[0.1em] rounded-full border border-white/10 bg-white/5 text-white/70 ${getSizeClasses()}`}>
        <Award size={getIconSize()} />
        TOP 1K
      </div>
    );
  }

  if (numericRank <= 10000) {
    return (
      <div className={`relative flex items-center justify-center font-bold uppercase tracking-[0.1em] rounded-full border border-zinc-800 bg-zinc-900/50 text-zinc-500 ${getSizeClasses()}`}>
        <Hexagon size={getIconSize()} />
        TOP 10K
      </div>
    );
  }

  return (
    <div className={`relative flex items-center justify-center font-bold uppercase tracking-[0.05em] rounded-full border border-zinc-900 bg-transparent text-zinc-700 ${getSizeClasses()}`}>
      <ShieldCheck size={getIconSize()} />
      TOP 100K
    </div>
  );
};

export default RankingBadge;
