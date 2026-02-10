import type { Notification, RevenuePoint, VibeApp } from '../../types';

type JamRow = {
  id: string;
  rank: string | null;
  name: string;
  pitch: string;
  icon: string;
  accent_color: string;
  monthly_revenue: number;
  lifetime_revenue: number;
  active_users: number;
  build_streak: number;
  growth: number;
  tags: string[] | null;
  verified: boolean;
  category: string;
  founder_name: string;
  founder_handle: string;
  founder_avatar: string;
  founder_email: string | null;
  tech_stack: string[] | null;
  problem: string;
  solution: string;
  pricing: string;
  is_for_sale: boolean;
  asking_price: string | null;
  profit_margin: number | null;
  is_anonymous: boolean;
  boost_tier: 'Free' | 'Pro' | 'Elite' | null;
  created_at: string;
};

type RevenueRow = {
  jam_id: string;
  period_label: string;
  revenue: number;
  sort_order: number;
};

type NotificationRow = {
  id: string;
  title: string;
  message: string;
  type: Notification['type'];
  timestamp_label: string;
  is_read: boolean;
  jam_id: string | null;
};

export const toDbJamInput = (app: VibeApp) => ({
  rank: app.rank,
  name: app.name,
  pitch: app.pitch,
  icon: app.icon,
  accent_color: app.accentColor,
  monthly_revenue: app.monthlyRevenue,
  lifetime_revenue: app.lifetimeRevenue,
  active_users: app.activeUsers,
  build_streak: app.buildStreak,
  growth: app.growth,
  tags: app.tags,
  verified: app.verified,
  category: app.category,
  founder_name: app.founder.name,
  founder_handle: app.founder.handle,
  founder_avatar: app.founder.avatar,
  founder_email: app.founder.email ?? null,
  tech_stack: app.techStack,
  problem: app.problem,
  solution: app.solution,
  pricing: app.pricing,
  is_for_sale: Boolean(app.isForSale),
  asking_price: app.askingPrice ?? null,
  profit_margin: app.profitMargin ?? null,
  is_anonymous: Boolean(app.isAnonymous),
  boost_tier: app.boostTier ?? null,
});

export const toDbRevenueInput = (jamId: string, history: RevenuePoint[] | undefined) => {
  const source = history && history.length > 0 ? history : [{ date: 'Month 1', revenue: 0 }];

  return source.map((point, index) => ({
    jam_id: jamId,
    period_label: point.date,
    revenue: point.revenue,
    sort_order: index,
  }));
};

export const toVibeApps = (jams: JamRow[], revenueRows: RevenueRow[]): VibeApp[] => {
  const revenueMap = revenueRows.reduce<Record<string, Array<RevenuePoint & { sortOrder: number }>>>((acc, row) => {
    if (!acc[row.jam_id]) {
      acc[row.jam_id] = [];
    }

    acc[row.jam_id].push({
      date: row.period_label,
      revenue: row.revenue,
      sortOrder: row.sort_order,
    });

    return acc;
  }, {});

  const sorted = [...jams].sort((a, b) => {
    if (b.monthly_revenue !== a.monthly_revenue) {
      return b.monthly_revenue - a.monthly_revenue;
    }

    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return sorted.map((jam, index) => ({
    id: jam.id,
    rank: jam.rank ?? String(index + 1).padStart(2, '0'),
    name: jam.name,
    pitch: jam.pitch,
    icon: jam.icon,
    accentColor: jam.accent_color,
    monthlyRevenue: jam.monthly_revenue,
    lifetimeRevenue: jam.lifetime_revenue,
    activeUsers: jam.active_users,
    buildStreak: jam.build_streak,
    growth: jam.growth,
    tags: jam.tags ?? [],
    verified: jam.verified,
    category: jam.category,
    founder: {
      name: jam.founder_name,
      handle: jam.founder_handle,
      avatar: jam.founder_avatar,
      email: jam.founder_email ?? undefined,
    },
    techStack: jam.tech_stack ?? [],
    problem: jam.problem,
    solution: jam.solution,
    pricing: jam.pricing,
    revenueHistory: (revenueMap[jam.id] ?? [])
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((point) => ({ date: point.date, revenue: point.revenue })),
    isForSale: jam.is_for_sale,
    askingPrice: jam.asking_price ?? undefined,
    profitMargin: jam.profit_margin ?? undefined,
    isAnonymous: jam.is_anonymous,
    boostTier: jam.boost_tier ?? undefined,
  }));
};

export const toNotifications = (rows: NotificationRow[]): Notification[] =>
  rows.map((row) => ({
    id: row.id,
    title: row.title,
    message: row.message,
    type: row.type,
    timestamp: row.timestamp_label,
    isRead: row.is_read,
    appId: row.jam_id ?? undefined,
  }));
