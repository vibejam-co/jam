import { z } from 'zod';
import { getMethod, methodNotAllowed, parseJsonBody, sendJson } from '../lib/server/http.js';
import { getSupabaseAdmin } from '../lib/server/supabase-admin.js';
import { isRecoverableSchemaError, sanitizeErrorDetails } from '../lib/server/marketplace-utils.js';
import { toDbJamInput, toDbRevenueInput, toVibeApps } from '../lib/server/transformers.js';
import { formatRank, getRankTier } from '../lib/ranking.js';

const JAM_SELECT = [
  'id',
  'rank',
  'name',
  'pitch',
  'icon',
  'accent_color',
  'monthly_revenue',
  'lifetime_revenue',
  'active_users',
  'build_streak',
  'growth',
  'tags',
  'verified',
  'category',
  'founder_name',
  'founder_handle',
  'founder_avatar',
  'founder_email',
  'tech_stack',
  'problem',
  'solution',
  'pricing',
  'is_for_sale',
  'asking_price',
  'profit_margin',
  'is_anonymous',
  'boost_tier',
  'created_at',
].join(',');

const REVENUE_SELECT = ['jam_id', 'period_label', 'revenue', 'sort_order'].join(',');

const MARKETPLACE_LISTING_SELECT = [
  'id',
  'jam_id',
  'name',
  'founder_email',
  'logo_url',
  'asking_price_cents',
  'mrr_cents',
  'profit_margin_bps',
  'trailing_30d_profit_cents',
  'monthly_unique_visitors',
  'pitch_decks',
  'verified_status',
  'is_listed',
  'listing_status',
  'status',
  'created_at',
].join(',');

const VibeAppSchema = z.object({
  id: z.string().min(1).optional(),
  rank: z.string().min(1).optional(),
  name: z.string().trim().min(1),
  pitch: z.string().trim().min(1),
  icon: z.string().trim().min(1).default('✨'),
  accentColor: z.string().trim().min(1).default('124, 58, 237'),
  monthlyRevenue: z.number().finite().nonnegative().default(0),
  lifetimeRevenue: z.number().finite().nonnegative().default(0),
  activeUsers: z.number().int().nonnegative().default(0),
  buildStreak: z.number().int().nonnegative().default(1),
  growth: z.number().finite().default(0),
  tags: z.array(z.string().trim()).default([]),
  verified: z.boolean().default(false),
  category: z.string().trim().min(1),
  founder: z.object({
    name: z.string().trim().min(1).default('Founder'),
    handle: z.string().trim().min(1).default('@founder'),
    avatar: z.string().trim().min(1).default('https://api.dicebear.com/7.x/avataaars/svg?seed=founder'),
    email: z.string().email().optional(),
  }),
  techStack: z.array(z.string().trim()).default([]),
  problem: z.string().default(''),
  solution: z.string().default(''),
  pricing: z.string().default(''),
  revenueHistory: z
    .array(
      z.object({
        date: z.string().trim().min(1),
        revenue: z.number().finite().nonnegative(),
      }),
    )
    .default([]),
  isForSale: z.boolean().optional(),
  askingPrice: z.string().optional(),
  profitMargin: z.number().finite().optional(),
  isAnonymous: z.boolean().optional(),
  boostTier: z.enum(['Free', 'Pro', 'Elite']).optional(),
});

const AppPayloadSchema = z.object({
  app: VibeAppSchema,
});

const normalizeVerificationBand = (app: any): number => {
  const status = String(app?.marketplaceVerifiedStatus ?? '').trim().toLowerCase();
  if (status === 'verified') {
    return 0;
  }
  if (status === 'pending') {
    return 1;
  }
  return app?.verified ? 1 : 2;
};

const deriveProfitCents = (app: any): number => {
  const netProfitCents = Number(app?.netProfitCents);
  if (Number.isFinite(netProfitCents)) {
    return Math.max(0, Math.round(netProfitCents));
  }

  const monthlyRevenueCents = Math.max(0, Math.round(Number(app?.monthlyRevenue ?? 0) * 100));
  if (monthlyRevenueCents <= 0) {
    return -1;
  }

  const profitMarginBps = Number(app?.profitMarginBps);
  if (Number.isFinite(profitMarginBps)) {
    return Math.max(0, Math.round((monthlyRevenueCents * profitMarginBps) / 10_000));
  }

  const profitMarginPercent = Number(app?.profitMargin);
  if (Number.isFinite(profitMarginPercent)) {
    return Math.max(0, Math.round((monthlyRevenueCents * profitMarginPercent) / 100));
  }

  return -1;
};

const rankApps = (apps: any[]) => {
  const sorted = [...apps]
    .map((app, index) => ({ app, index }))
    .sort((left, right) => {
      const verificationDelta = normalizeVerificationBand(left.app) - normalizeVerificationBand(right.app);
      if (verificationDelta !== 0) {
        return verificationDelta;
      }

      const profitDelta = deriveProfitCents(right.app) - deriveProfitCents(left.app);
      if (profitDelta !== 0) {
        return profitDelta;
      }

      const marginDelta = Number(right.app?.profitMarginBps ?? -1) - Number(left.app?.profitMarginBps ?? -1);
      if (marginDelta !== 0) {
        return marginDelta;
      }

      const revenueDelta = Number(right.app?.monthlyRevenue ?? 0) - Number(left.app?.monthlyRevenue ?? 0);
      if (revenueDelta !== 0) {
        return revenueDelta;
      }

      return left.index - right.index;
    });

  return sorted.map(({ app }, index) => {
    const rankValue = index + 1;
    return {
      ...app,
      rank: formatRank(rankValue),
      rankValue,
      rankTier: getRankTier(rankValue),
    };
  });
};

const loadApps = async (supabase: any) => {
  const { data: jams, error: jamsError } = await supabase
    .from('jams')
    .select(JAM_SELECT)
    .order('monthly_revenue', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(300);

  if (jamsError) {
    if (isRecoverableSchemaError(jamsError)) {
      return [] as any[];
    }
    throw jamsError;
  }

  const jamRows = Array.isArray(jams) ? jams : [];
  if (jamRows.length === 0) {
    return [] as any[];
  }

  const jamIds = jamRows.map((row: any) => row.id);
  const { data: revenueRows, error: revenueError } = await supabase
    .from('jam_revenue_history')
    .select(REVENUE_SELECT)
    .in('jam_id', jamIds)
    .order('sort_order', { ascending: true });

  const baseApps = (() => {
    if (revenueError) {
      if (isRecoverableSchemaError(revenueError)) {
        return toVibeApps(jamRows, []);
      }
      throw revenueError;
    }
    return toVibeApps(jamRows, Array.isArray(revenueRows) ? revenueRows : []);
  })();

  let listingQuery = await supabase
    .from('marketplace_assets')
    .select(MARKETPLACE_LISTING_SELECT)
    .or('is_listed.eq.true,listing_status.eq.LISTED,listing_status.eq.LIVE,status.eq.LISTED,status.eq.LIVE')
    .order('created_at', { ascending: false })
    .limit(600);

  if (listingQuery.error && isRecoverableSchemaError(listingQuery.error)) {
    listingQuery = await supabase
      .from('marketplace_assets')
      .select([
        'id',
        'jam_id',
        'name',
        'founder_email',
        'logo_url',
        'asking_price_cents',
        'verified_status',
        'is_listed',
        'created_at',
      ].join(','))
      .eq('is_listed', true)
      .order('created_at', { ascending: false })
      .limit(600);
  }

  const { data: listingRows, error: listingError } = listingQuery;
  if (listingError) {
    if (isRecoverableSchemaError(listingError)) {
      return rankApps(baseApps);
    }
    throw listingError;
  }

  const listings = Array.isArray(listingRows) ? listingRows : [];
  if (listings.length === 0) {
    return rankApps(baseApps);
  }

  const listingIds = listings
    .map((row: any) => String(row?.id ?? '').trim())
    .filter(Boolean);
  const churnByAssetId = new Map<string, number | null>();

  if (listingIds.length > 0) {
    const { data: snapshotRows, error: snapshotError } = await supabase
      .from('revenue_snapshots')
      .select('asset_id,churn_bps,period_end')
      .in('asset_id', listingIds)
      .order('period_end', { ascending: false })
      .limit(Math.max(1000, listingIds.length * 3));

    if (snapshotError) {
      if (!isRecoverableSchemaError(snapshotError)) {
        throw snapshotError;
      }
    } else {
      for (const row of Array.isArray(snapshotRows) ? snapshotRows : []) {
        const assetId = String((row as any)?.asset_id ?? '').trim();
        if (!assetId || churnByAssetId.has(assetId)) {
          continue;
        }
        const churnRaw = (row as any)?.churn_bps;
        const churnValue =
          typeof churnRaw === 'number' && Number.isFinite(churnRaw)
            ? Math.max(0, Math.round(churnRaw))
            : null;
        churnByAssetId.set(assetId, churnValue);
      }
    }
  }

  const byJamId = new Map<string, any>();
  const byNameFounder = new Map<string, any>();
  const byName = new Map<string, any>();

  for (const listing of listings) {
    const listingId = String((listing as any)?.id ?? '').trim();
    if (!listingId) {
      continue;
    }

    const jamId = String((listing as any)?.jam_id ?? '').trim();
    const name = String((listing as any)?.name ?? '').trim().toLowerCase();
    const founderEmail = String((listing as any)?.founder_email ?? '').trim().toLowerCase();

    if (jamId && !byJamId.has(jamId)) {
      byJamId.set(jamId, listing);
    }
    if (name && founderEmail && !byNameFounder.has(`${name}::${founderEmail}`)) {
      byNameFounder.set(`${name}::${founderEmail}`, listing);
    }
    if (name && !byName.has(name)) {
      byName.set(name, listing);
    }
  }

  const formatAskingPrice = (askingPriceCents: number): string =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(Math.max(0, Number(askingPriceCents ?? 0)) / 100);

  const isImageIconSource = (value: string | null | undefined): boolean => {
    const normalized = String(value ?? '').trim().toLowerCase();
    return (
      normalized.startsWith('data:image/')
      || normalized.startsWith('https://')
      || normalized.startsWith('http://')
      || normalized.startsWith('blob:')
      || normalized.startsWith('/')
    );
  };

  const extractPitchDeckCoverImage = (value: unknown): string | null => {
    if (!value || typeof value !== 'object') {
      return null;
    }
    const slides = (value as { slides?: unknown }).slides;
    if (!Array.isArray(slides)) {
      return null;
    }
    for (const slide of slides) {
      const imageUrl = slide && typeof slide === 'object'
        ? String((slide as { imageUrl?: unknown }).imageUrl ?? '').trim()
        : '';
      if (imageUrl && isImageIconSource(imageUrl)) {
        return imageUrl;
      }
    }
    return null;
  };

  const mergedApps = baseApps.map((app) => {
    const appName = String(app.name ?? '').trim().toLowerCase();
    const founderEmail = String(app.founder?.email ?? '').trim().toLowerCase();

    const matchedListing =
      byJamId.get(app.id)
      ?? (appName && founderEmail ? byNameFounder.get(`${appName}::${founderEmail}`) : undefined)
      ?? (appName ? byName.get(appName) : undefined);

    if (!matchedListing?.id) {
      return app.isForSale
        ? {
            ...app,
            isForSale: false,
            marketplaceAssetId: undefined,
          }
        : app;
    }

    const listingLogo = String((matchedListing as any)?.logo_url ?? '').trim();
    const matchedAssetId = String((matchedListing as any)?.id ?? '').trim();
    const resolvedIcon = isImageIconSource(listingLogo) ? listingLogo : app.icon;
    const listingProfitMarginBpsRaw = (matchedListing as any)?.profit_margin_bps;
    const listingProfitMarginBps =
      typeof listingProfitMarginBpsRaw === 'number' && Number.isFinite(listingProfitMarginBpsRaw)
        ? Math.max(0, Math.round(listingProfitMarginBpsRaw))
        : null;
    const trailingProfitRaw = (matchedListing as any)?.trailing_30d_profit_cents;
    const trailingProfitCents =
      typeof trailingProfitRaw === 'number' && Number.isFinite(trailingProfitRaw)
        ? Math.round(trailingProfitRaw)
        : null;
    const visitorsRaw = (matchedListing as any)?.monthly_unique_visitors;
    const monthlyUniqueVisitors =
      typeof visitorsRaw === 'number' && Number.isFinite(visitorsRaw)
        ? Math.max(0, Math.round(visitorsRaw))
        : null;
    const churnBps = matchedAssetId && churnByAssetId.has(matchedAssetId)
      ? churnByAssetId.get(matchedAssetId) ?? null
      : null;
    const pitchDeckCoverImageUrl = extractPitchDeckCoverImage((matchedListing as any)?.pitch_decks);

    const listingVerifiedStatus = String((matchedListing as any)?.verified_status ?? '').trim().toLowerCase();

    return {
      ...app,
      icon: resolvedIcon,
      isForSale: Boolean(
        (matchedListing as any)?.is_listed === true
        || (matchedListing as any)?.listing_status === 'LISTED'
        || (matchedListing as any)?.listing_status === 'LIVE'
        || (matchedListing as any)?.status === 'LISTED'
        || (matchedListing as any)?.status === 'LIVE'
      ),
      askingPrice:
        typeof (matchedListing as any)?.asking_price_cents === 'number' && (matchedListing as any).asking_price_cents > 0
          ? formatAskingPrice((matchedListing as any).asking_price_cents)
          : app.askingPrice,
      marketplaceAssetId: matchedAssetId,
      marketplaceVerifiedStatus:
        ((matchedListing as any)?.verified_status as any) ?? app.marketplaceVerifiedStatus,
      verified: listingVerifiedStatus === 'verified' ? true : app.verified,
      monthlyRevenue:
        typeof (matchedListing as any)?.mrr_cents === 'number' && (matchedListing as any).mrr_cents > 0
          ? Math.round((matchedListing as any).mrr_cents / 100)
          : app.monthlyRevenue,
      netProfitCents: trailingProfitCents ?? app.netProfitCents ?? null,
      profitMarginBps:
        listingProfitMarginBps
        ?? (typeof app.profitMargin === 'number' && Number.isFinite(app.profitMargin)
          ? Math.round(app.profitMargin * 100)
          : app.profitMarginBps ?? null),
      monthlyUniqueVisitors: monthlyUniqueVisitors ?? app.monthlyUniqueVisitors ?? null,
      churnBps: churnBps ?? app.churnBps ?? null,
      pitchDeckCoverImageUrl: pitchDeckCoverImageUrl ?? app.pitchDeckCoverImageUrl ?? null,
    };
  });

  return rankApps(mergedApps);
};

export default async function handler(req: any, res: any) {
  try {
    const method = getMethod(req);

    if (method === 'GET') {
      const supabase = await getSupabaseAdmin();
      const apps = await loadApps(supabase);
      return sendJson(res, 200, { data: apps });
    }

    if (method === 'POST') {
      const body = await parseJsonBody(req);
      const parsed = AppPayloadSchema.safeParse(body);
      if (!parsed.success) {
        return sendJson(res, 400, {
          error: 'Invalid app payload.',
          details: parsed.error.issues[0]?.message,
        });
      }

      const app = parsed.data.app;
      const supabase = await getSupabaseAdmin();
      const jamInsert = toDbJamInput(app as any);

      const { data: existingJam, error: existingJamError } = await supabase
        .from('jams')
        .select('id')
        .eq('name', jamInsert.name)
        .eq('founder_handle', jamInsert.founder_handle)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingJamError) {
        throw existingJamError;
      }

      let jamId = existingJam?.id as string | undefined;
      if (jamId) {
        const { error: jamUpdateError } = await supabase
          .from('jams')
          .update(jamInsert)
          .eq('id', jamId);

        if (jamUpdateError) {
          throw jamUpdateError;
        }
      } else {
        const { data: createdJam, error: jamError } = await supabase
          .from('jams')
          .insert(jamInsert)
          .select('id')
          .single();

        if (jamError) {
          throw jamError;
        }
        jamId = createdJam.id;
      }

      const { error: revenueDeleteError } = await supabase
        .from('jam_revenue_history')
        .delete()
        .eq('jam_id', jamId);

      if (revenueDeleteError && !isRecoverableSchemaError(revenueDeleteError)) {
        throw revenueDeleteError;
      }

      const revenueRows = toDbRevenueInput(jamId, app.revenueHistory as any[]);
      if (revenueRows.length > 0) {
        const { error: revenueInsertError } = await supabase
          .from('jam_revenue_history')
          .insert(revenueRows);

        if (revenueInsertError && !isRecoverableSchemaError(revenueInsertError)) {
          throw revenueInsertError;
        }
      }

      const apps = await loadApps(supabase);
      return sendJson(res, 201, { data: apps });
    }

    if (method === 'DELETE') {
      const rawId = req?.query?.id;
      const jamId = typeof rawId === 'string'
        ? rawId
        : Array.isArray(rawId) && typeof rawId[0] === 'string'
          ? rawId[0]
          : '';

      if (!jamId) {
        return sendJson(res, 400, {
          error: 'Missing jam id.',
        });
      }

      const supabase = await getSupabaseAdmin();

      const { error: revenueDeleteError } = await supabase
        .from('jam_revenue_history')
        .delete()
        .eq('jam_id', jamId);

      if (revenueDeleteError && !isRecoverableSchemaError(revenueDeleteError)) {
        throw revenueDeleteError;
      }

      const { error: listingDeleteError } = await supabase
        .from('marketplace_assets')
        .delete()
        .eq('jam_id', jamId);

      if (listingDeleteError && !isRecoverableSchemaError(listingDeleteError)) {
        throw listingDeleteError;
      }

      const { error: jamDeleteError } = await supabase
        .from('jams')
        .delete()
        .eq('id', jamId);

      if (jamDeleteError) {
        throw jamDeleteError;
      }

      const apps = await loadApps(supabase);
      return sendJson(res, 200, { data: apps });
    }

    return methodNotAllowed(res, ['GET', 'POST', 'DELETE']);
  } catch (error) {
    return sendJson(res, 500, {
      error: 'Failed to process apps request.',
      details: sanitizeErrorDetails(error),
    });
  }
}
