
import React from 'react';
import { motion } from 'framer-motion';
import { WidgetCardProps } from '../types';
import { ProfileWidget } from './widgets/ProfileWidget';
import { MusicWidget } from './widgets/MusicWidget';
import { MapWidget } from './widgets/MapWidget';
import { VideoWidget } from './widgets/VideoWidget';
import { Cloud, Edit3 } from 'lucide-react';

export const WidgetCard: React.FC<WidgetCardProps> = ({
  widget,
  isActive,
  onActivate,
  compact = false,
  profileOverride,
}) => {
  const getSpanClasses = (size: string, compact: boolean) => {
    if (compact) {
      return 'col-span-1 row-span-1';
    }
    switch (size) {
      case '2x2': return 'col-span-1 sm:col-span-2 row-span-2';
      case '2x1': return 'col-span-1 sm:col-span-2 row-span-1';
      case '1x2': return 'col-span-1 row-span-2';
      default: return 'col-span-1 row-span-1';
    }
  };

  const getShadowColor = (type: string) => {
    switch (type) {
      case 'music': return 'hover:shadow-[0_20px_50px_rgba(29,185,84,0.3)]';
      case 'video': return 'hover:shadow-[0_20px_50px_rgba(255,0,0,0.2)]';
      case 'profile': return 'hover:shadow-[0_20px_50px_rgba(66,135,245,0.3)]';
      default: return 'hover:shadow-[0_20px_50px_rgba(255,255,255,0.1)]';
    }
  };

  return (
    <motion.div
      layoutId={`widget-${widget.id}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => !isActive && onActivate(widget.id)}
      className={`
        relative group cursor-pointer aerogel rounded-[32px] overflow-hidden 
        transition-shadow duration-500
        ${getSpanClasses(widget.size, compact)} 
        ${getShadowColor(widget.type)}
        ${isActive ? 'opacity-0' : 'opacity-100'}
      `}
    >
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      
      <div className="relative z-10 w-full h-full">
        {widget.type === 'profile' && <ProfileWidget profileOverride={profileOverride} />}
        {widget.type === 'music' && <MusicWidget />}
        {widget.type === 'map' && <MapWidget />}
        {widget.type === 'video' && <VideoWidget />}
        
        {widget.type === 'weather' && (
          <div className="p-6 flex flex-col justify-between h-full">
            <Cloud className="text-white/80 w-8 h-8" />
            <div>
              <div className="text-3xl font-bold text-white">24°</div>
              <div className="text-xs text-white/50 uppercase tracking-widest font-medium">Clear Sky</div>
            </div>
          </div>
        )}

        {widget.type === 'notes' && (
          <div className="p-6 flex flex-col justify-between h-full">
            <Edit3 className="text-white/80 w-8 h-8" />
            <div className="text-sm text-white/60 line-clamp-3 font-medium italic">
              "Design is not just what it looks like and feels like. Design is how it works."
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
