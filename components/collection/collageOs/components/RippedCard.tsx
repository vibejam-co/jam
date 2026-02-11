
import React, { useMemo } from 'react';

interface RippedCardProps {
  children: React.ReactNode;
  className?: string;
  color?: string;
}

/**
 * Generates a random jagged polygon clip-path
 */
const generateJaggedPath = () => {
  const points = [];
  // Top edge
  for (let i = 0; i <= 100; i += 10) {
    points.push(`${i}% ${Math.random() * 5}%`);
  }
  // Right edge
  for (let i = 10; i <= 90; i += 10) {
    points.push(`${100 - Math.random() * 5}% ${i}%`);
  }
  // Bottom edge
  for (let i = 100; i >= 0; i -= 10) {
    points.push(`${i}% ${100 - Math.random() * 5}%`);
  }
  // Left edge
  for (let i = 90; i >= 10; i -= 10) {
    points.push(`${Math.random() * 5}% ${i}%`);
  }
  return `polygon(${points.join(', ')})`;
};

export const RippedCard: React.FC<RippedCardProps> = ({ children, className = '', color = 'bg-white' }) => {
  const clipPath = useMemo(() => generateJaggedPath(), []);

  return (
    <div 
      className={`relative ${color} paper-texture ${className} group`}
      style={{ clipPath }}
    >
      {/* Tape Decoration (top-left) */}
      <div className="absolute -top-2 -left-4 w-16 h-6 bg-yellow-200/60 rotate-[-25deg] shadow-sm pointer-events-none group-hover:bg-yellow-200/80 transition-colors z-10" />
      
      {/* Content */}
      <div className="relative z-0">
        {children}
      </div>

      {/* Paper Grain Filter Overlay (Specific to this card) */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/p6.png')] opacity-10 pointer-events-none" />
    </div>
  );
};
