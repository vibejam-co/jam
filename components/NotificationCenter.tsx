
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Bell, Heart, Sparkles, DollarSign, Settings, 
  CheckCheck, Info, ArrowUpRight, ShieldCheck, 
  Layers, Package, ChevronRight, Zap
} from 'lucide-react';
import { Notification, VibeApp } from '../types';

interface NotificationCenterProps {
  notifications: Notification[];
  onClose: () => void;
  onMarkAllRead: () => void;
  onSelectApp: (appId: string) => void;
  getAppById: (appId: string) => VibeApp | undefined;
}

type NotificationFilter = 'All' | 'Wishlist' | 'Updates' | 'Offers';

const NotificationCenter: React.FC<NotificationCenterProps> = ({ 
  notifications, 
  onClose, 
  onMarkAllRead, 
  onSelectApp,
  getAppById
}) => {
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>('All');

  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Wishlist') return n.type === 'wishlist';
    if (activeFilter === 'Updates') return n.type === 'update' || n.type === 'system';
    if (activeFilter === 'Offers') return n.type === 'offer';
    return true;
  });

  const getTypeIcon = (type: Notification['type']) => {
    switch (type) {
      case 'wishlist': return <Heart className="w-4 h-4 text-red-400" />;
      case 'offer': return <DollarSign className="w-4 h-4 text-[#D4AF37]" />;
      case 'update': return <Sparkles className="w-4 h-4 text-cyan-400" />;
      case 'system': return <Settings className="w-4 h-4 text-zinc-400" />;
      default: return <Bell className="w-4 h-4 text-white" />;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      className="absolute top-16 right-0 w-full sm:w-[420px] bg-[#050505] border border-white/10 rounded-[32px] shadow-[0_30px_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col z-[130] origin-top-right"
    >
      {/* Header */}
      <header className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white/5 border border-white/10">
            <Bell className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-sm font-black uppercase tracking-widest text-white">Notifications</h3>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={onMarkAllRead}
            className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <CheckCheck className="w-3.5 h-3.5" /> Read All
          </button>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/5 text-zinc-500 hover:text-white transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Filter Tabs */}
      <nav className="flex px-4 py-3 gap-2 border-b border-white/5 bg-black/40 backdrop-blur-md">
        {['All', 'Wishlist', 'Offers', 'Updates'].map(filter => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter as NotificationFilter)}
            className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all
              ${activeFilter === filter ? 'bg-white text-black' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}
          >
            {filter}
          </button>
        ))}
      </nav>

      {/* List Area */}
      <div className="max-h-[500px] overflow-y-auto no-scrollbar p-3 space-y-2 bg-[#050505]">
        <AnimatePresence mode="popLayout">
          {filteredNotifications.length > 0 ? filteredNotifications.map((n, i) => {
            const linkedApp = n.appId ? getAppById(n.appId) : undefined;
            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => n.appId && onSelectApp(n.appId)}
                className={`relative p-5 rounded-2xl border transition-all cursor-pointer group flex gap-4
                  ${n.isRead ? 'bg-transparent border-white/5 opacity-60' : 'bg-white/[0.03] border-white/10 hover:border-white/20'}`}
              >
                {!n.isRead && (
                  <div className="absolute top-5 right-5 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
                )}
                
                <div className={`shrink-0 w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center
                  ${!n.isRead && 'ring-2 ring-white/5'}`}>
                  {getTypeIcon(n.type)}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-widest text-white">{n.title}</h4>
                    <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">{n.timestamp}</span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                    {n.message}
                  </p>
                  
                  {linkedApp && (
                    <div className="mt-3 flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5 group-hover:border-white/10 transition-all">
                       <div className="flex items-center gap-2">
                         <span className="text-lg">{linkedApp.icon}</span>
                         <span className="text-[10px] font-bold text-white uppercase tracking-widest">{linkedApp.name}</span>
                       </div>
                       <ChevronRight className="w-3 h-3 text-zinc-700 group-hover:text-white transition-all" />
                    </div>
                  )}
                </div>
              </motion.div>
            );
          }) : (
            <div className="py-20 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto opacity-20">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest italic">Quiet for now.</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer / CTA */}
      <footer className="p-4 border-t border-white/5 bg-white/[0.01]">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500/10 via-transparent to-transparent border border-cyan-500/10">
           <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                 <Zap className="w-3 h-3 text-cyan-400" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Zenith Alerts</span>
              </div>
              <ShieldCheck className="w-3 h-3 text-zinc-700" />
           </div>
           <p className="text-[10px] text-zinc-500 leading-relaxed">
             Wishlist notifications help you track price fluctuations and revenue spikes in real-time.
           </p>
        </div>
      </footer>
    </motion.div>
  );
};

export default NotificationCenter;
