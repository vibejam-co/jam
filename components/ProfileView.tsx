
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Bookmark, Settings, Rocket, ShieldCheck, 
  ChevronRight, LogOut, Bell, Key, CreditCard,
  Heart, ArrowUpRight, Globe, Github, Activity,
  Trophy, TrendingUp, Sparkles
} from 'lucide-react';
import { VibeApp } from '../types';
import GemstoneIcon from './GemstoneIcon';

interface ProfileViewProps {
  onClose: () => void;
  wishlist: VibeApp[];
  myJams: VibeApp[];
  onSelectApp: (app: VibeApp) => void;
  displayName: string;
  handle: string;
  avatarUrl: string;
  onSignOut: () => void;
  isSigningOut?: boolean;
}

type ProfileTab = 'Wishlist' | 'My Jams' | 'Settings';

const ProfileView: React.FC<ProfileViewProps> = ({
  onClose,
  wishlist,
  myJams,
  onSelectApp,
  displayName,
  handle,
  avatarUrl,
  onSignOut,
  isSigningOut = false,
}) => {
  const [activeTab, setActiveTab] = useState<ProfileTab>('Wishlist');

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-xl flex justify-end"
    >
      {/* Backdrop click close */}
      <div className="absolute inset-0" onClick={onClose} />

      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative w-full max-w-lg bg-[#050505] border-l border-white/10 h-full flex flex-col shadow-[-20px_0_80px_rgba(0,0,0,0.8)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: Identity Section */}
        <header className="px-8 pt-12 pb-8 border-b border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
          <div className="flex justify-between items-start mb-8">
            <div className="relative group">
              <div className="w-20 h-20 rounded-[28px] overflow-hidden border-2 border-white/10 group-hover:border-white/30 transition-all shadow-2xl">
                <img src={avatarUrl} alt={`${displayName} avatar`} className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-2 -right-2 p-1.5 rounded-xl bg-green-500 border-4 border-[#050505] shadow-lg">
                <ShieldCheck className="w-3.5 h-3.5 text-black" />
              </div>
            </div>
            <button onClick={onClose} className="p-2.5 rounded-full hover:bg-white/5 transition-all">
              <X className="w-6 h-6 text-zinc-500" />
            </button>
          </div>
          
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-white tracking-tight">{displayName}</h2>
            <p className="text-zinc-500 text-sm font-medium">{handle} • Creator</p>
          </div>

          <div className="flex gap-4 mt-8">
            <div className="flex-1 p-3 rounded-2xl bg-white/[0.03] border border-white/10">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Portfolio Value</p>
              <p className="text-lg font-mono-data text-white font-bold">$1.4M</p>
            </div>
            <div className="flex-1 p-3 rounded-2xl bg-white/[0.03] border border-white/10">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Total Jams</p>
              <p className="text-lg font-mono-data text-white font-bold">12</p>
            </div>
          </div>
        </header>

        {/* Tab Switcher */}
        <nav className="flex px-8 border-b border-white/5">
          {['Wishlist', 'My Jams', 'Settings'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as ProfileTab)}
              className={`relative py-4 px-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all
                ${activeTab === tab ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              {tab}
              {activeTab === tab && (
                <motion.div 
                  layoutId="profileTabLine"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-white"
                />
              )}
            </button>
          ))}
        </nav>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'Wishlist' && (
              <motion.div 
                key="wishlist"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <div className="space-y-4">
                  {wishlist.length > 0 ? wishlist.map(app => (
                    <div 
                      key={app.id} 
                      onClick={() => onSelectApp(app)}
                      className="group p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <GemstoneIcon icon={app.icon} accentColor={app.accentColor} size="sm" isHovered={true} />
                        <div>
                          <h4 className="text-white font-bold text-sm tracking-tight">{app.name}</h4>
                          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">${app.monthlyRevenue.toLocaleString()} / mo</p>
                        </div>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-zinc-700 group-hover:text-white transition-all" />
                    </div>
                  )) : (
                    <div className="py-20 text-center">
                      <Heart className="w-10 h-10 text-zinc-800 mx-auto mb-4" />
                      <p className="text-zinc-500 text-sm font-medium">Your wishlist is empty.</p>
                    </div>
                  )}
                </div>

                {wishlist.length > 0 && (
                  <div className="pt-8 border-t border-white/5">
                    <h5 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <TrendingUp className="w-3 h-3" /> Potential Yield
                    </h5>
                    <div className="p-4 rounded-2xl bg-green-500/5 border border-green-500/10">
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Based on your wishlist, your curated portfolio represents <span className="text-green-500 font-bold">$420k+</span> in verified MRR.
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'My Jams' && (
              <motion.div 
                key="my-jams"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-8"
              >
                <div className="space-y-4">
                  {myJams.map(app => (
                    <div 
                      key={app.id}
                      onClick={() => onSelectApp(app)}
                      className="p-5 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all cursor-pointer"
                    >
                      <div className="flex justify-between items-start mb-4">
                         <div className="flex items-center gap-3">
                           <GemstoneIcon icon={app.icon} accentColor={app.accentColor} size="sm" isHovered={true} />
                           <div>
                             <h4 className="text-white font-bold tracking-tight">{app.name}</h4>
                             <span className="text-[9px] font-black text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded tracking-widest uppercase">Live</span>
                           </div>
                         </div>
                         <Rocket className="w-4 h-4 text-zinc-500" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <div>
                           <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">Revenue</p>
                           <p className="text-sm font-mono-data text-white font-bold">${app.monthlyRevenue.toLocaleString()}</p>
                         </div>
                         <div className="text-right">
                           <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">Growth</p>
                           <p className="text-sm font-mono-data text-purple-400 font-bold">+{app.growth}%</p>
                         </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4">
                   <h5 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Trophy className="w-3 h-3" /> Recent Achievements
                   </h5>
                   <div className="space-y-3">
                      <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                        <div className="p-2 rounded-xl bg-yellow-500/10 text-yellow-500">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <p className="text-xs text-zinc-300 font-medium">Reached <span className="text-white font-bold">Top 50</span> with Luminal AI</p>
                      </div>
                      <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                        <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                          <Activity className="w-4 h-4" />
                        </div>
                        <p className="text-xs text-zinc-300 font-medium">Verified 12 consecutive months of growth</p>
                      </div>
                   </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'Settings' && (
              <motion.div 
                key="settings"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                   <h5 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Account</h5>
                   <div className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden divide-y divide-white/5">
                      {[
                        { icon: Key, label: 'Security & Keys', detail: 'Manage API tokens' },
                        { icon: Bell, label: 'Notifications', detail: 'Real-time alerts' },
                        { icon: Globe, label: 'Public Profile', detail: 'On / Private' },
                      ].map(item => (
                        <button key={item.label} className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/5 transition-all text-left group">
                          <div className="flex items-center gap-4">
                            <div className="p-2 rounded-xl bg-white/5 text-zinc-400 group-hover:text-white group-hover:bg-white/10 transition-all">
                              <item.icon className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white">{item.label}</p>
                              <p className="text-[10px] font-medium text-zinc-500">{item.detail}</p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-zinc-700" />
                        </button>
                      ))}
                   </div>
                </div>

                <div className="space-y-2">
                   <h5 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Connected</h5>
                   <div className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden divide-y divide-white/5">
                      {[
                        { icon: CreditCard, label: 'Billing', detail: 'Visa ending in 4242' },
                        { icon: Github, label: 'GitHub', detail: 'alexvibe-dev' },
                      ].map(item => (
                        <button key={item.label} className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/5 transition-all text-left group">
                          <div className="flex items-center gap-4">
                            <div className="p-2 rounded-xl bg-white/5 text-zinc-400 group-hover:text-white transition-all">
                              <item.icon className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white">{item.label}</p>
                              <p className="text-[10px] font-medium text-zinc-500">{item.detail}</p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-zinc-700" />
                        </button>
                      ))}
                   </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer: Session Control */}
        <footer className="p-8 border-t border-white/5 bg-[#070707]">
          <button
            onClick={onSignOut}
            disabled={isSigningOut}
            className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 text-zinc-500 hover:text-white hover:border-red-500/30 hover:bg-red-500/5 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogOut className="w-4 h-4" /> {isSigningOut ? 'Signing Out...' : 'Sign Out'}
          </button>
        </footer>

      </motion.div>
    </motion.div>
  );
};

export default ProfileView;
