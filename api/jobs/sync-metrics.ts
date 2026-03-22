import { getMethod, methodNotAllowed, sendJson } from '../../lib/server/http.js';
import { getSupabaseAdmin } from '../../lib/server/supabase-admin.js';
import { sendBuyerAlphaDigestEmail } from '../../lib/server/email.js';
import { syncActiveConnections, syncConnectionById } from '../../lib/server/marketplace-sync.js';
import { getQueryValue, sanitizeErrorDetails } from '../../lib/server/marketplace-utils.js';

type BuyerAlertRow = {
  id: string;
  email: string;
  min_mrr_cents: number;
  max_price_cents: number | null;
  min_profit_margin_bps: number;
  category: string | null;
  verified_only: boolean;
  max_churn_bps: number | null;
  min_traffic: number | null;
  include_alpha_digest: boolean;
  digest_frequency: 'weekly' | 'daily' | 'off';
  last_digest_sent_at: string | null;
};

type AssetRow = {
  id: string;
  slug: string | null;
  name: string | null;
  title: string | null;
  mrr_cents: number | null;
  asking_price_cents: number | null;
  profit_margin_bps: number | null;
  churn_bps: number | null;
  monthly_unique_visitors: number | null;
  verified_status: string | null;
  category: string | null;
  created_at: string;
};

const hasValidCronSecret = (req: any): boolean => {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    throw new Error('Missing CRON_SECRET env var.');
  }

  const direct = req?.headers?.['x-cron-secret'];
  if (typeof direct === 'string' && direct === expected) {
    return true;
  }

  if (Array.isArray(direct) && direct[0] === expected) {
    return true;
  }

  const getHeader = req?.headers && typeof req.headers.get === 'function'
    ? req.headers.get.bind(req.headers)
    : null;

  const fromGetter = getHeader ? getHeader('x-cron-secret') : null;
  if (typeof fromGetter === 'string' && fromGetter === expected) {
    return true;
  }

  const authHeader = getHeader ? getHeader('authorization') : req?.headers?.authorization;
  if (typeof authHeader === 'string' && authHeader.trim() === `Bearer ${expected}`) {
    return true;
  }

  if (Array.isArray(authHeader) && authHeader[0] === `Bearer ${expected}`) {
    return true;
  }

  return false;
};

const toNullableNonNegativeInt = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return null;
  }
  return Math.max(0, Math.round(numeric));
};

const normalizeToken = (value: unknown): string => String(value ?? '').trim().toLowerCase();

const isDigestDue = (alert: BuyerAlertRow, nowMs: number): boolean => {
  const frequency = alert.digest_frequency === 'daily' ? 'daily' : 'weekly';
  const intervalMs = frequency === 'daily' ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
  if (!alert.last_digest_sent_at) {
    return true;
  }
  const lastMs = new Date(alert.last_digest_sent_at).getTime();
  if (!Number.isFinite(lastMs) || lastMs <= 0) {
    return true;
  }
  return nowMs - lastMs >= intervalMs;
};

const matchesAlert = (alert: BuyerAlertRow, asset: AssetRow): boolean => {
  const mrr = toNullableNonNegativeInt(asset.mrr_cents) ?? 0;
  if (mrr < (toNullableNonNegativeInt(alert.min_mrr_cents) ?? 0)) {
    return false;
  }

  const askingPrice = toNullableNonNegativeInt(asset.asking_price_cents) ?? 0;
  const maxPrice = toNullableNonNegativeInt(alert.max_price_cents);
  if (maxPrice !== null && askingPrice > maxPrice) {
    return false;
  }

  const margin = toNullableNonNegativeInt(asset.profit_margin_bps) ?? 0;
  if (margin < (toNullableNonNegativeInt(alert.min_profit_margin_bps) ?? 0)) {
    return false;
  }

  const requiredCategory = normalizeToken(alert.category);
  const assetCategory = normalizeToken(asset.category);
  if (requiredCategory && requiredCategory !== assetCategory) {
    return false;
  }

  if (alert.verified_only === true && normalizeToken(asset.verified_status) !== 'verified') {
    return false;
  }

  const maxChurn = toNullableNonNegativeInt(alert.max_churn_bps);
  if (maxChurn !== null) {
    const churn = toNullableNonNegativeInt(asset.churn_bps);
    if (churn === null || churn > maxChurn) {
      return false;
    }
  }

  const minTraffic = toNullableNonNegativeInt(alert.min_traffic);
  if (minTraffic !== null) {
    const traffic = toNullableNonNegativeInt(asset.monthly_unique_visitors) ?? 0;
    if (traffic < minTraffic) {
      return false;
    }
  }

  return true;
};

const runMarketplaceAlertDigest = async (): Promise<{
  attempted: number;
  sent: number;
  skipped: number;
  failed: number;
  matchedDeals: number;
}> => {
  const supabase = await getSupabaseAdmin();
  const now = new Date();
  const nowIso = now.toISOString();
  const nowMs = now.getTime();
  const appBaseUrl = (process.env.APP_BASE_URL?.trim() || 'https://www.vibejam.co').replace(/\/+$/, '');

  const { data: alertRows, error: alertsError } = await supabase
    .from('buyer_alerts')
    .select('id,email,min_mrr_cents,max_price_cents,min_profit_margin_bps,category,verified_only,max_churn_bps,min_traffic,include_alpha_digest,digest_frequency,last_digest_sent_at')
    .eq('include_alpha_digest', true)
    .neq('digest_frequency', 'off');

  if (alertsError) {
    throw alertsError;
  }

  const alerts = (Array.isArray(alertRows) ? alertRows : []) as BuyerAlertRow[];
  if (alerts.length === 0) {
    return {
      attempted: 0,
      sent: 0,
      skipped: 0,
      failed: 0,
      matchedDeals: 0,
    };
  }

  const { data: assetRows, error: assetsError } = await supabase
    .from('marketplace_assets')
    .select('id,slug,name,title,mrr_cents,asking_price_cents,profit_margin_bps,churn_bps,monthly_unique_visitors,verified_status,category,created_at')
    .or('is_listed.eq.true,listing_status.eq.LISTED,listing_status.eq.LIVE')
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })
    .limit(400);

  if (assetsError) {
    throw assetsError;
  }

  const assets = (Array.isArray(assetRows) ? assetRows : []) as AssetRow[];
  let attempted = 0;
  let sent = 0;
  let skipped = 0;
  let failed = 0;
  let matchedDeals = 0;

  for (const alert of alerts) {
    if (!isDigestDue(alert, nowMs)) {
      skipped += 1;
      continue;
    }

    const email = String(alert.email ?? '').trim().toLowerCase();
    if (!email) {
      skipped += 1;
      continue;
    }

    const frequency = alert.digest_frequency === 'daily' ? 'daily' : 'weekly';
    const matches = assets
      .filter((asset) => matchesAlert(alert, asset))
      .slice(0, 6)
      .map((asset) => {
        const slugOrId = asset.slug ? String(asset.slug).trim() : String(asset.id);
        const dealUrl = `${appBaseUrl}/?listing=${encodeURIComponent(slugOrId)}`;
        return {
          assetName: String(asset.name ?? asset.title ?? 'Untitled Asset').trim() || 'Untitled Asset',
          mrrCents: toNullableNonNegativeInt(asset.mrr_cents) ?? 0,
          askingPriceCents: toNullableNonNegativeInt(asset.asking_price_cents) ?? 0,
          profitMarginBps: toNullableNonNegativeInt(asset.profit_margin_bps),
          traffic: toNullableNonNegativeInt(asset.monthly_unique_visitors),
          churnBps: toNullableNonNegativeInt(asset.churn_bps),
          url: dealUrl,
        };
      });

    if (matches.length === 0) {
      skipped += 1;
      continue;
    }

    attempted += 1;
    matchedDeals += matches.length;

    try {
      const result = await sendBuyerAlphaDigestEmail({
        toEmail: email,
        frequency,
        filters: {
          category: alert.category,
          minMrrCents: toNullableNonNegativeInt(alert.min_mrr_cents) ?? 0,
          maxPriceCents: toNullableNonNegativeInt(alert.max_price_cents),
          minProfitMarginBps: toNullableNonNegativeInt(alert.min_profit_margin_bps) ?? 0,
          maxChurnBps: toNullableNonNegativeInt(alert.max_churn_bps),
          minTraffic: toNullableNonNegativeInt(alert.min_traffic),
          verifiedOnly: alert.verified_only === true,
        },
        matches,
      });

      if (result.sent) {
        sent += 1;
        await supabase
          .from('buyer_alerts')
          .update({ last_digest_sent_at: nowIso })
          .eq('id', alert.id);
      } else {
        skipped += 1;
      }
    } catch {
      failed += 1;
    }
  }

  return {
    attempted,
    sent,
    skipped,
    failed,
    matchedDeals,
  };
};

export default async function handler(req: any, res: any) {
  try {
    const method = getMethod(req);
    if (method !== 'POST' && method !== 'GET') {
      return methodNotAllowed(res, ['GET', 'POST']);
    }

    if (!hasValidCronSecret(req)) {
      return sendJson(res, 401, { error: 'Unauthorized cron request.' });
    }

    const connectionId = getQueryValue(req, 'connection_id');
    const limitRaw = getQueryValue(req, 'limit');
    const job = String(getQueryValue(req, 'job') ?? '').trim().toLowerCase();
    const limit = limitRaw && Number.isFinite(Number(limitRaw)) ? Math.max(1, Math.min(100, Number(limitRaw))) : 30;

    if (connectionId) {
      const result = await syncConnectionById(connectionId);
      return sendJson(res, 200, {
        data: {
          attempted: 1,
          success: result.ok ? 1 : 0,
          failed: result.ok ? 0 : 1,
          results: [result],
        },
      });
    }

    if (job === 'marketplace-alert-digest' || job === 'alert-digest') {
      const digest = await runMarketplaceAlertDigest();
      return sendJson(res, 200, { data: { digest } });
    }

    const summary = await syncActiveConnections(limit);
    const digest = await runMarketplaceAlertDigest();
    return sendJson(res, 200, {
      data: {
        metricsSync: summary,
        digest,
      },
    });
  } catch (error) {
    return sendJson(res, 500, {
      error: 'Failed to run background marketplace jobs.',
      details: sanitizeErrorDetails(error),
    });
  }
}
