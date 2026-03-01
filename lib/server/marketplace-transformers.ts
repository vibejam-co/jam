import { fromBpsToPercent } from './marketplace-utils.js';

type AssetRow = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  logo_url: string | null;
  website_url?: string | null;
  category: string;
  subcategory: string | null;
  tech_stack: string[] | null;
  founder_name: string;
  founder_email?: string | null;
  asking_price_cents: number;
  currency: string;
  is_listed: boolean;
  is_anonymous: boolean;
  visibility: 'public' | 'members_only' | 'private';
  verified_status: 'unverified' | 'pending' | 'verified' | 'error';
  last30d_revenue_cents: number;
  last30d_growth_bps: number;
  mrr_cents: number;
  monthly_unique_visitors?: number | null;
  analytics_proof_url?: string | null;
  active_subscribers?: number | null;
  churn_bps?: number | null;
  metrics_provider?: string | null;
  profit_margin_bps: number | null;
  valuation_multiple_x100: number | null;
  metrics_updated_at: string | null;
  created_at: string;
  updated_at: string;
  owner_user_id?: string;
};

type SnapshotRow = {
  period_end: string;
  revenue_cents: number;
  mrr_cents: number;
};

export const toMarketplaceCard = (
  row: AssetRow,
  options?: {
    viewerUserId?: string | null;
  },
) => ({
  id: row.id,
  slug: row.slug,
  name: row.name,
  tagline: row.tagline,
  logoUrl: row.logo_url,
  websiteUrl:
    typeof row.website_url === 'string' && row.website_url.trim()
      ? row.website_url.trim()
      : null,
  category: row.category,
  subcategory: row.subcategory,
  techStack: row.tech_stack ?? [],
  askingPriceCents: row.asking_price_cents,
  currency: row.currency,
  verifiedStatus: row.verified_status,
  visibility: row.visibility,
  isAnonymous: row.is_anonymous,
  mrrCents: row.mrr_cents,
  last30dRevenueCents: row.last30d_revenue_cents,
  last30dGrowthBps: row.last30d_growth_bps,
  monthlyUniqueVisitors:
    typeof row.monthly_unique_visitors === 'number' && Number.isFinite(row.monthly_unique_visitors)
      ? Math.max(0, Math.round(row.monthly_unique_visitors))
      : 0,
  analyticsProofUrl:
    typeof row.analytics_proof_url === 'string' && row.analytics_proof_url.trim()
      ? row.analytics_proof_url.trim()
      : null,
  profitMarginBps:
    typeof row.profit_margin_bps === 'number' && Number.isFinite(row.profit_margin_bps)
      ? Math.round(row.profit_margin_bps)
      : null,
  activeSubscribers:
    typeof row.active_subscribers === 'number' && Number.isFinite(row.active_subscribers)
      ? Math.max(0, Math.round(row.active_subscribers))
      : undefined,
  churnBps:
    typeof row.churn_bps === 'number' && Number.isFinite(row.churn_bps)
      ? Math.round(row.churn_bps)
      : null,
  metricsProvider: row.metrics_provider ?? null,
  profitMarginPercent: fromBpsToPercent(row.profit_margin_bps),
  valuationMultipleX100: row.valuation_multiple_x100,
  metricsUpdatedAt: row.metrics_updated_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  isOwner: Boolean(options?.viewerUserId && row.owner_user_id === options.viewerUserId),
});

export const toMarketplaceDetail = (
  row: AssetRow,
  snapshots: SnapshotRow[],
  options?: {
    viewerUserId?: string | null;
  },
) => ({
  ...toMarketplaceCard(row, options),
  description: row.description,
  founder:
    options?.viewerUserId && row.owner_user_id === options.viewerUserId
      ? {
          name: row.founder_name,
          email: row.founder_email ?? undefined,
        }
      : row.is_anonymous
        ? null
        : {
            name: row.founder_name,
          },
  sparkline: snapshots.map((item) => ({
    periodEnd: item.period_end,
    revenueCents: item.revenue_cents,
    mrrCents: item.mrr_cents,
  })),
});
