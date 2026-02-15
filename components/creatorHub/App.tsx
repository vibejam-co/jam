
import React, { useEffect, useMemo, useRef, useState } from 'react';
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

interface CreatorHubAppProps {
  forcedViewport?: 'mobile' | 'desktop';
  profileOverride?: {
    name?: string;
    bio?: string;
    avatar?: string;
  };
  linksOverride?: Record<string, string>;
  slugOverride?: string;
}

const normalizeUrl = (raw?: string): string | null => {
  if (!raw) {
    return null;
  }
  const value = raw.trim();
  if (!value || value === '#') {
    return null;
  }
  if (/^(https?:\/\/|mailto:|tel:)/i.test(value)) {
    return value;
  }
  if (value.startsWith('www.')) {
    return `https://${value}`;
  }
  if (value.includes('.')) {
    return `https://${value}`;
  }
  return null;
};

const firstDefinedLink = (links: Record<string, string>, keys: string[]): string | null => {
  for (const key of keys) {
    const normalized = normalizeUrl(links[key]);
    if (normalized) {
      return normalized;
    }
  }
  return null;
};

const App: React.FC<CreatorHubAppProps> = ({ forcedViewport, profileOverride, linksOverride, slugOverride }) => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [isCompactByWidth, setIsCompactByWidth] = useState(false);

  useEffect(() => {
    if (!rootRef.current || typeof ResizeObserver === 'undefined' || forcedViewport) {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      setIsCompactByWidth(entry.contentRect.width < 980);
    });
    observer.observe(rootRef.current);

    return () => observer.disconnect();
  }, [forcedViewport]);

  const isCompact = forcedViewport ? forcedViewport === 'mobile' : isCompactByWidth;
  const fallbackProfileUrl = slugOverride ? `https://vibejam.co/${slugOverride.replace(/^@/, '')}` : 'https://vibejam.co';
  const resolvedLinks = linksOverride ?? {};
  const twitterUrl = firstDefinedLink(resolvedLinks, ['x', 'twitter']) ?? fallbackProfileUrl;
  const instagramUrl = firstDefinedLink(resolvedLinks, ['instagram']) ?? fallbackProfileUrl;
  const githubUrl = firstDefinedLink(resolvedLinks, ['github']) ?? fallbackProfileUrl;
  const websiteUrl = firstDefinedLink(resolvedLinks, ['website', 'portfolio']) ?? fallbackProfileUrl;
  const newsletterUrl = firstDefinedLink(resolvedLinks, ['newsletter', 'email', 'mail']) ?? websiteUrl;
  const communityUrl =
    firstDefinedLink(resolvedLinks, ['community', 'discord', 'telegram', 'x', 'twitter', 'instagram']) ?? twitterUrl;

  const resolvedCreator = useMemo(
    () => ({
      ...CREATOR,
      name: profileOverride?.name?.trim() || CREATOR.name,
      avatar: profileOverride?.avatar?.trim() || CREATOR.avatar,
      description: profileOverride?.bio?.trim() || CREATOR.description,
      socials: [
        { platform: 'Twitter', url: twitterUrl, icon: 'twitter' },
        { platform: 'Instagram', url: instagramUrl, icon: 'instagram' },
        { platform: 'Github', url: githubUrl, icon: 'github' },
      ],
    }),
    [githubUrl, instagramUrl, profileOverride?.avatar, profileOverride?.bio, profileOverride?.name, twitterUrl],
  );

  const resolvedCtaCards = useMemo(
    () =>
      CTA_CARDS.map((cta) => {
        if (cta.title === 'Visit Website') {
          return { ...cta, url: websiteUrl };
        }
        if (cta.title === 'Join Newsletter') {
          return { ...cta, url: newsletterUrl };
        }
        if (cta.title === 'Community') {
          return { ...cta, url: communityUrl };
        }
        return cta;
      }),
    [communityUrl, newsletterUrl, websiteUrl],
  );

  return (
    <div
      ref={rootRef}
      className={`min-h-screen w-full max-w-7xl mx-auto overflow-x-hidden ${isCompact ? 'px-3 pb-12 pt-4' : 'px-3 sm:px-5 md:px-6 lg:px-8 pb-20 pt-16'}`}
    >
      <div className={isCompact ? 'flex flex-col gap-8' : 'grid grid-cols-12 gap-10 xl:gap-12'}>
        
        {/* Mobile: Full Width | Desktop: Left Column (4/12) */}
        <div className={isCompact ? 'space-y-8' : 'col-span-5 space-y-12 sticky top-8 self-start'}>
          <CreatorHeader creator={resolvedCreator} compact={isCompact} />
          
          {!isCompact && <FeaturedCard product={FEATURED_PRODUCT} compact={false} />}

          <div>
             <div className="flex flex-col space-y-2 opacity-50 text-[11px] sm:text-xs italic">
                <p>Curated on VibeJam • Proudly Indie</p>
             </div>
          </div>
        </div>

        {/* Mobile: Below Header | Desktop: Right Column (7/12) */}
        <div className={isCompact ? 'space-y-8' : 'col-span-7 space-y-12'}>
          
          {/* Featured Card shows on top in Mobile */}
          {isCompact && <FeaturedCard product={FEATURED_PRODUCT} compact />}

          {/* Top Links Grid */}
          <div className={isCompact ? 'grid grid-cols-1 gap-3' : 'grid grid-cols-3 gap-4'}>
            {resolvedCtaCards.map((cta, idx) => (
              <CTACard key={idx} cta={cta} compact={isCompact} />
            ))}
          </div>

          {/* Boutique Shelf / Catalog */}
          <ProductCatalog products={CATALOG} compact={isCompact} />

          {/* Trust / Proof Section */}
          <TrustSection badges={TRUST_BADGES} compact={isCompact} />

          {/* Timeline / Journal */}
          <Timeline entries={TIMELINE} compact={isCompact} />

          {/* Bottom Branding */}
          <footer className={`pt-10 pb-6 border-t border-[#E5E1D8] ${isCompact ? 'text-center' : 'text-left'}`}>
            <div className="inline-flex items-center space-x-2 text-[#332D2B]/40 font-medium text-sm sm:text-base">
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
