
import React from 'react';
import { motion } from 'framer-motion';
import { SliceType } from '../types';

interface SliceContentProps {
  type: SliceType;
  subtitle: string;
  compact?: boolean;
}

export const SliceContent: React.FC<SliceContentProps> = ({ type, subtitle, compact = false }) => {
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { delay: 0.3, duration: 0.6 } 
    }
  };

  switch (type) {
    case 'profile':
      return (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className={`absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 to-transparent pointer-events-none ${
            compact ? 'p-4' : 'p-8 md:p-12'
          }`}
        >
          <h2 className={`font-bodoni italic ${compact ? 'text-2xl mb-2' : 'text-4xl md:text-6xl mb-4'}`}>{subtitle}</h2>
          <p className={`font-oswald tracking-widest max-w-md opacity-80 leading-relaxed uppercase ${
            compact ? 'text-[11px] mb-3 line-clamp-2' : 'text-sm md:text-base mb-8'
          }`}>
            Synthesizing brutalist architecture with fluid motion. A designer exploring the intersection of digital sculpture and high-fashion curation.
          </p>
          <button className={`pointer-events-auto border border-white font-oswald text-xs tracking-widest hover:bg-white hover:text-black transition-colors duration-300 w-fit ${
            compact ? 'px-4 py-2' : 'px-8 py-3'
          }`}>
            SUBSCRIBE TO JOURNAL
          </button>
        </motion.div>
      );
    
    case 'shop':
      return (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className={`absolute inset-0 flex items-center justify-center bg-black/40 ${compact ? 'p-4' : 'p-8'}`}
        >
          <div className="text-center">
            <h2 className={`font-oswald tracking-tighter ${compact ? 'text-4xl mb-4' : 'text-6xl md:text-9xl mb-6'}`}>DROP ONE</h2>
            <button className={`pointer-events-auto bg-white text-black font-oswald font-bold hover:bg-black hover:text-white transition-colors duration-300 ${
              compact ? 'px-6 py-2 text-[10px] tracking-[0.22em]' : 'px-12 py-4 text-sm tracking-[0.3em]'
            }`}>
              EXPLORE ARCHIVE
            </button>
          </div>
        </motion.div>
      );

    case 'audio':
      return (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className={`absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm ${
            compact ? 'p-4' : 'p-8'
          }`}
        >
          <div className="w-full max-w-md">
            <div className={`flex items-end gap-1 justify-center ${compact ? 'mb-6 h-16' : 'mb-12 h-24'}`}>
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ height: [20, 80, 40, 60, 20] }}
                  transition={{ repeat: Infinity, duration: 1 + Math.random(), ease: "easeInOut" }}
                  className={`${compact ? 'w-1' : 'w-1 md:w-2'} bg-white/40`}
                />
              ))}
            </div>
            <div className="text-center">
              <span className="block font-oswald text-xs tracking-[0.5em] mb-4 opacity-50">PLAYING NOW</span>
              <h2 className={`font-bodoni italic underline underline-offset-8 ${compact ? 'text-xl mb-5' : 'text-3xl md:text-4xl mb-8'}`}>ETHEREAL MONOLITH</h2>
              <div className={`flex justify-center items-center pointer-events-auto ${compact ? 'gap-4' : 'gap-8'}`}>
                <button className="opacity-60 hover:opacity-100 transition-opacity">
                  <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18V6h2v12H6zm3.5-6L18 18V6l-8.5 6z"/></svg>
                </button>
                <button className="bg-white text-black p-4 rounded-full hover:scale-110 transition-transform">
                  <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                </button>
                <button className="opacity-60 hover:opacity-100 transition-opacity">
                  <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M16 18H18V6H16V18ZM14.5 12L6 6V18L14.5 12Z"/></svg>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      );

    default:
      return null;
  }
};
