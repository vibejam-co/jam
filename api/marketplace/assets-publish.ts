import { getMethod, methodNotAllowed, parseJsonBody, sendJson } from '../../lib/server/http.js';
import { getSupabaseAdmin } from '../../lib/server/supabase-admin.js';
import { getAuthenticatedUser } from '../../lib/server/auth.js';
import {
  computeValuationMultipleX100,
  isRecoverableSchemaError,
  parseUsdToCents,
  sanitizeErrorDetails,
} from '../../lib/server/marketplace-utils.js';
import { PublishMarketplaceAssetSchema } from '../../lib/server/marketplace-validation.js';
import { writeMarketplaceAuditLog } from '../../lib/server/marketplace-audit.js';
import { createDodoCheckoutSession, getDodoCheckoutSession } from '../../lib/server/dodo-payments.js';
import { syncConnectionById } from '../../lib/server/marketplace-sync.js';

const ACTIVE_SELECT = [
  'id',
  'owner_user_id',
  'slug',
  'jam_id',
  'title',
  'name',
  'listing_status',
  'domain_visibility',
  'asking_price_cents',
  'last30d_revenue_cents',
  'trailing_30d_expenses_cents',
  'trailing_30d_revenue_cents',
  'trailing_30d_profit_cents',
  'profit_margin_pct',
  'mrr_cents',
  'profit_margin_bps',
  'verified_status',
  'last30d_growth_bps',
  'visibility',
].join(',');

const LEGACY_ACTIVE_SELECT = [
  'id',
  'owner_user_id',
  'slug',
  'jam_id',
  'name',
  'asking_price_cents',
  'last30d_revenue_cents',
  'mrr_cents',
  'profit_margin_bps',
  'verified_status',
  'last30d_growth_bps',
  'visibility',
].join(',');

const BOOST_TIER_PRICE_CENTS: Record<'free' | 'pro' | 'elite', number> = {
  free: 0,
  pro: 4900,
  elite: 29900,
};

const requiresPaidBoost = (tier: 'free' | 'pro' | 'elite') => tier === 'pro' || tier === 'elite';

const getHeaderValue = (headers: any, key: string): string => {
  if (!headers) {
    return '';
  }
  if (typeof headers.get === 'function') {
    return String(headers.get(key) ?? '');
  }

  const direct = headers[key] ?? headers[key.toLowerCase()];
  if (typeof direct === 'string') {
    return direct;
  }
  if (Array.isArray(direct) && typeof direct[0] === 'string') {
    return direct[0];
  }
  return '';
};

const getBaseUrl = (req: any): string => {
  const forwardedProto = getHeaderValue(req?.headers, 'x-forwarded-proto');
  const forwardedHost = getHeaderValue(req?.headers, 'x-forwarded-host');
  if (forwardedProto && forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  const host = getHeaderValue(req?.headers, 'host');
  if (host) {
    return `https://${host}`;
  }

  return 'https://www.vibejam.co';
};

const getDodoBoostConfig = (tier: 'pro' | 'elite') => {
  const apiKey = process.env.DODO_MARKETPLACE_API_KEY || process.env.DODO_PAYMENTS_API_KEY;
  const productId = tier === 'pro'
    ? process.env.DODO_BOOST_PRO_PRODUCT_ID
    : process.env.DODO_BOOST_ELITE_PRODUCT_ID;

  if (!apiKey || !productId) {
    throw new Error(
      `Missing Dodo boost configuration for ${tier}. Set DODO_MARKETPLACE_API_KEY (or DODO_PAYMENTS_API_KEY) and tier product id env vars.`,
    );
  }

  return {
    apiKey,
    productId,
  };
};

const getBoostWindow = (tier: 'free' | 'pro' | 'elite') => {
  const now = new Date();
  if (tier === 'free') {
    return {
      startsAt: now.toISOString(),
      endsAt: null,
    };
  }

  const ends = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  return {
    startsAt: now.toISOString(),
    endsAt: ends.toISOString(),
  };
};

const getAssetId = (req: any): string => {
  const raw = req?.query?.assetId;
  if (typeof raw === 'string') {
    return raw;
  }
  if (Array.isArray(raw) && typeof raw[0] === 'string') {
    return raw[0];
  }
  return '';
};

const normalizeAssetName = (value: unknown): string =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

export default async function handler(req: any, res: any) {
  try {
    if (getMethod(req) !== 'POST') {
      return methodNotAllowed(res, ['POST']);
    }

    const user = await getAuthenticatedUser(req);
    if (!user) {
      return sendJson(res, 401, { error: 'Authentication required.' });
    }

    const assetId = getAssetId(req);
    if (!assetId) {
      return sendJson(res, 400, { error: 'Missing asset id.' });
    }

    const body = await parseJsonBody(req);
    const parsed = PublishMarketplaceAssetSchema.safeParse(body);
    if (!parsed.success) {
      return sendJson(res, 400, {
        error: 'Invalid publish payload.',
        details: parsed.error.issues[0]?.message,
      });
    }

    const payload = parsed.data;
    const askingPriceCents = typeof payload.askingPriceCents === 'number'
      ? payload.askingPriceCents
      : parseUsdToCents(payload.askingPriceUsd ?? '');

    if (!askingPriceCents || askingPriceCents <= 0) {
      return sendJson(res, 400, { error: 'Asking price is required.' });
    }

    const supabase = await getSupabaseAdmin();
    let assetResult = await supabase
      .from('marketplace_assets')
      .select(ACTIVE_SELECT)
      .eq('id', assetId)
      .limit(1)
      .maybeSingle();

    if (assetResult.error && isRecoverableSchemaError(assetResult.error)) {
      assetResult = await supabase
        .from('marketplace_assets')
        .select(LEGACY_ACTIVE_SELECT)
        .eq('id', assetId)
        .limit(1)
        .maybeSingle();
    }

    const { data: asset, error: assetError } = assetResult;

    if (assetError) {
      throw assetError;
    }

    if (!asset || asset.owner_user_id !== user.id) {
      return sendJson(res, 404, { error: 'Asset not found.' });
    }

    const siblingSelectPrimary = 'id,slug,name,jam_id,is_listed,listing_status';
    const siblingSelectFallback = 'id,slug,name,jam_id,is_listed';
    let siblingsResult = await supabase
      .from('marketplace_assets')
      .select(siblingSelectPrimary)
      .eq('owner_user_id', user.id)
      .neq('id', asset.id);

    if (siblingsResult.error && isRecoverableSchemaError(siblingsResult.error)) {
      siblingsResult = await supabase
        .from('marketplace_assets')
        .select(siblingSelectFallback)
        .eq('owner_user_id', user.id)
        .neq('id', asset.id);
    }

    if (siblingsResult.error) {
      throw siblingsResult.error;
    }

    const assetNameNormalized = normalizeAssetName(asset.name);
    const duplicateListedRow = (Array.isArray(siblingsResult.data) ? siblingsResult.data : []).find((row: any) => {
      const isActive = row.is_listed === true || row.listing_status === 'LISTED';
      if (!isActive) {
        return false;
      }

      if (asset.jam_id && row.jam_id && String(asset.jam_id) === String(row.jam_id)) {
        return true;
      }

      return normalizeAssetName(row.name) === assetNameNormalized;
    });

    if (duplicateListedRow) {
      await writeMarketplaceAuditLog({
        actorUserId: user.id,
        assetId: asset.id,
        action: 'publish_blocked_duplicate_listing',
        severity: 'WARN',
        reason: 'DUPLICATE_ACTIVE_LISTING',
        metadata: {
          duplicate_asset_id: duplicateListedRow.id,
          duplicate_slug: duplicateListedRow.slug ?? null,
          owner_user_id: user.id,
        },
      });

      return sendJson(res, 409, {
        error: 'This app is already listed in Marketplace. Edit the existing listing instead of creating a duplicate.',
        code: 'DUPLICATE_ASSET_LISTING',
        existingAssetId: duplicateListedRow.id,
        existingSlug: duplicateListedRow.slug ?? null,
      });
    }

    const { data: connectionRows, error: connectionError } = await supabase
      .from('payment_connections')
      .select('id, status, updated_at')
      .eq('asset_id', asset.id)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (connectionError) {
      throw connectionError;
    }

    const latestConnection = Array.isArray(connectionRows) ? connectionRows[0] : null;
    const activeConnection = latestConnection && latestConnection.status === 'active' ? latestConnection : null;
    const missingActiveConnection = !activeConnection;
    const hasHistoricalConnection = Boolean(latestConnection);
    const verificationFallbackStatus = missingActiveConnection
      ? (hasHistoricalConnection ? 'error' : 'unverified')
      : null;

    // Attempt a fresh sync at publish time so marketplace cards reflect latest connected metrics.
    if (activeConnection) {
      try {
        await syncConnectionById(activeConnection.id);
      } catch {
        // Non-fatal; listing can still publish while verification retries in the background.
      }
    }

    if (requiresPaidBoost(payload.tier)) {
      const tier = payload.tier;
      const checkoutSessionId = payload.boostCheckoutSessionId?.trim() ?? '';
      let dodoConfig: { apiKey: string; productId: string };

      try {
        dodoConfig = getDodoBoostConfig(tier);
      } catch (configError) {
        return sendJson(res, 400, {
          error: 'Boost checkout is not configured yet.',
          details: sanitizeErrorDetails(configError),
        });
      }

      if (!checkoutSessionId) {
        let checkout: Awaited<ReturnType<typeof createDodoCheckoutSession>>;
        try {
          checkout = await createDodoCheckoutSession(dodoConfig.apiKey, {
            productId: dodoConfig.productId,
            quantity: 1,
            returnUrl: `${getBaseUrl(req)}/?marketplace=boost`,
            customer: {
              email: user.email ?? undefined,
              name: (user.user_metadata?.full_name as string | undefined) ?? undefined,
            },
            metadata: {
              purpose: 'marketplace_boost',
              asset_id: asset.id,
              owner_user_id: user.id,
              tier,
            },
          });
        } catch (checkoutError) {
          return sendJson(res, 503, {
            error: 'Unable to start boost checkout right now.',
            details: sanitizeErrorDetails(checkoutError),
          });
        }

        const { error: paymentInsertError } = await supabase
          .from('boost_payments')
          .upsert(
            {
              asset_id: asset.id,
              owner_user_id: user.id,
              tier,
              amount_cents: BOOST_TIER_PRICE_CENTS[tier],
              currency: 'USD',
              dodo_checkout_id: checkout.session_id,
              dodo_checkout_url: checkout.checkout_url,
              status: 'pending',
              metadata: {
                provider: 'dodo',
              },
            },
            { onConflict: 'dodo_checkout_id' },
          );

        if (paymentInsertError) {
          throw paymentInsertError;
        }

        await writeMarketplaceAuditLog({
          actorUserId: user.id,
          assetId: asset.id,
          action: 'boost_checkout_created',
          metadata: {
            tier,
            dodo_checkout_id: checkout.session_id,
            amount_cents: BOOST_TIER_PRICE_CENTS[tier],
          },
        });

        return sendJson(res, 200, {
          data: {
            success: false,
            requiresPayment: true,
            tier,
            boostCheckoutSessionId: checkout.session_id,
            checkoutUrl: checkout.checkout_url,
            paymentStatus: 'pending',
          },
        });
      }

      let checkoutStatus: Awaited<ReturnType<typeof getDodoCheckoutSession>>;
      try {
        checkoutStatus = await getDodoCheckoutSession(dodoConfig.apiKey, checkoutSessionId);
      } catch (statusError) {
        return sendJson(res, 503, {
          error: 'Unable to verify boost payment right now.',
          details: sanitizeErrorDetails(statusError),
        });
      }
      const paymentStatus = String(checkoutStatus.payment_status ?? 'pending').toLowerCase();
      const isPaid = paymentStatus === 'succeeded';
      const normalizedStatus = isPaid
        ? 'paid'
        : paymentStatus === 'failed' || paymentStatus === 'cancelled'
          ? 'failed'
          : 'pending';

      const { data: existingPaymentRows } = await supabase
        .from('boost_payments')
        .select('dodo_checkout_url')
        .eq('dodo_checkout_id', checkoutSessionId)
        .limit(1);
      const existingCheckoutUrl =
        Array.isArray(existingPaymentRows) && existingPaymentRows[0]?.dodo_checkout_url
          ? existingPaymentRows[0].dodo_checkout_url
          : null;

      const { error: paymentUpdateError } = await supabase
        .from('boost_payments')
        .upsert(
          {
            asset_id: asset.id,
            owner_user_id: user.id,
            tier,
            amount_cents: BOOST_TIER_PRICE_CENTS[tier],
            currency: 'USD',
            dodo_checkout_id: checkoutSessionId,
            dodo_checkout_url: existingCheckoutUrl ?? `${getBaseUrl(req)}/?marketplace=boost`,
            dodo_payment_id: checkoutStatus.payment_id ?? null,
            status: normalizedStatus,
            metadata: {
              provider: 'dodo',
              payment_status: paymentStatus,
            },
          },
          { onConflict: 'dodo_checkout_id' },
        );

      if (paymentUpdateError) {
        throw paymentUpdateError;
      }

      if (!isPaid) {
        return sendJson(res, 200, {
          data: {
            success: false,
            requiresPayment: true,
            tier,
            boostCheckoutSessionId: checkoutSessionId,
            checkoutUrl: existingCheckoutUrl ?? '',
            paymentStatus,
          },
        });
      }
    }

    const valuationMultipleX100 = computeValuationMultipleX100(
      askingPriceCents,
      Number(asset.last30d_revenue_cents ?? 0),
    );

    const profitMarginBps = payload.profitMarginPercent === null || payload.profitMarginPercent === undefined
      ? null
      : Math.round(payload.profitMarginPercent * 100);
    const trailingRevenueCents = Number(asset.last30d_revenue_cents ?? 0);
    const trailingExpensesCents = Number(asset.trailing_30d_expenses_cents ?? 0);
    const trailingProfitCents = trailingRevenueCents - trailingExpensesCents;
    const trailingMarginPct = trailingRevenueCents > 0
      ? Math.max(0, Math.min(100, Number(((trailingProfitCents / trailingRevenueCents) * 100).toFixed(2))))
      : null;

    const publishPayload = {
      title: asset.name,
      asking_price_cents: askingPriceCents,
      profit_margin_bps: profitMarginBps,
      profit_margin_pct: trailingMarginPct,
      trailing_30d_revenue_cents: trailingRevenueCents,
      trailing_30d_profit_cents: trailingProfitCents,
      valuation_multiple_x100: valuationMultipleX100,
      is_listed: true,
      listing_status: 'LISTED',
      visibility: payload.visibility ?? 'public',
      domain_visibility: (payload.visibility ?? 'public') === 'private' ? 'PRIVATE' : 'PUBLIC',
      ...(verificationFallbackStatus ? { verified_status: verificationFallbackStatus } : {}),
    };

    const publishFallbackPayload = {
      asking_price_cents: askingPriceCents,
      profit_margin_bps: profitMarginBps,
      valuation_multiple_x100: valuationMultipleX100,
      is_listed: true,
      visibility: payload.visibility ?? 'public',
    };

    let publishResult = await supabase
      .from('marketplace_assets')
      .update(publishPayload)
      .eq('id', asset.id);

    if (publishResult.error && isRecoverableSchemaError(publishResult.error)) {
      publishResult = await supabase
        .from('marketplace_assets')
        .update(publishFallbackPayload)
        .eq('id', asset.id);
    }

    const { error: publishError } = publishResult;

    if (publishError) {
      throw publishError;
    }

    const boostWindow = getBoostWindow(payload.tier);

    const { error: boostError } = await supabase.from('boosts').insert({
      asset_id: asset.id,
      tier: payload.tier,
      starts_at: boostWindow.startsAt,
      ends_at: boostWindow.endsAt,
    });

    if (boostError) {
      throw boostError;
    }

    let refreshedAssetResult = await supabase
      .from('marketplace_assets')
      .select(ACTIVE_SELECT)
      .eq('id', asset.id)
      .limit(1)
      .maybeSingle();

    if (refreshedAssetResult.error && isRecoverableSchemaError(refreshedAssetResult.error)) {
      refreshedAssetResult = await supabase
        .from('marketplace_assets')
        .select(LEGACY_ACTIVE_SELECT)
        .eq('id', asset.id)
        .limit(1)
        .maybeSingle();
    }

    const { data: refreshedAsset, error: refreshedAssetError } = refreshedAssetResult;

    if (refreshedAssetError) {
      throw refreshedAssetError;
    }

    const assetSnapshot = refreshedAsset ?? asset;
    const publishWarning = missingActiveConnection
      ? 'Listing is live, but provider verification is not connected yet. Status is marked Needs attention until you connect a read-only provider key.'
      : null;

    await writeMarketplaceAuditLog({
      actorUserId: user.id,
      assetId: asset.id,
      action: 'asset_published',
      metadata: {
        asking_price_cents: askingPriceCents,
        valuation_multiple_x100: valuationMultipleX100,
        tier: payload.tier,
        visibility: payload.visibility ?? 'public',
        missing_active_connection: missingActiveConnection,
      },
    });

    return sendJson(res, 200, {
      data: {
        success: true,
        assetId: assetSnapshot.id,
        slug: assetSnapshot.slug,
        askingPriceCents,
        valuationMultipleX100,
        tier: payload.tier,
        visibility: payload.visibility ?? 'public',
        verifiedStatus: assetSnapshot.verified_status,
        mrrCents: Number(assetSnapshot.mrr_cents ?? 0),
        last30dRevenueCents: Number(assetSnapshot.last30d_revenue_cents ?? 0),
        last30dGrowthBps: Number(assetSnapshot.last30d_growth_bps ?? 0),
        warning: publishWarning,
      },
    });
  } catch (error) {
    return sendJson(res, 500, {
      error: 'Failed to publish marketplace asset.',
      details: sanitizeErrorDetails(error),
    });
  }
}
