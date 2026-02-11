
import React from 'react';
import { motion } from 'framer-motion';

const Environment: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {/* Distant Hills */}
      <div className="absolute bottom-0 left-0 w-full h-[30%]">
         <svg viewBox="0 0 1440 320" className="absolute bottom-0 w-[120%] -left-[10%]" preserveAspectRatio="none">
            <path 
              fill="#A3B18A" 
              fillOpacity="0.4" 
              d="M0,224L60,208C120,192,240,160,360,165.3C480,171,600,213,720,218.7C840,224,960,192,1080,186.7C1200,181,1320,203,1380,213.3L1440,224L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
            ></path>
         </svg>
         <svg viewBox="0 0 1440 320" className="absolute bottom-0 w-[120%] -left-[5%]" preserveAspectRatio="none">
            <path 
              fill="#588157" 
              fillOpacity="0.3" 
              d="M0,256L80,240C160,224,320,192,480,192C640,192,800,224,960,218.7C1120,213,1280,171,1360,149.3L1440,128L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"
            ></path>
         </svg>
      </div>

      {/* Clouds drifting */}
      <motion.div 
        className="absolute top-10 left-[10%] w-48 h-20 bg-white/40 rounded-full blur-xl"
        animate={{ x: [0, 100, 0] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div 
        className="absolute top-40 left-[60%] w-64 h-24 bg-white/30 rounded-full blur-2xl"
        animate={{ x: [0, -150, 0] }}
        transition={{ duration: 45, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
};

export default Environment;
