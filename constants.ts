
import { VibeApp, MarketItem, TrendingItem, Notification } from './types';

const mockHistory = [
  { date: 'Jan', revenue: 30000 },
  { date: 'Feb', revenue: 35000 },
  { date: 'Mar', revenue: 42000 },
  { date: 'Apr', revenue: 38000 },
  { date: 'May', revenue: 52000 },
  { date: 'Jun', revenue: 64000 },
  { date: 'Jul', revenue: 78000 },
  { date: 'Aug', revenue: 124500 },
];

export const APPS: VibeApp[] = [
  {
    id: '1',
    rank: '01',
    name: 'Luminal AI',
    pitch: 'Next-gen cognitive architecture for designers.',
    icon: '✨',
    accentColor: '124, 58, 237',
    monthlyRevenue: 124500,
    lifetimeRevenue: 1200000,
    activeUsers: 14202,
    buildStreak: 14,
    growth: 24,
    tags: ['AI', 'Productivity'],
    verified: true,
    category: 'AI',
    founder: {
      name: 'Alex Rivera',
      handle: '@arivera',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex'
    },
    techStack: ['React', 'PyTorch', 'Stripe', 'Supabase'],
    problem: 'Designers spend 40% of their time on repetitive spatial layout tasks that lack creative value.',
    solution: 'Luminal uses localized LLMs to predict layout intentions, reducing manual iterations by 80%.',
    pricing: 'Free / $29 mo',
    revenueHistory: mockHistory
  },
  {
    id: '2',
    rank: '02',
    name: 'Zenith CRM',
    pitch: 'Precision pipeline management for boutique firms.',
    icon: '📐',
    accentColor: '14, 165, 233',
    monthlyRevenue: 89000,
    lifetimeRevenue: 850000,
    activeUsers: 8402,
    buildStreak: 45,
    growth: 12,
    tags: ['SaaS', 'Sales'],
    verified: true,
    category: 'SaaS',
    founder: {
      name: 'Sarah Chen',
      handle: '@schen',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah'
    },
    techStack: ['Next.js', 'PostgreSQL', 'Stripe', 'Redis'],
    problem: 'Enterprise CRMs are too bloated for small boutique consulting firms that need speed.',
    solution: 'A high-performance terminal interface for sales pipelines with zero-lag data entry.',
    pricing: '$49 mo / seat',
    revenueHistory: mockHistory.map(h => ({ ...h, revenue: h.revenue * 0.7 }))
  },
  {
    id: '3',
    rank: '03',
    name: 'EtherFlow',
    pitch: 'Zero-latency transaction visualizer.',
    icon: '🌊',
    accentColor: '168, 85, 247',
    monthlyRevenue: 67200,
    lifetimeRevenue: 420000,
    activeUsers: 2402,
    buildStreak: 7,
    growth: 45,
    tags: ['Crypto', 'Tooling'],
    verified: true,
    category: 'Crypto',
    founder: {
      name: 'Marcus Thorne',
      handle: '@mthorne',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus'
    },
    techStack: ['Rust', 'WebAssembly', 'Ether.js', 'Vercel'],
    problem: 'Chain explorers are difficult to read and delayed, making real-time trading stressful.',
    solution: 'A native-feel visual dashboard that renders transaction flows in under 100ms.',
    pricing: 'Usage-based',
    revenueHistory: mockHistory.map(h => ({ ...h, revenue: h.revenue * 0.5 }))
  },
  {
    id: '4',
    rank: '04',
    name: 'Onyx Ledger',
    pitch: 'Automated tax compliance for creators.',
    icon: '💎',
    accentColor: '236, 72, 153',
    monthlyRevenue: 54000,
    lifetimeRevenue: 310000,
    activeUsers: 4500,
    buildStreak: 12,
    growth: 8,
    tags: ['SaaS', 'Finance'],
    verified: true,
    category: 'SaaS',
    founder: {
      name: 'Elena Vance',
      handle: '@evance',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elena'
    },
    techStack: ['Vue', 'Drizzle', 'Plaid', 'AWS'],
    problem: 'Solopreneurs overpay an average of $4k in taxes due to missed categorization.',
    solution: 'AI-driven expense matching that connects directly to banking APIs for instant filing.',
    pricing: '$19 mo / $199 yr',
    revenueHistory: mockHistory.map(h => ({ ...h, revenue: h.revenue * 0.4 }))
  }
];

export const MARKETPLACE: MarketItem[] = [
  { id: 'm1', name: 'PromptRefine', askingPrice: '$250k', status: 'For Sale' },
  { id: 'm2', name: 'CloudSheet', askingPrice: '$1.2M', status: 'Pending' },
  { id: 'm3', name: 'SnippetVault', askingPrice: '$45k', status: 'For Sale' }
];

export const TRENDING: TrendingItem[] = [
  { id: 't1', name: 'Velocify', change: 8.4 },
  { id: 't2', name: 'DarkNode', change: 12.1 },
  { id: 't3', name: 'PulseKit', change: -2.3 }
];

export const NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    title: 'Growth Alert',
    message: 'Your wishlisted app Luminal AI grew by 15% this week.',
    type: 'wishlist',
    timestamp: '2 hours ago',
    isRead: false,
    appId: '1'
  },
  {
    id: 'n2',
    title: 'New Offer Received',
    message: 'An investor has placed a private bid on Zenith CRM.',
    type: 'offer',
    timestamp: '5 hours ago',
    isRead: false,
    appId: '2'
  },
  {
    id: 'n3',
    title: 'Canvas v2.4 Live',
    message: 'New Aurora Crystal Bento layouts are now available for all Pro users.',
    type: 'update',
    timestamp: '1 day ago',
    isRead: true
  },
  {
    id: 'n4',
    title: 'System Notice',
    message: 'Verified revenue data for your portfolio has been refreshed.',
    type: 'system',
    timestamp: '2 days ago',
    isRead: true
  }
];
