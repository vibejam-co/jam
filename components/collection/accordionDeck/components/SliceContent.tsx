
import React from 'react';
import { motion } from 'framer-motion';
import { SliceType } from '../types';

interface SliceContentProps {
  type: SliceType;
  subtitle: string;
}

export const SliceContent: React.FC<SliceContentProps> = ({ type, subtitle }) => {
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
          className="absolute inset-0 flex flex-col justify-end p-8 md:p-12 bg-gradient-to-t from-black/80 to-transparent pointer-events-none"
        >
          <h2 className="font-bodoni text-4xl md:text-6xl mb-4 italic">{subtitle}</h2>
          <p className="font-oswald text-sm md:text-base tracking-widest max-w-md opacity-80 mb-8 leading-relaxed uppercase">
            Synthesizing brutalist architecture with fluid motion. A designer exploring the intersection of digital sculpture and high-fashion curation.
          </p>
          <button className="pointer-events-auto border border-white px-8 py-3 font-oswald text-xs tracking-widest hover:bg-white hover:text-black transition-colors duration-300 w-fit">
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
          className="absolute inset-0 flex items-center justify-center p-8 bg-black/40"
        >
          <div className="text-center">
            <h2 className="font-oswald text-6xl md:text-9xl mb-6 tracking-tighter">DROP ONE</h2>
            <button className="pointer-events-auto bg-white text-black px-12 py-4 font-oswald text-sm tracking-[0.3em] font-bold hover:bg-black hover:text-white transition-colors duration-300">
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
          className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-black/60 backdrop-blur-sm"
        >
          <div className="w-full max-w-md">
            <div className="flex items-end gap-1 mb-12 h-24 justify-center">
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ height: [20, 80, 40, 60, 20] }}
                  transition={{ repeat: Infinity, duration: 1 + Math.random(), ease: "easeInOut" }}
                  className="w-1 md:w-2 bg-white/40"
                />
              ))}
            </div>
            <div className="text-center">
              <span className="block font-oswald text-xs tracking-[0.5em] mb-4 opacity-50">PLAYING NOW</span>
              <h2 className="font-bodoni text-3xl md:text-4xl italic mb-8 underline underline-offset-8">ETHEREAL MONOLITH</h2>
              <div className="flex gap-8 justify-center items-center pointer-events-auto">
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
