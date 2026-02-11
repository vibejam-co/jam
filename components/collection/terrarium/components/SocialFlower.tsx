
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Instagram, Smartphone, Sparkles } from 'lucide-react';
import { GardenItemProps } from '../types';

const SocialFlower: React.FC<GardenItemProps> = ({ wind }) => {
  const [isHovered, setIsHovered] = useState(false);

  const petals = [
    { icon: <Instagram size={16} />, label: '@vibe_jam' },
    { icon: <Smartphone size={16} />, label: 'TikTok' },
    { icon: <Sparkles size={16} />, label: 'Portfolio' },
    { icon: null, label: 'Feed' },
    { icon: null, label: 'Links' },
  ];

  return (
    <div className="relative flex items-center justify-center h-full">
      {/* The Stem */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-48 origin-bottom">
        <svg width="20" height="200" viewBox="0 0 20 200" fill="none">
          <motion.path
            d={`M10 200 Q ${10 + wind.x} 100 10 0`}
            stroke="#588157"
            strokeWidth="4"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2 }}
          />
        </svg>
      </div>

      {/* The Flower Head */}
      <motion.div
        className="relative z-30 cursor-pointer"
        style={{ top: '-180px' }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        animate={{ 
            rotate: isHovered ? [0, 360] : wind.x,
            y: wind.y 
        }}
        transition={{
            rotate: isHovered ? { duration: 10, repeat: Infinity, ease: 'linear' } : { duration: 0.5 }
        }}
      >
        {/* Petals */}
        {petals.map((p, i) => {
          const angle = (i * 360) / petals.length;
          return (
            <motion.div
              key={i}
              className="absolute w-20 h-12 bg-[#F8AD9D] rounded-full origin-left flex items-center justify-end pr-3 border-2 border-white/30"
              style={{ transformOrigin: '0 50%', left: '50%', top: '50%', marginTop: '-24px' }}
              animate={{
                rotate: angle,
                scale: isHovered ? 1.4 : 1,
                x: isHovered ? 20 : 0
              }}
              transition={{ type: 'spring', stiffness: 100 }}
            >
               {isHovered && p.icon && (
                 <motion.div 
                    initial={{ opacity: 0, rotate: -angle }}
                    animate={{ opacity: 1, rotate: -angle }}
                    className="text-white"
                 >
                    {p.icon}
                 </motion.div>
               )}
            </motion.div>
          );
        })}

        {/* Center Disc */}
        <motion.div 
          className="relative w-20 h-20 bg-[#FFCDB2] rounded-full flex items-center justify-center border-4 border-white shadow-lg"
          whileHover={{ scale: 1.1 }}
        >
          <div className="text-[#588157] font-bold text-center leading-tight">
            VIBE<br/>JAM
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default SocialFlower;
