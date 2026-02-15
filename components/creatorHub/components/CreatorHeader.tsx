
import React from 'react';
import { Twitter, Instagram, Github } from 'lucide-react';
import { Creator } from '../types';

interface Props {
  creator: Creator;
  compact?: boolean;
}

const CreatorHeader: React.FC<Props> = ({ creator, compact = false }) => {
  return (
    <div className={`w-full mx-auto flex flex-col py-4 px-1 ${compact ? 'max-w-md items-center text-center' : 'items-start text-left max-w-none sm:px-3 md:px-4 md:py-8'}`}>
      <div className="relative mb-6">
        <img 
          src={creator.avatar} 
          alt={creator.name} 
          className={`rounded-full border-4 border-white soft-shadow object-cover ${compact ? 'w-20 h-20 xs:w-24 xs:h-24' : 'w-24 h-24 md:w-32 md:h-32'}`}
        />
        <div className={`absolute -bottom-1 -right-1 bg-[#E07A5F] text-white rounded-full border-2 border-[#FDFBF7] ${compact ? 'p-1.5 xs:p-2' : 'p-2'}`}>
          <span className="text-xs">✨</span>
        </div>
      </div>
      <h1 className={`font-bold mb-3 text-[#332D2B] ${compact ? 'text-2xl xs:text-3xl' : 'text-3xl sm:text-4xl'}`}>
        {creator.name}
      </h1>
      <p className={`text-[#332D2B]/70 max-w-sm leading-relaxed mb-6 font-medium ${compact ? 'text-sm xs:text-base' : 'text-base sm:text-lg'}`}>
        {creator.description}
      </p>
      
      <div className={`flex flex-wrap gap-3 ${compact ? 'justify-center' : 'justify-start'}`}>
        {creator.socials.map((social) => (
          <a
            key={social.platform}
            href={social.url}
            target="_blank"
            rel="noreferrer"
            className={`bg-white rounded-full soft-shadow hover:scale-110 transition-transform active:scale-95 border border-[#E5E1D8] ${compact ? 'p-2.5 xs:p-3' : 'p-3'}`}
            aria-label={social.platform}
          >
            {social.platform === 'Twitter' && <Twitter size={compact ? 16 : 18} className="text-[#332D2B]/60" />}
            {social.platform === 'Instagram' && <Instagram size={compact ? 16 : 18} className="text-[#332D2B]/60" />}
            {social.platform === 'Github' && <Github size={compact ? 16 : 18} className="text-[#332D2B]/60" />}
          </a>
        ))}
      </div>
    </div>
  );
};

export default CreatorHeader;
