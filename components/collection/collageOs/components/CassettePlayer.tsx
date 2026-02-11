
import React, { useState } from 'react';
import { motion } from 'framer-motion';

export const CassettePlayer: React.FC<{ title: string }> = ({ title }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <motion.div
      drag
      whileDrag={{ scale: 1.1, rotate: 0, zIndex: 100, boxShadow: "0px 25px 50px rgba(0,0,0,0.3)" }}
      transition={{ type: "tween", duration: 0.1, ease: "linear" }}
      className="cursor-grab active:cursor-grabbing select-none"
      initial={{ rotate: -3 }}
    >
      {/* Cassette Main Body */}
      <div className="w-80 h-52 bg-neutral-800 rounded-lg border-4 border-neutral-900 relative p-4 shadow-2xl overflow-hidden">
        
        {/* Top Label Area */}
        <div className="w-full h-24 bg-red-500 rounded border-b-4 border-neutral-900 relative overflow-hidden flex flex-col items-center justify-center p-2">
          <div className="absolute top-0 left-0 w-full h-1 bg-white/20"></div>
          
          {/* Handwritten Track Label */}
          <div className="w-full bg-white/90 px-4 py-1 rotate-[-1deg] shadow-sm border border-neutral-300">
            <p className={`font-handwritten text-sm text-neutral-800 whitespace-nowrap ${isPlaying ? 'animate-pulse' : ''}`}>
              A: {title}
            </p>
          </div>
          
          {/* Spool Windows */}
          <div className="flex gap-12 mt-4 relative z-10">
            <Spool spinning={isPlaying} />
            <Spool spinning={isPlaying} />
          </div>

          {/* Window Glass Overlay */}
          <div className="absolute bottom-2 w-48 h-10 bg-black/40 rounded-full blur-[1px]"></div>
        </div>

        {/* Cassette Details */}
        <div className="mt-4 flex justify-between items-end">
          <div className="flex flex-col">
            <span className="font-typewriter text-[10px] text-neutral-500">TYPE I // NORMAL POSITION</span>
            <span className="font-typewriter text-[10px] text-neutral-500">NR [ON]</span>
          </div>
          
          {/* Play/Pause Button - Looks like physical button */}
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className={`w-12 h-12 rounded-full border-4 border-black flex items-center justify-center transition-all ${isPlaying ? 'bg-green-500 translate-y-1' : 'bg-red-500 shadow-[0_4px_0_0_rgba(0,0,0,1)] hover:shadow-[0_2px_0_0_rgba(0,0,0,1)] hover:translate-y-[2px]'}`}
          >
            {isPlaying ? (
              <div className="w-3 h-3 bg-white" />
            ) : (
              <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[12px] border-l-white border-b-[8px] border-b-transparent ml-1" />
            )}
          </button>
        </div>

        {/* Screws */}
        <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-neutral-600 border border-black shadow-inner"></div>
        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-neutral-600 border border-black shadow-inner"></div>
        <div className="absolute bottom-2 left-2 w-2 h-2 rounded-full bg-neutral-600 border border-black shadow-inner"></div>
        <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-neutral-600 border border-black shadow-inner"></div>
      </div>

      {/* Fake Washi Tape on the Cassette */}
      <div className="absolute -top-4 right-10 w-20 h-6 bg-blue-300/40 rotate-[10deg] border-x-2 border-white/20 pointer-events-none"></div>
    </motion.div>
  );
};

const Spool: React.FC<{ spinning: boolean }> = ({ spinning }) => (
  <div className={`w-12 h-12 rounded-full bg-neutral-900 border-2 border-neutral-600 flex items-center justify-center ${spinning ? 'animate-spin-slow' : ''}`}>
    <div className="w-10 h-10 rounded-full border-2 border-dashed border-neutral-700 relative">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-4 h-4 rounded-full bg-neutral-500 border border-black"></div>
      </div>
      {/* Teeth */}
      {[0, 60, 120, 180, 240, 300].map(deg => (
        <div 
          key={deg}
          className="absolute w-1 h-3 bg-neutral-600"
          style={{ 
            left: '50%', 
            top: '50%', 
            transform: `translate(-50%, -50%) rotate(${deg}deg) translateY(-8px)` 
          }}
        />
      ))}
    </div>
  </div>
);
