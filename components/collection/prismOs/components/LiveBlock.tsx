
import React from 'react';
import { motion } from 'framer-motion';

export const LiveBlock: React.FC = () => {
  return (
    <div className="relative w-full h-full overflow-hidden group/live">
      {/* Background stream simulation */}
      <div className="absolute inset-0 scale-100 transition-transform duration-700 group-hover/live:scale-110">
        <img 
          src="https://picsum.photos/id/237/1200/400" 
          alt="Live Stream" 
          className="w-full h-full object-cover filter blur-[2px] group-hover/live:blur-0 transition-all brightness-50 contrast-125"
        />
      </div>

      {/* Overlay UI */}
      <div className="absolute inset-0 p-6 flex flex-col justify-between z-20">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/10 px-2 py-1">
            <motion.div 
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-red-500"
            />
            <span className="text-[10px] font-bold text-white uppercase tracking-widest">LIVE NOW</span>
          </div>
          <span className="text-white/40 text-[10px] uppercase font-mono tracking-widest">02:44:12</span>
        </div>

        <div>
          <h3 className="text-white text-xl font-bold uppercase tracking-tight">Designing Prism OS v2</h3>
          <p className="text-white/50 text-[10px] uppercase tracking-widest mt-1">Twitch.tv/AlexDRV</p>
        </div>
      </div>

      {/* Optical Mask for Fish-eye feel */}
      <div className="absolute inset-0 bg-gradient-to-tr from-black/40 to-transparent pointer-events-none group-hover/live:opacity-0 transition-opacity" />
    </div>
  );
};
