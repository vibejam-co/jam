
import React from 'react';
import { MapPin, Navigation } from 'lucide-react';

export const MapWidget: React.FC<{ isExpanded?: boolean }> = ({ isExpanded }) => {
  if (isExpanded) {
    return (
      <div className="w-full h-full rounded-3xl overflow-hidden relative border border-white/20">
        <img 
          src="https://picsum.photos/1200/800?random=map" 
          className="w-full h-full object-cover opacity-80"
          alt="Expanded Map"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-8 flex flex-col justify-end">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center shadow-lg animate-bounce">
              <MapPin className="text-white w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Infinite Loop, 1</h3>
              <p className="text-white/60">Cupertino, CA 95014, USA</p>
            </div>
          </div>
          <button className="w-full py-4 bg-white text-black font-bold rounded-2xl flex items-center justify-center gap-3">
            <Navigation className="w-5 h-5 fill-current" />
            Start Navigation
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative group overflow-hidden">
      <img 
        src="https://picsum.photos/400/400?random=map" 
        className="w-full h-full object-cover transition-all duration-700 group-hover:scale-125 group-hover:blur-[1px] blur-[3px] opacity-40"
        alt="Map"
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
        <div className="relative">
          <div className="absolute -inset-4 bg-blue-500/20 rounded-full animate-ping" />
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center shadow-lg border-2 border-white/40">
            <MapPin className="text-white w-5 h-5" />
          </div>
        </div>
        <span className="text-[10px] text-white font-bold bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10 uppercase tracking-widest">
          Near You
        </span>
      </div>
    </div>
  );
};
