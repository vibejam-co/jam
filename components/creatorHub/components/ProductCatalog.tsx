
import React from 'react';
import { Product } from '../types';

interface Props {
  products: Product[];
}

const ProductCatalog: React.FC<Props> = ({ products }) => {
  return (
    <div className="py-6">
      <h3 className="text-xl font-bold mb-6 text-[#332D2B] px-1 font-rounded">Boutique Shelf</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {products.map((product) => (
          <div 
            key={product.id}
            className="bg-white p-4 rounded-[20px] border border-[#E5E1D8] soft-shadow group hover:border-[#E07A5F]/30 transition-all flex flex-col h-full"
          >
            <div className="aspect-square rounded-[14px] overflow-hidden mb-4">
              <img 
                src={product.image} 
                alt={product.title} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </div>
            <div className="flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-1">
                <h4 className="font-bold text-[#332D2B] font-rounded">{product.title}</h4>
                {product.price && (
                  <span className="text-sm font-bold text-[#81B29A]">{product.price}</span>
                )}
              </div>
              <p className="text-sm text-[#332D2B]/60 mb-4 line-clamp-2 leading-snug">
                {product.description}
              </p>
              <button className="mt-auto bg-[#FDFBF7] border border-[#E5E1D8] text-[#332D2B] font-bold py-2 rounded-full text-sm hover:bg-[#E07A5F] hover:text-white hover:border-transparent transition-all active:scale-[0.98]">
                {product.cta}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductCatalog;
