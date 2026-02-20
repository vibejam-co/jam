
import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import GridItem from './components/GridItem';
import ExpandedModal from './components/ExpandedModal';
import AmbientBackground from './components/AmbientBackground';
import { GRID_ITEMS, PROFILE_DATA, CATEGORIES, MIDNIGHT_FOOTER } from './constants';
import { GridContent, MidnightZenithRenderModel, MidnightZenithSectionKey, ProfileData } from './types';
import { motion, AnimatePresence } from 'framer-motion';

interface MidnightZenithAppProps {
  forcedViewport?: 'mobile' | 'desktop';
  profileOverride?: {
    name?: string;
    bio?: string;
    avatar?: string;
    handle?: string;
  };
  canvasModel?: MidnightZenithRenderModel;
}

const DEFAULT_SECTION_ORDER: Array<{ key: MidnightZenithSectionKey; label: string; visible: boolean; position: number }> = [
  { key: 'hero', label: 'Hero', visible: true, position: 0 },
  { key: 'nav_tabs', label: 'Navigation', visible: true, position: 1 },
  { key: 'content_grid', label: 'Content Grid', visible: true, position: 2 },
  { key: 'footer_cta', label: 'Footer CTA', visible: true, position: 3 },
];

const App: React.FC<MidnightZenithAppProps> = ({ forcedViewport, profileOverride, canvasModel }) => {
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<GridContent | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [isScrolled, setIsScrolled] = useState(false);
  const isCompact = forcedViewport === 'mobile';

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 100);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const sections = useMemo(
    () => (canvasModel?.sections ?? DEFAULT_SECTION_ORDER).filter((item) => item.visible).sort((a, b) => a.position - b.position),
    [canvasModel?.sections],
  );
  const showHero = sections.some((section) => section.key === 'hero');
  const showNav = sections.some((section) => section.key === 'nav_tabs');
  const showGrid = sections.some((section) => section.key === 'content_grid');
  const showFooter = sections.some((section) => section.key === 'footer_cta');

  const resolvedCategories = useMemo(
    () => (canvasModel ? canvasModel.navTabs.map((item) => item.label) : CATEGORIES),
    [canvasModel?.navTabs],
  );
  const resolvedGridItems = useMemo(
    () => (canvasModel ? canvasModel.gridTiles : GRID_ITEMS),
    [canvasModel?.gridTiles],
  );

  useEffect(() => {
    if (!showNav || resolvedCategories.length === 0) {
      return;
    }
    if (!resolvedCategories.some((item) => item.toLowerCase() === activeCategory.toLowerCase())) {
      setActiveCategory(resolvedCategories[0]);
    }
  }, [activeCategory, resolvedCategories, showNav]);

  const filteredGridItems = useMemo(() => {
    if (!showNav || !activeCategory || activeCategory.toLowerCase() === 'all') {
      return resolvedGridItems;
    }
    return resolvedGridItems.filter((item) => (item.category ?? 'All').toLowerCase() === activeCategory.toLowerCase());
  }, [activeCategory, resolvedGridItems, showNav]);

  const activeAccentColor = focusedId
    ? resolvedGridItems.find((i) => i.id === focusedId)?.accentColor || '#ffffff'
    : '#1a1a1a';
  const resolvedProfile: ProfileData = useMemo(
    () => ({
      ...(canvasModel?.hero ?? PROFILE_DATA),
      name: profileOverride?.name?.trim() || canvasModel?.hero.name || PROFILE_DATA.name,
      bio: profileOverride?.bio?.trim() || canvasModel?.hero.bio || PROFILE_DATA.bio,
      profilePic: profileOverride?.avatar?.trim() || canvasModel?.hero.profilePic || PROFILE_DATA.profilePic,
      handle: profileOverride?.handle?.trim() || canvasModel?.hero.handle || PROFILE_DATA.handle,
      verified: canvasModel?.hero.verified ?? true,
    }),
    [canvasModel?.hero, profileOverride?.avatar, profileOverride?.bio, profileOverride?.handle, profileOverride?.name],
  );
  const resolvedFooter = useMemo(
    () => canvasModel?.footer ?? MIDNIGHT_FOOTER,
    [canvasModel?.footer],
  );

  return (
    <div className="relative min-h-screen bg-[#050505] text-white selection:bg-white selection:text-black">
      <AmbientBackground accentColor={activeAccentColor} />
      
      {/* Sticky Navigation */}
      <motion.nav 
        animate={{ 
          backgroundColor: isScrolled ? 'rgba(5, 5, 5, 0.8)' : 'transparent',
          backdropFilter: isScrolled ? 'blur(12px)' : 'blur(0px)',
          borderBottom: isScrolled ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid transparent'
        }}
        className={`fixed top-0 inset-x-0 z-[60] py-3 px-4 sm:px-6 flex justify-between items-center transition-all duration-500 ${isCompact ? '' : 'md:py-4 md:px-12'}`}
      >
        <div className="font-cinema font-bold text-xl tracking-tighter">VIBEJAM</div>
        <div className={`gap-8 ${isCompact ? 'hidden' : 'hidden md:flex'}`}>
          {showNav && resolvedCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`text-[11px] font-cinema tracking-[0.3em] uppercase transition-all duration-300 ${activeCategory === cat ? 'text-white' : 'text-white/30 hover:text-white/60'}`}
            >
              {cat}
            </button>
          ))}
        </div>
        <button className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        </button>
      </motion.nav>

      {showHero && <Header data={resolvedProfile} compact={isCompact} />}

      <main className={`px-3 sm:px-4 relative z-20 ${showHero ? (isCompact ? '-mt-8 pb-20' : 'md:px-12 lg:px-24 -mt-10 md:-mt-24 pb-24 md:pb-32') : (isCompact ? 'pt-20 pb-20' : 'md:px-12 lg:px-24 pt-24 pb-24')}`}>
        {showGrid && filteredGridItems.length > 0 && (
          <div className="masonry-grid">
            <AnimatePresence mode="popLayout">
              {filteredGridItems.map((item) => (
                <GridItem
                  key={item.id}
                  item={item}
                  isFocused={focusedId === item.id}
                  isAnyFocused={!!focusedId}
                  onFocus={() => setFocusedId(item.id)}
                  onBlur={() => setFocusedId(null)}
                  onClick={() => setSelectedItem(item)}
                  compact={isCompact}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {showNav && resolvedCategories.length > 0 && (
          <div className={`${isCompact ? 'flex' : 'md:hidden flex'} gap-4 overflow-x-auto py-8 no-scrollbar scroll-smooth`}>
            {resolvedCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap px-6 py-2 rounded-full border text-[10px] font-cinema tracking-widest uppercase transition-all
                  ${activeCategory === cat ? 'bg-white text-black border-white' : 'bg-transparent text-white/50 border-white/10'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </main>

      <ExpandedModal 
        item={selectedItem} 
        onClose={() => setSelectedItem(null)} 
      />

      {showFooter && (
        <footer className={`px-4 sm:px-6 text-center border-t border-white/5 ${isCompact ? 'py-14' : 'py-20 md:py-24'}`}>
          <div className="max-w-xl mx-auto">
            <h4 className="font-cinema font-bold text-2xl md:text-3xl mb-4 tracking-tight">{resolvedFooter.headline}</h4>
            <p className="text-white/40 text-xs md:text-sm font-cinema tracking-widest uppercase mb-10 md:mb-12">{resolvedFooter.subheadline}</p>
            <div className="flex flex-wrap gap-4 justify-center">
              {resolvedFooter.socials.map((social) => (
                <a
                  key={social.id}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-cinema tracking-[0.4em] uppercase text-white/30 hover:text-white transition-colors"
                >
                  {social.label}
                </a>
              ))}
            </div>
            <p className="mt-16 font-cinema text-white/10 tracking-[0.5em] text-[10px] uppercase">
              {resolvedFooter.tagline}
            </p>
          </div>
        </footer>
      )}
    </div>
  );
};

export default App;
