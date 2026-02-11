
import React from 'react';
import CreatorHeader from './components/CreatorHeader';
import FeaturedCard from './components/FeaturedCard';
import CTACard from './components/CTACard';
import ProductCatalog from './components/ProductCatalog';
import TrustSection from './components/TrustSection';
import Timeline from './components/Timeline';
import { 
  CREATOR, 
  FEATURED_PRODUCT, 
  CTA_CARDS, 
  CATALOG, 
  TRUST_BADGES, 
  TIMELINE 
} from './constants';

const App: React.FC = () => {
  return (
    <div className="min-h-screen max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pb-16 md:pb-20">
      <div className="flex flex-col lg:grid lg:grid-cols-12 lg:gap-12 pt-6 md:pt-16">
        
        {/* Mobile: Full Width | Desktop: Left Column (4/12) */}
        <div className="lg:col-span-5 space-y-12 lg:sticky lg:top-8 lg:self-start">
          <CreatorHeader creator={CREATOR} />
          
          <div className="hidden lg:block">
            <FeaturedCard product={FEATURED_PRODUCT} />
          </div>

          <div className="lg:pt-4">
             <div className="flex flex-col space-y-2 opacity-50 text-xs italic">
                <p>Curated on VibeJam • Proudly Indie</p>
             </div>
          </div>
        </div>

        {/* Mobile: Below Header | Desktop: Right Column (7/12) */}
        <div className="lg:col-span-7 space-y-10 md:space-y-12 mt-10 lg:mt-0">
          
          {/* Featured Card shows on top in Mobile */}
          <div className="lg:hidden">
            <FeaturedCard product={FEATURED_PRODUCT} />
          </div>

          {/* Top Links Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
            {CTA_CARDS.map((cta, idx) => (
              <CTACard key={idx} cta={cta} />
            ))}
          </div>

          {/* Boutique Shelf / Catalog */}
          <ProductCatalog products={CATALOG} />

          {/* Trust / Proof Section */}
          <TrustSection badges={TRUST_BADGES} />

          {/* Timeline / Journal */}
          <Timeline entries={TIMELINE} />

          {/* Bottom Branding */}
          <footer className="pt-12 pb-8 border-t border-[#E5E1D8] text-center lg:text-left">
            <div className="inline-flex items-center space-x-2 text-[#332D2B]/40 font-medium">
              <div className="w-8 h-8 rounded-lg clay-gradient flex items-center justify-center text-white text-[10px] font-bold">VJ</div>
              <span>Create your own at VibeJam.com</span>
            </div>
          </footer>
        </div>

      </div>
    </div>
  );
};

export default App;
