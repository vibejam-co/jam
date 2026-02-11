
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { SLICES } from '../constants';
import KineticSlice from './KineticSlice';

const AccordionDeck: React.FC = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(0);

  return (
    <div className="relative w-full h-screen bg-black flex flex-col md:flex-row overflow-hidden">
      {/* Branding Overlay (Static) */}
      <div className="absolute top-8 md:top-12 left-8 md:left-12 z-20 mix-blend-difference pointer-events-none">
        <h1 className="font-oswald text-2xl md:text-3xl font-bold tracking-[0.3em]">VIBEJAM</h1>
        <p className="font-bodoni italic text-sm md:text-base opacity-70">Kinetic Slicer // SS25</p>
      </div>

      <div className="absolute bottom-8 md:bottom-12 right-8 md:right-12 z-20 mix-blend-difference pointer-events-none text-right hidden md:block">
        <p className="font-oswald text-[10px] tracking-[0.5em] opacity-50 uppercase leading-loose">
          BRUTAL LUXE INTERFACE<br />
          AUTUMN WINTER COLLECTIONS<br />
          © 2024 FASHION HOUSE GLOBAL
        </p>
      </div>

      {/* Slices Container */}
      <motion.div 
        className="flex flex-col md:flex-row w-full h-full"
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
