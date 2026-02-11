
import React, { useRef } from 'react';
import { motion, MotionValue, useSpring, useTransform } from 'framer-motion';

interface PrismCardProps {
  children: React.ReactNode;
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
}

export const PrismCard: React.FC<PrismCardProps> = ({ children, mouseX, mouseY }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  // Smooth rotation physics
  const rotateX = useSpring(useTransform(mouseY, (y) => {
    if (!cardRef.current) return 0;
    const rect = cardRef.current.getBoundingClientRect();
    const centerY = rect.top + rect.height / 2;
    return -(y - (rect.top - (window.scrollY || 0) + rect.height / 2)) / 20;
  }), { stiffness: 100, damping: 20 });

  const rotateY = useSpring(useTransform(mouseX, (x) => {
    if (!cardRef.current) return 0;
    const rect = cardRef.current.getBoundingClientRect();
    return (x - (rect.left + rect.width / 2)) / 20;
  }), { stiffness: 100, damping: 20 });

  // Spotlight effect for edges
  const spotlightOpacity = useSpring(0);
  const spotlightX = useTransform(mouseX, (x) => {
    if (!cardRef.current) return 0;
    const rect = cardRef.current.getBoundingClientRect();
    return x - rect.left;
  });
  const spotlightY = useTransform(mouseY, (y) => {
    if (!cardRef.current) return 0;
    const rect = cardRef.current.getBoundingClientRect();
    return y - rect.top;
  });

  return (
    <motion.div
      ref={cardRef}
      onMouseEnter={() => spotlightOpacity.set(1)}
      onMouseLeave={() => {
        spotlightOpacity.set(0);
        rotateX.set(0);
        rotateY.set(0);
      }}
      style={{
        rotateX,
        rotateY,
        perspective: 1000,
        transformStyle: 'preserve-3d',
      }}
      className="group relative w-full h-full min-h-[160px] bg-white/5 backdrop-blur-[12px] border border-white/10 overflow-hidden will-change-transform rounded-none"
    >
      {/* Chromatic Aberration Border Simulation */}
      <div className="absolute inset-0 pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity duration-500">
        <div 
          className="absolute inset-[-1px]" 
          style={{ 
            boxShadow: '-1px -1px 0 rgba(0, 255, 255, 0.5), 1px 1px 0 rgba(255, 0, 255, 0.5), inset 0 0 20px rgba(255,255,255,0.05)'
          }} 
        />
      </div>

      {/* Refraction Spotlight Highlight */}
      <motion.div
        style={{
          opacity: spotlightOpacity,
          left: spotlightX,
          top: spotlightY,
          background: 'radial-gradient(circle at center, rgba(255,255,255,0.2) 0%, transparent 70%)',
        }}
        className="absolute -translate-x-1/2 -translate-y-1/2 w-96 h-96 pointer-events-none z-20"
      />

      {/* Moving Reflection Streak */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <motion.div 
          initial={{ x: '-100%', y: '-100%' }}
          whileHover={{ x: '100%', y: '100%' }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          className="w-full h-[200%] bg-gradient-to-br from-transparent via-white/10 to-transparent rotate-45"
        />
      </div>

      {/* Content Container */}
      <div className="relative z-30 w-full h-full">
        {children}
      </div>

      {/* Depth Layer for Glassiness */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />
    </motion.div>
  );
};
