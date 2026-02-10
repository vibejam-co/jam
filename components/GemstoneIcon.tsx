
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface GemstoneIconProps {
  icon: string;
  accentColor: string; // RGB string "124, 58, 237"
  isHovered?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const GemstoneIcon: React.FC<GemstoneIconProps> = ({ icon, accentColor, isHovered, size = 'md' }) => {
  const containerClasses = {
    sm: 'w-10 h-10 rounded-[14px]',
    md: 'w-12 h-12 sm:w-14 sm:h-14 rounded-[18px]',
    lg: 'w-16 h-16 sm:w-20 sm:h-20 rounded-[24px]'
  };

  const textClasses = {
    sm: 'text-lg',
    md: 'text-xl sm:text-2xl',
    lg: 'text-3xl sm:text-4xl'
  };

  return (
    <div className="relative group shrink-0">
      {/* Dynamic Glow Layer */}
      <div 
        className={`absolute inset-0 blur-xl opacity-0 transition-opacity duration-700 ${containerClasses[size]}`}
        style={{ 
          backgroundColor: `rgba(${accentColor}, 0.5)`,
          opacity: isHovered ? 0.4 : 0 
        }}
      />
      
      {/* The Core Icon Container */}
      <div 
        className={`relative flex items-center justify-center ring-1 ring-white/10 bg-[#0a0a0a] overflow-hidden icon-inset-shadow transition-all duration-500 ${containerClasses[size]}`}
        style={{
          boxShadow: isHovered 
            ? `0 0 30px -5px rgba(${accentColor}, 0.4), inset 0 2px 4px 0 rgba(255, 255, 255, 0.15)` 
            : `0 0 10px -5px rgba(${accentColor}, 0.1), inset 0 1px 2px 0 rgba(255, 255, 255, 0.05)`
        }}
      >
        <span className={`${textClasses[size]} z-10 transition-transform duration-500`} style={{ transform: isHovered ? 'scale(1.1)' : 'scale(1)' }}>
          {icon}
        </span>

        {/* Shine Animation Overlay */}
        <AnimatePresence>
          {isHovered && (
            <motion.div 
              initial={{ x: '-150%' }}
              animate={{ x: '150%' }}
              transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 1, ease: "linear" }}
              className="absolute inset-0 z-20 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-25deg]"
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default GemstoneIcon;
