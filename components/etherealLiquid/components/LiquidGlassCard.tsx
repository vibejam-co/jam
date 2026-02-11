
import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface LiquidGlassCardProps {
  children: React.ReactNode;
  className?: string;
  parallaxFactor?: number;
}

const LiquidGlassCard: React.FC<LiquidGlassCardProps> = ({ children, className = "", parallaxFactor = 0 }) => {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [10, -10]), { stiffness: 100, damping: 20 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-10, 10]), { stiffness: 100, damping: 20 });

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    x.set(mouseX / width - 0.5);
    y.set(mouseY / height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className={`
        relative group cursor-pointer perspective-1000
        rounded-[24px] overflow-hidden
        backdrop-blur-[40px] saturate-[1.1]
        bg-white/20 border-t border-white/40 border-l border-white/30
        shadow-[0_20px_50px_rgba(0,0,0,0.05)]
        transition-all duration-300
        hover:shadow-[0_40px_80px_rgba(0,0,0,0.08)]
        ${className}
      `}
    >
      {/* Light Refraction Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/5 pointer-events-none" />
      
      {/* Texture Layer */}
      <div className="absolute inset-0 noise-overlay opacity-[0.08] mix-blend-overlay pointer-events-none" />
      
      {/* Progressive Blur Bottom Edge Illusion */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white/10 to-transparent blur-xl pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 w-full h-full p-4 md:p-6" style={{ transform: "translateZ(30px)" }}>
        {children}
      </div>
    </motion.div>
  );
};

export default LiquidGlassCard;
