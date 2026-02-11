
import React from 'react';
import { Play, SkipBack, SkipForward, Pause, Music2, Heart } from 'lucide-react';

export const MusicWidget: React.FC<{ isExpanded?: boolean }> = ({ isExpanded }) => {
  if (isExpanded) {
    return (
      <div className="flex flex-col gap-6 md:gap-8 h-full text-white">
        <div className="flex flex-col md:flex-row gap-5 md:gap-8 items-center">
          <div className="w-36 h-36 md:w-48 md:h-48 rounded-[24px] md:rounded-[32px] overflow-hidden shadow-2xl rotate-[-3deg] shrink-0">
            <img src="https://picsum.photos/400/400?random=2" className="w-full h-full object-cover" alt="Album Art" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Midnight City</h2>
            <p className="text-base md:text-xl text-white/60 mb-4 md:mb-6">M83 — Hurry Up, We're Dreaming</p>
            <div className="flex items-center gap-4">
               <Heart className="w-6 h-6 text-green-400 fill-green-400" />
               <span className="text-sm text-white/40">Liked by you and 12k others</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="h-1.5 w-full bg-white/10 rounded-full relative overflow-hidden">
            <div className="absolute top-0 left-0 h-full w-1/3 bg-green-500 rounded-full" />
          </div>
          <div className="flex justify-between text-xs text-white/40 font-mono">
            <span>1:24</span>
            <span>4:03</span>
          </div>
        </div>

        <div className="flex justify-center items-center gap-8 md:gap-12 py-2 md:py-4">
          <SkipBack className="w-7 h-7 md:w-8 md:h-8 text-white/60 hover:text-white cursor-pointer" />
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform cursor-pointer">
            <Pause className="w-7 h-7 md:w-8 md:h-8 fill-current" />
          </div>
          <SkipForward className="w-7 h-7 md:w-8 md:h-8 text-white/60 hover:text-white cursor-pointer" />
        </div>

        <div className="mt-auto opacity-40">
          <p className="text-sm italic leading-relaxed">
            "Waiting in a car... Waiting for a ride in the dark... Night city lights, waiting for the sky..."
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 h-full relative group">
      <div className="absolute inset-0 z-0">
        <img src="https://picsum.photos/200/200?random=2" className="w-full h-full object-cover opacity-20 scale-110 blur-sm" alt="Bg" />
      </div>
      <div className="relative z-10 flex flex-col justify-between h-full">
        <div className="flex justify-between items-start">
          <Music2 className="text-white/80 w-6 h-6" />
          <div className="flex items-end gap-0.5 h-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div 
                key={i} 
                className="w-1 bg-green-500 animate-waveform" 
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        </div>
        <div>
          <div className="text-sm font-bold text-white truncate">Midnight City</div>
          <div className="text-[10px] text-white/50 uppercase truncate tracking-widest font-medium">M83</div>
        </div>
      </div>
    </div>
  );
};
