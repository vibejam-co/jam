import { getSupabaseAdmin } from './supabase-admin.js';
import { decryptSecret } from './secrets.js';
import { getProviderAdapter } from './providers/index.js';
import type { ProviderName } from './providers/types.js';
import { sanitizeErrorDetails } from './marketplace-utils.js';
import { writeMarketplaceAuditLog } from './marketplace-audit.js';

type ConnectionRow = {
  id: string;
  owner_user_id: string;
  asset_id: string;
  provider: ProviderName;
  encrypted_api_key: string;
  status: 'active' | 'revoked' | 'error';
  failure_count: number;
};

const BASE_RETRY_MINUTES = 15;
const MAX_RETRY_EXP = 5;

const nextRetryAtIso = (failureCount: number) => {
  const exp = Math.min(MAX_RETRY_EXP, Math.max(0, failureCount));
  const minutes = BASE_RETRY_MINUTES * 2 ** exp;
  const date = new Date(Date.now() + minutes * 60 * 1000);
  return date.toISOString();
};

const normalizeProvider = (value: string): ProviderName => {
  if (value === 'stripe' || value === 'lemonsqueezy' || value === 'polar' || value === 'dodo' || value === 'revenuecat') {
    return value;
  }
  throw new Error(`Unsupported provider: ${value}`);
};

export const syncSingleConnection = async (connection: ConnectionRow) => {
  const supabase = await getSupabaseAdmin();

  try {
    const provider = normalizeProvider(connection.provider);
    const secret = decryptSecret(connection.encrypted_api_key);
    const adapter = getProviderAdapter(provider);

    const since = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000);
    const transactions = [] as any[];
    for await (const tx of adapter.fetchHistoricalTransactions(secret, since)) {
      transactions.push(tx);
    }

    const metrics = await adapter.computeMetrics(transactions);

    const now = new Date();
    const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    await supabase.from('revenue_snapshots').insert({
      asset_id: connection.asset_id,
      provider,
      period_start: periodStart.toISOString(),
      period_end: now.toISOString(),
      revenue_cents: metrics.last30d_revenue_cents,
      mrr_cents: metrics.mrr_cents,
      active_subscribers: metrics.active_subscribers,
      churn_bps: metrics.churn_bps,
    });

    await supabase
      .from('marketplace_assets')
      .update({
        verified_status: 'verified',
        last30d_revenue_cents: metrics.last30d_revenue_cents,
        last30d_growth_bps: metrics.last30d_growth_bps,
        mrr_cents: metrics.mrr_cents,
        metrics_updated_at: now.toISOString(),
      })
      .eq('id', connection.asset_id);

    await supabase
      .from('payment_connections')
      .update({
        status: 'active',
        failure_count: 0,
        next_retry_at: null,
        status_message: null,
        last_checked_at: now.toISOString(),
      })
      .eq('id', connection.id);

    await writeMarketplaceAuditLog({
      actorUserId: connection.owner_user_id,
      assetId: connection.asset_id,
      action: 'sync_metrics_success',
      metadata: {
        provider,
        last30d_revenue_cents: metrics.last30d_revenue_cents,
        mrr_cents: metrics.mrr_cents,
      },
    });

    return {
      ok: true as const,
      connectionId: connection.id,
      assetId: connection.asset_id,
      provider,
      metrics,
    };
  } catch (error) {
    const details = sanitizeErrorDetails(error);
    const nextFailureCount = (connection.failure_count ?? 0) + 1;
    const nextRetry = nextRetryAtIso(nextFailureCount);

    await supabase
      .from('payment_connections')
      .update({
        status: 'error',
        failure_count: nextFailureCount,
        status_message: details.slice(0, 300),
        next_retry_at: nextRetry,
        last_checked_at: new Date().toISOString(),
      })
      .eq('id', connection.id);

    if (nextFailureCount >= 3) {
      await supabase
        .from('marketplace_assets')
        .update({
          verified_status: 'error',
          metrics_updated_at: new Date().toISOString(),
        })
        .eq('id', connection.asset_id);
    }

    await writeMarketplaceAuditLog({
      actorUserId: connection.owner_user_id,
      assetId: connection.asset_id,
      action: 'sync_metrics_error',
      metadata: {
        provider: connection.provider,
        details: details.slice(0, 280),
        failure_count: nextFailureCount,
        next_retry_at: nextRetry,
      },
    });

    return {
      ok: false as const,
      connectionId: connection.id,
      assetId: connection.asset_id,
      error: details,
    };
  }
};

export const syncConnectionById = async (connectionId: string) => {
  const supabase = await getSupabaseAdmin();
  const { data, error } = await supabase
    .from('payment_connections')
    .select('*')
    .eq('id', connectionId)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error('Connection not found.');
  }

  return syncSingleConnection(data as ConnectionRow);
};

export const syncActiveConnections = async (limit = 30) => {
  const supabase = await getSupabaseAdmin();
  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from('payment_connections')
    .select('*')
    .in('status', ['active', 'error'])
    .or(`next_retry_at.is.null,next_retry_at.lte.${nowIso}`)
    .order('updated_at', { ascending: true })
    .limit(limit);

  if (error) {
    throw error;
  }

  const rows = Array.isArray(data) ? (data as ConnectionRow[]) : [];
  const results = [] as Array<Awaited<ReturnType<typeof syncSingleConnection>>>;

  for (const row of rows) {
    // Sequential sync reduces provider-side rate issues and keeps logs ordered.
    // eslint-disable-next-line no-await-in-loop
    const result = await syncSingleConnection(row);
    results.push(result);
  }

  return {
    attempted: rows.length,
    success: results.filter((item) => item.ok).length,
    failed: results.filter((item) => !item.ok).length,
    results,
  };
};
