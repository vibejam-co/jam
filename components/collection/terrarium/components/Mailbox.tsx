
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mail } from 'lucide-react';
import { GardenItemProps } from '../types';

const Mailbox: React.FC<GardenItemProps> = ({ wind }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');

  return (
    <div className="relative group">
      {/* Mailbox Base */}
      <div className="w-32 h-2 origin-bottom bg-stone-400 rounded-full mb-0.5" />
      <div className="w-1 h-20 bg-stone-400 mx-auto" />
      
      {/* Mailbox Body */}
      <motion.div
        className="relative -mt-24 w-28 h-20 bg-[#B5838D] rounded-t-full cursor-pointer overflow-hidden border-2 border-[#6D4C41]"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => setIsOpen(!isOpen)}
        animate={{ rotate: wind.x * 0.1 }}
      >
        {/* Front Door */}
        <motion.div 
            className="absolute top-0 right-0 w-8 h-full bg-[#6D4C41]/30 z-10 origin-right"
            animate={{ rotateY: isOpen ? -110 : 0 }}
        />
        
        {/* Interior */}
        <div className="absolute inset-0 flex items-center justify-center">
            <Mail className="text-white/40" size={32} />
        </div>
      </motion.div>

      {/* The Flag */}
      <motion.div
        className="absolute top-[-80px] left-0 w-2 h-10 bg-red-500 origin-bottom rounded-full"
        animate={{ rotate: isHovered || isOpen ? 0 : -90 }}
        transition={{ type: 'spring', damping: 10 }}
      >
        <div className="absolute top-0 -left-2 w-6 h-4 bg-red-600 rounded-sm" />
      </motion.div>

      {/* Input Field Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="absolute left-32 top-[-100px] bg-white rounded-xl p-4 shadow-2xl border-2 border-[#A3B18A] w-64 z-50"
          >
            <h3 className="cozy-font text-lg font-bold text-[#588157] mb-2">Join the Garden Letter</h3>
            <div className="flex items-center space-x-2 bg-stone-50 rounded-lg p-2 border border-stone-200">
                <input 
                    type="email" 
                    placeholder="your@email.com" 
                    className="bg-transparent border-none focus:outline-none text-sm w-full"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="bg-[#588157] text-white p-2 rounded-md"
                >
                    <Send size={14} />
                </motion.button>
            </div>
            <p className="text-[10px] text-stone-400 mt-2">I'll only send seeds of inspiration.</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-center mt-2 font-bold text-stone-500 text-sm">Newsletter</div>
    </div>
  );
};

export default Mailbox;
