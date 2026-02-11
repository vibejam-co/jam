
import React, { useEffect, useState } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';
import { COLORS } from './constants';

interface CustomCursorProps {
  isHovering: boolean;
}

const CustomCursor: React.FC<CustomCursorProps> = ({ isHovering }) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth physics for the follower
  const springConfig = { damping: 25, stiffness: 200 };
  const cursorX = useSpring(mouseX, springConfig);
  const cursorY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <motion.div
      style={{
        x: cursorX,
        y: cursorY,
        translateX: '-50%',
        translateY: '-50%',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 9999,
        pointerEvents: 'none',
      }}
      animate={{
        width: isHovering ? 80 : 12,
        height: isHovering ? 80 : 12,
        backgroundColor: isHovering ? 'transparent' : COLORS.internationalOrange,
        borderColor: COLORS.internationalOrange,
        borderWidth: isHovering ? 2 : 0,
      }}
      transition={{ type: 'spring', damping: 20, stiffness: 250 }}
      className="rounded-full flex items-center justify-center overflow-hidden"
    >
      {isHovering && (
        <motion.span 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-[10px] font-sans-editorial font-bold text-[#FF4F00] uppercase tracking-widest"
        >
          View
        </motion.span>
      )}
    </motion.div>
  );
};

export default CustomCursor;
