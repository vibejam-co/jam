
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GridContent } from '../types';

interface ExpandedModalProps {
  item: GridContent | null;
  onClose: () => void;
}

const ExpandedModal: React.FC<ExpandedModalProps> = ({ item, onClose }) => {
  if (!item) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-12 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/98 backdrop-blur-3xl"
        />
        
        <motion.div
          layoutId={`card-${item.id}`}
          className="relative w-full max-w-7xl md:aspect-video rounded-t-3xl md:rounded-3xl overflow-hidden border-none md:border border-white/10 shadow-[0_0_100px_rgba(0,0,0,1)] bg-black min-h-[92dvh] md:min-h-0"
        >
          <video
            src={item.videoUrl}
            autoPlay
            loop
            controls
            className="w-full h-full object-cover"
          />
          
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
          
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-16 pointer-events-none">
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-black font-cinema uppercase tracking-tighter">
                  {item.type}
                </span>
                <span className="text-[11px] font-cinema tracking-[0.4em] text-white/50 uppercase">
                  {item.subtitle}
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-8xl font-cinema font-bold mb-6 md:mb-8 tracking-tighter">
                {item.title}
              </h2>
              
              <div className="flex flex-col md:flex-row gap-3 md:gap-4 pointer-events-auto">
                <button className="group relative px-6 sm:px-10 py-3 md:py-4 bg-white text-black font-cinema font-bold rounded-full transition-transform active:scale-95 flex items-center justify-center gap-2 text-sm md:text-base">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                  WATCH FULL SCREEN
                </button>
                <button className="px-6 sm:px-10 py-3 md:py-4 bg-white/5 text-white font-cinema font-bold rounded-full border border-white/10 backdrop-blur-md hover:bg-white/10 transition-all text-sm md:text-base">
                  SAVE TO ARCHIVE
                </button>
              </div>
            </motion.div>
          </div>

          <button
            onClick={onClose}
            className="fixed top-4 right-4 md:absolute md:top-10 md:right-10 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all z-50 active:scale-90"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ExpandedModal;
