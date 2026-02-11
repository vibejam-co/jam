
import React from 'react';

export const MusicBlock: React.FC = () => {
  return (
    <div className="h-full w-full p-6 flex flex-col justify-between group/music">
      <div className="flex justify-between items-center mb-4">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white/40">
           <path d="M12 3V13.55C11.41 13.21 10.73 13 10 13C7.79 13 6 14.79 6 17C6 19.21 7.79 21 10 21C12.21 21 14 19.21 14 17V7H18V3H12Z" fill="currentColor"/>
        </svg>
        <div className="flex gap-1">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className={`w-0.5 bg-cyan-400 h-2 animate-pulse`} style={{ animationDelay: `${i * 0.2}s` }} />
          ))}
        </div>
      </div>

      <div className="relative w-full aspect-square mb-4 overflow-hidden">
        <img 
          src="https://picsum.photos/id/111/300/300" 
          alt="Album" 
          className="w-full h-full object-cover filter saturate-150 mix-blend-overlay opacity-80 group-hover/music:opacity-100 group-hover/music:mix-blend-normal transition-all"
        />
      </div>

      <div className="overflow-hidden">
        <div className="text-white text-xs font-bold truncate uppercase tracking-tight">Chromatic Waves</div>
        <div className="text-white/40 text-[9px] uppercase tracking-widest mt-1">Vibe Engine</div>
      </div>
    </div>
  );
};
