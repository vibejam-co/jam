
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SliceData } from '../types';
import { SPRING_TRANSITION } from '../constants';
import { SliceContent } from './SliceContent';

interface KineticSliceProps {
  data: SliceData;
  isExpanded: boolean;
  onHover: () => void;
  onLeave: () => void;
  compact?: boolean;
}

const KineticSlice: React.FC<KineticSliceProps> = ({ data, isExpanded, onHover, onLeave, compact = false }) => {
  return (
    <motion.div
      layout
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onHover} // Better for touch devices
      className={`relative h-full overflow-hidden border-white/20 transition-colors duration-500 cursor-pointer group
        ${isExpanded ? 'flex-[5] z-10' : 'flex-1'}
        ${compact ? 'border-b last:border-0 min-h-[120px]' : 'border-b md:border-b-0 md:border-r last:border-0'}
      `}
      transition={SPRING_TRANSITION}
    >
      {/* Background Image / Material */}
      <motion.div 
        layout
        className="absolute inset-0 w-full h-full grayscale-[0.5] group-hover:grayscale-0 transition-all duration-700"
      >
        <img 
          src={data.imageUrl} 
          alt={data.title} 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
        <div className="noise-overlay absolute inset-0" />
      </motion.div>

      {/* Vertical Text Label (Idle State) */}
      <div className={`absolute inset-0 flex items-center justify-center transition-all duration-700 pointer-events-none
        ${isExpanded ? 'opacity-0 scale-110 blur-xl' : 'opacity-100 scale-100'}
      `}>
        <div className={`flex items-center justify-center ${compact ? 'flex-row gap-3' : 'flex-col md:flex-row'}`}>
            <span className={`font-oswald text-xs tracking-[1em] opacity-50 ${compact ? '' : 'mb-4 md:mb-0 md:mr-8 [writing-mode:vertical-rl] rotate-180'}`}>
                {data.id}
            </span>
            <h3 className={`font-oswald font-bold tracking-tighter text-white whitespace-nowrap uppercase ${compact ? 'text-2xl [writing-mode:horizontal-tb]' : 'text-4xl md:text-7xl [writing-mode:horizontal-tb] md:[writing-mode:vertical-rl] md:rotate-180'}`}>
                {data.title}
            </h3>
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <SliceContent type={data.type} subtitle={data.subtitle} />
        )}
      </AnimatePresence>

      {/* Decorative ID Corner */}
      <div className={`absolute top-6 left-6 font-oswald text-[10px] tracking-[0.4em] opacity-40 transition-opacity duration-500
        ${isExpanded ? 'opacity-0' : 'opacity-40'}
      `}>
        SYSTEM_ENTRY // {data.id}
      </div>
    </motion.div>
  );
};

export default KineticSlice;
