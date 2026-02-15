
import React from 'react';
import { CTALink } from '../types';

interface Props {
  cta: CTALink;
  compact?: boolean;
}

const CTACard: React.FC<Props> = ({ cta, compact = false }) => {
  return (
    <a 
      href={cta.url}
      target="_blank"
      rel="noreferrer"
      className={`${cta.color} rounded-[20px] flex flex-col items-center justify-center text-center group transition-all hover:scale-[1.03] active:scale-[0.97] border border-transparent hover:border-[#332D2B]/10 ${compact ? 'p-4 min-h-[130px]' : 'p-5 md:p-6 min-h-[148px] md:min-h-0'}`}
    >
      <div className={`bg-white/80 rounded-full soft-shadow text-[#332D2B] ${compact ? 'p-3 mb-3' : 'p-4 mb-4'}`}>
        {cta.icon}
      </div>
      <span className={`font-rounded font-bold text-[#332D2B] leading-tight ${compact ? 'text-sm' : 'text-base md:text-lg'}`}>
        {cta.title}
      </span>
    </a>
  );
};

export default CTACard;
