import { getMethod, methodNotAllowed, parseJsonBody, sendJson } from '../../lib/server/http.js';
import { getSupabaseAdmin } from '../../lib/server/supabase-admin.js';
import { getAuthenticatedUser } from '../../lib/server/auth.js';
import { sanitizeErrorDetails } from '../../lib/server/marketplace-utils.js';
import { ConnectMarketplaceAssetSchema } from '../../lib/server/marketplace-validation.js';
import { encryptSecret, keyFingerprint } from '../../lib/server/secrets.js';
import { getProviderAdapter } from '../../lib/server/providers/index.js';
import { checkRateLimit } from '../../lib/server/rate-limit.js';
import { writeMarketplaceAuditLog } from '../../lib/server/marketplace-audit.js';
import { syncConnectionById } from '../../lib/server/marketplace-sync.js';

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

    const limiter = checkRateLimit(`marketplace-connect:${user.id}`, { limit: 6, windowMs: 10 * 60 * 1000 });
    if (!limiter.ok) {
      return sendJson(res, 429, {
        error: 'Too many verification attempts. Please wait before trying again.',
        details: `Retry in ${Math.ceil(limiter.retryAfterMs / 1000)}s`,
      });
    }

    const body = await parseJsonBody(req);
    const parsed = ConnectMarketplaceAssetSchema.safeParse(body);
    if (!parsed.success) {
      return sendJson(res, 400, {
        error: 'Invalid connect payload.',
        details: parsed.error.issues[0]?.message,
      });
    }

    const payload = parsed.data;
    if (payload.provider === 'stripe') {
      const key = payload.apiKey.trim();
      if (key.startsWith('sk_live_')) {
        return sendJson(res, 400, {
          error: 'Use a Stripe Restricted Key (rk_live_) instead of a Secret Key.',
          details: 'Secret keys are not accepted for marketplace verification.',
        });
      }
      if (!key.startsWith('rk_live_')) {
        return sendJson(res, 400, {
          error: 'Stripe key must start with rk_live_.',
          details: 'Create a live restricted read-only key in Stripe and try again.',
        });
      }
    }
    if (payload.provider === 'revenuecat') {
      const key = payload.apiKey.trim();
      if (!key.startsWith('sk_')) {
        return sendJson(res, 400, {
          error: 'RevenueCat key must start with sk_.',
          details: 'Create a RevenueCat Secret Key from Project Settings -> API Keys.',
        });
      }
    }

    const supabase = await getSupabaseAdmin();

    const { data: asset, error: assetError } = await supabase
      .from('marketplace_assets')
      .select('id, owner_user_id')
      .eq('id', assetId)
      .limit(1)
      .maybeSingle();

    if (assetError) {
      throw assetError;
    }

    if (!asset || asset.owner_user_id !== user.id) {
      return sendJson(res, 404, { error: 'Asset not found.' });
    }

    const adapter = getProviderAdapter(payload.provider);
    let validation: Awaited<ReturnType<typeof adapter.validateKey>>;
    try {
      validation = await adapter.validateKey(payload.apiKey);
    } catch (validationError) {
      const details = sanitizeErrorDetails(validationError);
      const normalized = details.toLowerCase();
      const isUserFixable =
        normalized.includes('invalid') ||
        normalized.includes('rejected') ||
        normalized.includes('unauthorized') ||
        normalized.includes('forbidden') ||
        normalized.includes('format');

      return sendJson(res, isUserFixable ? 400 : 503, {
        error: isUserFixable
          ? 'Unable to validate provider key.'
          : 'Provider validation is temporarily unavailable.',
        details,
      });
    }

    const encrypted = encryptSecret(payload.apiKey);
    const fingerprint = keyFingerprint(payload.apiKey);

    const { data: connection, error: upsertError } = await supabase
      .from('payment_connections')
      .upsert(
        {
          owner_user_id: user.id,
          asset_id: asset.id,
          provider: payload.provider,
          encrypted_api_key: encrypted,
          key_fingerprint: fingerprint,
          status: 'active',
          status_message: validation.warning ?? null,
          failure_count: 0,
          next_retry_at: null,
          last_checked_at: new Date().toISOString(),
        },
        {
          onConflict: 'asset_id,provider',
        },
      )
      .select('id, key_fingerprint, status, provider, status_message')
      .single();

    if (upsertError) {
      throw upsertError;
    }

    const { error: assetUpdateError } = await supabase
      .from('marketplace_assets')
      .update({
        verified_status: 'pending',
        is_anonymous: payload.isAnonymous ?? undefined,
      })
      .eq('id', asset.id);

    if (assetUpdateError) {
      throw assetUpdateError;
    }

    await writeMarketplaceAuditLog({
      actorUserId: user.id,
      assetId: asset.id,
      action: 'payment_connection_created',
      metadata: {
        provider: payload.provider,
        key_fingerprint: fingerprint,
        warning: validation.warning,
      },
    });

    let verifiedStatus: 'pending' | 'verified' = 'pending';
    let metrics: {
      mrrCents: number;
      last30dRevenueCents: number;
      last30dGrowthBps: number;
      activeSubscribers: number;
    } | null = null;

    // Stripe sync is fast/reliable enough for immediate metrics preview.
    if (payload.provider === 'stripe') {
      try {
        const syncResult = await syncConnectionById(connection.id);
        if (syncResult.ok) {
          verifiedStatus = 'verified';
          metrics = {
            mrrCents: syncResult.metrics.mrr_cents,
            last30dRevenueCents: syncResult.metrics.last30d_revenue_cents,
            last30dGrowthBps: syncResult.metrics.last30d_growth_bps,
            activeSubscribers: syncResult.metrics.active_subscribers,
          };
        }
      } catch {
        // Leave pending; cron sync will retry and update status.
      }
    }

    return sendJson(res, 200, {
      data: {
        connection,
        verifiedStatus,
        warning: validation.warning,
        metrics,
      },
    });
  } catch (error) {
    return sendJson(res, 500, {
      error: 'Failed to connect provider for marketplace asset.',
      details: sanitizeErrorDetails(error),
    });
  }
}
