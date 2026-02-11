
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const IMAGES = [
  'https://picsum.photos/seed/p1/300/300',
  'https://picsum.photos/seed/p2/300/300',
  'https://picsum.photos/seed/p3/300/300',
  'https://picsum.photos/seed/p4/300/300',
];

export const PolaroidStack: React.FC = () => {
  const [isDealt, setIsDealt] = useState(false);

  return (
    <div className="relative w-64 h-80 flex items-center justify-center">
      {/* Background Hint */}
      {!isDealt && (
         <div className="absolute top-0 left-0 w-full h-full border-2 border-dashed border-neutral-400 rounded-lg flex items-center justify-center -rotate-3">
           <span className="font-handwritten text-neutral-400 text-sm">TAP TO DEAL</span>
         </div>
      )}

      {/* The Stack */}
      <div className="relative w-full h-full cursor-pointer" onClick={() => setIsDealt(!isDealt)}>
        {IMAGES.map((src, index) => (
          <motion.div
            key={index}
            drag={isDealt}
            dragConstraints={{ left: -200, right: 200, top: -200, bottom: 200 }}
            animate={{
              rotate: isDealt ? (index - 1.5) * 15 : (index - 1.5) * 3,
              x: isDealt ? (index - 1.5) * 60 : 0,
              y: isDealt ? Math.abs(index - 1.5) * 10 : 0,
              zIndex: isDealt ? 50 + index : 10 + index,
            }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="absolute top-0 left-0 w-64 p-3 bg-white shadow-xl border border-neutral-200 origin-bottom"
          >
            {/* The Photo Container */}
            <div className="w-full aspect-square bg-neutral-100 overflow-hidden relative">
              <img src={src} className="w-full h-full object-cover sepia-[0.3] brightness-90 contrast-110" alt={`Pic ${index}`} />
              <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent pointer-events-none"></div>
            </div>
            
            {/* The Bottom Margin (Captions) */}
            <div className="mt-4 pb-2">
              <p className="font-handwritten text-sm text-neutral-600 text-center">
                {["memories.exe", "summer vibe", "manifesting", "lmao who dis?"][index]}
              </p>
            </div>

            {/* Paper Texture Overlay */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/rough-paper.png')] opacity-10 pointer-events-none"></div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
