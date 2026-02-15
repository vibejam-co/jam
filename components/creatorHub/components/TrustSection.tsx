
import React from 'react';
import { TrustBadge } from '../types';

interface Props {
  badges: TrustBadge[];
  compact?: boolean;
}

const TrustSection: React.FC<Props> = ({ badges, compact = false }) => {
  return (
    <div className={compact ? 'py-8' : 'py-10'}>
      <div className={`bg-[#81B29A]/5 border border-[#81B29A]/20 ${compact ? 'rounded-[20px] p-4' : 'rounded-[24px] p-6'}`}>
        <h3 className="text-sm font-bold text-[#81B29A] uppercase tracking-widest mb-6 text-center md:text-left">
          Trusted Proof
        </h3>
        <div className={`flex flex-wrap justify-center ${compact ? 'flex-col gap-3' : 'md:justify-start gap-4 md:gap-6'}`}>
          {badges.map((badge, idx) => (
            <div key={idx} className={`flex items-center space-x-2 bg-white/50 rounded-full border border-[#81B29A]/10 max-w-full ${compact ? 'px-3 py-2.5' : 'px-4 py-3'}`}>
              {badge.icon}
              <span className={`text-[#332D2B] font-medium break-words ${compact ? 'text-xs' : 'text-sm'}`}>{badge.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrustSection;
