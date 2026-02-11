
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { LinkItem } from './types';

interface LinkStripProps {
  item: LinkItem;
  onHover: (id: string | null) => void;
  isHovered: boolean;
  setIsCursorHovering: (val: boolean) => void;
  isMobilePreview?: boolean;
}

const LinkStrip: React.FC<LinkStripProps> = ({ item, onHover, isHovered, setIsCursorHovering, isMobilePreview = false }) => {
  return (
    <motion.a
      href={item.url}
      onMouseEnter={() => {
        onHover(item.id);
        setIsCursorHovering(true);
      }}
      onMouseLeave={() => {
        onHover(null);
        setIsCursorHovering(false);
      }}
      className="group relative w-full border-b border-black py-12 md:py-16 px-6 md:px-12 flex items-center justify-between overflow-hidden transition-colors duration-500 ease-in-out"
      style={{ mixBlendMode: 'difference' }}
    >
      <div className={`flex items-center ${isMobilePreview ? 'gap-6' : 'gap-8 md:gap-16'}`}>
        <span className={`font-sans-editorial tracking-[0.2em] opacity-80 uppercase ${isMobilePreview ? 'text-xs' : 'text-xs md:text-sm'}`}>
          {item.index}
        </span>
        <div className="flex flex-col">
          <h2 className={`font-serif-editorial italic leading-none tracking-tighter ${isMobilePreview ? 'text-5xl' : 'text-5xl md:text-7xl lg:text-8xl'}`}>
            {item.title}
          </h2>
          <span className={`font-sans-editorial mt-2 tracking-[0.15em] opacity-60 uppercase ${isMobilePreview ? 'text-[10px]' : 'text-[10px] md:text-xs'}`}>
            {item.subtitle}
          </span>
        </div>
      </div>

      <motion.div
        animate={{ 
          x: isHovered ? 0 : -20, 
          opacity: isHovered ? 1 : 0 
        }}
        transition={{ duration: 0.3 }}
      >
        <ArrowUpRight size={isMobilePreview ? 30 : 48} strokeWidth={1} className={isMobilePreview ? 'block' : 'hidden md:block'} />
      </motion.div>
    </motion.a>
  );
};

export default LinkStrip;
