
import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GridContent } from '../types';

interface GridItemProps {
  item: GridContent;
  isFocused: boolean;
  isAnyFocused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  onClick: () => void;
}

const GridItem: React.FC<GridItemProps> = ({ item, isFocused, isAnyFocused, onFocus, onBlur, onClick }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      if (isHovered) {
        videoRef.current.play().catch(() => {});
        videoRef.current.playbackRate = 1.0;
        videoRef.current.muted = false;
      } else {
        videoRef.current.playbackRate = 0.5;
        videoRef.current.muted = true;
      }
    }
  }, [isHovered]);

  const getSpanClasses = () => {
    switch (item.type) {
      case 'vertical': return 'row-span-2 col-span-1 aspect-[9/16]';
      case 'horizontal': return 'col-span-1 md:col-span-2 aspect-[16/9] md:aspect-video';
      case 'square': return 'col-span-1 aspect-square';
      default: return '';
    }
  };

  return (
    <motion.div
      layoutId={`card-${item.id}`}
      onMouseEnter={() => { setIsHovered(true); onFocus(); }}
      onMouseLeave={() => { setIsHovered(false); onBlur(); }}
      onClick={onClick}
      className={`relative group cursor-pointer overflow-hidden rounded-xl md:rounded-2xl border border-white/5 bg-white/5 backdrop-blur-sm transition-all duration-700
        ${getSpanClasses()}
        ${isFocused ? 'z-40 scale-[1.03] border-white/30 shadow-2xl grayscale-0 opacity-100' : 'z-0'}
        ${isAnyFocused && !isFocused ? 'opacity-40 grayscale blur-[1px]' : ''}
      `}
    >
      <video
        ref={videoRef}
        src={item.videoUrl}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover pointer-events-none transition-transform duration-1000 group-hover:scale-110"
      />
      
      {/* Visualizer for music/square cards */}
      {item.type === 'square' && (
        <div className="absolute bottom-4 left-4 flex items-end gap-[3px] h-6 z-10">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ height: [4, 12, 6, 20, 4] }}
              transition={{
                duration: 0.8 + Math.random(),
                repeat: Infinity,
                delay: i * 0.1,
                ease: "easeInOut"
              }}
              className="w-[3px] bg-white/70 rounded-full"
            />
          ))}
        </div>
      )}

      {/* Decorative Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Badges */}
      <div className="absolute top-4 left-4 flex gap-2">
        {Math.random() > 0.7 && (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white font-cinema uppercase tracking-tighter">
            Live
          </span>
        )}
      </div>

      {/* Content Overlay */}
      <div className="absolute inset-0 flex flex-col justify-end p-5 md:p-8 translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
        <motion.span 
          animate={isFocused ? { opacity: 1, x: 0 } : { opacity: 0.6, x: 0 }}
          className="text-[10px] md:text-xs font-cinema tracking-[0.25em] text-white/50 uppercase mb-1"
        >
          {item.subtitle}
        </motion.span>
        <motion.h3
          className="text-lg md:text-2xl font-bold font-cinema tracking-tight leading-tight"
        >
          {item.title}
        </motion.h3>
        
        <div className="h-px w-0 group-hover:w-full bg-white/30 mt-4 transition-all duration-700 delay-100" />
      </div>
    </motion.div>
  );
};

export default GridItem;
