
import React from 'react';
import { Signal } from '../types';

interface SignalCardProps {
  signal: Signal;
}

export const SignalCard: React.FC<SignalCardProps> = ({ signal }) => {
  return (
    <div className="group flex justify-between items-center py-5 border-b border-neutral-900 hover:border-neutral-700 transition-colors cursor-default">
      <div>
        <p className="font-mono text-[9px] uppercase tracking-widest text-neutral-500 group-hover:text-neutral-300 transition-colors">
          {signal.label}
        </p>
        <p className="text-lg font-medium tracking-tight">
          {signal.value}
        </p>
      </div>
      {signal.verified && (
        <div className="w-2 h-2 rounded-full bg-white opacity-20 shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
      )}
    </div>
  );
};
