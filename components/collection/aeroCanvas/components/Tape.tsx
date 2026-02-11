
import React from 'react';

export const Tape: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={`absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-8 bg-white/40 backdrop-blur-sm border border-white/20 rotate-1 shadow-sm z-20 ${className}`}>
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#000_1px,transparent_1px)] bg-[size:4px_4px]" />
    </div>
  );
};
