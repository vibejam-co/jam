
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EDITORIAL_LINKS } from './constants';
import LinkStrip from './LinkStrip';
import CustomCursor from './CustomCursor';

interface EditorialKineticProfileProps {
  isMobilePreview?: boolean;
}

const EditorialKineticProfile: React.FC<EditorialKineticProfileProps> = ({ isMobilePreview = false }) => {
  const [activeLinkId, setActiveLinkId] = useState<string | null>(null);
  const [isCursorHovering, setIsCursorHovering] = useState(false);

  const activeLink = EDITORIAL_LINKS.find(link => link.id === activeLinkId);

  return (
    <div className={`relative ${isMobilePreview ? 'h-full min-h-0' : 'min-h-screen'} bg-[#F0F0F0] text-black selection:bg-[#FF4F00] selection:text-white overflow-x-hidden`}>
      {!isMobilePreview && <CustomCursor isHovering={isCursorHovering} />}

      {/* Background Mask / Reveal Layer */}
      <AnimatePresence>
        {activeLink && (
          <motion.div
            key={activeLink.id}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className={`${isMobilePreview ? 'absolute' : 'fixed'} inset-0 z-0 pointer-events-none`}
          >
            <div className="absolute inset-0 bg-black/20 z-10" />
            <img
              src={activeLink.imageUrl}
              alt={activeLink.title}
              className="w-full h-full object-cover grayscale-[0.2] brightness-[0.8]"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <main className={`relative z-10 flex flex-col ${isMobilePreview ? 'pb-4' : 'md:flex-row'}`}>
        {/* Left Side: Massive Fixed Title */}
        <section
          className={`p-8 flex flex-col justify-between pointer-events-none ${
            isMobilePreview ? 'w-full gap-8 pb-2 pt-6 px-5' : 'md:w-1/3 md:h-screen md:sticky md:top-0 md:p-12'
          }`}
        >
          <div>
            <div className="w-12 h-[2px] bg-[#FF4F00] mb-8" />
            <p className="font-sans-editorial text-[10px] tracking-[0.3em] uppercase opacity-60">
              VIBEJAM / VOLUME 04
            </p>
          </div>
          
          <div className={isMobilePreview ? '' : 'mt-20 md:mt-0'}>
            <h1 
              className={`font-serif-editorial italic leading-[0.85] tracking-tighter ${
                isMobilePreview ? 'text-[3.3rem] xs:text-[4.2rem]' : 'text-7xl md:text-8xl lg:text-9xl'
              }`}
              style={{ mixBlendMode: 'difference', color: 'white' }}
            >
              THE<br />ARCHIVE
            </h1>
            <p className={`font-sans-editorial text-xs mt-6 tracking-[0.2em] opacity-80 uppercase ${isMobilePreview ? 'max-w-[260px]' : 'max-w-[200px]'}`}>
              A curated collection of digital experiences and tactile aesthetics.
            </p>
          </div>

          <div className={isMobilePreview ? '' : 'hidden md:block'}>
            <p className="font-sans-editorial text-[10px] tracking-[0.2em] uppercase opacity-40">
              EST. 2025 &copy; ALL RIGHTS RESERVED
            </p>
          </div>
        </section>

        {/* Right Side: Scrollable Link Strips */}
        <section className={`${isMobilePreview ? 'w-full' : 'md:w-2/3 md:border-l'} border-t ${isMobilePreview ? '' : 'md:border-t-0'} border-black bg-transparent`}>
          <div className="flex flex-col">
            {EDITORIAL_LINKS.map((link) => (
              <LinkStrip
                key={link.id}
                item={link}
                onHover={setActiveLinkId}
                isHovered={activeLinkId === link.id}
                setIsCursorHovering={setIsCursorHovering}
                isMobilePreview={isMobilePreview}
              />
            ))}
          </div>

          {/* Footer Metadata - Mobile Only */}
          <footer className={`p-6 md:p-8 border-t border-black ${isMobilePreview ? '' : 'md:hidden'}`}>
            <p className="font-sans-editorial text-[10px] tracking-[0.2em] uppercase opacity-40">
              EST. 2025 &copy; ALL RIGHTS RESERVED
            </p>
          </footer>
        </section>
      </main>

      {/* Decorative Branding */}
      <div className={`${isMobilePreview ? 'relative mt-2 mb-6 px-5' : 'fixed bottom-12 left-12 md:left-auto md:right-12'} z-50 pointer-events-none`}>
        <div className="flex items-center gap-4">
          <span className="font-sans-editorial text-[10px] tracking-widest uppercase opacity-60">
            Scroll to explore
          </span>
          <div className="w-8 h-[1px] bg-black/40" />
        </div>
      </div>
    </div>
  );
};

export default EditorialKineticProfile;
