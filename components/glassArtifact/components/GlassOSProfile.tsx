
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WidgetCard } from './WidgetCard';
import { Widget } from '../types';
// Import widget components correctly from their modules
import { ProfileWidget } from './widgets/ProfileWidget';
import { MusicWidget } from './widgets/MusicWidget';
import { MapWidget } from './widgets/MapWidget';
import { VideoWidget } from './widgets/VideoWidget';

const INITIAL_WIDGETS: Widget[] = [
  { id: '1', type: 'profile', title: 'User Profile', size: '2x2' },
  { id: '2', type: 'music', title: 'Now Playing', size: '1x1' },
  { id: '3', type: 'map', title: 'Location', size: '1x1' },
  { id: '4', type: 'video', title: 'Vibe Feed', size: '2x1' },
  { id: '5', type: 'weather', title: 'Atmosphere', size: '1x1' },
  { id: '6', type: 'notes', title: 'Quick Catch', size: '1x1' },
];

interface GlassOSProfileProps {
  forcedViewport?: 'mobile' | 'desktop';
  profileOverride?: {
    name?: string;
    bio?: string;
    avatar?: string;
    handle?: string;
  };
}

export const GlassOSProfile: React.FC<GlassOSProfileProps> = ({ forcedViewport, profileOverride }) => {
  const [isCompactByWidth, setIsCompactByWidth] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const isEmbeddedPreview = Boolean(forcedViewport);

  useEffect(() => {
    if (!activeId || isEmbeddedPreview) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [activeId, isEmbeddedPreview]);

  useEffect(() => {
    const checkCompact = () => setIsCompactByWidth(window.innerWidth < 768);
    checkCompact();
    window.addEventListener('resize', checkCompact);
    return () => window.removeEventListener('resize', checkCompact);
  }, []);

  const isCompact = forcedViewport ? forcedViewport === 'mobile' : isCompactByWidth;

  return (
    <div className="relative w-full">
      {/* Grid Layout */}
      <div
        className={`grid ${
          isCompact
            ? 'grid-cols-1 gap-3 auto-rows-[130px]'
            : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 auto-rows-[140px] md:auto-rows-[180px]'
        }`}
      >
        {INITIAL_WIDGETS.map((widget) => (
          <WidgetCard
            key={widget.id}
            widget={widget}
            isActive={activeId === widget.id}
            onActivate={setActiveId}
            compact={isCompact}
            profileOverride={profileOverride}
          />
        ))}
      </div>

      {/* Expansion Overlay */}
      <AnimatePresence>
        {activeId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveId(null)}
            className={`z-[100] bg-black/40 backdrop-blur-xl flex justify-center ${
              isEmbeddedPreview
                ? `absolute inset-0 ${isCompact ? 'items-end p-0' : 'items-center p-2'}`
                : `fixed inset-0 ${isCompact ? 'items-end p-0' : 'items-end md:items-center p-0 md:p-4'}`
            }`}
          >
            <motion.div
              layoutId={`widget-${activeId}`}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-3xl aerogel shadow-2xl overflow-hidden relative ${
                isEmbeddedPreview
                  ? isCompact
                    ? 'h-[86%] rounded-t-[24px]'
                    : 'h-[88%] rounded-[28px]'
                  : isCompact
                    ? 'h-[90dvh] rounded-t-[24px]'
                    : 'h-[92dvh] md:h-[600px] rounded-t-[28px] md:rounded-[40px]'
              }`}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <WidgetExpandedContent 
                widget={INITIAL_WIDGETS.find(w => w.id === activeId)!}
                profileOverride={profileOverride}
                onClose={() => setActiveId(null)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Internal Helper for Expanded View
const WidgetExpandedContent: React.FC<{
  widget: Widget;
  onClose: () => void;
  profileOverride?: {
    name?: string;
    bio?: string;
    avatar?: string;
    handle?: string;
  };
}> = ({ widget, onClose, profileOverride }) => {
  // Removed incorrect local destructuring from string literals
  
  return (
    <div className="w-full h-full flex flex-col p-4 sm:p-6 md:p-8">
      <div className="flex justify-between items-center mb-5 md:mb-8">
        <h2 className="text-xl md:text-2xl font-semibold text-white/90">{widget.title}</h2>
        <button 
          onClick={onClose}
          className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-colors"
        >
          ✕
        </button>
      </div>
      
      <div className="flex-1 overflow-auto">
        {widget.type === 'profile' && <ProfileWidget isExpanded={true} profileOverride={profileOverride} />}
        {widget.type === 'music' && <MusicWidget isExpanded={true} />}
        {widget.type === 'map' && <MapWidget isExpanded={true} />}
        {widget.type === 'video' && <VideoWidget isExpanded={true} />}
        {['weather', 'notes'].includes(widget.type) && (
          <div className="text-white/40 flex items-center justify-center h-full text-lg">
            App functionality coming soon to Vision Pro.
          </div>
        )}
      </div>
    </div>
  );
};
