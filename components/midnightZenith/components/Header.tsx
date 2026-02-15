
import React from 'react';
import { motion } from 'framer-motion';
import { ProfileData } from '../types';

interface HeaderProps {
  data: ProfileData;
  compact?: boolean;
}

const Header: React.FC<HeaderProps> = ({ data, compact = false }) => {
  return (
    <header className={`relative w-full overflow-hidden ${compact ? 'h-[62vh]' : 'h-[72vh] md:h-[90vh]'}`}>
      <video
        src={data.heroVideo}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />
      
      {/* Cinematic Overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-[#050505]"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent"></div>

      {/* Profile Overlay */}
      <div className={`absolute inset-x-0 bottom-0 ${compact ? 'px-4 pb-14' : 'px-4 sm:px-6 md:px-24 pb-20 md:pb-48'}`}>
        <div className="max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className={`flex flex-col items-start gap-5 mb-6 ${compact ? '' : 'md:flex-row md:items-end md:gap-10 md:mb-8'}`}
          >
            <div className="relative shrink-0">
              <img 
                src={data.profilePic} 
                alt={data.name} 
                className={`rounded-2xl object-cover border border-white/10 shadow-2xl ${compact ? 'w-20 h-20' : 'w-24 h-24 md:w-40 md:h-40'}`}
              />
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-white flex items-center justify-center border-4 border-black">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="black"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
              </div>
            </div>
            
            <div className="flex-1">
              <h1 className={`font-cinema font-extrabold tracking-tightest leading-[0.85] text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50 ${compact ? 'text-[2.15rem] xs:text-[2.8rem] mb-3' : 'text-4xl sm:text-6xl md:text-9xl mb-3 md:mb-4'}`}>
                {data.name}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <p className="text-sm font-cinema tracking-[0.4em] text-white/40 uppercase">
                  {data.handle}
                </p>
                {!compact && <div className="h-px flex-1 bg-white/10 hidden md:block" />}
                <div className="flex items-center gap-3">
                   <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                   <span className="text-[10px] font-cinema tracking-widest text-white/30 uppercase">Artist Verified</span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.6 }}
            className={`font-cinema font-light text-white/60 leading-relaxed max-w-xl ${compact ? 'text-xs' : 'text-sm md:text-lg md:border-l md:border-white/10 md:pl-8'}`}
          >
            {data.bio}
          </motion.p>
        </div>
      </div>

      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_200px_rgba(0,0,0,0.5)]"></div>
    </header>
  );
};

export default Header;
