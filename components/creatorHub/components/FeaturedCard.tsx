
import React from 'react';
import { Product } from '../types';
import { ArrowRight } from 'lucide-react';

interface Props {
  product: Product;
  compact?: boolean;
}

const FeaturedCard: React.FC<Props> = ({ product, compact = false }) => {
  return (
    <div className={`bg-white rounded-[20px] overflow-hidden soft-shadow border border-[#E5E1D8] transition-all flex flex-col ${compact ? '' : 'md:hover:scale-[1.01] sm:rounded-[24px]'}`}>
      <div className={`overflow-hidden ${compact ? 'h-48 xs:h-52' : 'h-52 sm:h-56 md:h-64'}`}>
        <img 
          src={product.image} 
          alt={product.title} 
          className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
        />
      </div>
      <div className={compact ? 'p-4 xs:p-5' : 'p-5 sm:p-6 md:p-8'}>
        <div className={`inline-flex items-center px-3 py-1 rounded-full bg-[#E07A5F]/10 text-[#E07A5F] font-bold uppercase tracking-wider mb-4 ${compact ? 'text-[10px] xs:text-xs' : 'text-xs'}`}>
          Featured Release
        </div>
        <h2 className={`font-bold mb-3 text-[#332D2B] leading-tight ${compact ? 'text-lg xs:text-xl' : 'text-xl sm:text-2xl md:text-3xl'}`}>
          {product.title}
        </h2>
        <p className={`text-[#332D2B]/70 leading-relaxed ${compact ? 'text-sm xs:text-base mb-6' : 'text-base md:text-lg mb-6 md:mb-8'}`}>
          {product.description}
        </p>
        <button className={`clay-gradient text-white rounded-full font-bold soft-shadow flex items-center justify-center space-x-2 hover:opacity-90 active:scale-[0.98] transition-all ${compact ? 'px-5 xs:px-6 py-3 text-sm xs:text-base w-full' : 'px-6 md:px-8 py-3.5 md:py-4 text-base md:text-lg w-full md:w-auto'}`}>
          <span>{product.cta}</span>
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default FeaturedCard;
