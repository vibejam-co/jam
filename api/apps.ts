import { z } from 'zod';
import { getMethod, methodNotAllowed, parseJsonBody, sendJson } from '../lib/server/http.js';
import { getSupabaseAdmin } from '../lib/server/supabase-admin.js';
import { isRecoverableSchemaError, sanitizeErrorDetails } from '../lib/server/marketplace-utils.js';
import { toDbJamInput, toDbRevenueInput, toVibeApps } from '../lib/server/transformers.js';

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
  'asking_price_cents',
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
      return baseApps;
    }
    throw listingError;
  }

  const listings = Array.isArray(listingRows) ? listingRows : [];
  if (listings.length === 0) {
    return baseApps;
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

  return baseApps.map((app) => {
    const appName = String(app.name ?? '').trim().toLowerCase();
    const founderEmail = String(app.founder?.email ?? '').trim().toLowerCase();

    const matchedListing =
      byJamId.get(app.id)
      ?? (appName && founderEmail ? byNameFounder.get(`${appName}::${founderEmail}`) : undefined)
      ?? (appName ? byName.get(appName) : undefined);

    if (!matchedListing?.id) {
      return app;
    }

    return {
      ...app,
      isForSale: Boolean(
        (matchedListing as any)?.is_listed === true
        || (matchedListing as any)?.listing_status === 'LISTED'
        || (matchedListing as any)?.listing_status === 'LIVE'
        || (matchedListing as any)?.status === 'LISTED'
        || (matchedListing as any)?.status === 'LIVE'
        || app.isForSale,
      ),
      askingPrice:
        typeof (matchedListing as any)?.asking_price_cents === 'number' && (matchedListing as any).asking_price_cents > 0
          ? formatAskingPrice((matchedListing as any).asking_price_cents)
          : app.askingPrice,
      marketplaceAssetId: String((matchedListing as any).id),
      marketplaceVerifiedStatus:
        ((matchedListing as any)?.verified_status as any) ?? app.marketplaceVerifiedStatus,
    };
  });
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

    return methodNotAllowed(res, ['GET', 'POST']);
  } catch (error) {
    return sendJson(res, 500, {
      error: 'Failed to process apps request.',
      details: sanitizeErrorDetails(error),
    });
  }
}
