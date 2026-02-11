
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Music2, Music3, Play } from 'lucide-react';
import { GardenItemProps } from '../types';

const MusicBird: React.FC<GardenItemProps> = ({ wind }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);

  return (
    <div className="relative h-64 flex items-end">
      {/* Branch/Vine */}
      <svg width="120" height="100" viewBox="0 0 120 100" className="absolute bottom-0 left-0 overflow-visible">
        <motion.path
          d="M0 80 C 40 80, 80 40, 120 40"
          stroke="#7F5539"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5 }}
        />
      </svg>

      {/* The Bird */}
      <motion.div
        className="relative mb-12 ml-12 cursor-pointer group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => setShowPlayer(!showPlayer)}
        animate={{ 
          y: [0, -4, 0],
          rotate: wind.x * 0.2
        }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        {/* Bird Visual */}
        <div className="w-14 h-10 bg-[#FFB4A2] rounded-full relative shadow-sm border-2 border-white/50">
          <div className="absolute -right-2 top-2 w-4 h-4 bg-[#FFB4A2] rotate-45 rounded-sm" /> {/* Tail */}
          <div className="absolute right-1 top-3 w-1.5 h-1.5 bg-slate-800 rounded-full" /> {/* Eye */}
          <div className="absolute right-0 top-5 w-3 h-2 bg-yellow-400 rounded-full" /> {/* Beak */}
          
          {/* Wing */}
          <motion.div 
            className="absolute left-2 top-2 w-8 h-5 bg-[#E5989B] rounded-full border border-white/20" 
            animate={{ rotate: isHovered ? [-10, -40] : 0 }}
          />
        </div>

        {/* Floating Notes */}
        <AnimatePresence>
          {isHovered && (
            <>
              {[Music, Music2, Music3].map((Icon, i) => (
                <motion.div
                  key={i}
                  className="absolute text-[#588157]"
                  initial={{ opacity: 0, y: 0, x: 0 }}
                  animate={{ 
                    opacity: [0, 1, 0], 
                    y: -50 - (i * 20),
                    x: (i - 1) * 30 
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity, 
                    delay: i * 0.4 
                  }}
                >
                  <Icon size={16} />
                </motion.div>
              ))}
            </>
          )}
        </AnimatePresence>

        {/* Mini Player Bubble */}
        <AnimatePresence>
          {showPlayer && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              className="absolute bottom-16 -left-16 w-48 bg-white rounded-2xl p-3 shadow-xl border border-pink-100 z-50"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-sage-100 rounded-lg flex items-center justify-center text-[#588157]">
                   <Play size={16} fill="currentColor" />
                </div>
                <div>
                  <div className="text-xs font-bold text-stone-700 truncate">Lo-fi Garden Beats</div>
                  <div className="text-[10px] text-stone-400">02:45 / 04:20</div>
                </div>
              </div>
              <div className="mt-2 h-1 bg-stone-100 rounded-full overflow-hidden">
                <motion.div 
                    className="h-full bg-[#A3B18A]" 
                    initial={{ width: 0 }}
                    animate={{ width: '60%' }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default MusicBird;
