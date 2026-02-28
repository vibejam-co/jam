import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, ChevronRight } from 'lucide-react';
import type { InboxConversationSummary } from '../types';

interface InboxQuickCenterProps {
  items: InboxConversationSummary[];
  unreadCount: number;
  isLoading: boolean;
  error?: string | null;
  onClose: () => void;
  onOpenConversation: (conversationId: string) => void;
  onOpenInbox: () => void;
  className?: string;
}

const formatRelativeTime = (iso: string): string => {
  if (!iso) {
    return 'just now';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return 'just now';
  }
  const delta = Math.max(0, Date.now() - date.getTime());
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (delta < minute) return 'just now';
  if (delta < hour) return `${Math.floor(delta / minute)}m`;
  if (delta < day) return `${Math.floor(delta / hour)}h`;
  return `${Math.floor(delta / day)}d`;
};

const getInitials = (value: string): string => {
  const parts = String(value || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) {
    return '?';
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 1).toUpperCase();
  }
  return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`.toUpperCase();
};

const InboxQuickCenter: React.FC<InboxQuickCenterProps> = ({
  items,
  unreadCount,
  isLoading,
  error = null,
  onClose,
  onOpenConversation,
  onOpenInbox,
  className,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.96 }}
      transition={{ type: 'spring', damping: 22, stiffness: 320 }}
      className={`absolute top-16 right-0 z-[130] w-[360px] max-w-[calc(100vw-24px)] bg-[#050505] border border-white/10 rounded-[30px] shadow-[0_32px_100px_rgba(0,0,0,0.85)] overflow-hidden ${className ?? ''}`}
    >
      <header className="px-5 py-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white/5 border border-white/10">
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-white">Inbox</h3>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-full hover:bg-white/5 text-zinc-500 hover:text-white transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      <div className="max-h-[420px] overflow-y-auto no-scrollbar p-2">
        {isLoading ? (
          <div className="space-y-2 p-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={`quick-inbox-skeleton-${index}`} className="rounded-2xl border border-white/5 bg-white/[0.02] p-3 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/10" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-32 rounded bg-white/10" />
                    <div className="h-3 w-full rounded bg-white/10" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="m-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-4 text-xs text-red-200">
            {error}
          </div>
        ) : items.length === 0 ? (
          <div className="py-14 text-center">
            <MessageSquare className="w-9 h-9 text-zinc-800 mx-auto mb-3" />
            <p className="text-zinc-500 text-xs font-medium">No conversations yet.</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {items.slice(0, 12).map((item, index) => (
              <motion.button
                key={item.id}
                type="button"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => onOpenConversation(item.id)}
                className="w-full text-left rounded-2xl border border-white/5 bg-white/[0.02] hover:border-white/15 transition-all px-3 py-3 mb-2"
              >
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    {item.counterpartAvatarUrl ? (
                      <img
                        src={item.counterpartAvatarUrl}
                        alt={item.counterpartName}
                        className="w-10 h-10 rounded-full object-cover border border-white/15"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full border border-white/15 bg-white/[0.04] text-zinc-200 text-[11px] font-black uppercase tracking-wider inline-flex items-center justify-center">
                        {getInitials(item.counterpartName)}
                      </div>
                    )}
                    {item.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 inline-flex min-w-[16px] h-4 px-1 items-center justify-center rounded-full bg-gradient-to-b from-[#FF6B7A] via-[#FF3B5C] to-[#FF2D55] border border-white/35 text-[8px] text-white font-black font-mono-data">
                        {item.unreadCount > 9 ? '9+' : item.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-white truncate">{item.counterpartName}</p>
                      <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">{formatRelativeTime(item.lastMessageAt)}</p>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-cyan-300 truncate">{item.listingName}</p>
                    <p className="text-[11px] text-zinc-400 truncate mt-0.5">{item.lastMessagePreview}</p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-700" />
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        )}
      </div>

      <footer className="p-3 border-t border-white/5 bg-white/[0.01]">
        <button
          type="button"
          onClick={onOpenInbox}
          className="w-full h-10 rounded-full border border-white/15 text-[10px] font-black uppercase tracking-widest text-zinc-200 hover:bg-white hover:text-black transition-all"
        >
          Open Full Inbox
        </button>
      </footer>
    </motion.div>
  );
};

export default InboxQuickCenter;
