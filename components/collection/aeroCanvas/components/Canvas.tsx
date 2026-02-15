
import React, { useRef, useEffect, useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { INITIAL_WIDGETS, CANVAS_SIZE } from '../constants';
import { PolaroidWidget } from './PolaroidWidget';
import { TikTokFrame } from './TikTokFrame';
import { NewsletterEnvelope } from './NewsletterEnvelope';
import { Sticker } from './Sticker';

interface CanvasProps {
  forcedViewport?: 'mobile' | 'desktop';
}

export const Canvas: React.FC<CanvasProps> = ({ forcedViewport }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobileByWidth, setIsMobileByWidth] = useState(window.innerWidth < 768);
  const isMobile = forcedViewport ? forcedViewport === 'mobile' : isMobileByWidth;
  
  // Motion values for the canvas position and scale
  const x = useMotionValue(-CANVAS_SIZE / 2 + window.innerWidth / 2);
  const y = useMotionValue(-CANVAS_SIZE / 2 + window.innerHeight / 2);
  const scale = useMotionValue(window.innerWidth < 768 ? 0.75 : 1);

  // Parallax background transformations
  const bgX = useTransform(x, (val) => val * 0.2);
  const bgY = useTransform(y, (val) => val * 0.2);

  // Floating orbs parallax - subtle for mobile performance
  const orb1X = useTransform(x, (val) => val * 0.05);
  const orb1Y = useTransform(y, (val) => val * 0.08);

  useEffect(() => {
    const handleResize = () => setIsMobileByWidth(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleRecenter = () => {
    animate(x, -CANVAS_SIZE / 2 + window.innerWidth / 2, { type: 'spring', bounce: 0 });
    animate(y, -CANVAS_SIZE / 2 + window.innerHeight / 2, { type: 'spring', bounce: 0 });
    animate(scale, isMobile ? 0.75 : 1, { type: 'spring', bounce: 0 });
  };

  const zoomIn = () => animate(scale, Math.min(scale.get() + 0.2, 1.5));
  const zoomOut = () => animate(scale, Math.max(scale.get() - 0.2, 0.4));

  return (
    <div className="relative w-full h-full overflow-hidden cursor-grab active:cursor-grabbing bg-[#F8F9FA] touch-none">
      
      {/* Background Parallax Layer 1: Dot Grid */}
      <motion.div 
        style={{ x: bgX, y: bgY }}
        className="absolute w-[10000px] h-[10000px] top-[-3000px] left-[-3000px] dot-grid opacity-30 pointer-events-none"
      />

      {/* Background Parallax Layer 2: Decorative Orbs */}
      <motion.div 
        style={{ x: orb1X, y: orb1Y }}
        className={`absolute top-[20%] left-[30%] bg-blue-100 rounded-full opacity-40 pointer-events-none ${isMobile ? 'w-[260px] h-[260px] blur-[70px]' : 'w-[300px] md:w-96 h-[300px] md:h-96 blur-[80px] md:blur-[100px]'}`}
      />

      {/* Main Draggable Canvas Container */}
      <motion.div
        drag
        dragConstraints={{
          left: -CANVAS_SIZE + window.innerWidth,
          right: 0,
          top: -CANVAS_SIZE + window.innerHeight,
          bottom: 0,
        }}
        dragTransition={{ bounceStiffness: 150, bounceDamping: 25 }}
        dragElastic={0.05}
        style={{ x, y, scale }}
        className="absolute w-[4000px] h-[4000px] origin-center"
      >
        {/* Render Widgets from data */}
        {INITIAL_WIDGETS.map((widget) => {
          const commonProps = {
            key: widget.id,
            rotation: widget.rotation,
          };

          return (
            <div 
              key={widget.id} 
              className="absolute pointer-events-auto" 
              style={{ left: widget.x, top: widget.y }}
            >
              {widget.type === 'polaroid' && (
                <PolaroidWidget 
                  {...commonProps} 
                  image={widget.content.image} 
                  title={widget.content.title} 
                  subtitle={widget.content.subtitle} 
                />
              )}
              {widget.type === 'tiktok' && (
                <TikTokFrame 
                  {...commonProps} 
                  videoUrl={widget.content.videoUrl} 
                />
              )}
              {widget.type === 'newsletter' && (
                <NewsletterEnvelope 
                  {...commonProps} 
                  title={widget.content.title} 
                  description={widget.content.description} 
                />
              )}
              {widget.type === 'sticker' && (
                <Sticker 
                    {...commonProps} 
                    label={widget.content.label} 
                    type={widget.content.type}
                />
              )}
              {widget.type === 'note' && (
                <Sticker 
                    {...commonProps} 
                    type="note" 
                    content={widget.content.text} 
                />
              )}
              {widget.type === 'spotify' && (
                <Sticker 
                    {...commonProps} 
                    type="spotify" 
                    content={widget.content.track} 
                />
              )}
            </div>
          );
        })}
      </motion.div>

      {/* Responsive HUD Navigation (Mobile Left) */}
      <div className={`fixed left-4 flex flex-col gap-2 z-50 ${isMobile ? 'bottom-24' : 'bottom-24 md:bottom-auto md:top-1/2 md:-translate-y-1/2'}`}>
        <button 
          onClick={zoomIn}
          className="w-10 h-10 bg-white shadow-lg border border-gray-100 rounded-full flex items-center justify-center font-bold text-lg hover:bg-gray-50 active:scale-90 transition-all"
        >
          +
        </button>
        <button 
          onClick={handleRecenter}
          className="w-10 h-10 bg-white shadow-lg border border-gray-100 rounded-full flex items-center justify-center hover:bg-gray-50 active:scale-90 transition-all"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        </button>
        <button 
          onClick={zoomOut}
          className="w-10 h-10 bg-white shadow-lg border border-gray-100 rounded-full flex items-center justify-center font-bold text-lg hover:bg-gray-50 active:scale-90 transition-all"
        >
          -
        </button>
      </div>

      {/* Persistent UI Overlay - Bottom Dock */}
      <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center justify-between gap-4 bg-white/90 backdrop-blur-xl rounded-full shadow-2xl border border-white/40 z-50 ${isMobile ? 'w-[92%] px-4 py-2.5' : 'w-[90%] md:w-auto px-4 md:px-6 py-2.5 md:py-3 md:justify-start'}`}>
         <div className={`flex items-center gap-2 border-gray-200 ${isMobile ? '' : 'md:gap-3 md:border-r md:pr-4'}`}>
            <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-[10px] md:text-xs italic shrink-0">AV</div>
            <div className={`flex overflow-hidden ${isMobile ? 'flex-col' : 'flex-col md:flex-row md:items-center md:gap-2'}`}>
                <span className={`font-bold text-gray-800 whitespace-nowrap ${isMobile ? 'text-[11px]' : 'text-[11px] md:text-sm'}`}>Alex's Desk</span>
                <span className={`text-green-500 font-bold flex items-center gap-1 ${isMobile ? 'text-[9px]' : 'text-[9px] md:text-xs'}`}>
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    Live
                </span>
            </div>
         </div>
         <span className={`text-xs text-gray-400 font-medium tracking-tight ${isMobile ? 'hidden' : 'hidden lg:block'}`}>
            Use mouse or touch to pan the spatial world
         </span>
         
         {/* Join Button for Mobile within the dock if space is tight, otherwise separate */}
         <button className={`${isMobile ? 'block' : 'md:hidden'} bg-black text-white font-black text-[10px] px-4 py-1.5 rounded-full uppercase tracking-widest active:scale-95 transition-transform`}>
            Join
         </button>
      </div>

      {/* Desktop Top-Right Action */}
      <div className={`${isMobile ? 'hidden' : 'hidden md:block'} fixed top-8 right-8 z-50`}>
        <button className="bg-black text-white font-black text-xs px-5 py-2 rounded-full uppercase tracking-widest shadow-lg hover:scale-105 transition-transform active:scale-95">
          Join VibeJam
        </button>
      </div>
    </div>
  );
};
