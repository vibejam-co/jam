
import React, { useState } from 'react';
import { Play, Volume2, Maximize, Share2 } from 'lucide-react';

export const VideoWidget: React.FC<{ isExpanded?: boolean }> = ({ isExpanded }) => {
  const [isHovered, setIsHovered] = useState(false);

  if (isExpanded) {
    return (
      <div className="flex flex-col gap-4 md:gap-6 h-full">
        <div className="w-full aspect-video rounded-3xl overflow-hidden relative border border-white/10 shadow-2xl bg-black">
          <img 
            src="https://picsum.photos/1280/720?random=video" 
            className="w-full h-full object-cover opacity-90"
            alt="Video Player"
          />
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-24 h-24 rounded-full bg-white/10 backdrop-blur-2xl border border-white/20 flex items-center justify-center text-white">
                <Play className="w-10 h-10 fill-current ml-2" />
             </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-black/80 to-transparent flex justify-between items-center">
            <div className="flex gap-4">
               <Volume2 className="text-white w-6 h-6 cursor-pointer" />
            </div>
            <div className="flex gap-4">
               <Share2 className="text-white w-6 h-6 cursor-pointer" />
               <Maximize className="text-white w-6 h-6 cursor-pointer" />
            </div>
          </div>
        </div>
        <div className="space-y-3 md:space-y-4">
          <h2 className="text-xl md:text-2xl font-bold text-white">The Future of Spatial Design Systems</h2>
          <div className="flex flex-wrap items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-white/20 overflow-hidden">
                <img src="https://picsum.photos/100/100?random=4" alt="Creator" />
             </div>
             <span className="text-white font-medium">DesignTheory HQ</span>
             <span className="text-white/40 text-xs md:text-sm">• 48k views • 2 hours ago</span>
          </div>
          <p className="text-white/60 text-sm md:text-base leading-relaxed">
            Exploring the nuances of frosted aerogel materials and how they define the next era of interface aesthetics. 
            Deep dive into glass-morphism 3.0 and spatial context.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="h-full w-full relative group overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <img 
        src="https://picsum.photos/800/400?random=video" 
        className={`w-full h-full object-cover transition-transform duration-[2000ms] ease-out ${isHovered ? 'scale-110 brightness-75' : 'scale-100 brightness-100'}`}
        alt="Video Thumbnail"
      />
      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
      
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className={`
          w-16 h-16 rounded-full aerogel border border-white/30 flex items-center justify-center text-white
          transition-all duration-500 scale-110
          ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        `}>
          <Play className="w-6 h-6 fill-current ml-1" />
        </div>
      </div>

      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
        <div className="text-xs font-bold text-white uppercase tracking-widest drop-shadow-md">
          Spatial Lab #04
        </div>
        <div className="px-2 py-0.5 rounded bg-black/60 text-[10px] text-white font-mono">
          08:24
        </div>
      </div>
    </div>
  );
};
