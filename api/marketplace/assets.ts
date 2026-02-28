import { z } from 'zod';
import { getMethod, methodNotAllowed, parseJsonBody, sendJson } from '../../lib/server/http.js';
import { getSupabaseAdmin } from '../../lib/server/supabase-admin.js';
import { getAuthenticatedUser, isMemberUser } from '../../lib/server/auth.js';
import {
  computeValuationMultipleX100,
  getQueryValue,
  isRecoverableSchemaError,
  parseBooleanQuery,
  parseUsdToCents,
  slugify,
  sanitizeErrorDetails,
  toPercentBps,
} from '../../lib/server/marketplace-utils.js';
import {
  CreateMarketplaceAssetDraftSchema,
  MarketplaceAssetsQuerySchema,
  UpdateMarketplaceAssetSchema,
} from '../../lib/server/marketplace-validation.js';
import { toMarketplaceCard, toMarketplaceDetail } from '../../lib/server/marketplace-transformers.js';
import { writeMarketplaceAuditLog } from '../../lib/server/marketplace-audit.js';

const ASSET_SELECT = [
  'id',
  'slug',
  'title',
  'name',
  'tagline',
  'description',
  'logo_url',
  'category',
  'subcategory',
  'tech_stack',
  'founder_name',
  'founder_email',
  'asking_price_cents',
  'currency',
  'asset_type',
  'listing_status',
  'is_listed',
  'is_anonymous',
  'visibility',
  'domain_visibility',
  'verified_status',
  'last30d_revenue_cents',
  'last30d_growth_bps',
  'mrr_cents',
  'profit_margin_bps',
  'trailing_30d_revenue_cents',
  'trailing_30d_profit_cents',
  'trailing_30d_expenses_cents',
  'profit_margin_pct',
  'valuation_multiple_x100',
  'metrics_updated_at',
  'created_at',
  'updated_at',
  'owner_user_id',
].join(',');

const LEGACY_ASSET_SELECT = [
  'id',
  'slug',
  'name',
  'tagline',
  'description',
  'logo_url',
  'category',
  'subcategory',
  'tech_stack',
  'founder_name',
  'founder_email',
  'asking_price_cents',
  'currency',
  'is_listed',
  'is_anonymous',
  'visibility',
  'verified_status',
  'last30d_revenue_cents',
  'last30d_growth_bps',
  'mrr_cents',
  'profit_margin_bps',
  'valuation_multiple_x100',
  'metrics_updated_at',
  'created_at',
  'updated_at',
  'owner_user_id',
].join(',');

const canReadAsset = (
  row: any,
  userId: string | null,
  canViewMembers: boolean,
) => {
  if (!row) {
    return false;
  }

  if (userId && row.owner_user_id === userId) {
    return true;
  }

  const listingStatus = String(row.listing_status ?? row.status ?? '').toUpperCase();
  const isListed = row.is_listed === true || listingStatus === 'LISTED' || listingStatus === 'LIVE';
  if (!isListed) {
    return false;
  }

  const visibility = String(row.visibility ?? row.domain_visibility ?? '').toLowerCase();
  if (visibility === 'public') {
    return true;
  }

  if (visibility === 'members_only' && canViewMembers) {
    return true;
  }

  return false;
};

const getLatestSnapshotByAssetId = async (
  supabase: any,
  assetIds: string[],
): Promise<Map<string, { activeSubscribers: number; churnBps: number | null; provider: string | null }>> => {
  const byAsset = new Map<string, { activeSubscribers: number; churnBps: number | null; provider: string | null }>();
  if (assetIds.length === 0) {
    return byAsset;
  }

  const settled = await Promise.allSettled(
    assetIds.map(async (assetId) => {
      const { data, error } = await supabase
        .from('revenue_snapshots')
        .select('asset_id, active_subscribers, churn_bps, provider, period_end')
        .eq('asset_id', assetId)
        .order('period_end', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        return null;
      }

      return {
        assetId: String(data.asset_id),
        activeSubscribers: Math.max(0, Number(data.active_subscribers ?? 0)),
        churnBps:
          typeof data.churn_bps === 'number' && Number.isFinite(data.churn_bps)
            ? Math.round(data.churn_bps)
            : null,
        provider: data.provider ? String(data.provider) : null,
      };
    }),
  );

  for (const result of settled) {
    if (result.status === 'fulfilled' && result.value) {
      byAsset.set(result.value.assetId, {
        activeSubscribers: result.value.activeSubscribers,
        churnBps: result.value.churnBps,
        provider: result.value.provider,
      });
      continue;
    }

    if (result.status === 'rejected' && !isRecoverableSchemaError(result.reason)) {
      throw result.reason;
    }
  }

  return byAsset;
};

const readAssetByIdOrSlug = async (supabase: any, idOrSlug: string) => {
  const executeSelect = async (selectClause: string) => {
    const baseQuery = supabase.from('marketplace_assets').select(selectClause).limit(1);
    const query = /^[0-9a-fA-F-]{36}$/.test(idOrSlug)
      ? baseQuery.eq('id', idOrSlug)
      : baseQuery.eq('slug', idOrSlug);
    return query.maybeSingle();
  };

  const { data, error } = await executeSelect(ASSET_SELECT);
  if (error) {
    if (isRecoverableSchemaError(error)) {
      const legacy = await executeSelect(LEGACY_ASSET_SELECT);
      if (legacy.error) {
        throw legacy.error;
      }
      return legacy.data;
    }
    throw error;
  }
  return data;
};

const applyAssetFilters = (
  query: any,
  params: z.infer<typeof MarketplaceAssetsQuerySchema>,
  canViewMembers: boolean,
  options?: {
    includeListedStatusFallback?: boolean;
  },
) => {
  let next = query;
  if (options?.includeListedStatusFallback) {
    next = next.or('is_listed.eq.true,listing_status.eq.LISTED,listing_status.eq.LIVE,status.eq.LISTED,status.eq.LIVE');
  } else {
    next = next.eq('is_listed', true);
  }

  if (canViewMembers) {
    next = next.or('visibility.eq.public,visibility.eq.members_only');
  } else {
    next = next.eq('visibility', 'public');
  }

  if (params.category) {
    next = next.ilike('category', params.category);
  }

  if (params.q) {
    const escaped = params.q.replace(/[,%]/g, '');
    next = next.or(`name.ilike.%${escaped}%,tagline.ilike.%${escaped}%,description.ilike.%${escaped}%`);
  }

  if (typeof params.min_mrr === 'number') {
    next = next.gte('mrr_cents', params.min_mrr * 100);
  }
  if (typeof params.max_price === 'number') {
    next = next.lte('asking_price_cents', params.max_price * 100);
  }
  if (typeof params.min_rev30 === 'number') {
    next = next.gte('last30d_revenue_cents', params.min_rev30 * 100);
  }
  if (typeof params.max_multiple === 'number') {
    next = next.lte('valuation_multiple_x100', params.max_multiple * 100);
  }
  if (params.verified_only) {
    next = next.eq('verified_status', 'verified');
  }

  if (params.sort === 'mrr') {
    next = next.order('mrr_cents', { ascending: false });
  } else if (params.sort === 'rev30') {
    next = next.order('last30d_revenue_cents', { ascending: false });
  } else if (params.sort === 'multiple') {
    next = next.order('valuation_multiple_x100', { ascending: false, nullsFirst: false });
  } else {
    next = next.order('created_at', { ascending: false });
  }

  return next;
};

const reserveUniqueSlug = async (supabase: any, desiredName: string): Promise<string> => {
  const base = slugify(desiredName) || 'asset';

  for (let attempt = 0; attempt < 50; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const { data, error } = await supabase
      .from('marketplace_assets')
      .select('id')
      .eq('slug', candidate)
      .limit(1);

    if (error) {
      throw error;
    }

    if (!Array.isArray(data) || data.length === 0) {
      return candidate;
    }
  }

  throw new Error('Could not generate unique slug for asset.');
};

export default async function handler(req: any, res: any) {
  try {
    const method = getMethod(req);
    const idOrSlug = getQueryValue(req, 'assetId') ?? undefined;

    if (method === 'GET' && idOrSlug) {
      const supabase = await getSupabaseAdmin();
      const data = await readAssetByIdOrSlug(supabase, idOrSlug);

      if (!data) {
        return sendJson(res, 404, { error: 'Marketplace asset not found.' });
      }

      const user = await getAuthenticatedUser(req);
      const userId = user?.id ?? null;
      const canViewMembers = Boolean(user && isMemberUser(user));

      if (!canReadAsset(data, userId, canViewMembers)) {
        return sendJson(res, 200, {
          data: {
            locked: true,
            reason: data.visibility === 'members_only' ? 'membership_required' : 'private_asset',
            asset: {
              id: data.id,
              slug: data.slug,
              name: data.name,
              tagline: data.tagline,
              category: data.category,
              askingPriceCents: data.asking_price_cents,
              mrrCents: data.mrr_cents,
              last30dRevenueCents: data.last30d_revenue_cents,
              valuationMultipleX100: data.valuation_multiple_x100,
              verifiedStatus: data.verified_status,
            },
          },
        });
      }

      const [{ data: snapshots, error: snapshotError }, { data: boosts, error: boostError }] = await Promise.all([
        supabase
          .from('revenue_snapshots')
          .select('period_end, revenue_cents, mrr_cents')
          .eq('asset_id', data.id)
          .order('period_end', { ascending: true })
          .limit(90),
        supabase
          .from('boosts')
          .select('tier, starts_at, ends_at')
          .eq('asset_id', data.id)
          .order('created_at', { ascending: false })
          .limit(1),
      ]);

      if (snapshotError) {
        throw snapshotError;
      }
      if (boostError) {
        throw boostError;
      }

      return sendJson(res, 200, {
        data: {
          locked: false,
          asset: {
            ...toMarketplaceDetail(data as any, Array.isArray(snapshots) ? (snapshots as any) : [], {
              viewerUserId: userId,
            }),
            boost: Array.isArray(boosts) && boosts.length > 0 ? boosts[0] : null,
          },
        },
      });
    }

    if (method === 'PATCH') {
      if (!idOrSlug) {
        return sendJson(res, 400, { error: 'Missing assetId query param.' });
      }

      const user = await getAuthenticatedUser(req);
      if (!user?.id) {
        return sendJson(res, 401, { error: 'Authentication required.' });
      }

      const supabase = await getSupabaseAdmin();
      const existingRow = await readAssetByIdOrSlug(supabase, idOrSlug);

      if (!existingRow) {
        return sendJson(res, 404, { error: 'Marketplace asset not found.' });
      }
      if (existingRow.owner_user_id !== user.id) {
        return sendJson(res, 403, { error: 'Only the listing owner can edit this asset.' });
      }

      const payloadRaw = await parseJsonBody(req);
      const parsed = UpdateMarketplaceAssetSchema.safeParse(payloadRaw);
      if (!parsed.success) {
        return sendJson(res, 400, {
          error: 'Invalid listing update payload.',
          details: parsed.error.issues[0]?.message,
        });
      }

      const payload = parsed.data;
      const updatePayload: Record<string, unknown> = {};

      if (payload.name !== undefined) updatePayload.name = payload.name;
      if (payload.name !== undefined) updatePayload.title = payload.name;
      if (payload.tagline !== undefined) updatePayload.tagline = payload.tagline;
      if (payload.description !== undefined) updatePayload.description = payload.description;
      if (payload.logoUrl !== undefined) updatePayload.logo_url = payload.logoUrl || null;
      if (payload.category !== undefined) updatePayload.category = payload.category;
      if (payload.subcategory !== undefined) updatePayload.subcategory = payload.subcategory || null;
      if (payload.techStack !== undefined) updatePayload.tech_stack = payload.techStack;
      if (payload.founderName !== undefined) updatePayload.founder_name = payload.founderName;
      if (payload.founderEmail !== undefined) updatePayload.founder_email = payload.founderEmail;
      if (payload.visibility !== undefined) updatePayload.visibility = payload.visibility;
      if (payload.visibility !== undefined) {
        updatePayload.domain_visibility = payload.visibility === 'private' ? 'PRIVATE' : 'PUBLIC';
      }
      if (payload.isAnonymous !== undefined) updatePayload.is_anonymous = payload.isAnonymous;
      if (payload.profitMarginPercent !== undefined) updatePayload.profit_margin_bps = toPercentBps(payload.profitMarginPercent);
      if (payload.profitMarginPercent !== undefined) updatePayload.profit_margin_pct = payload.profitMarginPercent;

      const nextAskingPriceCents = typeof payload.askingPriceCents === 'number'
        ? payload.askingPriceCents
        : payload.askingPriceUsd !== undefined
          ? parseUsdToCents(payload.askingPriceUsd)
          : null;

      if (nextAskingPriceCents !== null) {
        if (!Number.isFinite(nextAskingPriceCents) || nextAskingPriceCents <= 0) {
          return sendJson(res, 400, {
            error: 'Asking price must be greater than zero.',
          });
        }
        updatePayload.asking_price_cents = Math.round(nextAskingPriceCents);
        updatePayload.valuation_multiple_x100 = computeValuationMultipleX100(
          Math.round(nextAskingPriceCents),
          Number(existingRow.last30d_revenue_cents ?? 0),
        );
      }

      if (Object.keys(updatePayload).length === 0) {
        return sendJson(res, 400, { error: 'No editable fields were provided.' });
      }

      const fallbackUpdatePayload = { ...updatePayload };
      delete (fallbackUpdatePayload as any).title;
      delete (fallbackUpdatePayload as any).domain_visibility;
      delete (fallbackUpdatePayload as any).profit_margin_pct;

      let updateResult = await supabase
        .from('marketplace_assets')
        .update(updatePayload)
        .eq('id', existingRow.id)
        .select(ASSET_SELECT)
        .single();

      if (updateResult.error && isRecoverableSchemaError(updateResult.error)) {
        updateResult = await supabase
          .from('marketplace_assets')
          .update(fallbackUpdatePayload)
          .eq('id', existingRow.id)
          .select(LEGACY_ASSET_SELECT)
          .single();
      }

      const { data: updatedRow, error: updateError } = updateResult;

      if (updateError) {
        throw updateError;
      }

      await writeMarketplaceAuditLog({
        actorUserId: user.id,
        assetId: existingRow.id,
        action: 'asset_updated',
        metadata: {
          fields: Object.keys(updatePayload),
          is_listed: Boolean(updatedRow.is_listed),
        },
      });

      const [{ data: snapshots, error: snapshotError }, { data: boosts, error: boostError }] = await Promise.all([
        supabase
          .from('revenue_snapshots')
          .select('period_end, revenue_cents, mrr_cents')
          .eq('asset_id', existingRow.id)
          .order('period_end', { ascending: true })
          .limit(90),
        supabase
          .from('boosts')
          .select('tier, starts_at, ends_at')
          .eq('asset_id', existingRow.id)
          .order('created_at', { ascending: false })
          .limit(1),
      ]);

      if (snapshotError) {
        throw snapshotError;
      }
      if (boostError) {
        throw boostError;
      }

      return sendJson(res, 200, {
        data: {
          locked: false,
          asset: {
            ...toMarketplaceDetail(
              updatedRow as any,
              Array.isArray(snapshots) ? (snapshots as any) : [],
              { viewerUserId: user.id },
            ),
            boost: Array.isArray(boosts) && boosts.length > 0 ? boosts[0] : null,
          },
        },
      });
    }

    if (method === 'DELETE') {
      if (!idOrSlug) {
        return sendJson(res, 400, { error: 'Missing assetId query param.' });
      }

      const user = await getAuthenticatedUser(req);
      if (!user?.id) {
        return sendJson(res, 401, { error: 'Authentication required.' });
      }

      const supabase = await getSupabaseAdmin();
      const existingRow = await readAssetByIdOrSlug(supabase, idOrSlug);

      if (!existingRow) {
        return sendJson(res, 404, { error: 'Marketplace asset not found.' });
      }

      if (existingRow.owner_user_id !== user.id) {
        return sendJson(res, 403, { error: 'Only the listing owner can delete this asset.' });
      }

      await writeMarketplaceAuditLog({
        actorUserId: user.id,
        assetId: existingRow.id,
        action: 'asset_deleted',
        metadata: {
          name: existingRow.name ?? null,
          slug: existingRow.slug ?? null,
          is_listed: Boolean(existingRow.is_listed),
          verified_status: existingRow.verified_status ?? null,
          visibility: existingRow.visibility ?? null,
        },
      });

      const { error: deleteError } = await supabase
        .from('marketplace_assets')
        .delete()
        .eq('id', existingRow.id)
        .eq('owner_user_id', user.id);

      if (deleteError) {
        throw deleteError;
      }

      return sendJson(res, 200, {
        data: {
          deleted: true,
          assetId: existingRow.id,
        },
      });
    }

    if (method === 'GET') {
      const user = await getAuthenticatedUser(req);
      const canViewMembers = Boolean(user && isMemberUser(user));

      const parsedQuery = MarketplaceAssetsQuerySchema.safeParse({
        q: getQueryValue(req, 'q') ?? undefined,
        category: getQueryValue(req, 'category') ?? undefined,
        min_mrr: getQueryValue(req, 'min_mrr') ?? undefined,
        max_price: getQueryValue(req, 'max_price') ?? undefined,
        min_rev30: getQueryValue(req, 'min_rev30') ?? undefined,
        max_multiple: getQueryValue(req, 'max_multiple') ?? undefined,
        verified_only: parseBooleanQuery(getQueryValue(req, 'verified_only')),
        sort: getQueryValue(req, 'sort') ?? undefined,
        page: getQueryValue(req, 'page') ?? undefined,
        pageSize: getQueryValue(req, 'pageSize') ?? undefined,
      });

      if (!parsedQuery.success) {
        return sendJson(res, 400, {
          error: 'Invalid marketplace query params.',
          details: parsedQuery.error.issues[0]?.message,
        });
      }

      const params = parsedQuery.data;
      const supabase = await getSupabaseAdmin();
      const from = (params.page - 1) * params.pageSize;
      const to = from + params.pageSize - 1;

      let dataQuery = supabase
        .from('marketplace_assets')
        .select(ASSET_SELECT, { count: 'exact' });

      dataQuery = applyAssetFilters(dataQuery, params, canViewMembers, {
        includeListedStatusFallback: true,
      }).range(from, to);

      let queryResult = await dataQuery;

      if (queryResult.error && isRecoverableSchemaError(queryResult.error)) {
        let fallbackQuery = supabase
          .from('marketplace_assets')
          .select(LEGACY_ASSET_SELECT, { count: 'exact' });
        fallbackQuery = applyAssetFilters(fallbackQuery, params, canViewMembers, {
          includeListedStatusFallback: false,
        }).range(from, to);
        queryResult = await fallbackQuery;
      }

      const { data, error, count } = queryResult;
      if (error) {
        throw error;
      }

      let lockedCount = 0;
      if (!canViewMembers) {
        let lockedQuery = supabase
          .from('marketplace_assets')
          .select('id', { count: 'exact', head: true })
          .or('is_listed.eq.true,listing_status.eq.LISTED,listing_status.eq.LIVE,status.eq.LISTED,status.eq.LIVE')
          .or('visibility.eq.members_only');

        if (params.category) {
          lockedQuery = lockedQuery.ilike('category', params.category);
        }
        if (params.q) {
          const escaped = params.q.replace(/[,%]/g, '');
          lockedQuery = lockedQuery.or(`name.ilike.%${escaped}%,tagline.ilike.%${escaped}%,description.ilike.%${escaped}%`);
        }

        const lockedResult = await lockedQuery;
        lockedCount = lockedResult.count ?? 0;
      }

      const rows = Array.isArray(data) ? data : [];
      const dedupedRows: any[] = [];
      const seenOwnerName = new Set<string>();

      for (const row of rows) {
        const owner = String((row as any)?.owner_user_id ?? '');
        const name = String((row as any)?.name ?? '').trim().toLowerCase();
        const dedupeKey = owner && name ? `${owner}:${name}` : String((row as any)?.id ?? '');
        if (seenOwnerName.has(dedupeKey)) {
          continue;
        }
        seenOwnerName.add(dedupeKey);
        dedupedRows.push(row);
      }

      const snapshotByAsset = await getLatestSnapshotByAssetId(
        supabase,
        dedupedRows.map((row: any) => String(row.id)).filter(Boolean),
      );

      const hydratedRows = dedupedRows.map((row: any) => {
        const snapshot = snapshotByAsset.get(String(row.id));
        if (!snapshot) {
          return row;
        }

        return {
          ...row,
          active_subscribers: snapshot.activeSubscribers,
          churn_bps: snapshot.churnBps,
          metrics_provider: snapshot.provider,
        };
      });

      return sendJson(res, 200, {
        data: {
          items: hydratedRows.map((row: any) => toMarketplaceCard(row, { viewerUserId: user?.id ?? null })),
          page: params.page,
          pageSize: params.pageSize,
          total: count ?? 0,
          hasMore: (count ?? 0) > to + 1,
          meta: {
            requiresMembership: !canViewMembers,
            lockedCount,
          },
        },
      });
    }

    if (method === 'POST') {
      const user = await getAuthenticatedUser(req);
      if (!user) {
        return sendJson(res, 401, { error: 'Authentication required.' });
      }

      const body = await parseJsonBody(req);
      const parsed = CreateMarketplaceAssetDraftSchema.safeParse(body);
      if (!parsed.success) {
        return sendJson(res, 400, {
          error: 'Invalid marketplace asset payload.',
          details: parsed.error.issues[0]?.message,
        });
      }

      const payload = parsed.data;
      const supabase = await getSupabaseAdmin();

      const { data: existingDraft, error: existingDraftError } = await supabase
        .from('marketplace_assets')
        .select('id, slug')
        .eq('owner_user_id', user.id)
        .eq('is_listed', false)
        .eq('name', payload.name)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingDraftError) {
        throw existingDraftError;
      }

      if (existingDraft?.id) {
        const draftUpdatePayload = {
          jam_id: payload.jamId ?? null,
          title: payload.name,
          tagline: payload.tagline,
          description: payload.description,
          logo_url: payload.logoUrl || null,
          category: payload.category,
          subcategory: payload.subcategory || null,
          tech_stack: payload.techStack,
          founder_name: payload.founderName,
          founder_email: payload.founderEmail,
          is_anonymous: payload.isAnonymous,
          visibility: payload.visibility,
          domain_visibility: payload.visibility === 'private' ? 'PRIVATE' : 'PUBLIC',
          listing_status: 'DRAFT',
        };
        const draftUpdateFallbackPayload = {
          jam_id: payload.jamId ?? null,
          tagline: payload.tagline,
          description: payload.description,
          logo_url: payload.logoUrl || null,
          category: payload.category,
          subcategory: payload.subcategory || null,
          tech_stack: payload.techStack,
          founder_name: payload.founderName,
          founder_email: payload.founderEmail,
          is_anonymous: payload.isAnonymous,
          visibility: payload.visibility,
        };

        let draftUpdateResult = await supabase
          .from('marketplace_assets')
          .update(draftUpdatePayload)
          .eq('id', existingDraft.id)
          .select(ASSET_SELECT)
          .single();

        if (draftUpdateResult.error && isRecoverableSchemaError(draftUpdateResult.error)) {
          draftUpdateResult = await supabase
            .from('marketplace_assets')
            .update(draftUpdateFallbackPayload)
            .eq('id', existingDraft.id)
            .select(LEGACY_ASSET_SELECT)
            .single();
        }

        const { data: updatedDraft, error: updateError } = draftUpdateResult;

        if (updateError) {
          throw updateError;
        }

        await writeMarketplaceAuditLog({
          actorUserId: user.id,
          assetId: updatedDraft.id,
          action: 'asset_draft_reused',
          metadata: {
            slug: updatedDraft.slug,
            category: payload.category,
          },
        });

        return sendJson(res, 200, {
          data: {
            asset: toMarketplaceCard(updatedDraft, { viewerUserId: user.id }),
            draft: true,
            reused: true,
          },
        });
      }

      const slug = await reserveUniqueSlug(supabase, payload.name);

      const insertPayload = {
        owner_user_id: user.id,
        jam_id: payload.jamId ?? null,
        title: payload.name,
        slug,
        name: payload.name,
        tagline: payload.tagline,
        description: payload.description,
        logo_url: payload.logoUrl || null,
        category: payload.category,
        subcategory: payload.subcategory || null,
        tech_stack: payload.techStack,
        founder_name: payload.founderName,
        founder_email: payload.founderEmail,
        is_anonymous: payload.isAnonymous,
        visibility: payload.visibility,
        domain_visibility: payload.visibility === 'private' ? 'PRIVATE' : 'PUBLIC',
        listing_status: 'DRAFT',
        is_listed: false,
        verified_status: 'unverified',
      };

      const insertFallbackPayload = {
        owner_user_id: user.id,
        jam_id: payload.jamId ?? null,
        slug,
        name: payload.name,
        tagline: payload.tagline,
        description: payload.description,
        logo_url: payload.logoUrl || null,
        category: payload.category,
        subcategory: payload.subcategory || null,
        tech_stack: payload.techStack,
        founder_name: payload.founderName,
        founder_email: payload.founderEmail,
        is_anonymous: payload.isAnonymous,
        visibility: payload.visibility,
        is_listed: false,
        verified_status: 'unverified',
      };

      let insertResult = await supabase
        .from('marketplace_assets')
        .insert(insertPayload)
        .select(ASSET_SELECT)
        .single();

      if (insertResult.error && isRecoverableSchemaError(insertResult.error)) {
        insertResult = await supabase
          .from('marketplace_assets')
          .insert(insertFallbackPayload)
          .select(LEGACY_ASSET_SELECT)
          .single();
      }

      const { data, error } = insertResult;

      if (error) {
        throw error;
      }

      await writeMarketplaceAuditLog({
        actorUserId: user.id,
        assetId: data.id,
        action: 'asset_draft_created',
        metadata: {
          slug,
          category: payload.category,
        },
      });

      return sendJson(res, 201, {
        data: {
          asset: toMarketplaceCard(data, { viewerUserId: user.id }),
          draft: true,
          reused: false,
        },
      });
    }

    return methodNotAllowed(res, ['GET', 'POST', 'PATCH', 'DELETE']);
  } catch (error) {
    return sendJson(res, 500, {
      error: 'Failed to process marketplace assets request.',
      details: sanitizeErrorDetails(error),
    });
  }
}
