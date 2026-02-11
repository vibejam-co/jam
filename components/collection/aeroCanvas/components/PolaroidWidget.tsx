
import React from 'react';
import { motion } from 'framer-motion';
import { Tape } from './Tape';

interface PolaroidProps {
  image: string;
  title: string;
  subtitle: string;
  rotation: number;
}

export const PolaroidWidget: React.FC<PolaroidProps> = ({ image, title, subtitle, rotation }) => {
  return (
    <motion.div
      whileHover={{ 
        scale: 1.05, 
        rotate: 0, 
        zIndex: 50,
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
      }}
      style={{ rotate: rotation }}
      className="bg-white p-4 pb-12 shadow-2xl w-64 flex flex-col items-center relative transition-shadow duration-300"
    >
      <Tape />
      <div className="w-full aspect-square overflow-hidden bg-gray-100 mb-4 border-2 border-gray-50">
        <img src={image} alt={title} className="w-full h-full object-cover grayscale-[20%]" />
      </div>
      <div className="text-center">
        <h3 className="font-bold text-gray-800 text-lg uppercase tracking-wider">{title}</h3>
        <p className="text-sm text-gray-500 font-medium italic">{subtitle}</p>
      </div>
    </motion.div>
  );
};
