
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Globe, Mail, Users } from 'lucide-react';
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
import type {
  CTALink,
  CreatorHubRenderModel,
  CreatorHubSectionKey,
  Product,
  TimelineEntry,
  TrustBadge,
} from './types';

interface CreatorHubAppProps {
  forcedViewport?: 'mobile' | 'desktop';
  profileOverride?: {
    name?: string;
    bio?: string;
    avatar?: string;
  };
  linksOverride?: Record<string, string>;
  slugOverride?: string;
  creatorModel?: CreatorHubRenderModel;
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

const CTA_COLORS = ['bg-[#F2CC8F]/20', 'bg-[#E07A5F]/15', 'bg-[#81B29A]/20', 'bg-[#DDBEA9]/18', 'bg-[#A8DADC]/18'];

const ctaIconForTitle = (title: string): React.ReactNode => {
  const token = title.toLowerCase();
  if (token.includes('newsletter') || token.includes('mail') || token.includes('email')) {
    return <Mail size={24} />;
  }
  if (token.includes('community') || token.includes('discord') || token.includes('telegram')) {
    return <Users size={24} />;
  }
  return <Globe size={24} />;
};

const buildCtaCardsFromActions = (items: Array<{ id: string; title: string; url: string }>): CTALink[] =>
  items.map((item, index) => ({
    title: item.title,
    url: item.url,
    icon: ctaIconForTitle(item.title),
    color: CTA_COLORS[index % CTA_COLORS.length],
  }));

const DEFAULT_SECTIONS: Array<{ key: CreatorHubSectionKey; label: string; visible: boolean; position: number }> = [
  { key: 'social_row', label: 'Social Links', visible: true, position: 0 },
  { key: 'top_actions', label: 'Top Actions', visible: true, position: 1 },
  { key: 'featured_release', label: 'Featured Release', visible: true, position: 2 },
  { key: 'boutique_shelf', label: 'Boutique Shelf', visible: true, position: 3 },
  { key: 'trusted_proof', label: 'Trusted Proof', visible: true, position: 4 },
  { key: 'vibejam_log', label: 'VibeJam Log', visible: true, position: 5 },
];

const App: React.FC<CreatorHubAppProps> = ({ forcedViewport, profileOverride, linksOverride, slugOverride, creatorModel }) => {
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
  const isSocialRowVisible = useMemo(
    () => (creatorModel?.sections ?? DEFAULT_SECTIONS).find((item) => item.key === 'social_row')?.visible ?? true,
    [creatorModel?.sections],
  );

  const resolvedCreator = useMemo(
    () => ({
      ...CREATOR,
      name: profileOverride?.name?.trim() || CREATOR.name,
      avatar: profileOverride?.avatar?.trim() || CREATOR.avatar,
      description: profileOverride?.bio?.trim() || CREATOR.description,
      socials: isSocialRowVisible
        ? (creatorModel?.socials ?? [
            { platform: 'Twitter', url: twitterUrl, icon: 'twitter' },
            { platform: 'Instagram', url: instagramUrl, icon: 'instagram' },
            { platform: 'Github', url: githubUrl, icon: 'github' },
          ])
        : [],
    }),
    [creatorModel?.socials, githubUrl, instagramUrl, isSocialRowVisible, profileOverride?.avatar, profileOverride?.bio, profileOverride?.name, twitterUrl],
  );

  const fallbackCtaCards = useMemo(
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
  const resolvedCtaCards = useMemo(
    () => (creatorModel ? buildCtaCardsFromActions(creatorModel.topActions) : fallbackCtaCards),
    [creatorModel, fallbackCtaCards],
  );
  const resolvedProducts = useMemo<Product[]>(
    () => creatorModel?.products ?? CATALOG,
    [creatorModel?.products],
  );
  const resolvedFeaturedProduct = useMemo<Product>(
    () => creatorModel?.featuredRelease ?? FEATURED_PRODUCT,
    [creatorModel?.featuredRelease],
  );
  const resolvedTrustBadges = useMemo<TrustBadge[]>(
    () =>
      creatorModel
        ? creatorModel.trustBadgeLabels.map((label) => ({
            label,
            icon: <CheckCircle2 size={18} className="text-[#81B29A]" />,
          }))
        : TRUST_BADGES,
    [creatorModel],
  );
  const resolvedTimeline = useMemo<TimelineEntry[]>(
    () =>
      creatorModel
        ? creatorModel.logEntries.map((entry) => ({
            date: entry.date,
            title: entry.title,
            content: entry.content,
          }))
        : TIMELINE,
    [creatorModel],
  );
  const orderedSections = useMemo(
    () => (creatorModel?.sections ?? DEFAULT_SECTIONS).filter((item) => item.visible).sort((a, b) => a.position - b.position),
    [creatorModel?.sections],
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

          <div>
             <div className="flex flex-col space-y-2 opacity-50 text-[11px] sm:text-xs italic">
                <p>Curated on VibeJam • Proudly Indie</p>
             </div>
          </div>
        </div>

        {/* Mobile: Below Header | Desktop: Right Column (7/12) */}
        <div className={isCompact ? 'space-y-8' : 'col-span-7 space-y-12'}>
          {orderedSections.map((section) => {
            if (section.key === 'social_row') {
              return null;
            }
            if (section.key === 'top_actions') {
              return (
                <div key={section.key} className={isCompact ? 'grid grid-cols-1 gap-3' : 'grid grid-cols-3 gap-4'}>
                  {resolvedCtaCards.map((cta, idx) => (
                    <CTACard key={`${cta.title}-${idx}`} cta={cta} compact={isCompact} />
                  ))}
                </div>
              );
            }
            if (section.key === 'featured_release') {
              return <FeaturedCard key={section.key} product={resolvedFeaturedProduct} compact={isCompact} />;
            }
            if (section.key === 'boutique_shelf') {
              return <ProductCatalog key={section.key} products={resolvedProducts} compact={isCompact} />;
            }
            if (section.key === 'trusted_proof') {
              return <TrustSection key={section.key} badges={resolvedTrustBadges} compact={isCompact} />;
            }
            if (section.key === 'vibejam_log') {
              return <Timeline key={section.key} entries={resolvedTimeline} compact={isCompact} />;
            }
            return null;
          })}

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
