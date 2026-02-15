
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
      className={`group relative w-full border-b border-black overflow-hidden transition-colors duration-500 ease-in-out ${
        isMobilePreview
          ? 'py-7 px-4 flex items-start justify-between'
          : 'py-12 md:py-16 px-6 md:px-12 flex items-center justify-between'
      }`}
      style={{ mixBlendMode: 'difference' }}
    >
      <div className={`flex min-w-0 ${isMobilePreview ? 'items-start gap-4 pr-2' : 'items-center gap-8 md:gap-16'}`}>
        <span className={`font-sans-editorial tracking-[0.2em] opacity-80 uppercase ${isMobilePreview ? 'text-xs' : 'text-xs md:text-sm'}`}>
          {item.index}
        </span>
        <div className="flex flex-col min-w-0">
          <h2 className={`font-serif-editorial italic leading-none tracking-tighter break-words ${isMobilePreview ? 'text-[2.15rem] xs:text-[2.6rem]' : 'text-5xl md:text-7xl lg:text-8xl'}`}>
            {item.title}
          </h2>
          <span className={`font-sans-editorial mt-2 tracking-[0.15em] opacity-60 uppercase ${isMobilePreview ? 'text-[10px] leading-relaxed pr-1' : 'text-[10px] md:text-xs'}`}>
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
        <ArrowUpRight size={isMobilePreview ? 22 : 48} strokeWidth={1} className={isMobilePreview ? 'mt-1 opacity-80' : 'hidden md:block'} />
      </motion.div>
    </motion.a>
  );
};

export default LinkStrip;
