
import React, { useState } from 'react';
import { motion } from 'framer-motion';

export const CRTVideo: React.FC = () => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      drag
      whileDrag={{ scale: 1.05, rotate: 0, zIndex: 100 }}
      transition={{ type: "tween", duration: 0.1 }}
      className="cursor-grab active:cursor-grabbing w-72 md:w-96"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ rotate: 2 }}
    >
      <div className="bg-zinc-800 p-6 rounded-[40px] border-b-8 border-zinc-900 relative shadow-2xl">
        {/* Screen Bezel */}
        <div className="bg-zinc-900 p-4 rounded-[30px] border-4 border-zinc-950 overflow-hidden relative aspect-video flex items-center justify-center">
          
          {/* The Content (Simulated Video) */}
          <div className={`absolute inset-0 bg-black overflow-hidden ${isHovered ? 'opacity-100' : 'opacity-80'}`}>
            <img 
              src="https://picsum.photos/seed/vibe/800/450" 
              className={`w-full h-full object-cover grayscale brightness-125 contrast-150 ${isHovered ? 'animate-pulse' : ''}`}
              alt="Video"
            />
            {/* Chromatic Aberration Effect (Only on hover) */}
            {isHovered && (
              <>
                <div className="absolute inset-0 mix-blend-screen opacity-50 bg-red-500 translate-x-[2px] pointer-events-none"></div>
                <div className="absolute inset-0 mix-blend-screen opacity-50 bg-blue-500 -translate-x-[2px] pointer-events-none"></div>
              </>
            )}
          </div>

          {/* Static Noise Overlay */}
          {!isHovered && (
            <div className="absolute inset-0 z-10 opacity-40 mix-blend-screen">
              <img 
                src="https://media.giphy.com/media/oEI9uWUicG7vHnB3fD/giphy.gif" 
                className="w-full h-full object-cover" 
                alt="Static"
              />
            </div>
          )}

          {/* Scanlines Overlay */}
          <div className="absolute inset-0 z-20 scanlines opacity-30"></div>
          
          {/* Screen Glare */}
          <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none z-30"></div>
        </div>

        {/* TV Controls */}
        <div className="mt-4 flex items-center justify-between px-4">
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-zinc-700 border-2 border-zinc-900 shadow-inner"></div>
            <div className="w-8 h-8 rounded-full bg-zinc-700 border-2 border-zinc-900 shadow-inner"></div>
          </div>
          <div className="flex flex-col items-end">
             <div className="w-12 h-4 bg-red-900 rounded-sm mb-1 flex items-center justify-center">
               <span className="text-[8px] text-red-500 font-bold">POWER</span>
             </div>
             <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.8)]"></div>
          </div>
        </div>

        {/* Branding */}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 font-marker text-zinc-600 text-[10px] tracking-widest">
          GEN-Z TRON 3000
        </div>
      </div>
      
      {/* Tape on top */}
      <div className="absolute -top-3 left-10 w-16 h-8 bg-pink-300/40 rotate-[-15deg] border-x-2 border-white/20 pointer-events-none"></div>
    </motion.div>
  );
};
