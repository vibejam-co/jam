
import React from 'react';
import { motion } from 'framer-motion';

interface StickerProps {
  label?: string;
  type?: 'note' | 'sticker' | 'spotify' | 'arrow';
  content?: string;
  rotation: number;
}

export const Sticker: React.FC<StickerProps> = ({ label, type = 'sticker', content, rotation }) => {
  if (type === 'note') {
    return (
      <motion.div
        style={{ rotate: rotation }}
        whileHover={{ scale: 1.1, rotate: 0 }}
        className="bg-yellow-100 p-6 shadow-lg w-48 min-h-[180px] border-l-4 border-yellow-200 handwritten text-xl text-gray-700"
      >
        {content}
      </motion.div>
    );
  }

  if (type === 'spotify') {
    return (
        <motion.div
          style={{ rotate: rotation }}
          whileHover={{ scale: 1.05, rotate: -2 }}
          className="bg-[#1DB954] text-white p-4 shadow-xl rounded-full flex items-center gap-4 px-6"
        >
          <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
            <div className="w-4 h-4 text-white">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.494 17.308c-.217.356-.679.468-1.034.252-2.864-1.75-6.47-2.146-10.716-1.176-.408.094-.814-.162-.908-.571-.094-.409.162-.815.571-.908 4.654-1.064 8.64-.61 11.834 1.34.356.216.468.678.253 1.033zm1.467-3.26c-.274.444-.852.585-1.296.311-3.278-2.016-8.277-2.6-12.152-1.424-.502.152-1.033-.131-1.185-.632-.152-.501.131-1.033.632-1.185 4.432-1.344 9.94-.693 13.693 1.614.444.274.585.852.311 1.296zm.126-3.388c-3.932-2.336-10.428-2.55-14.218-1.4c-.604.183-1.246-.167-1.429-.771-.183-.604.167-1.246.771-1.429 4.34-1.318 11.528-1.066 16.03 1.606.543.322.721 1.026.399 1.569-.323.543-1.026.721-1.569.399z"/></svg>
            </div>
          </div>
          <span className="text-sm font-bold truncate max-w-[120px]">{content}</span>
        </motion.div>
      );
  }

  if (type === 'arrow') {
      return (
        <motion.div style={{ rotate: rotation }} className="text-gray-400">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 17L17 7M17 7H7M17 7V17" />
            </svg>
        </motion.div>
      )
  }

  return (
    <motion.div
      whileHover={{ scale: 1.2, rotate: rotation + 10 }}
      style={{ rotate: rotation }}
      className="bg-white border-2 border-black rounded-lg px-6 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black font-black uppercase text-sm italic"
    >
      {label}
    </motion.div>
  );
};
