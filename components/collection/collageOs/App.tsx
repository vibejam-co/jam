
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CassettePlayer } from './components/CassettePlayer';
import { CRTVideo } from './components/CRTVideo';
import { PolaroidStack } from './components/PolaroidStack';
import { RippedCard } from './components/RippedCard';

interface CollageOsAppProps {
  forcedViewport?: 'mobile' | 'desktop';
}

const App: React.FC<CollageOsAppProps> = ({ forcedViewport }) => {
  const isCompact = forcedViewport === 'mobile';
  return (
    <div className={`min-h-screen w-full corkboard relative overflow-hidden flex flex-col items-center ${isCompact ? 'p-3' : 'p-4 md:p-12'}`}>
      {/* Header Sticker */}
      <motion.div 
        drag
        whileDrag={{ scale: 1.05, rotate: 2, zIndex: 50 }}
        initial={{ y: -100, rotate: -5 }}
        animate={{ y: 0 }}
        className={`z-10 cursor-grab active:cursor-grabbing ${isCompact ? 'mb-4' : 'mb-8'}`}
      >
        <RippedCard color="bg-yellow-300" className="px-8 py-4 shadow-xl">
          <h1 className={`font-marker text-black tracking-tighter ${isCompact ? 'text-2xl' : 'text-4xl md:text-6xl'}`}>
            VIBEJAM COLLAGE OS
          </h1>
          <p className="font-typewriter text-xs text-center uppercase tracking-widest mt-1">
            Build: 0.21-GENZ // MSCHF INSPIRED
          </p>
        </RippedCard>
      </motion.div>

      {/* Main Collage Area */}
      <div className={`relative w-full max-w-6xl ${isCompact ? 'min-h-[72vh] flex flex-col gap-4 px-1' : 'h-[80vh] md:h-[70vh]'}`}>
        
        {/* Cassette Player */}
        <div className={isCompact ? 'relative z-20 self-start scale-[0.82] origin-top-left' : 'absolute top-0 left-0 md:left-10 z-20'}>
          <CassettePlayer title="LO-FI BEATS TO ROT YOUR BRAIN TO" />
        </div>

        {/* CRT Video */}
        <div className={isCompact ? 'relative z-10 self-end scale-[0.82] origin-top-right -mt-8' : 'absolute bottom-10 right-0 md:right-10 z-10'}>
          <CRTVideo />
        </div>

        {/* Polaroid Stack */}
        <div className={isCompact ? 'relative z-30 self-center scale-[0.86] -mt-6' : 'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 md:translate-x-0 md:translate-y-0 md:left-20 md:bottom-20 z-30'}>
          <PolaroidStack />
        </div>

        {/* Random Notes & Stickers */}
        <motion.div 
          drag 
          className="absolute top-40 right-40 hidden lg:block z-0"
          initial={{ rotate: 12 }}
        >
          <RippedCard color="bg-pink-400" className="p-4 w-48 shadow-lg">
            <p className="font-handwritten text-lg text-white">
              don't forget to touch grass today! or just keep scrolling... 
            </p>
          </RippedCard>
        </motion.div>

        <motion.div 
          drag 
          className="absolute bottom-40 left-10 hidden lg:block z-5"
          initial={{ rotate: -8 }}
        >
          <div className="bg-blue-400 p-2 rounded-sm rotate-6 shadow-md border-2 border-black">
            <p className="font-marker text-white text-sm">UR VALID FR FR</p>
          </div>
        </motion.div>

        {/* Washi Tape Decorations on the "Screen" */}
        <div className={`pointer-events-none absolute inset-0 ${isCompact ? 'hidden' : ''}`}>
          <WashiTape color="bg-green-400/30" rotation={45} top="10%" left="5%" />
          <WashiTape color="bg-purple-400/30" rotation={-30} bottom="15%" right="10%" />
        </div>
      </div>

      {/* Footer Instruction */}
      <div className={`bg-white/80 p-2 font-typewriter text-[10px] border border-black z-50 ${isCompact ? 'mt-2 self-end' : 'fixed bottom-4 right-4'}`}>
        DRAG ANYTHING TO REARRANGE YOUR VIBE.
      </div>
    </div>
  );
};

const WashiTape: React.FC<{ color: string; rotation: number; top?: string; left?: string; bottom?: string; right?: string }> = ({ color, rotation, top, left, bottom, right }) => (
  <div 
    className={`absolute w-32 h-8 ${color} ${rotation > 0 ? 'rotate-['+rotation+'deg]' : 'rotate-['+rotation+'deg]'} shadow-sm`}
    style={{ top, left, bottom, right, transform: `rotate(${rotation}deg)` }}
  >
    <div className="absolute inset-0 border-x-2 border-dashed border-white/20"></div>
  </div>
);

export default App;
