
import React from 'react';
import { motion } from 'framer-motion';
import { Tape } from './Tape';

interface TikTokFrameProps {
  videoUrl: string;
  rotation: number;
}

export const TikTokFrame: React.FC<TikTokFrameProps> = ({ videoUrl, rotation }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.05, rotate: 0, zIndex: 50 }}
      style={{ rotate: rotation }}
      className="relative w-56 h-[400px] bg-black rounded-[2.5rem] p-3 shadow-2xl border-4 border-gray-900 overflow-visible"
    >
      <Tape className="w-16 h-6 -top-4 -left-4 !rotate-[-35deg]" />
      
      <div className="w-full h-full rounded-[2rem] overflow-hidden bg-gray-800 relative">
        <video 
          src={videoUrl} 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="w-full h-full object-cover"
        />
        
        {/* Mobile UI Mockup */}
        <div className="absolute bottom-6 left-4 right-4 flex flex-col gap-2 pointer-events-none">
          <div className="h-2 w-24 bg-white/40 rounded" />
          <div className="h-2 w-16 bg-white/20 rounded" />
        </div>
        
        <div className="absolute right-3 bottom-12 flex flex-col gap-4">
          {[1,2,3].map(i => (
            <div key={i} className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md" />
          ))}
        </div>
      </div>
    </motion.div>
  );
};
