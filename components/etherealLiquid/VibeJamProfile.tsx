
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Instagram, 
  Twitter, 
  Briefcase, 
  BookOpen, 
  Mail, 
  Music, 
  Link as LinkIcon, 
  BarChart3, 
  MapPin,
  Heart,
  Share2
} from 'lucide-react';
import LiquidGlassCard from './components/LiquidGlassCard';
import { USER_DATA, LINKS_DATA, MUSIC_DATA } from './constants';
import { LinkItem, MusicItem } from './types';

const IconMap: Record<string, any> = {
  Instagram,
  Twitter,
  Briefcase,
  BookOpen,
  Mail
};

type Tab = 'links' | 'music' | 'stats';

interface VibeJamProfileProps {
  forcedViewport?: 'mobile' | 'desktop';
  profileOverride?: {
    name?: string;
    bio?: string;
    avatar?: string;
    handle?: string;
  };
}

const VibeJamProfile: React.FC<VibeJamProfileProps> = ({ forcedViewport, profileOverride }) => {
  const [activeTab, setActiveTab] = useState<Tab>('links');
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [isCompactByWidth, setIsCompactByWidth] = useState(false);

  useEffect(() => {
    if (forcedViewport) {
      return;
    }
    if (!rootRef.current || typeof ResizeObserver === 'undefined') {
      return;
    }
    const observer = new ResizeObserver(([entry]) => {
      setIsCompactByWidth(entry.contentRect.width < 768);
    });
    observer.observe(rootRef.current);
    return () => observer.disconnect();
  }, [forcedViewport]);

  const isCompact = forcedViewport ? forcedViewport === 'mobile' : isCompactByWidth;
  const userData = useMemo(
    () => ({
      ...USER_DATA,
      name: profileOverride?.name?.trim() || USER_DATA.name,
      bio: profileOverride?.bio?.trim() || USER_DATA.bio,
      avatar: profileOverride?.avatar?.trim() || USER_DATA.avatar,
      handle: profileOverride?.handle?.trim() || USER_DATA.handle,
    }),
    [profileOverride?.avatar, profileOverride?.bio, profileOverride?.handle, profileOverride?.name],
  );

  return (
    <div ref={rootRef} className="relative min-h-screen w-full flex flex-col items-center bg-[#F0F4F8] selection:bg-violet-200/50 overflow-x-hidden">
      {/* Ethereal Background Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div 
          animate={{
            x: [0, 200, 0],
            y: [0, -200, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-[#4A00E0] opacity-10 blur-[120px] rounded-full" 
        />
        <motion.div 
          animate={{
            x: [0, -200, 0],
            y: [0, 200, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-[#00D2FF] opacity-15 blur-[120px] rounded-full" 
        />
      </div>

      {/* Main Content Container */}
      <main className={`relative z-10 w-full max-w-4xl px-3 sm:px-4 flex flex-col items-center ${isCompact ? 'py-7' : 'py-10 md:py-24'}`}>
        
        {/* Profile Header */}
        <motion.header 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`w-full flex flex-col items-center text-center ${isCompact ? 'mb-8' : 'mb-12'}`}
        >
          <div className="relative group mb-6">
            <div className="absolute inset-0 bg-white/40 blur-2xl group-hover:blur-3xl transition-all duration-500 rounded-full" />
            <img 
              src={userData.avatar} 
              alt={userData.name} 
              className={`relative rounded-full border-2 border-white/50 shadow-xl object-cover ${isCompact ? 'w-24 h-24' : 'w-28 h-28 md:w-32 md:h-32'}`}
            />
          </div>
          <h1 className={`font-medium text-slate-900/90 mb-1 tracking-tight ${isCompact ? 'text-2xl' : 'text-3xl md:text-4xl'}`}>
            {userData.name}
          </h1>
          <p className="text-slate-500 font-light mb-4">
            {userData.handle}
          </p>
          <p className="max-w-md text-slate-700/80 font-light leading-relaxed mb-6 px-4">
            {userData.bio}
          </p>
          
          <div className={`flex mb-8 ${isCompact ? 'gap-5' : 'gap-8'}`}>
            <div className="text-center">
              <span className={`block font-medium text-slate-800 ${isCompact ? 'text-lg' : 'text-xl'}`}>{userData.followers}</span>
              <span className="text-xs font-light text-slate-400 uppercase tracking-widest">Followers</span>
            </div>
            <div className="h-10 w-[1px] bg-slate-200 self-center" />
            <div className="text-center">
              <span className={`block font-medium text-slate-800 ${isCompact ? 'text-lg' : 'text-xl'}`}>{userData.following}</span>
              <span className="text-xs font-light text-slate-400 uppercase tracking-widest">Following</span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className={`w-full ${isCompact ? 'max-w-[330px]' : 'max-w-[360px]'}`}>
            <div className={`p-1 bg-white/30 backdrop-blur-xl rounded-full border border-white/40 shadow-sm ${isCompact ? 'grid grid-cols-3 gap-1' : 'inline-flex min-w-full'}`}>
              {[
                { id: 'links', icon: LinkIcon, label: 'Links' },
                { id: 'music', icon: Music, label: 'Music' },
                { id: 'stats', icon: BarChart3, label: 'Stats' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as Tab)}
                  className={`
                    relative rounded-full transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap
                    ${isCompact ? 'px-2 py-2 text-xs' : 'px-4 sm:px-6 py-2 text-sm'}
                    ${activeTab === tab.id ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'}
                  `}
                >
                  {activeTab === tab.id && (
                    <motion.div 
                      layoutId="activeTab"
                      className="absolute inset-0 bg-white shadow-sm rounded-full z-0"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.35 }}
                    />
                  )}
                  <tab.icon size={isCompact ? 14 : 16} className="relative z-10 shrink-0" />
                  <span className="relative z-10 font-medium">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </motion.header>

        {/* Dynamic Content Area with Liquid Mist Transition */}
        <div className="w-full min-h-[360px] sm:min-h-[420px]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeTab}
              initial={isCompact ? { opacity: 0, y: 8 } : { opacity: 0, scale: 0.95, filter: "blur(20px)" }}
              animate={isCompact ? { opacity: 1, y: 0 } : { opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={isCompact ? { opacity: 0, y: -8 } : { opacity: 0, scale: 0.95, filter: "blur(20px)" }}
              transition={{ duration: isCompact ? 0.28 : 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              {activeTab === 'links' && <LinksGrid links={LINKS_DATA} compact={isCompact} />}
              {activeTab === 'music' && <MusicGrid music={MUSIC_DATA} compact={isCompact} />}
              {activeTab === 'stats' && <StatsView compact={isCompact} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Floating Action Button */}
      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`fixed z-50 bg-slate-900 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-slate-800 transition-colors ${isCompact ? 'bottom-4 right-4 w-11 h-11' : 'bottom-4 right-4 md:bottom-8 md:right-8 w-12 h-12 md:w-14 md:h-14'}`}
      >
        <Share2 size={24} />
      </motion.button>
    </div>
  );
};

const LinksGrid: React.FC<{ links: LinkItem[]; compact?: boolean }> = ({ links, compact = false }) => {
  return (
    <div
      className={`grid ${
        compact
          ? 'grid-cols-1 gap-3 auto-rows-[130px]'
          : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 auto-rows-[140px] md:auto-rows-[180px]'
      }`}
    >
      {links.map((link) => {
        const Icon = IconMap[link.icon] || LinkIcon;
        const colSpan = compact
          ? 'col-span-1'
          : link.size === 'large'
            ? 'sm:col-span-2'
            : link.size === 'medium'
              ? 'sm:col-span-2'
              : 'col-span-1';
        const rowSpan = compact ? 'row-span-1' : link.size === 'large' ? 'row-span-2' : 'row-span-1';

        return (
          <a key={link.id} href={link.url} target="_blank" rel="noreferrer" className="block">
            <LiquidGlassCard className={`${colSpan} ${rowSpan}`}>
              <div className="flex flex-col h-full justify-between">
                <div className="flex justify-between items-start">
                  <div className="p-3 bg-white/40 rounded-2xl shadow-sm text-slate-700">
                    <Icon size={24} />
                  </div>
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className={`font-medium text-slate-900/90 ${link.size === 'large' && !compact ? 'text-2xl' : 'text-lg'}`}>
                      {link.title}
                    </h3>
                    {link.description && (
                      <p className="text-slate-500 font-light text-sm line-clamp-1">
                        {link.description}
                      </p>
                    )}
                  </div>
                  <LinkIcon size={16} className="text-slate-500/60 mt-1" />
                </div>
              </div>
            </LiquidGlassCard>
          </a>
        );
      })}
    </div>
  );
};

const MusicGrid: React.FC<{ music: MusicItem[]; compact?: boolean }> = ({ music, compact = false }) => {
  if (compact) {
    return (
      <div className="grid grid-cols-1 gap-3 w-full">
        {music.map((item) => (
          <LiquidGlassCard key={item.id} className="h-auto min-h-[196px]">
            <div className="h-full flex flex-col gap-3">
              <div className="relative overflow-hidden rounded-2xl h-28 w-full">
                <img src={item.cover} alt={item.title} className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col justify-center min-w-0">
                <h3 className="text-lg font-medium text-slate-900 truncate">{item.title}</h3>
                <p className="text-slate-500 font-light truncate">{item.artist}</p>
                <div className="mt-3 flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1 text-xs font-light text-slate-400">
                    <Music size={12} />
                    <span>{item.plays} plays</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-light text-slate-400">
                    <Heart size={12} />
                    <span>Favorite</span>
                  </div>
                </div>
              </div>
            </div>
          </LiquidGlassCard>
        ))}
        <LiquidGlassCard className="h-auto min-h-[172px] bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border-none">
          <div className="flex flex-col justify-between h-full gap-4">
            <div>
              <h3 className="text-xl font-medium text-slate-900 mb-2">Connect to Spotify</h3>
              <p className="text-slate-600 font-light">See what I'm listening to in real-time.</p>
            </div>
            <button className="w-full px-8 py-3 bg-white/70 hover:bg-white/90 backdrop-blur-md rounded-full font-medium transition-all shadow-sm">
              Connect
            </button>
          </div>
        </LiquidGlassCard>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {music.map((item) => (
        <LiquidGlassCard key={item.id} className="h-48">
          <div className="h-full flex gap-6">
            <div className="relative overflow-hidden rounded-2xl h-full aspect-square">
              <img src={item.cover} alt={item.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                 <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                    <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-slate-900 border-b-[6px] border-b-transparent ml-1" />
                 </div>
              </div>
            </div>
            <div className="flex flex-col justify-center flex-1 min-w-0">
              <h3 className="text-xl font-medium text-slate-900">{item.title}</h3>
              <p className="text-slate-500 font-light truncate">{item.artist}</p>
              <div className="mt-4 flex items-center gap-4">
                <div className="flex items-center gap-1 text-xs font-light text-slate-400">
                  <Music size={12} />
                  <span>{item.plays} plays</span>
                </div>
                <div className="flex items-center gap-1 text-xs font-light text-slate-400">
                  <Heart size={12} />
                  <span>Favorite</span>
                </div>
              </div>
            </div>
          </div>
        </LiquidGlassCard>
      ))}
      <LiquidGlassCard className="h-56 md:h-48 md:col-span-2 bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border-none">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between h-full gap-4">
          <div>
             <h3 className="text-xl md:text-2xl font-medium text-slate-900 mb-2">Connect to Spotify</h3>
             <p className="text-slate-600 font-light">See what I'm listening to in real-time.</p>
          </div>
          <button className="w-full sm:w-auto px-8 py-3 bg-white/60 hover:bg-white/90 backdrop-blur-md rounded-full font-medium transition-all shadow-sm">
            Connect
          </button>
        </div>
      </LiquidGlassCard>
    </div>
  );
};

const StatsView: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  return (
    <div className={`grid ${compact ? 'grid-cols-1 gap-4' : 'grid-cols-1 md:grid-cols-3 gap-6'}`}>
      {[
        { label: 'Views', value: '42.8k', trend: '+12%', color: 'text-emerald-500' },
        { label: 'Clicks', value: '1,204', trend: '+5%', color: 'text-blue-500' },
        { label: 'Conversions', value: '8.4%', trend: '-2%', color: 'text-rose-500' }
      ].map((stat, i) => (
        <LiquidGlassCard key={i}>
          <div className="text-center">
            <p className="text-xs font-light text-slate-400 uppercase tracking-widest mb-2">{stat.label}</p>
            <h3 className={`${compact ? 'text-2xl' : 'text-3xl'} font-medium text-slate-900 mb-1`}>{stat.value}</h3>
            <span className={`text-xs font-medium ${stat.color}`}>{stat.trend} this week</span>
          </div>
        </LiquidGlassCard>
      ))}
      <LiquidGlassCard className={`md:col-span-3 ${compact ? 'h-56' : 'h-64'}`}>
        <div className="flex flex-col h-full">
           <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-medium text-slate-900 flex items-center gap-2">
                 <BarChart3 size={18} /> Engagement History
              </h3>
              <div className="flex gap-2">
                 <div className="w-3 h-3 rounded-full bg-blue-400/50" />
                 <div className="w-3 h-3 rounded-full bg-violet-400/50" />
              </div>
           </div>
           <div className="flex-1 flex items-end gap-2 px-2">
              {Array.from({ length: 14 }).map((_, i) => (
                <motion.div 
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.random() * 80 + 20}%` }}
                  transition={{ delay: i * 0.05, duration: 1, ease: "easeOut" }}
                  className="flex-1 bg-gradient-to-t from-slate-200/50 to-slate-400/30 rounded-t-lg min-w-[8px]"
                />
              ))}
           </div>
        </div>
      </LiquidGlassCard>
    </div>
  );
};

export default VibeJamProfile;
