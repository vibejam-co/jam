
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AmbientBackgroundProps {
  accentColor: string;
}

const AmbientBackground: React.FC<AmbientBackgroundProps> = ({ accentColor }) => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-[#050505]">
      <AnimatePresence mode="wait">
        <motion.div
          key={accentColor}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.15 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5 }}
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${accentColor} 0%, transparent 70%)`,
            filter: 'blur(100px)',
          }}
        />
      </AnimatePresence>
      
      {/* Moving noise/texture */}
      <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
    </div>
  );
};

export default AmbientBackground;
