
import React from 'react';
import { TimelineEntry } from '../types';

interface Props {
  entries: TimelineEntry[];
  compact?: boolean;
}

const Timeline: React.FC<Props> = ({ entries, compact = false }) => {
  return (
    <div className={compact ? 'py-4' : 'py-6'}>
      <h3 className={`font-bold text-[#332D2B] font-rounded ${compact ? 'text-lg mb-6' : 'text-xl mb-8'}`}>VibeJam Log</h3>
      <div className={`relative border-l-2 border-[#E5E1D8] ml-2 ${compact ? 'pl-5 space-y-7' : 'ml-3 pl-8 space-y-10'}`}>
        {entries.map((entry, idx) => (
          <div key={idx} className="relative">
            <div className={`absolute top-0 rounded-full bg-white border-2 border-[#E07A5F] flex items-center justify-center text-[#E07A5F] soft-shadow ${compact ? '-left-[30px] w-5 h-5' : '-left-[41px] w-6 h-6'}`}>
              {entry.icon}
            </div>
            <div>
              <span className={`font-bold text-[#E07A5F] uppercase tracking-wider block mb-1 ${compact ? 'text-[10px]' : 'text-xs'}`}>
                {entry.date}
              </span>
              <h4 className={`font-bold text-[#332D2B] mb-2 font-rounded ${compact ? 'text-base' : 'text-lg'}`}>
                {entry.title}
              </h4>
              <p className={`text-[#332D2B]/70 leading-relaxed ${compact ? 'text-xs' : 'text-sm'}`}>
                {entry.content}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Timeline;
