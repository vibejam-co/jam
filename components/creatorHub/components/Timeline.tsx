
import React from 'react';
import { TimelineEntry } from '../types';

interface Props {
  entries: TimelineEntry[];
}

const Timeline: React.FC<Props> = ({ entries }) => {
  return (
    <div className="py-6">
      <h3 className="text-xl font-bold mb-8 text-[#332D2B] font-rounded">VibeJam Log</h3>
      <div className="relative border-l-2 border-[#E5E1D8] ml-2 md:ml-3 pl-6 md:pl-8 space-y-8 md:space-y-10">
        {entries.map((entry, idx) => (
          <div key={idx} className="relative">
            <div className="absolute -left-[33px] md:-left-[41px] top-0 w-5 h-5 md:w-6 md:h-6 rounded-full bg-white border-2 border-[#E07A5F] flex items-center justify-center text-[#E07A5F] soft-shadow">
              {entry.icon}
            </div>
            <div>
              <span className="text-xs font-bold text-[#E07A5F] uppercase tracking-wider block mb-1">
                {entry.date}
              </span>
              <h4 className="text-lg font-bold text-[#332D2B] mb-2 font-rounded">
                {entry.title}
              </h4>
              <p className="text-[#332D2B]/70 leading-relaxed text-sm">
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
