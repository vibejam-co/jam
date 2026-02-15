
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { SLICES } from '../constants';
import KineticSlice from './KineticSlice';

interface AccordionDeckProps {
  forcedViewport?: 'mobile' | 'desktop';
}

const AccordionDeck: React.FC<AccordionDeckProps> = ({ forcedViewport }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(0);
  const isCompact = forcedViewport === 'mobile';

  return (
    <div className={`relative w-full bg-black flex overflow-hidden ${isCompact ? 'h-full min-h-[100dvh] flex-col' : 'h-screen flex-col md:flex-row'}`}>
      {/* Branding Overlay (Static) */}
      <div className={`absolute z-20 mix-blend-difference pointer-events-none ${isCompact ? 'top-4 left-4' : 'top-8 md:top-12 left-8 md:left-12'}`}>
        <h1 className={`font-oswald font-bold tracking-[0.3em] ${isCompact ? 'text-lg' : 'text-2xl md:text-3xl'}`}>VIBEJAM</h1>
        <p className={`font-bodoni italic opacity-70 ${isCompact ? 'text-xs' : 'text-sm md:text-base'}`}>Kinetic Slicer // SS25</p>
      </div>

      <div className={`absolute bottom-8 md:bottom-12 right-8 md:right-12 z-20 mix-blend-difference pointer-events-none text-right ${isCompact ? 'hidden' : 'hidden md:block'}`}>
        <p className="font-oswald text-[10px] tracking-[0.5em] opacity-50 uppercase leading-loose">
          BRUTAL LUXE INTERFACE<br />
          AUTUMN WINTER COLLECTIONS<br />
          © 2024 FASHION HOUSE GLOBAL
        </p>
      </div>

      {/* Slices Container */}
      <motion.div 
        className={`w-full h-full ${isCompact ? 'flex flex-col pt-20' : 'flex flex-col md:flex-row'}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
      >
        {SLICES.map((slice, index) => (
          <KineticSlice
            key={slice.id}
            data={slice}
            isExpanded={hoveredIndex === index}
            onHover={() => setHoveredIndex(index)}
            onLeave={() => {
                // We want one to stay expanded if possible, 
                // or you can set to null to go back to even distribution
                // For "luxury" feel, keeping the last one or default to 0 is common.
            }}
            compact={isCompact}
          />
        ))}
      </motion.div>
      
      {/* Progress Line */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-white/5 overflow-hidden z-30">
        <motion.div 
          className="h-full bg-white"
          initial={{ width: '0%' }}
          animate={{ width: hoveredIndex !== null ? `${((hoveredIndex + 1) / SLICES.length) * 100}%` : '0%' }}
          transition={{ type: "spring", stiffness: 50, damping: 20 }}
        />
      </div>
    </div>
  );
};

export default AccordionDeck;
