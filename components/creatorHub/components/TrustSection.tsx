
import React from 'react';
import { TrustBadge } from '../types';

interface Props {
  badges: TrustBadge[];
}

const TrustSection: React.FC<Props> = ({ badges }) => {
  return (
    <div className="py-10">
      <div className="bg-[#81B29A]/5 rounded-[24px] p-6 border border-[#81B29A]/20">
        <h3 className="text-sm font-bold text-[#81B29A] uppercase tracking-widest mb-6 text-center md:text-left">
          Trusted Proof
        </h3>
        <div className="flex flex-col md:flex-row flex-wrap gap-4 md:gap-8 justify-center md:justify-start">
          {badges.map((badge, idx) => (
            <div key={idx} className="flex items-center space-x-2 bg-white/50 px-4 py-3 rounded-full border border-[#81B29A]/10">
              {badge.icon}
              <span className="text-[#332D2B] font-medium text-sm whitespace-nowrap">{badge.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrustSection;
