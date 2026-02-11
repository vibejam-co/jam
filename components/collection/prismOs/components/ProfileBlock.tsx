
import React from 'react';
import { motion } from 'framer-motion';

export const ProfileBlock: React.FC = () => {
  return (
    <div className="h-full w-full flex flex-col p-6 group/profile relative overflow-hidden">
      <div className="relative h-64 w-full mb-8 overflow-hidden bg-white/5">
        {/* RGB Split Layers */}
        <motion.div className="absolute inset-0 grayscale transition-all duration-500 group-hover/profile:grayscale-0">
          <img 
            src="https://picsum.photos/id/64/800/1200" 
            alt="Profile" 
            className="w-full h-full object-cover opacity-100 mix-blend-screen"
          />
        </motion.div>
        
        {/* Holographic Overlays hidden by default */}
        <div className="absolute inset-0 opacity-0 group-hover/profile:opacity-100 transition-opacity duration-300 pointer-events-none">
          <img 
            src="https://picsum.photos/id/64/800/1200" 
            className="absolute inset-0 w-full h-full object-cover mix-blend-screen translate-x-[2px] translate-y-[-1px] filter brightness-150 saturate-200 contrast-125 tint-red opacity-50"
          />
          <img 
            src="https://picsum.photos/id/64/800/1200" 
            className="absolute inset-0 w-full h-full object-cover mix-blend-screen translate-x-[-2px] translate-y-[1px] filter brightness-150 saturate-200 contrast-125 tint-cyan opacity-50"
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-end">
        <h2 className="text-3xl font-bold text-white tracking-tighter mb-2 leading-none uppercase">ALEX DRV</h2>
        <p className="text-white/40 text-[10px] tracking-[0.4em] mb-4 uppercase">Visual Engineer</p>
        
        <div className="relative group/bio">
          <p className="text-white/70 text-xs leading-relaxed drop-shadow-xl z-10 relative">
            Specializing in refractive shaders and optical user interfaces. Crafting digital diamonds for the modern web.
          </p>
          <div className="absolute -inset-2 bg-white/5 opacity-0 group-hover/bio:opacity-100 transition-all blur-md -z-1" />
        </div>
      </div>

      {/* Bottom corner detail */}
      <div className="absolute bottom-4 right-4 flex gap-1 opacity-20">
        <div className="w-1 h-4 bg-cyan-400" />
        <div className="w-1 h-4 bg-pink-500" />
      </div>
    </div>
  );
};
