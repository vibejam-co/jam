
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface NewsletterProps {
  title: string;
  description: string;
  rotation: number;
}

export const NewsletterEnvelope: React.FC<NewsletterProps> = ({ title, description, rotation }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  return (
    <motion.div
      style={{ rotate: rotation }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="relative w-[280px] md:w-[340px] h-[180px] md:h-[220px] cursor-pointer group"
      onClick={() => !isOpen && setIsOpen(true)}
    >
      {/* Letter Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: 0, opacity: 0 }}
            animate={{ y: -100, opacity: 1 }}
            exit={{ y: 0, opacity: 0 }}
            className="absolute left-2 right-2 md:left-4 md:right-4 bg-white p-4 md:p-6 shadow-2xl border border-gray-100 z-10 rounded-sm"
          >
            {subscribed ? (
              <div className="text-center py-2 md:py-4">
                <h4 className="text-green-600 font-bold text-sm md:text-lg">You're in! 📬</h4>
                <p className="text-[10px] md:text-sm text-gray-500">Check your inbox for the vibe.</p>
              </div>
            ) : (
              <>
                <h4 className="font-extrabold text-gray-800 mb-1 md:mb-2 uppercase text-[10px] md:text-sm tracking-widest">{title}</h4>
                <p className="text-[9px] md:text-xs text-gray-500 mb-3 md:mb-4 leading-tight">{description}</p>
                <div className="flex gap-2">
                  <input 
                    type="email" 
                    placeholder="Email..." 
                    className="flex-1 text-[10px] md:text-xs border-b border-gray-200 focus:border-black outline-none pb-1"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSubscribed(true);
                    }}
                    className="bg-black text-white text-[9px] md:text-[10px] px-2 md:px-3 py-1 rounded hover:bg-gray-800 transition-colors uppercase font-bold shrink-0"
                  >
                    Join
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Physical Envelope */}
      <div className="absolute inset-0 bg-[#fdfdfd] border-b-2 border-gray-200 shadow-xl overflow-hidden rounded-sm z-20">
        {/* Envelope Flap Top */}
        <motion.div 
          className="absolute top-0 left-0 right-0 h-1/2 bg-[#fcfcfc] border-b border-gray-200 origin-top z-30"
          animate={{ rotateX: isOpen ? -160 : 0 }}
          style={{ transformStyle: 'preserve-3d' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-transparent opacity-20" />
        </motion.div>
        
        {/* Envelope Body */}
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-[#f8f8f8] z-20 flex items-center justify-center">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-gray-200 flex items-center justify-center">
                <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-red-500/10 border-2 border-red-500 flex items-center justify-center">
                    <span className="text-red-500 font-black text-[10px] md:text-xs">V</span>
                </div>
            </div>
        </div>
      </div>
    </motion.div>
  );
};
