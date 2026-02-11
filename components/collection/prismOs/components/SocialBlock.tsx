
import React from 'react';
import { motion } from 'framer-motion';

export const SocialBlock: React.FC = () => {
  const socials = [
    { label: 'Twitter', handle: '@AlexDRV', color: 'hover:text-cyan-400' },
    { label: 'GitHub', handle: 'alex-prism', color: 'hover:text-purple-400' },
    { label: 'Behance', handle: 'alex_designs', color: 'hover:text-pink-400' },
  ];

  return (
    <div className="h-full w-full p-6 flex items-center justify-around">
      {socials.map((s, idx) => (
        <motion.a
          key={idx}
          href="#"
          whileHover={{ y: -5 }}
          className={`flex flex-col items-center gap-2 group/link transition-colors ${s.color}`}
        >
          <div className="w-10 h-10 border border-white/10 flex items-center justify-center bg-white/5 backdrop-blur-sm group-hover/link:border-white/40 transition-all">
             <span className="text-white font-bold text-lg">{s.label[0]}</span>
          </div>
          <div className="text-center">
            <div className="text-[8px] text-white/40 uppercase tracking-[0.2em]">{s.label}</div>
            <div className="text-[10px] text-white font-mono">{s.handle}</div>
          </div>
        </motion.a>
      ))}
    </div>
  );
};
