import type { NormalizedTransaction, ProviderAdapter, ProviderMetrics } from './types.js';

const POLAR_API_BASE = (process.env.POLAR_API_BASE_URL?.trim() || 'https://api.polar.sh')
  .replace(/\/+$/, '');

const emptyMetrics: ProviderMetrics = {
  last30d_revenue_cents: 0,
  mrr_cents: 0,
  last30d_growth_bps: 0,
  active_subscribers: 0,
  churn_bps: null,
};

const isNetworkError = (error: unknown): boolean => {
  if (!(error instanceof Error)) {
    return false;
  }
  const message = error.message.toLowerCase();
  return (
    message.includes('fetch failed') ||
    message.includes('network') ||
    message.includes('econnreset') ||
    message.includes('etimedout') ||
    message.includes('enotfound') ||
    message.includes('eai_again') ||
    message.includes('socket')
  );
};

const toIsoDate = (value: unknown): string => {
  if (typeof value === 'string' && value.trim()) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString();
    }
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    const millis = value > 1_000_000_000_000 ? value : value * 1000;
    const date = new Date(millis);
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString();
    }
  }
  return new Date().toISOString();
};

const toCents = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    if (!Number.isInteger(value)) {
      return Math.round(value * 100);
    }
    return Math.round(value);
  }
  if (typeof value === 'string' && value.trim()) {
    const normalized = value.trim().replace(/[$,\s]/g, '');
    const parsed = Number(normalized);
    if (!Number.isFinite(parsed)) {
      return 0;
    }
    if (normalized.includes('.')) {
      return Math.round(parsed * 100);
    }
    return Math.round(parsed);
  }
  return 0;
};

const polarRequest = async (
  key: string,
  path: string,
  query?: Record<string, string | number | boolean | null | undefined>,
): Promise<{ status: number; payload: any }> => {
  const url = new URL(`${POLAR_API_BASE}${path}`);
  if (query) {
    for (const [k, value] of Object.entries(query)) {
      if (value === undefined || value === null) {
        continue;
      }
      url.searchParams.set(k, String(value));
    }
  }

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${key}`,
        Accept: 'application/json',
      },
    });
  } catch (error) {
    if (isNetworkError(error)) {
      throw new Error('Unable to reach Polar right now. Please retry shortly.');
    }
    throw error;
  }

  const payload = await response.json().catch(() => null);
  return { status: response.status, payload };
};

const extractItems = (payload: any): unknown[] => {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (Array.isArray(payload?.items)) {
    return payload.items;
  }
  if (Array.isArray(payload?.data)) {
    return payload.data;
  }
  if (Array.isArray(payload?.result?.items)) {
    return payload.result.items;
  }
  return [];
};

const normalizeOrder = (raw: unknown): NormalizedTransaction | null => {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const row = raw as Record<string, unknown>;
  const id =
    (typeof row.id === 'string' && row.id) ||
    (typeof row.order_id === 'string' && row.order_id) ||
    '';
  if (!id) {
    return null;
  }

  const status =
    (typeof row.status === 'string' && row.status.toLowerCase()) ||
    (typeof row.state === 'string' && row.state.toLowerCase()) ||
    '';
  if (status && !['paid', 'succeeded', 'completed', 'settled', 'active'].includes(status)) {
    return null;
  }

  const amountCents = Math.max(
    toCents(row.amount),
    toCents(row.amount_cents),
    toCents(row.total),
    toCents(row.total_amount),
    0,
  );
  if (amountCents <= 0) {
    return null;
  }

  const customer =
    row.customer && typeof row.customer === 'object'
      ? (row.customer as Record<string, unknown>)
      : null;

  const isSubscription =
    row.recurring === true
    || String(row.type ?? '').toLowerCase().includes('subscription')
    || String(row.billing_type ?? '').toLowerCase().includes('subscription');

  return {
    id,
    timestamp: toIsoDate(row.created_at ?? row.createdAt ?? row.paid_at ?? row.updated_at),
    amount_cents: amountCents,
    currency: String(row.currency ?? row.currency_code ?? 'USD').toUpperCase(),
    type: isSubscription ? 'subscription' : 'one_time',
    customer_id:
      (typeof row.customer_id === 'string' && row.customer_id) ||
      (typeof customer?.id === 'string' && customer.id) ||
      (typeof customer?.email === 'string' && customer.email) ||
      undefined,
    subscription_id:
      (typeof row.subscription_id === 'string' && row.subscription_id) ||
      undefined,
  };
};

const computeGrowthBps = (transactions: NormalizedTransaction[]): number => {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const currentStart = now - 30 * dayMs;
  const previousStart = now - 60 * dayMs;

  const currentRevenue = transactions
    .filter((tx) => {
      const ts = new Date(tx.timestamp).getTime();
      return ts >= currentStart && ts < now && tx.amount_cents > 0;
    })
    .reduce((sum, tx) => sum + tx.amount_cents, 0);

  const previousRevenue = transactions
    .filter((tx) => {
      const ts = new Date(tx.timestamp).getTime();
      return ts >= previousStart && ts < currentStart && tx.amount_cents > 0;
    })
    .reduce((sum, tx) => sum + tx.amount_cents, 0);

  if (previousRevenue <= 0) {
    return currentRevenue > 0 ? 10_000 : 0;
  }

  return Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 10_000);
};

export const polarAdapter: ProviderAdapter = {
  provider: 'polar',

  async validateKey(key: string) {
    const trimmed = key.trim();
    if (!trimmed || trimmed.length < 12) {
      throw new Error('Polar key format is invalid.');
    }

    const ping = await polarRequest(trimmed, '/v1/orders', { limit: 1 });
    if (ping.status === 401 || ping.status === 403) {
      throw new Error('Invalid key or insufficient permissions.');
    }
    if (ping.status < 200 || ping.status >= 300) {
      throw new Error(`Polar validation failed (${ping.status}).`);
    }

    return {
      readOnlyLikely: false,
      warning:
        'Use least-privilege read scopes in Polar (subscriptions/orders metrics only).',
    };
  },

  async *fetchHistoricalTransactions(key: string, since: Date): AsyncGenerator<NormalizedTransaction> {
    const trimmed = key.trim();
    let cursor: string | undefined;
    let pages = 0;

    while (pages < 10) {
      pages += 1;
      const response = await polarRequest(trimmed, '/v1/orders', {
        limit: 100,
        cursor,
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error('Invalid key or insufficient permissions.');
      }
      if (response.status < 200 || response.status >= 300) {
        break;
      }

      const items = extractItems(response.payload);
      if (items.length === 0) {
        break;
      }

      for (const item of items) {
        const normalized = normalizeOrder(item);
        if (!normalized) {
          continue;
        }
        if (new Date(normalized.timestamp).getTime() < since.getTime()) {
          continue;
        }
        yield normalized;
      }

      const nextCursor =
        (typeof response.payload?.next_cursor === 'string' && response.payload.next_cursor) ||
        (typeof response.payload?.nextCursor === 'string' && response.payload.nextCursor) ||
        (typeof response.payload?.pagination?.next_cursor === 'string' && response.payload.pagination.next_cursor) ||
        null;

      if (!nextCursor) {
        break;
      }
      cursor = nextCursor;
    }
  },

  async computeMetrics(transactions): Promise<ProviderMetrics> {
    if (!Array.isArray(transactions) || transactions.length === 0) {
      return emptyMetrics;
    }

    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const startRecent = now - 30 * dayMs;

    const last30 = transactions.filter((tx) => {
      const ts = new Date(tx.timestamp).getTime();
      return ts >= startRecent && ts < now && tx.amount_cents > 0;
    });

    const last30dRevenue = last30.reduce((sum, tx) => sum + tx.amount_cents, 0);
    const mrr = last30
      .filter((tx) => tx.type === 'subscription')
      .reduce((sum, tx) => sum + tx.amount_cents, 0);

    const activeSubscribers = new Set(
      last30
        .filter((tx) => tx.type === 'subscription')
        .map((tx) => tx.customer_id)
        .filter((id): id is string => Boolean(id)),
    ).size;

    return {
      last30d_revenue_cents: Math.max(0, Math.round(last30dRevenue)),
      mrr_cents: Math.max(0, Math.round(mrr)),
      last30d_growth_bps: computeGrowthBps(transactions),
      active_subscribers: activeSubscribers,
      churn_bps: null,
    };
  },
};

