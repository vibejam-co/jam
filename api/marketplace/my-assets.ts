import { getMethod, methodNotAllowed, sendJson } from '../../lib/server/http.js';
import { getSupabaseAdmin } from '../../lib/server/supabase-admin.js';
import { getAuthenticatedUser } from '../../lib/server/auth.js';
import {
  getQueryValue,
  isRecoverableSchemaError,
  parseBooleanQuery,
  sanitizeErrorDetails,
} from '../../lib/server/marketplace-utils.js';
import { toMarketplaceCard } from '../../lib/server/marketplace-transformers.js';

const SELECT_FIELDS = [
  'id',
  'jam_id',
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

export default async function handler(req: any, res: any) {
  try {
    if (getMethod(req) !== 'GET') {
      return methodNotAllowed(res, ['GET']);
    }

    const user = await getAuthenticatedUser(req);
    if (!user) {
      return sendJson(res, 401, { error: 'Authentication required.' });
    }

    const supabase = await getSupabaseAdmin();
    const includeOfferItems = Boolean(parseBooleanQuery(getQueryValue(req, 'include_offer_items')));
    const markViewed = Boolean(parseBooleanQuery(getQueryValue(req, 'mark_viewed')));
    const assetFilter = getQueryValue(req, 'asset_id') ?? undefined;

    if (markViewed && assetFilter) {
      const { error: markViewedError } = await supabase
        .from('offers')
        .update({ status: 'viewed' })
        .eq('seller_user_id', user.id)
        .eq('asset_id', assetFilter)
        .eq('status', 'sent');

      if (markViewedError) {
        throw markViewedError;
      }
    }

    let offersQuery = supabase
      .from('offers')
      .select('id, asset_id, buyer_user_id, offer_price_cents, message, status, created_at, updated_at')
      .eq('seller_user_id', user.id);

    if (assetFilter) {
      offersQuery = offersQuery.eq('asset_id', assetFilter);
    }

    const [{ data: assets, error: assetsError }, { data: offers, error: offersError }] = await Promise.all([
      supabase
        .from('marketplace_assets')
        .select(SELECT_FIELDS)
        .eq('owner_user_id', user.id)
        .order('created_at', { ascending: false }),
      offersQuery.order('created_at', { ascending: false }),
    ]);

    if (assetsError) {
      throw assetsError;
    }

    if (offersError) {
      throw offersError;
    }

    const offerRows = Array.isArray(offers) ? offers : [];
    const assetRows = Array.isArray(assets) ? assets : [];
    const snapshotByAsset = await getLatestSnapshotByAssetId(
      supabase,
      assetRows.map((asset: any) => String(asset.id)).filter(Boolean),
    );

    const byAsset = offerRows.reduce<Record<string, { total: number; sent: number; viewed: number; accepted: number; rejected: number; countered: number }>>((acc, row: any) => {
      const assetId = String(row.asset_id);
      if (!acc[assetId]) {
        acc[assetId] = {
          total: 0,
          sent: 0,
          viewed: 0,
          accepted: 0,
          rejected: 0,
          countered: 0,
        };
      }
      acc[assetId].total += 1;
      if (row.status in acc[assetId]) {
        (acc[assetId] as any)[row.status] += 1;
      }
      return acc;
    }, {});

    let buyerLabelById: Record<string, string> = {};
    if (includeOfferItems) {
      const buyerIds = Array.from(
        new Set(offerRows.map((row: any) => String(row.buyer_user_id)).filter(Boolean)),
      );

      buyerLabelById = {};
      await Promise.all(
        buyerIds.slice(0, 100).map(async (buyerId) => {
          const { data } = await supabase.auth.admin.getUserById(buyerId);
          const metadata = data?.user?.user_metadata ?? {};
          const fullName =
            (typeof metadata.full_name === 'string' && metadata.full_name.trim()) ||
            (typeof metadata.name === 'string' && metadata.name.trim()) ||
            '';
          const fallbackEmail =
            typeof data?.user?.email === 'string' && data.user.email.includes('@')
              ? data.user.email.split('@')[0]
              : '';

          buyerLabelById[buyerId] = fullName || fallbackEmail || 'Verified Buyer';
        }),
      );
    }

    return sendJson(res, 200, {
      data: {
        items: assetRows
          .filter((asset: any) => (assetFilter ? asset.id === assetFilter : true))
          .map((asset: any) => {
            const snapshot = snapshotByAsset.get(String(asset.id));
            const hydratedAsset = snapshot
              ? {
                  ...asset,
                  active_subscribers: snapshot.activeSubscribers,
                  churn_bps: snapshot.churnBps,
                  metrics_provider: snapshot.provider,
                }
              : asset;

            return {
              ...toMarketplaceCard(hydratedAsset, { viewerUserId: user.id }),
              jamId: asset.jam_id ? String(asset.jam_id) : null,
              offers: byAsset[asset.id] ?? {
                total: 0,
                sent: 0,
                viewed: 0,
                accepted: 0,
                rejected: 0,
                countered: 0,
              },
              offerItems: includeOfferItems
                ? offerRows
                    .filter((offer: any) => offer.asset_id === asset.id)
                    .map((offer: any) => ({
                      id: offer.id,
                      assetId: offer.asset_id,
                      buyerUserId: offer.buyer_user_id,
                      buyerLabel: buyerLabelById[String(offer.buyer_user_id)] ?? 'Verified Buyer',
                      offerPriceCents: Number(offer.offer_price_cents ?? 0),
                      message: offer.message,
                      status: offer.status,
                      createdAt: offer.created_at,
                      updatedAt: offer.updated_at,
                    }))
                : undefined,
            };
          }),
      },
    });
  } catch (error) {
    return sendJson(res, 500, {
      error: 'Failed to load your marketplace assets.',
      details: sanitizeErrorDetails(error),
    });
  }
}
