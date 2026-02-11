
import React from 'react';
import { motion } from 'framer-motion';

export const ShopBlock: React.FC = () => {
  return (
    <div className="h-full w-full flex flex-col p-6 items-center justify-center relative group/shop">
      <div className="mb-4 text-center">
        <div className="text-white/30 text-[10px] tracking-[0.3em] uppercase mb-1">Store</div>
        <div className="text-white font-bold text-sm tracking-widest uppercase">Prism Capsule</div>
      </div>

      <div className="relative w-full aspect-square flex items-center justify-center perspective-[1000px]">
        {/* Spinning Product Simulation */}
        <motion.div
          animate={{ rotateY: 360, y: [0, -10, 0] }}
          transition={{ 
            rotateY: { duration: 10, repeat: Infinity, ease: 'linear' },
            y: { duration: 3, repeat: Infinity, ease: 'easeInOut' }
          }}
          className="w-32 h-32 relative preserve-3d"
        >
          {/* Main Product Image with Overlays */}
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-pink-600 blur-xl opacity-20" />
          <img 
            src="https://picsum.photos/id/357/400/400" 
            alt="Product" 
            className="w-full h-full object-cover border border-white/20 shadow-2xl rounded-sm"
          />
        </motion.div>
      </div>

      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="mt-6 w-full py-3 bg-white/10 hover:bg-white text-white hover:text-black border border-white/20 transition-all text-[10px] font-bold uppercase tracking-[0.2em]"
      >
        Collect Item
      </motion.button>

      {/* Technical annotation */}
      <div className="absolute top-4 right-4 text-[8px] font-mono text-cyan-400/40">BOX_ID: 9942</div>
    </div>
  );
};
