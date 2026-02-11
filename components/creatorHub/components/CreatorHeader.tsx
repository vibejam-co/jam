
import React from 'react';
import { Twitter, Instagram, Github } from 'lucide-react';
import { Creator } from '../types';

interface Props {
  creator: Creator;
}

const CreatorHeader: React.FC<Props> = ({ creator }) => {
  return (
    <div className="flex flex-col items-center md:items-start text-center md:text-left py-6 md:py-8 px-1 sm:px-4">
      <div className="relative mb-6">
        <img 
          src={creator.avatar} 
          alt={creator.name} 
          className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white soft-shadow object-cover"
        />
        <div className="absolute -bottom-1 -right-1 bg-[#E07A5F] text-white p-2 rounded-full border-2 border-[#FDFBF7]">
          <span className="text-xs">✨</span>
        </div>
      </div>
      <h1 className="text-3xl sm:text-4xl font-bold mb-3 text-[#332D2B]">
        {creator.name}
      </h1>
      <p className="text-base sm:text-lg text-[#332D2B]/70 max-w-sm leading-relaxed mb-6 font-medium">
        {creator.description}
      </p>
      
      <div className="flex space-x-3">
        {creator.socials.map((social) => (
          <a
            key={social.platform}
            href={social.url}
            className="p-3 bg-white rounded-full soft-shadow hover:scale-110 transition-transform active:scale-95 border border-[#E5E1D8]"
            aria-label={social.platform}
          >
            {social.platform === 'Twitter' && <Twitter size={18} className="text-[#332D2B]/60" />}
            {social.platform === 'Instagram' && <Instagram size={18} className="text-[#332D2B]/60" />}
            {social.platform === 'Github' && <Github size={18} className="text-[#332D2B]/60" />}
          </a>
        ))}
      </div>
    </div>
  );
};

export default CreatorHeader;
