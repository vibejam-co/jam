
import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { WindState } from '../types';
import Pollen from './Pollen';
import Environment from './Environment';
import Plant from './Plant';
import SocialFlower from './SocialFlower';
import MusicBird from './MusicBird';
import Mailbox from './Mailbox';
import BeanstalkMobile from './BeanstalkMobile';

const DigitalTerrarium: React.FC = () => {
  const [wind, setWind] = useState<WindState>({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    const handleMouseMove = (e: MouseEvent) => {
      // Calculate wind influence: plants lean away from cursor
      const x = (e.clientX / window.innerWidth - 0.5) * 15;
      const y = (e.clientY / window.innerHeight - 0.5) * 5;
      setWind({ x, y });
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gradient-to-b from-[#FFEFBA] to-white">
      {/* Visual Overlays */}
      <div className="paper-texture" />
      <Environment />
      <Pollen />

      {/* Main Content Area */}
      {isMobile ? (
        <BeanstalkMobile wind={wind} />
      ) : (
        <div className="relative z-10 w-full h-full flex flex-col justify-end items-center px-10 pb-20">
          
          {/* Garden Scene (Desktop) */}
          <div className="relative w-full max-w-6xl h-[600px] flex items-end justify-between">
            
            {/* Left Side: Newsletter Mailbox */}
            <div className="mb-4">
              <Mailbox wind={wind} />
            </div>

            {/* Center: Hero Social Flower & Main Plants */}
            <div className="flex-1 flex justify-center items-end space-x-12 relative">
              <Plant wind={wind} delay={0.2} color="#A3B18A" height={180} />
              <div className="z-20">
                 <SocialFlower wind={wind} />
              </div>
              <Plant wind={wind} delay={0.4} color="#588157" height={220} />
            </div>

            {/* Right Side: Music Bird & More Foliage */}
            <div className="flex items-end space-x-8">
              <MusicBird wind={wind} />
              <Plant wind={wind} delay={0.6} color="#A3B18A" height={160} />
            </div>

          </div>

          {/* Profile Label */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 1 }}
            className="mt-12 text-center"
          >
            <h1 className="cozy-font text-5xl font-bold text-sage-800 text-[#588157]">The Wanderer's Garden</h1>
            <p className="text-stone-500 font-medium tracking-wide">Growing digital connections with love and tea.</p>
          </motion.div>
        </div>
      )}

      {/* Floating Cloud Links (Sky Layer) */}
      {!isMobile && (
        <div className="absolute top-20 left-0 w-full flex justify-around pointer-events-none px-20">
          {['About', 'Projects', 'Gallery', 'Contact'].map((label, i) => (
            <motion.a
              key={label}
              href={`#${label.toLowerCase()}`}
              className="pointer-events-auto bg-white/60 backdrop-blur-sm px-6 py-3 rounded-full shadow-sm hover:shadow-md transition-shadow cursor-pointer flex items-center space-x-2 border border-white/40"
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.5 + i * 0.1, type: 'spring' }}
              whileHover={{ scale: 1.05, y: -5 }}
            >
               <span className="text-[#588157] font-bold">{label}</span>
            </motion.a>
          ))}
        </div>
      )}
    </div>
  );
};

export default DigitalTerrarium;
