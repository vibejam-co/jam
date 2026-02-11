
import React from 'react';
import { CTALink } from '../types';

interface Props {
  cta: CTALink;
}

const CTACard: React.FC<Props> = ({ cta }) => {
  return (
    <a 
      href={cta.url}
      className={`${cta.color} p-5 md:p-6 rounded-[20px] min-h-[148px] md:min-h-0 flex flex-col items-center justify-center text-center group transition-all hover:scale-[1.03] active:scale-[0.97] border border-transparent hover:border-[#332D2B]/10`}
    >
      <div className="bg-white/80 p-4 rounded-full mb-4 soft-shadow text-[#332D2B]">
        {cta.icon}
      </div>
      <span className="font-rounded font-bold text-[#332D2B] text-base md:text-lg leading-tight">
        {cta.title}
      </span>
    </a>
  );
};

export default CTACard;
