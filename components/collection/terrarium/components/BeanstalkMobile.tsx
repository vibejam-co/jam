
import React from 'react';
import { motion } from 'framer-motion';
import { GardenItemProps } from '../types';
import { Instagram, Music, Mail, User, Briefcase } from 'lucide-react';

const BeanstalkMobile: React.FC<GardenItemProps> = ({ wind }) => {
  const items = [
    { label: 'Instagram', icon: <Instagram />, color: 'bg-pink-100', href: 'https://instagram.com/vibejamco' },
    { label: 'Newsletter', icon: <Mail />, color: 'bg-amber-100', href: 'mailto:hello@vibejam.co' },
    { label: 'Spotify', icon: <Music />, color: 'bg-emerald-100', href: 'https://open.spotify.com' },
    { label: 'Portfolio', icon: <Briefcase />, color: 'bg-sky-100', href: 'https://www.vibejam.co' },
    { label: 'About', icon: <User />, color: 'bg-purple-100', href: 'https://www.vibejam.co/canvas' },
  ];

  return (
    <div className="relative w-full h-full overflow-y-auto overflow-x-hidden pt-20 pb-40 flex flex-col items-center">
      {/* Central Vine */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-[2000px] pointer-events-none">
        <svg width="40" height="2000" viewBox="0 0 40 2000" fill="none">
          <motion.path
            d="M20 0 Q 30 500, 20 1000 T 20 2000"
            stroke="#588157"
            strokeWidth="8"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 3 }}
          />
        </svg>
      </div>

      <div className="z-10 text-center mb-16 px-6">
         <h1 className="cozy-font text-5xl text-[#588157]">My Beanstalk</h1>
         <p className="text-stone-500">Scroll down to climb the garden.</p>
      </div>

      {/* Floating Bean Items */}
      <div className="w-full max-w-sm flex flex-col space-y-32 z-10 px-8">
        {items.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: i % 2 === 0 ? -100 : 100 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className={`relative flex items-center ${i % 2 === 0 ? 'flex-row' : 'flex-row-reverse'} justify-between`}
          >
            {/* Branch to Vine */}
            <div className={`absolute top-1/2 -translate-y-1/2 w-20 h-0.5 bg-[#A3B18A] ${i % 2 === 0 ? 'left-full ml-2' : 'right-full mr-2'}`} />

            <motion.a
              href={item.href}
              target={item.href.startsWith('mailto:') ? undefined : '_blank'}
              rel={item.href.startsWith('mailto:') ? undefined : 'noreferrer'}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`w-48 h-20 ${item.color} rounded-3xl border-4 border-white shadow-xl flex items-center px-4 space-x-4`}
            >
               <div className="p-3 bg-white rounded-2xl text-[#588157] shadow-sm">
                  {item.icon}
               </div>
               <span className="font-bold text-[#588157] tracking-tight">{item.label}</span>
            </motion.a>
          </motion.div>
        ))}
      </div>
      
      <div className="mt-40 text-stone-400 cozy-font text-xl">The End (For now)</div>
    </div>
  );
};

export default BeanstalkMobile;
