
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import GridItem from './components/GridItem';
import ExpandedModal from './components/ExpandedModal';
import AmbientBackground from './components/AmbientBackground';
import { GRID_ITEMS, PROFILE_DATA, CATEGORIES } from './constants';
import { GridContent } from './types';
import { motion, AnimatePresence } from 'framer-motion';

const App: React.FC = () => {
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<GridContent | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 100);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const activeAccentColor = focusedId 
    ? GRID_ITEMS.find(i => i.id === focusedId)?.accentColor || '#ffffff'
    : '#1a1a1a';

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
        className="fixed top-0 inset-x-0 z-[60] py-3 md:py-4 px-4 sm:px-6 md:px-12 flex justify-between items-center transition-all duration-500"
      >
        <div className="font-cinema font-bold text-xl tracking-tighter">VIBEJAM</div>
        <div className="hidden md:flex gap-8">
          {CATEGORIES.map(cat => (
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

      <Header data={PROFILE_DATA} />

      <main className="px-3 sm:px-4 md:px-12 lg:px-24 -mt-10 md:-mt-24 pb-24 md:pb-32 relative z-20">
        <div className="masonry-grid">
          <AnimatePresence mode="popLayout">
            {GRID_ITEMS.map((item) => (
              <GridItem
                key={item.id}
                item={item}
                isFocused={focusedId === item.id}
                isAnyFocused={!!focusedId}
                onFocus={() => setFocusedId(item.id)}
                onBlur={() => setFocusedId(null)}
                onClick={() => setSelectedItem(item)}
              />
            ))}
          </AnimatePresence>
        </div>
        
        {/* Mobile Category Scroller */}
        <div className="md:hidden flex gap-4 overflow-x-auto py-8 no-scrollbar scroll-smooth">
          {CATEGORIES.map(cat => (
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
      </main>

      <ExpandedModal 
        item={selectedItem} 
        onClose={() => setSelectedItem(null)} 
      />

      <footer className="py-20 md:py-24 px-4 sm:px-6 text-center border-t border-white/5">
        <div className="max-w-xl mx-auto">
          <h4 className="font-cinema font-bold text-2xl md:text-3xl mb-4 tracking-tight">STAY IN THE LOOP</h4>
          <p className="text-white/40 text-xs md:text-sm font-cinema tracking-widest uppercase mb-10 md:mb-12">New drops every Friday at Midnight</p>
          <div className="flex flex-wrap gap-4 justify-center">
            {['Instagram', 'Twitter', 'Vimeo', 'Discord'].map(social => (
              <a key={social} href="#" className="text-xs font-cinema tracking-[0.4em] uppercase text-white/30 hover:text-white transition-colors">{social}</a>
            ))}
          </div>
          <p className="mt-16 font-cinema text-white/10 tracking-[0.5em] text-[10px] uppercase">
            Designed for Immersion &copy; 2025
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
