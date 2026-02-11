
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { PrismCard } from './components/PrismCard';
import { Background } from './components/Background';
import { ProfileBlock } from './components/ProfileBlock';
import { LiveBlock } from './components/LiveBlock';
import { ShopBlock } from './components/ShopBlock';
import { MusicBlock } from './components/MusicBlock';
import { SocialBlock } from './components/SocialBlock';

const App: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const { left, top } = containerRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - left);
    mouseY.set(e.clientY - top);
  }, [mouseX, mouseY]);

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative min-h-screen w-full bg-black flex items-center justify-center p-4 md:p-12 overflow-hidden selection:bg-pink-500/30"
    >
      <Background />
      
      <div className="relative z-10 w-full max-w-6xl">
        <header className="mb-12 text-center md:text-left">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold tracking-tighter text-white uppercase"
          >
            Prism <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-pink-500">OS</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 0.2 }}
            className="text-white/60 text-sm md:text-lg mt-2 uppercase tracking-[0.3em]"
          >
            Optical Fidelity • VibeJam 2024
          </motion.p>
        </header>

        <main className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-3 gap-4 h-full">
          {/* Main Profile - Tall 2x3 */}
          <div className="md:col-span-1 md:row-span-3">
            <PrismCard mouseX={mouseX} mouseY={mouseY}>
              <ProfileBlock />
            </PrismCard>
          </div>

          {/* Live Status - Wide 2x1 */}
          <div className="md:col-span-2 md:row-span-1">
            <PrismCard mouseX={mouseX} mouseY={mouseY}>
              <LiveBlock />
            </PrismCard>
          </div>

          {/* Music - Square 1x1 */}
          <div className="md:col-span-1 md:row-span-1">
            <PrismCard mouseX={mouseX} mouseY={mouseY}>
              <MusicBlock />
            </PrismCard>
          </div>

          {/* Shop - Square 1x2 */}
          <div className="md:col-span-1 md:row-span-2">
            <PrismCard mouseX={mouseX} mouseY={mouseY}>
              <ShopBlock />
            </PrismCard>
          </div>

          {/* Socials - Long 2x1 */}
          <div className="md:col-span-2 md:row-span-1">
            <PrismCard mouseX={mouseX} mouseY={mouseY}>
              <SocialBlock />
            </PrismCard>
          </div>

          {/* Bottom Utility - 2x1 (shared col) */}
          <div className="md:col-span-2 md:row-span-1">
            <PrismCard mouseX={mouseX} mouseY={mouseY}>
              <div className="h-full w-full flex flex-col justify-end p-6 gap-2">
                <div className="text-white/40 text-[10px] tracking-widest uppercase">System Log</div>
                <div className="text-cyan-400 font-mono text-xs">REFRACTION_ENGINE_OK</div>
                <div className="text-pink-500 font-mono text-xs">CAUSTICS_ENABLED: TRUE</div>
              </div>
            </PrismCard>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
