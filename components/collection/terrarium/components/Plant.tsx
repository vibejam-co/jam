
import React from 'react';
import { motion } from 'framer-motion';
import { GardenItemProps } from '../types';

interface PlantProps extends GardenItemProps {
  color: string;
  height: number;
}

const Plant: React.FC<PlantProps> = ({ wind, delay = 0, color, height }) => {
  const swayRotation = (Math.random() - 0.5) * 4;
  const duration = 3 + Math.random() * 2;

  return (
    <motion.div 
      className="relative origin-bottom"
      style={{ height: `${height}px` }}
      animate={{ 
        rotate: [swayRotation - 2 + wind.x, swayRotation + 2 + wind.x]
      }}
      transition={{
        rotate: {
          duration,
          repeat: Infinity,
          repeatType: 'reverse',
          ease: 'easeInOut'
        }
      }}
    >
      <svg width="40" height={height} viewBox={`0 0 40 ${height}`} fill="none" className="overflow-visible">
        <motion.path
          d={`M20 ${height} Q ${20 + wind.x * 2} ${height/2} 20 0`}
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, delay, ease: "easeOut" }}
        />
        
        {/* Leaves */}
        {[height * 0.2, height * 0.5, height * 0.8].map((y, i) => (
          <motion.circle
            key={i}
            cx={20 + (i % 2 === 0 ? 8 : -8)}
            cy={y}
            r="8"
            fill={color}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: delay + 1 + i * 0.2 }}
          />
        ))}
      </svg>
    </motion.div>
  );
};

export default Plant;
