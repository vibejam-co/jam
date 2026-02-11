type CanvasThemeSeed = {
  id: string;
  name: string;
  desc: string;
  accent: string;
  previewImg: string;
  atmosphere: 'glass' | 'editorial' | 'brutalist' | 'aurora' | 'luxe' | 'retro';
};

type CanvasTemplateSeed = {
  id: string;
  name: string;
  type: string;
  author: string;
  color: string;
};

const BASE_CANVAS_THEMES: CanvasThemeSeed[] = [
  { id: 'midnight-zenith', name: 'Midnight Zenith', desc: 'Bento-style architecture with glass-morphism.', accent: 'cyan-400', previewImg: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=600', atmosphere: 'glass' },
  { id: 'editorial-kinetic', name: 'Editorial Kinetic', desc: 'Bold Swiss typography and high-contrast layouts.', accent: 'yellow-400', previewImg: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&q=80&w=600', atmosphere: 'editorial' },
  { id: 'concrete-vibe', name: 'Concrete Vibe', desc: 'Brutalist minimalism with raw textures.', accent: 'rose-500', previewImg: 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?auto=format&fit=crop&q=80&w=600', atmosphere: 'brutalist' },
  { id: 'aurora-bento', name: 'Aurora Bento', desc: 'Soft gradients and organic liquid shapes.', accent: 'purple-500', previewImg: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=600', atmosphere: 'aurora' },
  { id: 'glass-artifact', name: 'Glass Artifact', desc: 'Pure transparency for ultra-clean storefronts.', accent: 'blue-400', previewImg: 'https://images.unsplash.com/photo-1633167606207-d840b5070fc2?auto=format&fit=crop&q=80&w=600', atmosphere: 'glass' },
  { id: 'retro-grid', name: 'Retro Grid', desc: 'Structured 8-bit energy for builders.', accent: 'green-400', previewImg: 'https://images.unsplash.com/photo-1618556450991-2f1af64e8191?auto=format&fit=crop&q=80&w=600', atmosphere: 'retro' },
  { id: 'aurora-crystal-bento', name: 'Aurora Crystal Bento', desc: 'Flagship gradient lattice with drifting atmosphere.', accent: 'cyan-400', previewImg: 'https://images.unsplash.com/photo-1647259754939-b661f5f55d7f?auto=format&fit=crop&q=80&w=600', atmosphere: 'aurora' },
  { id: 'editorial-pop', name: 'Editorial Pop', desc: 'Typography-led layout with kinetic contrast.', accent: 'orange-400', previewImg: 'https://images.unsplash.com/photo-1604076913837-52ab5629fba9?auto=format&fit=crop&q=80&w=600', atmosphere: 'editorial' },
  { id: 'neon-artifact-night', name: 'Neon Artifact Night', desc: 'Dark cinematic rails with neon callouts.', accent: 'fuchsia-400', previewImg: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&q=80&w=600', atmosphere: 'luxe' },
  { id: 'soft-luxe-storefront', name: 'Soft Luxe Storefront', desc: 'Warm premium cards optimized for conversion.', accent: 'amber-300', previewImg: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=600', atmosphere: 'luxe' },
  { id: 'sonic-gradient-stage', name: 'Sonic Gradient Stage', desc: 'Performance layout for creators and music builders.', accent: 'emerald-400', previewImg: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=600', atmosphere: 'aurora' },
  { id: 'carbon-jewelbox', name: 'Carbon Jewelbox', desc: 'Levelled depth hierarchy with carbon textures.', accent: 'zinc-300', previewImg: 'https://images.unsplash.com/photo-1484417894907-623942c8ee29?auto=format&fit=crop&q=80&w=600', atmosphere: 'brutalist' },
  { id: 'opal-signal-grid', name: 'Opal Signal Grid', desc: 'Signal-first canvas with prism accents.', accent: 'sky-300', previewImg: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=600', atmosphere: 'glass' },
  { id: 'night-market-frame', name: 'Night Market Frame', desc: 'For storefront creators with conversion blocks.', accent: 'violet-400', previewImg: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=600', atmosphere: 'luxe' },
  { id: 'zen-terminal', name: 'Zen Terminal', desc: 'Mono-first data shell for technical founders.', accent: 'lime-400', previewImg: 'https://images.unsplash.com/photo-1518773553398-650c184e0bb3?auto=format&fit=crop&q=80&w=600', atmosphere: 'retro' },
  { id: 'obsidian-metric', name: 'Obsidian Metric', desc: 'High-signal metric composition on black.', accent: 'cyan-300', previewImg: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&q=80&w=600', atmosphere: 'glass' },
  { id: 'atlas-bento', name: 'Atlas Bento', desc: 'Map-like information architecture with soft cards.', accent: 'indigo-300', previewImg: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=600', atmosphere: 'aurora' },
  { id: 'sapphire-sweep', name: 'Sapphire Sweep', desc: 'Sheen interactions for premium CTAs.', accent: 'blue-300', previewImg: 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&q=80&w=600', atmosphere: 'glass' },
  { id: 'radial-blacksmith', name: 'Radial Blacksmith', desc: 'Forged texture and heavy modular spacing.', accent: 'stone-300', previewImg: 'https://images.unsplash.com/photo-1514517220031-f9fa831f08ad?auto=format&fit=crop&q=80&w=600', atmosphere: 'brutalist' },
  { id: 'halo-economy', name: 'Halo Economy', desc: 'Creator economy storefront with halo chips.', accent: 'teal-300', previewImg: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=600', atmosphere: 'aurora' },
  { id: 'monarch-editorial', name: 'Monarch Editorial', desc: 'Luxury serif pairing with clean rails.', accent: 'amber-400', previewImg: 'https://images.unsplash.com/photo-1517142089942-ba376ce32a2e?auto=format&fit=crop&q=80&w=600', atmosphere: 'editorial' },
  { id: 'chrome-collage', name: 'Chrome Collage', desc: 'Layered card collage for multi-brand creators.', accent: 'slate-300', previewImg: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=600', atmosphere: 'retro' },
  { id: 'prism-protocol', name: 'Prism Protocol', desc: 'Scientific signal badges and strict geometry.', accent: 'violet-300', previewImg: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=600', atmosphere: 'glass' },
  { id: 'quartz-newsroom', name: 'Quartz Newsroom', desc: 'Editorial stack for writers and product voices.', accent: 'yellow-300', previewImg: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=600', atmosphere: 'editorial' },
];

const EXPANDED_THEME_VARIANTS: CanvasThemeSeed[] = BASE_CANVAS_THEMES.slice(0, 20).map((theme) => ({
  ...theme,
  id: `${theme.id}-atelier`,
  name: `${theme.name} Atelier`,
  desc: `${theme.desc} Atelier variation with deeper signal contrast.`,
}));

export const CANVAS_THEMES: CanvasThemeSeed[] = [...BASE_CANVAS_THEMES, ...EXPANDED_THEME_VARIANTS];

export const CANVAS_TEMPLATES: CanvasTemplateSeed[] = [
  { id: 'gold-standard', name: 'Gold Standard', type: 'Architectural', author: 'Julian Vane', color: 'bg-[#0A0A0A]' },
  { id: 'accordion-deck', name: 'Accordion Deck', type: 'Brutal Luxe', author: 'Kinetic Slicer', color: 'bg-[#A9A8AF]' },
  { id: 'collage-os', name: 'Collage OS', type: 'Creative', author: 'MSCHF Style', color: 'bg-[#E5E1D5]' },
  { id: 'terrarium', name: 'Terrarium', type: 'Nature', author: 'Wanderer', color: 'bg-[#F7EFC8]' },
  { id: 'prism-os', name: 'Prism OS', type: 'Refractive', author: 'Alex DRV', color: 'bg-[#0F1115]' },
  { id: 'aero-canvas', name: 'Aero Canvas', type: 'Spatial', author: 'Alex Vibe', color: 'bg-[#FAFAFA]' },
  { id: 'founder-console', name: 'Founder Console', type: 'Startup', author: 'VibeJam', color: 'bg-[#111827]' },
  { id: 'fundflow-lab', name: 'Fundflow Lab', type: 'Fintech', author: 'VibeJam', color: 'bg-[#0B132B]' },
  { id: 'motion-folio', name: 'Motion Folio', type: 'Design', author: 'VibeJam', color: 'bg-[#1C1B29]' },
  { id: 'chroma-studio', name: 'Chroma Studio', type: 'Creative', author: 'VibeJam', color: 'bg-[#F5F3FF]' },
  { id: 'devlink-pro', name: 'Devlink Pro', type: 'Developer', author: 'VibeJam', color: 'bg-[#0A0A0A]' },
  { id: 'byte-atelier', name: 'Byte Atelier', type: 'Product', author: 'VibeJam', color: 'bg-[#161B22]' },
  { id: 'stream-operator', name: 'Stream Operator', type: 'Content', author: 'VibeJam', color: 'bg-[#0E1A2B]' },
  { id: 'signal-vault', name: 'Signal Vault', type: 'Brand', author: 'VibeJam', color: 'bg-[#101828]' },
  { id: 'noir-ledger', name: 'Noir Ledger', type: 'Analytics', author: 'VibeJam', color: 'bg-[#111111]' },
  { id: 'luma-poster', name: 'Luma Poster', type: 'Editorial', author: 'VibeJam', color: 'bg-[#FEF3C7]' },
  { id: 'tempo-grid', name: 'Tempo Grid', type: 'Music', author: 'VibeJam', color: 'bg-[#0D1321]' },
  { id: 'opal-window', name: 'Opal Window', type: 'Portfolio', author: 'VibeJam', color: 'bg-[#E0F2FE]' },
  { id: 'commerce-bento', name: 'Commerce Bento', type: 'Ecommerce', author: 'VibeJam', color: 'bg-[#1F2937]' },
  { id: 'api-briefing', name: 'API Briefing', type: 'Developer', author: 'VibeJam', color: 'bg-[#111827]' },
  { id: 'canvas-radio', name: 'Canvas Radio', type: 'Music', author: 'VibeJam', color: 'bg-[#1E1B4B]' },
  { id: 'market-nova', name: 'Market Nova', type: 'Marketplace', author: 'VibeJam', color: 'bg-[#0F172A]' },
  { id: 'atelier-lens', name: 'Atelier Lens', type: 'Creator', author: 'VibeJam', color: 'bg-[#172554]' },
  { id: 'zenith-feed', name: 'Zenith Feed', type: 'SaaS', author: 'VibeJam', color: 'bg-[#030712]' },
  { id: 'modular-pulse', name: 'Modular Pulse', type: 'Product', author: 'VibeJam', color: 'bg-[#111827]' },
  { id: 'lattice-pro', name: 'Lattice Pro', type: 'AI', author: 'VibeJam', color: 'bg-[#082F49]' },
  { id: 'foundry-showcase', name: 'Foundry Showcase', type: 'Developer', author: 'VibeJam', color: 'bg-[#18181B]' },
  { id: 'glacier-note', name: 'Glacier Note', type: 'Writing', author: 'VibeJam', color: 'bg-[#F8FAFC]' },
  { id: 'tone-board', name: 'Tone Board', type: 'Creative', author: 'VibeJam', color: 'bg-[#27272A]' },
  { id: 'buildstream', name: 'Buildstream', type: 'Engineering', author: 'VibeJam', color: 'bg-[#020617]' },
  { id: 'studio-broker', name: 'Studio Broker', type: 'Agency', author: 'VibeJam', color: 'bg-[#1E293B]' },
  { id: 'glow-deck', name: 'Glow Deck', type: 'Pitch', author: 'VibeJam', color: 'bg-[#1F1147]' },
  { id: 'orbit-catalog', name: 'Orbit Catalog', type: 'DTC', author: 'VibeJam', color: 'bg-[#0C4A6E]' },
  { id: 'signal-labbook', name: 'Signal Labbook', type: 'Research', author: 'VibeJam', color: 'bg-[#0A192F]' },
  { id: 'creator-brief', name: 'Creator Brief', type: 'Creator', author: 'VibeJam', color: 'bg-[#1F2937]' },
  { id: 'venture-panel', name: 'Venture Panel', type: 'Investor', author: 'VibeJam', color: 'bg-[#111827]' },
  { id: 'craft-docket', name: 'Craft Docket', type: 'Design', author: 'VibeJam', color: 'bg-[#172554]' },
  { id: 'wave-index', name: 'Wave Index', type: 'Analytics', author: 'VibeJam', color: 'bg-[#082F49]' },
  { id: 'metric-ward', name: 'Metric Ward', type: 'Health', author: 'VibeJam', color: 'bg-[#083344]' },
  { id: 'launch-strata', name: 'Launch Strata', type: 'Startup', author: 'VibeJam', color: 'bg-[#111827]' },
  { id: 'arc-portfolio', name: 'Arc Portfolio', type: 'Freelance', author: 'VibeJam', color: 'bg-[#020617]' },
  { id: 'maker-hall', name: 'Maker Hall', type: 'No-Code', author: 'VibeJam', color: 'bg-[#292524]' },
  { id: 'radar-press', name: 'Radar Press', type: 'Media', author: 'VibeJam', color: 'bg-[#1F2937]' },
  { id: 'velocity-core', name: 'Velocity Core', type: 'Performance', author: 'VibeJam', color: 'bg-[#0B1120]' },
  { id: 'nexus-shell', name: 'Nexus Shell', type: 'Developer', author: 'VibeJam', color: 'bg-[#09090B]' },
  { id: 'vibe-index', name: 'Vibe Index', type: 'Personal Brand', author: 'VibeJam', color: 'bg-[#172554]' },
  { id: 'signal-operator', name: 'Signal Operator', type: 'Creator', author: 'VibeJam', color: 'bg-[#101828]' },
  { id: 'artifact-room', name: 'Artifact Room', type: 'Showroom', author: 'VibeJam', color: 'bg-[#171717]' },
];

export const featuredFrameworks = CANVAS_THEMES.slice(0, 6);
