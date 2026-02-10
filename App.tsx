
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bell, Plus, ChevronDown, LayoutGrid, Globe, Zap, Heart } from 'lucide-react';
import { APPS as INITIAL_APPS, NOTIFICATIONS as INITIAL_NOTIFICATIONS } from './constants';
import { VibeApp, Notification } from './types';
import FeedRow from './components/FeedRow';
import MarketRail from './components/MarketRail';
import JamDetailView from './components/JamDetailView';
import MarketplaceView from './components/MarketplaceView';
import CanvasView from './components/CanvasView';
import StartJamModal from './components/StartJamModal';
import ListAppModal from './components/ListAppModal';
import ProfileView from './components/ProfileView';
import NotificationCenter from './components/NotificationCenter';
import NewsletterSection from './components/NewsletterSection';
import Footer from './components/Footer';
import LegalModal from './components/LegalModal';
import { fetchApps, fetchNotifications, publishApp } from './lib/api';

// Quick filters remain as the high-traffic entry points
const QUICK_FILTERS = ['All', 'AI', 'SaaS', 'Crypto', 'Marketplace'];

// The extensive list provided by the user
const ALL_CATEGORIES = [
  "Ai", "Analytics", "Community", "Content Creation", "Crypto", 
  "Customer Support", "Design Tools", "Developer Tools", "Ecommerce", 
  "Education", "Entertainment", "Fintech", "Games", "Health", 
  "IoT", "Legal", "Marketing", "Marketplace", "Mobile Apps", 
  "News & Magazines", "No-Code", "Productivity", "Real Estate", 
  "Recruiting & HR", "SaaS", "Sales", "Security", "Social Media", 
  "Travel", "Utilities"
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'Rankings' | 'Marketplace' | 'Canvas'>('Rankings');
  const [filter, setFilter] = useState<string>('All');
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<VibeApp | null>(null);
  const [apps, setApps] = useState<VibeApp[]>(INITIAL_APPS);
  const [wishlist, setWishlist] = useState<VibeApp[]>(INITIAL_APPS.slice(0, 2));
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const [isStartJamOpen, setIsStartJamOpen] = useState(false);
  const [isListAppOpen, setIsListAppOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // Legal & Support State
  const [legalModalTab, setLegalModalTab] = useState<'Terms' | 'Privacy' | 'Support' | null>(null);

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      try {
        const [remoteApps, remoteNotifications] = await Promise.all([
          fetchApps(),
          fetchNotifications(),
        ]);

        if (cancelled) {
          return;
        }

        if (remoteApps.length > 0) {
          setApps(remoteApps);
          setWishlist(remoteApps.slice(0, 2));
        }

        if (remoteNotifications.length > 0) {
          setNotifications(remoteNotifications);
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : 'Failed to load backend data.');
        }
      }
    };

    hydrate();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredApps = apps.filter(app => {
    if (filter === 'All') return true;
    // Marketplace filter shows apps that are for sale
    if (filter === 'Marketplace') return app.isForSale;
    // Case-insensitive check for the broad category list
    return app.category.toLowerCase() === filter.toLowerCase();
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handlePublishJam = async (newApp: VibeApp) => {
    if (isPublishing) {
      return;
    }

    setIsPublishing(true);

    try {
      const publishedApps = await publishApp(newApp);
      if (publishedApps.length > 0) {
        setApps(publishedApps);
      }
      setLoadError(null);
    } catch (error) {
      // Fallback to local state to avoid a dead-end UX when backend is unavailable.
      const nextRank = (apps.length + 1).toString().padStart(2, '0');
      const appWithRank = { ...newApp, rank: nextRank };
      setApps([appWithRank, ...apps]);
      setLoadError(error instanceof Error ? error.message : 'Publish failed on backend; saved locally only.');
    } finally {
      setIsPublishing(false);
    }

    setIsStartJamOpen(false);
    setIsListAppOpen(false);
    if (newApp.isForSale) {
      setActiveTab('Marketplace');
    } else {
      setActiveTab('Rankings');
    }
  };

  const handleToggleWishlist = (app: VibeApp) => {
    setWishlist(prev => 
      prev.find(a => a.id === app.id) 
        ? prev.filter(a => a.id !== app.id) 
        : [...prev, app]
    );
  };

  const isAppInWishlist = (appId: string) => wishlist.some(a => a.id === appId);
  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  const getAppById = (appId: string) => apps.find(a => a.id === appId);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white/20">
      
      {/* Navigation - The Stealth Glass */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-extrabold tracking-tighter text-white">VibeJam</h1>
            <div className="hidden xs:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-bold text-green-500 tracking-wider">MARKET OPEN</span>
            </div>
          </div>

          <div className="hidden md:flex items-center bg-white/5 rounded-full p-1 border border-white/5">
            {['Rankings', 'Marketplace', 'Canvas'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`relative px-6 py-1.5 text-xs font-bold rounded-full transition-all duration-300
                  ${activeTab === tab ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                {tab}
                {activeTab === tab && (
                  <motion.div layoutId="activeTab" className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 w-8 h-[2px] bg-green-500" />
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            <button className="text-zinc-400 hover:text-white transition-colors"><Search className="w-5 h-5" /></button>
            <div className="hidden xs:block w-[1px] h-4 bg-white/10" />
            <button onClick={() => setIsStartJamOpen(true)} className="hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/20 text-xs font-bold hover:bg-white hover:text-black transition-all">
              <Plus className="w-3.5 h-3.5" /> Start Jam
            </button>
            <div className="flex items-center gap-3 relative">
              <button onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} className="relative p-1 transition-transform hover:scale-110 active:scale-95">
                <Bell className={`w-5 h-5 transition-colors ${isNotificationsOpen ? 'text-white' : 'text-zinc-400'}`} />
                {unreadCount > 0 && <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-cyan-400 border-2 border-black" />}
              </button>
              <AnimatePresence>
                {isNotificationsOpen && (
                  <>
                    <div className="fixed inset-0 z-[125]" onClick={() => setIsNotificationsOpen(false)} />
                    <NotificationCenter notifications={notifications} onClose={() => setIsNotificationsOpen(false)} onMarkAllRead={markAllRead} getAppById={getAppById} onSelectApp={(id) => {
                      const app = getAppById(id);
                      if (app) { setSelectedApp(app); setIsNotificationsOpen(false); }
                    }} />
                  </>
                )}
              </AnimatePresence>
              <div onClick={() => setIsProfileOpen(true)} className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 overflow-hidden cursor-pointer hover:border-white/30 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                <img src="https://picsum.photos/id/64/100/100" alt="Avatar" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-32 pb-20">
        <AnimatePresence mode="wait">
          {activeTab === 'Rankings' && (
            <motion.div key="rankings" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <header className="mb-12 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                <div>
                  <motion.h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tighter text-white mb-4 leading-[1.1]">
                    Highest Earning <br />
                    <span className="text-zinc-500">Vibe-Coded Apps</span>
                  </motion.h2>
                  <p className="text-zinc-500 text-base sm:text-lg font-medium">Verified revenue. Live progress. No fluff.</p>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 no-scrollbar relative">
                  {QUICK_FILTERS.map((item) => (
                    <button
                      key={item}
                      onClick={() => { setFilter(item); setIsCategoryMenuOpen(false); }}
                      className={`px-5 py-2 rounded-full text-xs font-bold transition-all border shrink-0
                        ${filter === item ? 'bg-white text-black border-white' : 'bg-transparent text-zinc-500 border-white/10 hover:border-white/30'}`}
                    >
                      {item}
                    </button>
                  ))}
                  
                  {/* Strategic Extension Filter */}
                  <div className="relative shrink-0">
                    <button
                      onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)}
                      className={`group flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all border
                        ${!QUICK_FILTERS.includes(filter) && filter !== 'All' ? 'bg-white text-black border-white' : 'bg-transparent text-zinc-500 border-white/10 hover:border-white/30'}`}
                    >
                      Explore 
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${isCategoryMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {isCategoryMenuOpen && (
                        <>
                          {/* Close layer for clicking outside */}
                          <div className="fixed inset-0 z-[60]" onClick={() => setIsCategoryMenuOpen(false)} />
                          
                          {/* World Class Dropdown Menu */}
                          <motion.div
                            initial={{ opacity: 0, y: 12, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.98 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="absolute right-0 top-full mt-4 z-[70] w-[300px] sm:w-[560px] bg-[#0A0A0A] border border-white/10 rounded-[32px] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.9)] overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
                            
                            <div className="relative z-10 flex flex-col gap-6">
                              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500 flex items-center gap-2">
                                  <LayoutGrid className="w-3 h-3" /> Industry Verticals
                                </h3>
                                <span className="text-[10px] font-mono-data text-zinc-700 tracking-widest">{ALL_CATEGORIES.length} TOTAL</span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1.5 max-h-[440px] overflow-y-auto no-scrollbar pr-2">
                                {ALL_CATEGORIES.map((cat) => (
                                  <button
                                    key={cat}
                                    onClick={() => { setFilter(cat); setIsCategoryMenuOpen(false); }}
                                    className={`text-left py-2.5 px-3 rounded-xl text-[11px] font-bold tracking-tight transition-all flex items-center justify-between group/cat
                                      ${filter === cat ? 'bg-white text-black' : 'text-zinc-500 hover:text-white hover:bg-white/[0.03]'}`}
                                  >
                                    {cat}
                                    <AnimatePresence>
                                      {filter === cat ? (
                                        <motion.div layoutId="catActive" className="w-1.5 h-1.5 rounded-full bg-black shadow-[0_0_8px_rgba(0,0,0,0.4)]" />
                                      ) : (
                                        <motion.div initial={{ opacity: 0 }} whileHover={{ opacity: 1 }} className="w-1.5 h-1.5 rounded-full bg-white/20" />
                                      )}
                                    </AnimatePresence>
                                  </button>
                                ))}
                              </div>
                              
                              <div className="pt-4 mt-2 border-t border-white/5 flex items-center justify-between">
                                <p className="text-[9px] font-medium text-zinc-600 leading-tight">
                                  Select a niche to filter verified <br />vibe-coded assets.
                                </p>
                                <button 
                                  onClick={() => { setFilter('All'); setIsCategoryMenuOpen(false); }}
                                  className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
                                >
                                  Reset All
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-12 lg:gap-16">
                <section className="flex flex-col min-w-0">
                  <div className="grid grid-cols-[3rem_1fr_auto] md:grid-cols-[4rem_1fr_11rem_10rem] items-center h-10 border-b border-white/5 text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em] px-2 sm:px-4">
                    <div className="text-center">#</div>
                    <div className="px-4 sm:px-6">Identity</div>
                    <div className="text-right pr-4 sm:pr-8">Performance</div>
                    <div className="hidden md:block text-right pr-8">Status</div>
                  </div>
                  <div className="flex flex-col">
                    {filteredApps.length > 0 ? filteredApps.map((app, i) => (
                      <FeedRow key={app.id} app={app} index={i} onClick={(a) => setSelectedApp(a)} onToggleWishlist={handleToggleWishlist} isInWishlist={isAppInWishlist(app.id)} />
                    )) : (
                      <div className="py-40 text-center space-y-6">
                         <div className="w-16 h-16 rounded-[24px] bg-white/[0.02] border border-white/5 flex items-center justify-center mx-auto mb-4">
                            <LayoutGrid className="w-8 h-8 text-zinc-800" />
                         </div>
                         <div className="space-y-2">
                           <p className="text-zinc-500 font-medium text-lg italic">No assets found in <span className="text-white font-bold not-italic">"{filter}"</span></p>
                           <button 
                            onClick={() => setFilter('All')}
                            className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-colors underline underline-offset-4"
                           >
                            Clear Filter
                           </button>
                         </div>
                      </div>
                    )}
                  </div>
                </section>
                <MarketRail apps={apps} onViewAllMarketplace={() => setActiveTab('Marketplace')} />
              </div>

              {/* Newsletter Feature */}
              <NewsletterSection />

              {loadError && (
                <div className="mt-8 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 px-5 py-4 text-xs text-yellow-200">
                  Backend notice: {loadError}
                </div>
              )}

              {/* Rankings Footer */}
              <Footer onOpenLegal={(tab) => setLegalModalTab(tab)} />
            </motion.div>
          )}

          {activeTab === 'Marketplace' && (
            <motion.div key="marketplace" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <MarketplaceView apps={apps} onSelectApp={(a) => setSelectedApp(a)} onOpenListApp={() => setIsListAppOpen(true)} />
            </motion.div>
          )}

          {activeTab === 'Canvas' && (
            <motion.div key="canvas" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <CanvasView />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Modals & Overlays */}
      <AnimatePresence>
        {selectedApp && <JamDetailView app={selectedApp} onClose={() => setSelectedApp(null)} onToggleWishlist={handleToggleWishlist} isInWishlist={isAppInWishlist(selectedApp.id)} />}
      </AnimatePresence>
      <AnimatePresence>
        {isProfileOpen && <ProfileView wishlist={wishlist} myJams={apps.filter(a => a.id === '1')} onClose={() => setIsProfileOpen(false)} onSelectApp={(app) => { setIsProfileOpen(false); setSelectedApp(app); }} />}
      </AnimatePresence>
      <AnimatePresence>
        {isStartJamOpen && <StartJamModal onClose={() => setIsStartJamOpen(false)} onPublish={handlePublishJam} />}
      </AnimatePresence>
      <AnimatePresence>
        {isListAppOpen && <ListAppModal onClose={() => setIsListAppOpen(false)} onPublish={handlePublishJam} />}
      </AnimatePresence>
      
      {/* Legal & Support Modal */}
      <AnimatePresence>
        {legalModalTab && (
          <LegalModal 
            initialTab={legalModalTab} 
            onClose={() => setLegalModalTab(null)} 
          />
        )}
      </AnimatePresence>

      {/* Atmospheric Background Layers */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-blue-500/[0.03] rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-500/[0.03] rounded-full blur-[140px] pointer-events-none -z-10" />
    </div>
  );
};

export default App;
