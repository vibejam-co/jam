
import React from 'react';
import { 
  Globe, 
  Mail, 
  Users, 
  Twitter, 
  Instagram, 
  Github, 
  CheckCircle2, 
  TrendingUp, 
  Ship,
  Sparkles,
  Zap,
  Coffee
} from 'lucide-react';
import { Creator, Product, CTALink, TrustBadge, TimelineEntry } from './types';

export const CREATOR: Creator = {
  name: "Alex Rivera",
  avatar: "https://picsum.photos/id/64/400/400",
  description: "Digital artisan building tools for mindful creators. Shipping weekly from a sunny studio in Barcelona.",
  socials: [
    { platform: "Twitter", url: "#", icon: "twitter" },
    { platform: "Instagram", url: "#", icon: "instagram" },
    { platform: "Github", url: "#", icon: "github" },
  ]
};

export const FEATURED_PRODUCT: Product = {
  id: "featured-1",
  title: "The Mindful Workspace",
  description: "A curated system for focus, aesthetics, and deep work. Includes Notion templates, soundscapes, and digital widgets.",
  image: "https://picsum.photos/id/20/800/450",
  cta: "Get it now",
  featured: true
};

export const CTA_CARDS: CTALink[] = [
  { 
    title: "Visit Website", 
    icon: <Globe size={24} />, 
    url: "#", 
    color: "bg-[#F2CC8F]/20" 
  },
  { 
    title: "Join Newsletter", 
    icon: <Mail size={24} />, 
    url: "#", 
    color: "bg-[#E07A5F]/15" 
  },
  { 
    title: "Community", 
    icon: <Users size={24} />, 
    url: "#", 
    color: "bg-[#81B29A]/20" 
  },
];

export const CATALOG: Product[] = [
  {
    id: "p1",
    title: "Lofi Focus Pack",
    description: "6 hours of original focus music.",
    image: "https://picsum.photos/id/26/300/300",
    price: "$12",
    cta: "Buy"
  },
  {
    id: "p2",
    title: "Visual Assets 01",
    description: "Hand-drawn UI icons and shapes.",
    image: "https://picsum.photos/id/30/300/300",
    price: "$24",
    cta: "Explore"
  },
  {
    id: "p3",
    title: "Weekly Planner",
    description: "Simple PDF for high-level goals.",
    image: "https://picsum.photos/id/37/300/300",
    price: "Free",
    cta: "Download"
  },
  {
    id: "p4",
    title: "Creative Pro Set",
    description: "Everything you need to launch.",
    image: "https://picsum.photos/id/42/300/300",
    price: "$49",
    cta: "View"
  }
];

export const TRUST_BADGES: TrustBadge[] = [
  { label: "Verified Revenue", icon: <CheckCircle2 size={18} className="text-[#81B29A]" /> },
  { label: "Consistent Weekly Shipping", icon: <Ship size={18} className="text-[#81B29A]" /> },
  { label: "2,400+ Active Users", icon: <TrendingUp size={18} className="text-[#81B29A]" /> },
];

export const TIMELINE: TimelineEntry[] = [
  {
    date: "March 12, 2024",
    title: "New Layout Release",
    content: "Refined the Mindful Workspace dashboard for better mobile accessibility.",
    icon: <Sparkles size={16} />
  },
  {
    date: "Feb 28, 2024",
    title: "Hit 2k Users!",
    content: "Incredible milestone. Thank you all for the trust in VibeJam.",
    icon: <Zap size={16} />
  },
  {
    date: "Feb 15, 2024",
    title: "Coffee Chat",
    content: "Hosted a community Q&A about building in public.",
    icon: <Coffee size={16} />
  }
];
