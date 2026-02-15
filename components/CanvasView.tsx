
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { 
  Sparkles, 
  LayoutTemplate, 
  Share2, 
  BarChart3, 
  ArrowRight, 
  Eye, 
  Rocket,
  ChevronRight,
  Users,
  X,
  ExternalLink,
  Instagram,
  Twitter,
  Music,
  ShoppingBag,
  Zap,
  ShieldCheck,
  CreditCard
} from 'lucide-react';
import CanvasOnboarding from './CanvasOnboarding';
import CanvasPublishTransition from './CanvasPublishTransition';
import CanvasCommandDashboard from './CanvasCommandDashboard';
import EditorialKineticPreviewShell from './editorialKinetic/EditorialKineticPreviewShell';
import MidnightZenithPreviewShell from './midnightZenith/MidnightZenithPreviewShell';
import CreatorHubPreviewShell from './creatorHub/CreatorHubPreviewShell';
import EtherealLiquidPreviewShell from './etherealLiquid/EtherealLiquidPreviewShell';
import GlassArtifactPreviewShell from './glassArtifact/GlassArtifactPreviewShell';
import GoldStandardCollectionPreviewShell from './collection/GoldStandardCollectionPreviewShell';
import AccordionDeckCollectionPreviewShell from './collection/AccordionDeckCollectionPreviewShell';
import CollageOsCollectionPreviewShell from './collection/CollageOsCollectionPreviewShell';
import TerrariumCollectionPreviewShell from './collection/TerrariumCollectionPreviewShell';
import PrismOsCollectionPreviewShell from './collection/PrismOsCollectionPreviewShell';
import AeroCanvasCollectionPreviewShell from './collection/AeroCanvasCollectionPreviewShell';
import { fetchCanvasCatalog, fetchMyCanvasSession, saveCanvasOnboarding } from '../lib/api';
import type {
  CanvasCatalogResponse,
  CanvasDashboardSession,
  CanvasOnboardingPayload,
  CanvasPublishResult,
  CanvasTemplate,
  CanvasTheme,
} from '../types';
import type { User } from '@supabase/supabase-js';

const FALLBACK_THEME_COLOR_CLASSES = [
  'from-cyan-500/20 via-blue-500/10 to-transparent',
  'from-yellow-500/20 via-orange-500/10 to-transparent',
  'from-purple-500/20 via-pink-500/10 to-transparent',
  'from-rose-500/20 via-stone-500/10 to-transparent',
  'from-green-500/20 via-emerald-500/10 to-transparent',
];

const FALLBACK_THEME_ICONS = ['✨', '🗞️', '🌙', '🧸', '🎵', '⚡', '🧠', '📈'];

const THEME_DISPLAY_OVERRIDES: Record<string, { name?: string; desc?: string }> = {
  'concrete-vibe': {
    name: 'Creator Hub',
    desc: 'Warm, human storefront built for trust and conversion.',
  },
  'aurora-bento': {
    name: 'Ethereal Liquid',
    desc: 'High-refraction liquid glass with floating bento cards.',
  },
};

const normalizeSlug = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\/(www\.)?vibejam\.co\//, '')
    .replace(/^vibejam\.co\//, '')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);

const LEGACY_DASHBOARD_SESSION_KEY = 'vibejam.canvas.dashboard-session.v1';
const DASHBOARD_SESSION_STORAGE_PREFIX = 'vibejam.canvas.dashboard-session.v2';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const parseLegacyDashboardSession = (value: unknown): CanvasDashboardSession | null => {
  if (!isRecord(value)) {
    return null;
  }

  const onboarding = value.onboarding;
  const publish = value.publish;
  if (!isRecord(onboarding) || !isRecord(publish)) {
    return null;
  }

  if (
    typeof onboarding.claimedName !== 'string' ||
    typeof onboarding.selectedTheme !== 'string' ||
    !isRecord(onboarding.profile) ||
    typeof onboarding.profile.name !== 'string' ||
    typeof onboarding.profile.bio !== 'string' ||
    typeof onboarding.profile.avatar !== 'string' ||
    !Array.isArray(onboarding.selectedSignals) ||
    !isRecord(onboarding.links) ||
    typeof publish.profileId !== 'string' ||
    typeof publish.slug !== 'string' ||
    typeof publish.url !== 'string' ||
    typeof publish.publishedAt !== 'string'
  ) {
    return null;
  }

  return {
    onboarding: {
      claimedName: onboarding.claimedName,
      vanitySlug: typeof onboarding.vanitySlug === 'string' ? onboarding.vanitySlug : onboarding.claimedName,
      profile: {
        name: onboarding.profile.name,
        bio: onboarding.profile.bio,
        avatar: onboarding.profile.avatar,
      },
      selectedTheme: onboarding.selectedTheme,
      selectedTemplateId:
        typeof onboarding.selectedTemplateId === 'string' ? onboarding.selectedTemplateId : undefined,
      selectedSignals: onboarding.selectedSignals.filter(
        (signal): signal is string => typeof signal === 'string',
      ),
      links: Object.fromEntries(
        Object.entries(onboarding.links).filter(
          (entry): entry is [string, string] => typeof entry[1] === 'string',
        ),
      ),
    },
    publish: {
      success: true,
      profileId: publish.profileId,
      slug: publish.slug,
      url: publish.url,
      publishedAt: publish.publishedAt,
    },
  };
};

const getDashboardSessionStorageKey = (userId: string): string =>
  `${DASHBOARD_SESSION_STORAGE_PREFIX}.${userId}`;

const readDashboardSessionFromStorage = (userId: string): CanvasDashboardSession | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(getDashboardSessionStorageKey(userId));
  if (!raw) {
    return null;
  }

  try {
    return parseLegacyDashboardSession(JSON.parse(raw));
  } catch {
    return null;
  }
};

const writeDashboardSessionToStorage = (userId: string, session: CanvasDashboardSession) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(getDashboardSessionStorageKey(userId), JSON.stringify(session));
  } catch {
    // Storage errors should never block dashboard access.
  }
};

const dedupeThemesById = (input: CanvasTheme[]): CanvasTheme[] => {
  const seen = new Set<string>();
  const output: CanvasTheme[] = [];
  for (const theme of input) {
    if (seen.has(theme.id)) {
      continue;
    }
    seen.add(theme.id);
    output.push(theme);
  }
  return output;
};

const dedupeTemplatesById = (input: CanvasTemplate[]): CanvasTemplate[] => {
  const seen = new Set<string>();
  const output: CanvasTemplate[] = [];
  for (const item of input) {
    if (seen.has(item.id)) {
      continue;
    }
    seen.add(item.id);
    output.push(item);
  }
  return output;
};

const parseTemplateHexColor = (value: string): string => {
  const match = value.match(/\[#([0-9a-fA-F]{3,8})\]/);
  if (!match) {
    return '#111111';
  }
  return `#${match[1]}`;
};

const templatePreviewDataUri = (hex: string): string => {
  const safeHex = hex.replace('#', '');
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 900'><rect width='600' height='900' fill='%23${safeHex}'/><rect x='58' y='58' width='484' height='784' rx='28' fill='rgba(0,0,0,0.08)'/><rect x='90' y='90' width='420' height='180' rx='18' fill='rgba(255,255,255,0.12)'/><rect x='90' y='300' width='420' height='170' rx='18' fill='rgba(255,255,255,0.09)'/><rect x='90' y='500' width='420' height='280' rx='18' fill='rgba(255,255,255,0.07)'/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

type CanvasThemePreview = CanvasTheme & {
  previewColor: string;
  icon: string;
};

/**
 * Aurora Crystal Bento Preview Component
 * Epic design implementation based on the provided creative brief.
 */
const AuroraCrystalBentoPreview: React.FC<{
  theme: CanvasThemePreview;
  onClose: () => void;
  onUseTheme: () => void;
}> = ({ theme, onClose, onUseTheme }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] w-screen h-[100dvh] bg-[#020408] overflow-hidden flex flex-col font-sans selection:bg-cyan-500/30"
    >
      {/* 1) ATMOSPHERE: DRFTING AURORA GRADIENT */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            x: [0, 50, -50, 0],
            y: [0, -30, 30, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[20%] -left-[10%] w-[120%] h-[120%] bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.15),rgba(124,58,237,0.1),rgba(236,72,153,0.05),transparent_70%)] blur-[100px]"
        />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] contrast-150 brightness-150" />
      </div>

      {/* TOP NAV OVERLAY (Minimal) */}
      <div className="relative z-20 flex justify-between items-center px-6 py-6 lg:px-12">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${theme.previewColor} shadow-[0_0_20px_rgba(255,255,255,0.2)]`} />
          <span className="text-white font-bold tracking-tighter text-lg uppercase">{theme.name}</span>
        </div>
        <button 
          onClick={onClose}
          className="p-2 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all backdrop-blur-md"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* MAIN CONTENT SCROLL AREA */}
      <div className="flex-1 overflow-y-auto no-scrollbar relative z-10 px-6 lg:px-12 pb-32">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 pt-12">
          
          {/* LEFT: THE HERO CRYSTAL CARD */}
          <motion.div 
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: "spring", damping: 20 }}
            className="lg:w-[400px] shrink-0"
          >
            <div className="sticky top-12 p-8 rounded-[40px] bg-white/[0.03] border border-white/20 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_2px_10px_rgba(255,255,255,0.1)] relative overflow-hidden group">
              {/* Card light sweep */}
              <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
              
              <div className="relative z-10">
                <div className="w-24 h-24 rounded-full border-2 border-white/30 p-1 mb-8 bg-white/5 flex items-center justify-center text-4xl">
                  {theme.icon}
                </div>
                <h1 className="text-4xl font-extrabold text-white tracking-tighter mb-2 leading-none">{theme.name}</h1>
                <p className="text-cyan-300 font-medium tracking-wide text-sm uppercase mb-8">Premium Canvas Preview</p>
                
                <p className="text-zinc-400 text-lg leading-relaxed mb-10">
                  {theme.desc}
                </p>

                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <span className="text-zinc-500 text-xs font-bold tracking-widest uppercase">Verified</span>
                    <ShieldCheck className="w-5 h-5 text-cyan-400" />
                  </div>
                </div>

                {/* DESKTOP ACQUIRE BUTTON PLACEMENT */}
                <div className="hidden lg:block mt-12">
                   <button onClick={onUseTheme} className="w-full h-16 rounded-full bg-white/5 border border-white/20 backdrop-blur-xl text-white font-black uppercase tracking-widest relative overflow-hidden group shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98]">
                      <span className="relative z-10">Use This Vibe</span>
                      {/* Sheen Animation */}
                      <motion.div 
                        animate={{ x: ['-200%', '200%'] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent skew-x-[-20deg]"
                      />
                   </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* RIGHT: THE BENTO GRID */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[160px]">
            
            {/* LARGE BOX: HIGHLIGHTED PROJECT */}
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="md:col-span-2 row-span-2 rounded-[32px] bg-white/[0.03] border border-white/20 backdrop-blur-xl p-8 flex flex-col justify-between group cursor-pointer shadow-xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8">
                <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
                  <Zap className="w-6 h-6 text-cyan-400" />
                </div>
              </div>
              <div>
                <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[10px] text-cyan-400 font-black tracking-widest uppercase mb-4 inline-block">Featured</span>
                <h3 className="text-3xl font-bold text-white tracking-tight mb-2">{theme.name}</h3>
                <p className="text-zinc-400 max-w-sm">{theme.desc}</p>
              </div>
              <div className="flex items-center gap-2 text-white font-black text-xs uppercase tracking-widest group-hover:gap-4 transition-all">
                Preview Layout <ArrowRight className="w-4 h-4" />
              </div>
              <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-cyan-500/10 blur-[80px] rounded-full" />
              <img
                src={theme.previewImg}
                alt={`${theme.name} preview`}
                className="absolute inset-0 -z-10 w-full h-full object-cover opacity-20 pointer-events-none"
              />
            </motion.div>

            {/* SMALL BOX: STATS */}
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="row-span-1 rounded-[32px] bg-white/[0.03] border border-white/20 backdrop-blur-xl p-6 flex flex-col justify-between"
            >
              <Users className="w-5 h-5 text-zinc-500" />
              <div>
                <h4 className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">Active Users</h4>
                <p className="text-2xl font-black text-white font-mono-data tracking-tighter">14,202</p>
              </div>
            </motion.div>

            {/* SMALL BOX: REVENUE */}
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="row-span-1 rounded-[32px] bg-white/[0.03] border border-white/20 backdrop-blur-xl p-6 flex flex-col justify-between"
            >
              <CreditCard className="w-5 h-5 text-cyan-400" />
              <div>
                <h4 className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">Monthly Rev</h4>
                <p className="text-2xl font-black text-[#00FF41] font-mono-data tracking-tighter">$215,000</p>
              </div>
            </motion.div>

            {/* LONG BOX: SOCIALS */}
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="md:col-span-2 row-span-1 rounded-[32px] bg-white/[0.03] border border-white/20 backdrop-blur-xl p-8 flex items-center justify-between"
            >
              <div className="flex items-center gap-6">
                {[Instagram, Twitter, ExternalLink].map((Icon, idx) => (
                  <div key={idx} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all cursor-pointer">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                ))}
              </div>
              <div className="text-right">
                <h4 className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">Connected Networks</h4>
                <p className="text-sm font-bold text-white">3 Verified Profiles</p>
              </div>
            </motion.div>

            {/* MEDIUM BOX: SHOP */}
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="row-span-2 rounded-[32px] bg-[#0c0e12] border border-white/20 backdrop-blur-xl p-8 flex flex-col justify-between relative overflow-hidden group"
            >
              <div className="relative z-10">
                <ShoppingBag className="w-8 h-8 text-cyan-400 mb-6" />
                <h3 className="text-xl font-bold text-white tracking-tight mb-2">Boutique Shelf</h3>
                <p className="text-zinc-500 text-sm">Limited edition digital assets for builders.</p>
              </div>
              <button className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all">Visit Store</button>
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400/5 blur-[40px] group-hover:bg-cyan-400/10 transition-all" />
            </motion.div>

            {/* BOX: MUSIC */}
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="md:col-span-2 row-span-1 rounded-[32px] bg-white/[0.03] border border-white/20 backdrop-blur-xl p-8 flex items-center justify-between group"
            >
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Music className="w-6 h-6 text-white" />
                 </div>
                 <div>
                   <h4 className="text-white font-bold tracking-tight">Vibe Radio</h4>
                   <p className="text-zinc-500 text-xs font-mono-data">Now Spinning: Midnight Theory</p>
                 </div>
               </div>
               <div className="flex gap-1 items-end h-4">
                  {[2, 4, 3, 5, 2].map((h, i) => (
                    <motion.div 
                      key={i} 
                      animate={{ height: ['20%', '100%', '20%'] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1 }}
                      className="w-1 bg-cyan-400 rounded-full" 
                    />
                  ))}
               </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* MOBILE FLOATING ACQUIRE BUTTON */}
      <div className="lg:hidden fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full px-6">
         <button onClick={onUseTheme} className="w-full h-16 rounded-full bg-white/5 border border-white/20 backdrop-blur-2xl text-white font-black uppercase tracking-widest relative overflow-hidden shadow-2xl active:scale-95 transition-transform flex items-center justify-center gap-3">
            Use This Vibe
            <motion.div 
              animate={{ x: ['-200%', '200%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent skew-x-[-20deg]"
            />
         </button>
      </div>

    </motion.div>
  );
};

const CollectionTemplatePreview: React.FC<{
  template: CanvasTemplate;
  onClose: () => void;
  onUseTemplate: () => void;
}> = ({ template, onClose, onUseTemplate }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] w-screen h-[100dvh] bg-[#020408] overflow-hidden flex flex-col font-sans selection:bg-cyan-500/30"
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.08),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(56,189,248,0.08),transparent_55%)]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] contrast-150 brightness-150" />
      </div>

      <div className="relative z-20 flex justify-between items-center px-6 py-6 lg:px-12 border-b border-white/10 bg-black/30 backdrop-blur-xl">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">The Collection Preview</p>
          <h3 className="text-2xl font-extrabold tracking-tight text-white mt-1">{template.name}</h3>
          <p className="text-xs text-zinc-400 font-semibold uppercase tracking-[0.16em] mt-1">{template.type} • {template.author}</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all"
          aria-label="Close template preview"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto no-scrollbar px-6 lg:px-12 py-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-8">
          <motion.div
            initial={{ y: 22, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 180, damping: 24 }}
            className="lg:col-span-2"
          >
            <div className="sticky top-6 rounded-[34px] border border-white/20 bg-black/30 backdrop-blur-2xl p-6 shadow-[0_20px_70px_rgba(0,0,0,0.7)]">
              <div className={`aspect-[3/4] rounded-2xl ${template.color} p-5 border border-black/10 relative overflow-hidden`}>
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/10" />
                <div className="relative h-full rounded-xl bg-black/10 border border-black/10 p-4 flex flex-col">
                  <div className="w-2/3 h-3 bg-black/15 rounded-full mb-3" />
                  <div className="w-1/2 h-2 bg-black/15 rounded-full mb-5" />
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-black/10 border border-black/10" />
                    <div className="rounded-lg bg-black/10 border border-black/10" />
                    <div className="rounded-lg bg-black/10 border border-black/10 col-span-2" />
                  </div>
                </div>
              </div>
              <button
                onClick={onUseTemplate}
                className="mt-6 w-full h-14 rounded-2xl bg-white text-black font-black uppercase tracking-[0.2em] text-xs hover:bg-zinc-200 transition-all"
              >
                Use This Template
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 26, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.08, type: 'spring', stiffness: 170, damping: 24 }}
            className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6 auto-rows-[180px]"
          >
            <div className="md:col-span-2 rounded-[28px] border border-white/15 bg-white/[0.03] backdrop-blur-xl p-8">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300 mb-3">Template Positioning</p>
              <h4 className="text-3xl font-extrabold text-white tracking-tight mb-3">{template.name}</h4>
              <p className="text-zinc-400 leading-relaxed">
                High-fidelity storefront composition tuned for premium creator identity. This framework keeps your signal clear while preserving the Canvas aesthetic language.
              </p>
            </div>
            <div className="rounded-[28px] border border-white/15 bg-white/[0.03] backdrop-blur-xl p-6 flex flex-col justify-between">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">Theme Fit</p>
              <p className="text-2xl font-black text-white tracking-tight">{template.type}</p>
              <LayoutTemplate className="w-6 h-6 text-cyan-300" />
            </div>
            <div className="rounded-[28px] border border-white/15 bg-white/[0.03] backdrop-blur-xl p-6 flex flex-col justify-between">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">Crafted By</p>
              <p className="text-2xl font-black text-white tracking-tight">{template.author}</p>
              <Eye className="w-6 h-6 text-cyan-300" />
            </div>
            <div className="md:col-span-2 rounded-[28px] border border-white/15 bg-black/40 backdrop-blur-xl p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500 mb-2">Ready To Publish</p>
                <p className="text-zinc-300 font-medium">Set this template and continue to claim your `vibejam.co/slug` page.</p>
              </div>
              <button
                onClick={onUseTemplate}
                className="h-12 px-6 rounded-xl bg-white/10 border border-white/20 text-white font-black uppercase tracking-[0.18em] text-xs hover:bg-white/20 transition-all whitespace-nowrap"
              >
                Apply Template
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

interface CanvasViewProps {
  authUser: User | null;
  onRequireAuth?: () => void;
  onNavigateMainTab?: (tab: 'Rankings' | 'Marketplace' | 'Canvas') => void;
  onOpenProfile?: () => void;
  onToggleNotifications?: () => void;
  onOpenStartJam?: () => void;
  unreadCount?: number;
  isNotificationsOpen?: boolean;
}

const CanvasView: React.FC<CanvasViewProps> = ({
  authUser,
  onRequireAuth,
  onNavigateMainTab,
  onOpenProfile,
  onToggleNotifications,
  onOpenStartJam,
  unreadCount = 0,
  isNotificationsOpen = false,
}) => {
  const [catalog, setCatalog] = useState<CanvasCatalogResponse | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [isCatalogLoading, setIsCatalogLoading] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [previewTheme, setPreviewTheme] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<string | null>(null);
  const [claimedUsername, setClaimedUsername] = useState('');
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [isSavingOnboarding, setIsSavingOnboarding] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishResult, setPublishResult] = useState<CanvasPublishResult | null>(null);
  const [dashboardSession, setDashboardSession] = useState<CanvasDashboardSession | null>(null);
  const [isLaunchTransitionVisible, setIsLaunchTransitionVisible] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [needsSlugInput, setNeedsSlugInput] = useState(false);
  const slugInputRef = useRef<HTMLInputElement | null>(null);
  const dashboardSessionRef = useRef<CanvasDashboardSession | null>(null);
  const authEmail = authUser?.email ?? '';
  const authAvatarUrl =
    (authUser?.user_metadata?.avatar_url as string | undefined) ||
    (authUser?.user_metadata?.picture as string | undefined) ||
    'https://picsum.photos/id/64/100/100';
  const authDisplayName =
    (authUser?.user_metadata?.full_name as string | undefined) ||
    (authUser?.user_metadata?.name as string | undefined) ||
    (authEmail ? authEmail.split('@')[0] : 'Guest');

  useEffect(() => {
    dashboardSessionRef.current = dashboardSession;
  }, [dashboardSession]);

  useEffect(() => {
    let cancelled = false;

    const loadCatalog = async () => {
      try {
        const data = await fetchCanvasCatalog();
        if (cancelled) {
          return;
        }

        setCatalog(data);
        setSelectedTheme((prev) => prev ?? data.themes[0]?.id ?? null);
        setSelectedTemplate((prev) => prev ?? data.templates[0]?.id ?? null);
      } catch (error) {
        if (!cancelled) {
          setCatalogError(error instanceof Error ? error.message : 'Failed to load Canvas catalog.');
        }
      } finally {
        if (!cancelled) {
          setIsCatalogLoading(false);
        }
      }
    };

    loadCatalog();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadServerCanvasSession = async () => {
      if (!authUser) {
        return;
      }

      const localSession = readDashboardSessionFromStorage(authUser.id);
      if (localSession && !cancelled) {
        dashboardSessionRef.current = localSession;
        setDashboardSession(localSession);
        setPublishResult(localSession.publish);
        setClaimedUsername(localSession.publish.slug);
        setSelectedTheme((prev) => prev ?? localSession.onboarding.selectedTheme ?? null);
        setSelectedTemplate((prev) => prev ?? localSession.onboarding.selectedTemplateId ?? null);
      }

      try {
        const data = await fetchMyCanvasSession();
        if (cancelled) {
          return;
        }

        if (data.session) {
          dashboardSessionRef.current = data.session;
          setDashboardSession(data.session);
          setPublishResult(data.session.publish);
          setClaimedUsername(data.session.publish.slug);
          setSelectedTheme((prev) => prev ?? data.session?.onboarding.selectedTheme ?? null);
          setSelectedTemplate((prev) => prev ?? data.session?.onboarding.selectedTemplateId ?? null);
          writeDashboardSessionToStorage(authUser.id, data.session);
          setCatalogError((prev) => (prev === 'Failed to load your Canvas workspace.' ? null : prev));
        } else {
          let migratedSession: CanvasDashboardSession | null = null;

          if (typeof window !== 'undefined') {
            const keysToCheck = [
              `${LEGACY_DASHBOARD_SESSION_KEY}.${authUser.id}`,
              LEGACY_DASHBOARD_SESSION_KEY,
            ];
            for (const key of keysToCheck) {
              const raw = window.localStorage.getItem(key);
              if (!raw) {
                continue;
              }

              try {
                migratedSession = parseLegacyDashboardSession(JSON.parse(raw));
              } catch {
                migratedSession = null;
              }
              if (!migratedSession) {
                continue;
              }

              window.localStorage.removeItem(key);
              break;
            }
          }

          if (migratedSession) {
            dashboardSessionRef.current = migratedSession;
            setDashboardSession(migratedSession);
            setPublishResult(migratedSession.publish);
            setClaimedUsername(migratedSession.publish.slug);
            setSelectedTheme((prev) => prev ?? migratedSession?.onboarding.selectedTheme ?? null);
            setSelectedTemplate((prev) => prev ?? migratedSession?.onboarding.selectedTemplateId ?? null);
            writeDashboardSessionToStorage(authUser.id, migratedSession);

            saveCanvasOnboarding(migratedSession.onboarding)
              .then((result) => {
                if (cancelled) {
                  return;
                }
                const persistedSession = { onboarding: migratedSession.onboarding, publish: result };
                dashboardSessionRef.current = persistedSession;
                setDashboardSession(persistedSession);
                setPublishResult(result);
                setClaimedUsername(result.slug);
                writeDashboardSessionToStorage(authUser.id, persistedSession);
              })
              .catch(() => {
                // Keep migrated in-memory session; user can still continue in dashboard.
              });
          } else {
            if (!dashboardSessionRef.current) {
              setDashboardSession(null);
              setPublishResult(null);
              setClaimedUsername('');
            }
          }
        }
      } catch (error) {
        if (!cancelled) {
          if (!dashboardSessionRef.current) {
            setDashboardSession(null);
            setPublishResult(null);
            setClaimedUsername('');
          }
          setCatalogError((prev) =>
            prev ?? (error instanceof Error ? error.message : 'Failed to load your Canvas workspace.'),
          );
        }
      }
    };

    loadServerCanvasSession();

    return () => {
      cancelled = true;
    };
  }, [authUser]);

  useEffect(() => {
    if (authUser) {
      return;
    }

    if (isOnboarding || isLaunchTransitionVisible || isDashboardOpen) {
      return;
    }

    dashboardSessionRef.current = null;
    setDashboardSession(null);
    setPublishResult(null);
    setClaimedUsername('');
    setIsDashboardOpen(false);
    setIsLaunchTransitionVisible(false);
  }, [authUser, isDashboardOpen, isLaunchTransitionVisible, isOnboarding]);

  useEffect(() => {
    if (isLaunchTransitionVisible && !dashboardSession) {
      setIsLaunchTransitionVisible(false);
    }
  }, [dashboardSession, isLaunchTransitionVisible]);

  const themes = catalog?.themes ?? [];
  const templates = catalog?.templates ?? [];
  const themesForDisplay = useMemo<CanvasThemePreview[]>(
    () =>
      themes.map((theme, index) => {
        const override = THEME_DISPLAY_OVERRIDES[theme.id];
        return {
          ...theme,
          name: override?.name ?? theme.name,
          desc: override?.desc ?? theme.desc,
          previewColor: FALLBACK_THEME_COLOR_CLASSES[index % FALLBACK_THEME_COLOR_CLASSES.length],
          icon: FALLBACK_THEME_ICONS[index % FALLBACK_THEME_ICONS.length],
        };
      }),
    [themes],
  );
  const onboardingFrameworks = useMemo(() => {
    if (!selectedTheme) {
      return themesForDisplay;
    }

    const selected = themesForDisplay.find((theme) => theme.id === selectedTheme);
    if (!selected) {
      return themesForDisplay;
    }

    return [selected, ...themesForDisplay.filter((theme) => theme.id !== selected.id)];
  }, [selectedTheme, themesForDisplay]);
  const landingThemes = useMemo(() => themesForDisplay.slice(0, 5), [themesForDisplay]);
  const landingThemesUnique = useMemo(() => dedupeThemesById(landingThemes), [landingThemes]);
  const landingTemplates = useMemo(() => templates.slice(0, 6), [templates]);
  const landingTemplatesUnique = useMemo(() => dedupeTemplatesById(landingTemplates), [landingTemplates]);
  const studioThemesForDashboard = useMemo(() => {
    const collectionAsThemes: CanvasTheme[] = landingTemplatesUnique.map((item) => {
      const hex = parseTemplateHexColor(item.color);
      return {
        id: `collection-${item.id}`,
        name: item.name,
        desc: `${item.type} • ${item.author}`,
        accent: 'violet-400',
        previewImg: templatePreviewDataUri(hex),
      };
    });
    return dedupeThemesById([...landingThemesUnique, ...collectionAsThemes]);
  }, [landingTemplatesUnique, landingThemesUnique]);
  const activePreviewTheme = useMemo(
    () => themesForDisplay.find((theme) => theme.id === previewTheme) ?? null,
    [previewTheme, themesForDisplay],
  );
  const activePreviewTemplate = useMemo(
    () => templates.find((template) => template.id === previewTemplate) ?? null,
    [previewTemplate, templates],
  );

  const claimedSlug = normalizeSlug(claimedUsername);

  const openDashboard = useCallback(() => {
    if (!dashboardSession) {
      return;
    }

    setPublishError(null);
    setIsOnboarding(false);
    setIsLaunchTransitionVisible(false);
    setIsDashboardOpen(true);
  }, [dashboardSession]);

  useEffect(() => {
    if (!dashboardSession) {
      return;
    }

    if (isOnboarding || isLaunchTransitionVisible || isDashboardOpen) {
      return;
    }

    setIsDashboardOpen(true);
  }, [
    dashboardSession,
    isDashboardOpen,
    isLaunchTransitionVisible,
    isOnboarding,
  ]);

  useEffect(() => {
    if (!activePreviewTheme && !activePreviewTemplate) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    const originalOverscroll = document.body.style.overscrollBehavior;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setPreviewTheme(null);
        setPreviewTemplate(null);
      }
    };

    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.overscrollBehavior = originalOverscroll;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [activePreviewTheme, activePreviewTemplate]);

  useEffect(() => {
    if (!isLaunchTransitionVisible && !isDashboardOpen) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    const originalOverscroll = document.body.style.overscrollBehavior;
    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.overscrollBehavior = originalOverscroll;
    };
  }, [isLaunchTransitionVisible, isDashboardOpen]);

  const focusSlugInput = useCallback(() => {
    slugInputRef.current?.focus();
    slugInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  const handleClaimCanvas = useCallback(() => {
    if (!authUser) {
      onRequireAuth?.();
      return;
    }

    if (isCatalogLoading || onboardingFrameworks.length === 0) {
      return;
    }

    if (!claimedSlug) {
      setNeedsSlugInput(true);
      focusSlugInput();
      return;
    }

    setNeedsSlugInput(false);
    setPublishError(null);
    setIsOnboarding(true);
  }, [authUser, claimedSlug, focusSlugInput, isCatalogLoading, onRequireAuth, onboardingFrameworks.length]);

  const handleEnterDashboard = useCallback(async () => {
    const availableSession = dashboardSession ?? dashboardSessionRef.current;
    if (availableSession) {
      if (!dashboardSession) {
        dashboardSessionRef.current = availableSession;
        setDashboardSession(availableSession);
        setPublishResult(availableSession.publish);
        setClaimedUsername(availableSession.publish.slug);
      }
      setPublishError(null);
      setIsLaunchTransitionVisible(false);
      setIsOnboarding(false);
      setIsDashboardOpen(true);
      return;
    }

    if (!authUser) {
      onRequireAuth?.();
      setPublishError('Sign in required to load your Canvas dashboard.');
      return;
    }

    try {
      const data = await fetchMyCanvasSession();
      if (data.session) {
        dashboardSessionRef.current = data.session;
        setDashboardSession(data.session);
        setPublishResult(data.session.publish);
        setClaimedUsername(data.session.publish.slug);
        writeDashboardSessionToStorage(authUser.id, data.session);
        setPublishError(null);
        setIsLaunchTransitionVisible(false);
        setIsDashboardOpen(true);
        return;
      }
    } catch (error) {
      setPublishError(error instanceof Error ? error.message : 'Unable to load your Canvas dashboard.');
    }

    const localSession = readDashboardSessionFromStorage(authUser.id);
    if (localSession) {
      dashboardSessionRef.current = localSession;
      setDashboardSession(localSession);
      setPublishResult(localSession.publish);
      setClaimedUsername(localSession.publish.slug);
      setPublishError(null);
      setIsLaunchTransitionVisible(false);
      setIsDashboardOpen(true);
      return;
    }

    setIsLaunchTransitionVisible(false);
  }, [authUser, dashboardSession, onRequireAuth, openDashboard]);

  const handleCloseDashboard = useCallback(() => {
    setIsDashboardOpen(false);
  }, []);

  const renderThemePreview = () => {
    if (!activePreviewTheme) {
      return null;
    }

    const handleClose = () => setPreviewTheme(null);
    const handleUseTheme = () => {
      setSelectedTheme(activePreviewTheme.id);
      setPreviewTheme(null);
    };

    switch (activePreviewTheme.id) {
      case 'midnight-zenith':
        return <MidnightZenithPreviewShell onClose={handleClose} onUseTheme={handleUseTheme} />;
      case 'editorial-kinetic':
        return <EditorialKineticPreviewShell onClose={handleClose} onUseTheme={handleUseTheme} />;
      case 'concrete-vibe':
        return <CreatorHubPreviewShell onClose={handleClose} onUseTheme={handleUseTheme} />;
      case 'aurora-bento':
        return <EtherealLiquidPreviewShell onClose={handleClose} onUseTheme={handleUseTheme} />;
      case 'glass-artifact':
        return <GlassArtifactPreviewShell onClose={handleClose} onUseTheme={handleUseTheme} />;
      default:
        return (
          <AuroraCrystalBentoPreview
            theme={activePreviewTheme}
            onClose={handleClose}
            onUseTheme={handleUseTheme}
          />
        );
    }
  };

  const renderTemplatePreview = () => {
    if (!activePreviewTemplate) {
      return null;
    }

    const handleClose = () => setPreviewTemplate(null);
    const handleUseTemplate = () => {
      setSelectedTemplate(activePreviewTemplate.id);
      setPreviewTemplate(null);
    };

    switch (activePreviewTemplate.id) {
      case 'gold-standard':
        return (
          <GoldStandardCollectionPreviewShell
            onClose={handleClose}
            onUseTemplate={handleUseTemplate}
          />
        );
      case 'accordion-deck':
        return (
          <AccordionDeckCollectionPreviewShell
            onClose={handleClose}
            onUseTemplate={handleUseTemplate}
          />
        );
      case 'collage-os':
        return (
          <CollageOsCollectionPreviewShell
            onClose={handleClose}
            onUseTemplate={handleUseTemplate}
          />
        );
      case 'terrarium':
        return (
          <TerrariumCollectionPreviewShell
            onClose={handleClose}
            onUseTemplate={handleUseTemplate}
          />
        );
      case 'prism-os':
        return (
          <PrismOsCollectionPreviewShell
            onClose={handleClose}
            onUseTemplate={handleUseTemplate}
          />
        );
      case 'aero-canvas':
        return (
          <AeroCanvasCollectionPreviewShell
            onClose={handleClose}
            onUseTemplate={handleUseTemplate}
          />
        );
      default:
        return (
          <CollectionTemplatePreview
            template={activePreviewTemplate}
            onClose={handleClose}
            onUseTemplate={handleUseTemplate}
          />
        );
    }
  };

  return (
    <div className="space-y-32 pb-32">
      
      {/* 1) HERO SECTION */}
      <section className="relative pt-12 text-center md:text-left">
        <div className="max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-8"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
            <span className="text-[10px] font-black tracking-[0.2em] uppercase text-zinc-400">Introducing Canvas</span>
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-8xl font-extrabold tracking-tighter text-white mb-8 leading-[0.9]"
          >
            Claim your <br />
            <span className="text-zinc-600 italic font-serif-rank">Canvas.</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-zinc-500 text-lg md:text-2xl font-medium max-w-2xl mb-12"
          >
            Your unique journey, showcased. 20k+ creators are already remarkable. <span className="text-zinc-400">It's time you stood out from the crowd.</span>
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-4"
          >
            <div className="relative w-full sm:w-80 group">
              <input 
                ref={slugInputRef}
                type="text" 
                placeholder="vibejam.co/yourname"
                value={claimedUsername}
                onChange={(e) => {
                  setClaimedUsername(e.target.value);
                  if (needsSlugInput) {
                    setNeedsSlugInput(false);
                  }
                }}
                className={`w-full h-14 bg-white/5 border rounded-2xl px-6 text-white font-mono-data focus:outline-none focus:ring-1 transition-all ${
                  needsSlugInput
                    ? 'border-amber-400/70 focus:ring-amber-300/50'
                    : 'border-white/10 focus:ring-white/30'
                }`}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 opacity-50 group-hover:opacity-100 transition-opacity">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="text-[8px] font-bold tracking-widest uppercase">Available</span>
              </div>
            </div>
            <button
              disabled={isCatalogLoading}
              onClick={handleClaimCanvas}
              className="h-14 px-8 rounded-2xl bg-white text-black font-black uppercase tracking-tight hover:bg-zinc-200 transition-all flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              {isCatalogLoading ? 'Loading Canvas...' : authUser ? 'Claim My Canvas' : 'Sign In To Claim'} <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
          {claimedSlug && (
            <p className="mt-3 text-xs text-zinc-500 font-mono-data">
              Publishing as `https://vibejam.co/{claimedSlug}`
            </p>
          )}
          {needsSlugInput && authUser && (
            <p className="mt-2 text-xs text-amber-300">Enter your Canvas name to continue.</p>
          )}
        </div>

        {/* Floating Preview Asset (Mobile Mockup-like) */}
        <div className="hidden xl:block absolute -right-20 top-0 w-[500px] h-[700px] pointer-events-none">
          <div className="relative w-full h-full bg-[#111] rounded-[48px] border-[12px] border-[#222] overflow-hidden shadow-2xl rotate-3">
             <div className="absolute top-0 w-full h-24 bg-gradient-to-b from-black/80 to-transparent z-10" />
             <div className="p-8 pt-16">
                <div className="w-16 h-16 rounded-full bg-zinc-800 mb-4" />
                <div className="w-32 h-4 bg-white/20 rounded-full mb-2" />
                <div className="w-24 h-3 bg-white/10 rounded-full mb-8" />
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/10 h-24" />
                  ))}
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* 2) THEME GALLERY: "CHOOSE YOUR VIBE" */}
      <section className="space-y-16">
        <div className="text-center md:text-left">
          <h3 className="text-3xl md:text-5xl font-extrabold tracking-tighter text-white mb-4">Choose Your Vibe</h3>
          <p className="text-zinc-500 text-lg font-medium">Your page will look great by default. <span className="text-zinc-400">You can always tweak it later.</span></p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {landingThemes.map((theme, i) => (
            <motion.div
              key={theme.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              onClick={() => setSelectedTheme(theme.id)}
              className={`group relative flex flex-col h-[500px] rounded-[32px] overflow-hidden cursor-pointer transition-all duration-500 border-2 
                ${selectedTheme === theme.id ? 'border-white ring-4 ring-white/10 scale-105' : 'border-white/10 hover:border-white/30'} bg-zinc-950`}
            >
              {/* Theme Preview Mini Window */}
              <div className={`flex-1 w-full bg-gradient-to-br ${theme.previewColor} relative p-6 flex flex-col justify-center items-center overflow-hidden`}>
                <div className="absolute top-4 left-4 text-2xl opacity-40 group-hover:opacity-100 transition-opacity">{theme.icon}</div>
                <div className="w-full h-32 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 flex flex-col p-4 shadow-xl transition-transform group-hover:scale-110">
                   <div className="w-12 h-1 bg-white/20 rounded-full mb-2" />
                   <div className="w-8 h-1 bg-white/10 rounded-full mb-4" />
                   <div className="flex-1 grid grid-cols-2 gap-2">
                     <div className="bg-white/5 rounded-md" />
                     <div className="bg-white/5 rounded-md" />
                   </div>
                </div>
                
                {/* Ambient Animation Inside */}
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
                  transition={{ duration: 5, repeat: Infinity }}
                  className="absolute inset-0 bg-white/5 blur-[40px] pointer-events-none"
                />
              </div>

              {/* Theme Details */}
              <div className="p-6 bg-black/40 backdrop-blur-md border-t border-white/5">
                <h4 className="text-white font-bold text-lg tracking-tight mb-1">{theme.name}</h4>
                <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest leading-tight">{theme.desc}</p>
                
                <div className="mt-6 flex gap-2">
                   <button 
                     onClick={(e) => { e.stopPropagation(); setPreviewTheme(theme.id); }}
                     className="flex-1 py-2 text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all"
                   >
                     Preview
                   </button>
                   <button 
                     onClick={(e) => { e.stopPropagation(); setSelectedTheme(theme.id); }}
                     className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all
                       ${selectedTheme === theme.id ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}
                   >
                     {selectedTheme === theme.id ? 'Selected' : 'Select'}
                   </button>
                </div>
              </div>

              {/* Glow when selected */}
              <AnimatePresence>
                {selectedTheme === theme.id && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`absolute inset-0 shadow-[0_0_60px_-10px_rgba(255,255,255,0.2)] pointer-events-none`}
                  />
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Global Acquire Action */}
        <AnimatePresence>
          {selectedTheme && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-center"
            >
              <button className="px-12 py-4 rounded-full bg-white text-black font-black uppercase tracking-widest hover:scale-105 transition-all shadow-2xl flex items-center gap-3">
                Acquire Theme <ChevronRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* 3) FEATURE LANDING: "SHARE & ANALYZE" */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { 
            title: 'Share Anywhere', 
            icon: Share2, 
            desc: 'Your link works perfectly in Instagram bios, X profiles, and LinkedIn. It\'s the only business card you need.',
            color: 'text-blue-400'
          },
          { 
            title: 'Analyze Audience', 
            icon: Users, 
            desc: 'Understand exactly who is visiting. Location, device, and source tracking built-in for precision.',
            color: 'text-purple-400'
          },
          { 
            title: 'Real-time Metrics', 
            icon: BarChart3, 
            desc: 'Watch your growth live. Pulse tracking shows engagement heatmaps and conversion velocity.',
            color: 'text-green-400'
          }
        ].map((feat, i) => (
          <div key={feat.title} className="p-10 rounded-[40px] bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all flex flex-col gap-6">
            <div className={`w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center ${feat.color}`}>
              <feat.icon className="w-7 h-7" />
            </div>
            <h4 className="text-2xl font-bold text-white tracking-tight">{feat.title}</h4>
            <p className="text-zinc-500 leading-relaxed">{feat.desc}</p>
          </div>
        ))}
      </section>

      {/* 4) TEMPLATE LOOKBOOK */}
      <section className="space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
             <h3 className="text-3xl md:text-5xl font-extrabold tracking-tighter text-white mb-2">The Collection</h3>
             <p className="text-zinc-500 text-lg font-medium">Curated design frameworks for every digital craftsman.</p>
          </div>
          <button className="text-zinc-400 font-bold hover:text-white transition-colors flex items-center gap-2 text-xs uppercase tracking-widest">
            View All Frameworks <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {landingTemplates.map((tmpl, i) => (
            <motion.div 
              key={tmpl.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="group cursor-pointer"
              onClick={() => {
                setSelectedTemplate(tmpl.id);
                setPreviewTemplate(tmpl.id);
              }}
            >
              <div className={`aspect-[3/4] rounded-2xl ${tmpl.color} mb-3 relative overflow-hidden transition-transform group-hover:-translate-y-2 ${selectedTemplate === tmpl.id ? 'ring-2 ring-white/60' : ''}`}>
                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Eye className="w-6 h-6 text-white" />
                </div>
                {/* Minimal preview mockup */}
                <div className="absolute inset-4 rounded-lg bg-black/5 border border-black/5 flex flex-col p-3">
                   <div className="w-1/2 h-2 bg-black/10 rounded-full mb-2" />
                   <div className="flex-1 rounded bg-black/5" />
                </div>
              </div>
              <p className="text-xs font-bold text-white tracking-tight mb-0.5">{tmpl.name}</p>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{tmpl.type} • {tmpl.author}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Final CTA Strip */}
      <div className="p-12 md:p-20 rounded-[48px] bg-gradient-to-br from-white/[0.05] via-black to-black border border-white/5 flex flex-col items-center text-center">
         <div className="w-20 h-20 rounded-3xl bg-white text-black flex items-center justify-center mb-10 shadow-[0_0_50px_rgba(255,255,255,0.2)]">
            <LayoutTemplate className="w-10 h-10" />
         </div>
         <h2 className="text-4xl md:text-6xl font-extrabold text-white tracking-tighter mb-6 leading-tight">Your digital storefront, <br />vibe-coded in seconds.</h2>
         <p className="text-zinc-500 text-lg md:text-xl max-w-xl mb-12 font-medium italic">Stop building landing pages from scratch. Claim your canvas and let your work do the talking.</p>
         <button
           type="button"
           onClick={handleClaimCanvas}
           disabled={isCatalogLoading}
           className="px-12 py-5 rounded-2xl bg-white text-black font-black uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
         >
           Start My Canvas For Free <Rocket className="w-5 h-5" />
         </button>
      </div>

      {catalogError && (
        <div className="p-6 rounded-3xl border border-yellow-500/30 bg-yellow-500/10">
          <p className="text-yellow-200 text-sm">Catalog notice: {catalogError}</p>
        </div>
      )}

      {/* FULL-SCREEN THEME PREVIEW OVERLAY */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {renderThemePreview()}
            {renderTemplatePreview()}
          </AnimatePresence>,
          document.body,
        )}

      {/* ONBOARDING FLOW OVERLAY */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isOnboarding && (
              <CanvasOnboarding
                claimedName={claimedSlug}
                vanitySlug={claimedSlug}
                frameworks={onboardingFrameworks}
                initialThemeId={selectedTheme ?? undefined}
                selectedTemplateId={selectedTemplate ?? undefined}
                isPublishing={isSavingOnboarding}
                publishError={publishError}
                onThemeChange={(themeId) => setSelectedTheme(themeId)}
                onPreviewTheme={(themeId) => setPreviewTheme(themeId)}
                onClose={() => {
                  setPublishError(null);
                  setIsOnboarding(false);
                }}
                onComplete={async (data) => {
                  setIsSavingOnboarding(true);
                  setPublishError(null);
                  try {
                    const result = await saveCanvasOnboarding(data);
                    const nextSession = { onboarding: data, publish: result };
                    dashboardSessionRef.current = nextSession;
                    setPublishResult(result);
                    setClaimedUsername(result.slug);
                    setDashboardSession(nextSession);
                    if (authUser) {
                      writeDashboardSessionToStorage(authUser.id, nextSession);
                    }
                    setIsDashboardOpen(false);
                    setIsLaunchTransitionVisible(true);
                    setIsOnboarding(false);
                  } catch (error) {
                    setPublishError(error instanceof Error ? error.message : 'Failed to publish Canvas.');
                  } finally {
                    setIsSavingOnboarding(false);
                  }
                }}
              />
            )}
          </AnimatePresence>,
          document.body,
        )}

      {/* POST-PUBLISH LAUNCH EXPERIENCE */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isLaunchTransitionVisible && dashboardSession && (
              <CanvasPublishTransition publish={dashboardSession.publish} onContinue={handleEnterDashboard} />
            )}
            {isDashboardOpen && dashboardSession && (
              <CanvasCommandDashboard
                onboarding={dashboardSession.onboarding}
                publish={dashboardSession.publish}
                themes={themesForDisplay}
                studioThemes={studioThemesForDashboard}
                authAvatarUrl={authAvatarUrl}
                authDisplayName={authDisplayName}
                unreadCount={unreadCount}
                isNotificationsOpen={isNotificationsOpen}
                onNavigateMainTab={onNavigateMainTab}
                onToggleNotifications={onToggleNotifications}
                onOpenProfile={onOpenProfile}
                onOpenStartJam={onOpenStartJam}
                onClose={handleCloseDashboard}
              />
            )}
          </AnimatePresence>,
          document.body,
        )}

    </div>
  );
};

export default CanvasView;
