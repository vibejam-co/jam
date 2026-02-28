import { getMethod, methodNotAllowed, parseJsonBody, sendJson } from '../../../lib/server/http.js';
import { getSupabaseAdmin } from '../../../lib/server/supabase-admin.js';
import { getAuthenticatedUser, isMemberUser } from '../../../lib/server/auth.js';
import {
  computeValuationMultipleX100,
  getQueryValue,
  parseUsdToCents,
  sanitizeErrorDetails,
  toPercentBps,
} from '../../../lib/server/marketplace-utils.js';
import { toMarketplaceDetail } from '../../../lib/server/marketplace-transformers.js';
import { UpdateMarketplaceAssetSchema } from '../../../lib/server/marketplace-validation.js';
import { writeMarketplaceAuditLog } from '../../../lib/server/marketplace-audit.js';

const ASSET_SELECT = [
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

  if (row.is_listed !== true) {
    return false;
  }

  if (row.visibility === 'public') {
    return true;
  }

  if (row.visibility === 'members_only' && canViewMembers) {
    return true;
  }

  return false;
};

export default async function handler(req: any, res: any) {
  try {
    const method = getMethod(req);
    if (method !== 'GET' && method !== 'PATCH' && method !== 'DELETE') {
      return methodNotAllowed(res, ['GET', 'PATCH', 'DELETE']);
    }

    const assetParam = req?.query?.assetId ?? getQueryValue(req, 'assetId');
    const assetId = typeof assetParam === 'string' ? assetParam : Array.isArray(assetParam) ? assetParam[0] : '';

    if (!assetId) {
      return sendJson(res, 400, { error: 'Missing asset id.' });
    }

    const supabase = await getSupabaseAdmin();
    const baseQuery = supabase.from('marketplace_assets').select(ASSET_SELECT).limit(1);
    const query = /^[0-9a-fA-F-]{36}$/.test(assetId) ? baseQuery.eq('id', assetId) : baseQuery.eq('slug', assetId);

    const { data, error } = await query.maybeSingle();
    if (error) {
      throw error;
    }

    if (!data) {
      return sendJson(res, 404, { error: 'Marketplace asset not found.' });
    }

    const user = await getAuthenticatedUser(req);
    const userId = user?.id ?? null;
    const canViewMembers = Boolean(user && isMemberUser(user));

    if (method === 'PATCH') {
      if (!userId) {
        return sendJson(res, 401, { error: 'Authentication required.' });
      }

      if (data.owner_user_id !== userId) {
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
      if (payload.tagline !== undefined) updatePayload.tagline = payload.tagline;
      if (payload.description !== undefined) updatePayload.description = payload.description;
      if (payload.logoUrl !== undefined) updatePayload.logo_url = payload.logoUrl || null;
      if (payload.category !== undefined) updatePayload.category = payload.category;
      if (payload.subcategory !== undefined) updatePayload.subcategory = payload.subcategory || null;
      if (payload.techStack !== undefined) updatePayload.tech_stack = payload.techStack;
      if (payload.founderName !== undefined) updatePayload.founder_name = payload.founderName;
      if (payload.founderEmail !== undefined) updatePayload.founder_email = payload.founderEmail;
      if (payload.visibility !== undefined) updatePayload.visibility = payload.visibility;
      if (payload.isAnonymous !== undefined) updatePayload.is_anonymous = payload.isAnonymous;
      if (payload.profitMarginPercent !== undefined) updatePayload.profit_margin_bps = toPercentBps(payload.profitMarginPercent);

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
          Number(data.last30d_revenue_cents ?? 0),
        );
      }

      if (Object.keys(updatePayload).length === 0) {
        return sendJson(res, 400, { error: 'No editable fields were provided.' });
      }

      const { data: updatedRow, error: updateError } = await supabase
        .from('marketplace_assets')
        .update(updatePayload)
        .eq('id', data.id)
        .select(ASSET_SELECT)
        .single();

      if (updateError) {
        throw updateError;
      }

      await writeMarketplaceAuditLog({
        actorUserId: userId,
        assetId: data.id,
        action: 'asset_updated',
        metadata: {
          fields: Object.keys(updatePayload),
          is_listed: Boolean(updatedRow.is_listed),
        },
      });

      const { data: updatedSnapshots } = await supabase
        .from('revenue_snapshots')
        .select('period_end, revenue_cents, mrr_cents')
        .eq('asset_id', data.id)
        .order('period_end', { ascending: true })
        .limit(90);

      const { data: updatedBoosts } = await supabase
        .from('boosts')
        .select('tier, starts_at, ends_at')
        .eq('asset_id', data.id)
        .order('created_at', { ascending: false })
        .limit(1);

      return sendJson(res, 200, {
        data: {
          locked: false,
          asset: {
            ...toMarketplaceDetail(
              updatedRow as any,
              Array.isArray(updatedSnapshots) ? (updatedSnapshots as any) : [],
              { viewerUserId: userId },
            ),
            boost: Array.isArray(updatedBoosts) && updatedBoosts.length > 0 ? updatedBoosts[0] : null,
          },
        },
      });
    }

    if (method === 'DELETE') {
      if (!userId) {
        return sendJson(res, 401, { error: 'Authentication required.' });
      }

      if (data.owner_user_id !== userId) {
        return sendJson(res, 403, { error: 'Only the listing owner can delete this asset.' });
      }

      await writeMarketplaceAuditLog({
        actorUserId: userId,
        assetId: data.id,
        action: 'asset_deleted',
        metadata: {
          name: data.name ?? null,
          slug: data.slug ?? null,
          is_listed: Boolean(data.is_listed),
          verified_status: data.verified_status ?? null,
          visibility: data.visibility ?? null,
        },
      });

      const { error: deleteError } = await supabase
        .from('marketplace_assets')
        .delete()
        .eq('id', data.id)
        .eq('owner_user_id', userId);

      if (deleteError) {
        throw deleteError;
      }

      return sendJson(res, 200, {
        data: {
          deleted: true,
          assetId: data.id,
        },
      });
    }

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

    const { data: snapshots, error: snapshotError } = await supabase
      .from('revenue_snapshots')
      .select('period_end, revenue_cents, mrr_cents')
      .eq('asset_id', data.id)
      .order('period_end', { ascending: true })
      .limit(90);

    if (snapshotError) {
      throw snapshotError;
    }

    const { data: boosts } = await supabase
      .from('boosts')
      .select('tier, starts_at, ends_at')
      .eq('asset_id', data.id)
      .order('created_at', { ascending: false })
      .limit(1);

    return sendJson(res, 200, {
      data: {
        locked: false,
        asset: {
          ...toMarketplaceDetail(
            data as any,
            Array.isArray(snapshots) ? (snapshots as any) : [],
            { viewerUserId: userId },
          ),
          boost: Array.isArray(boosts) && boosts.length > 0 ? boosts[0] : null,
        },
      },
    });
  } catch (error) {
    return sendJson(res, 500, {
      error: 'Failed to load marketplace asset.',
      details: sanitizeErrorDetails(error),
    });
  }
}
