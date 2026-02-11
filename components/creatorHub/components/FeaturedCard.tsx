
import React from 'react';
import { Product } from '../types';
import { ArrowRight } from 'lucide-react';

interface Props {
  product: Product;
}

const FeaturedCard: React.FC<Props> = ({ product }) => {
  return (
    <div className="bg-white rounded-[24px] overflow-hidden soft-shadow border border-[#E5E1D8] transition-all hover:scale-[1.01] flex flex-col">
      <div className="h-52 sm:h-56 md:h-64 overflow-hidden">
        <img 
          src={product.image} 
          alt={product.title} 
          className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
        />
      </div>
      <div className="p-5 sm:p-6 md:p-8">
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#E07A5F]/10 text-[#E07A5F] text-xs font-bold uppercase tracking-wider mb-4">
          Featured Release
        </div>
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 text-[#332D2B] leading-tight">
          {product.title}
        </h2>
        <p className="text-[#332D2B]/70 text-base md:text-lg mb-6 md:mb-8 leading-relaxed">
          {product.description}
        </p>
        <button className="clay-gradient text-white px-6 md:px-8 py-3.5 md:py-4 rounded-full font-bold text-base md:text-lg soft-shadow flex items-center justify-center space-x-2 w-full md:w-auto hover:opacity-90 active:scale-[0.98] transition-all">
          <span>{product.cta}</span>
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default FeaturedCard;
