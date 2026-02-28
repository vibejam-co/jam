import type { NormalizedTransaction, ProviderAdapter, ProviderMetrics } from './types.js';

const LEMONSQUEEZY_API_BASE = (process.env.LEMONSQUEEZY_API_BASE_URL?.trim() || 'https://api.lemonsqueezy.com')
  .replace(/\/+$/, '');

const emptyMetrics: ProviderMetrics = {
  last30d_revenue_cents: 0,
  mrr_cents: 0,
  last30d_growth_bps: 0,
  active_subscribers: 0,
  churn_bps: null,
};

type RequestOptions = {
  query?: Record<string, string | number | boolean | null | undefined>;
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

const asErrorMessage = (payload: unknown, status: number): string => {
  if (!payload || typeof payload !== 'object') {
    return `LemonSqueezy request failed (${status}).`;
  }

  const row = payload as { message?: unknown; error?: unknown; errors?: unknown };
  if (typeof row.message === 'string' && row.message.trim()) {
    return row.message.trim();
  }
  if (typeof row.error === 'string' && row.error.trim()) {
    return row.error.trim();
  }
  if (Array.isArray(row.errors) && row.errors.length > 0) {
    const first = row.errors[0];
    if (first && typeof first === 'object') {
      const detail = (first as any).detail;
      if (typeof detail === 'string' && detail.trim()) {
        return detail.trim();
      }
    }
  }
  return `LemonSqueezy request failed (${status}).`;
};

const lemonsqueezyRequest = async (
  key: string,
  path: string,
  options: RequestOptions = {},
): Promise<{ status: number; payload: any }> => {
  const url = new URL(`${LEMONSQUEEZY_API_BASE}${path}`);
  if (options.query) {
    for (const [queryKey, value] of Object.entries(options.query)) {
      if (value === null || value === undefined) {
        continue;
      }
      url.searchParams.set(queryKey, String(value));
    }
  }

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${key}`,
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
      },
    });
  } catch (error) {
    if (isNetworkError(error)) {
      throw new Error('Unable to reach LemonSqueezy right now. Please retry shortly.');
    }
    throw error;
  }

  const payload = await response.json().catch(() => null);
  return { status: response.status, payload };
};

const toIsoDate = (value: unknown): string => {
  if (typeof value === 'string' && value.trim()) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString();
    }
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    const date = new Date(value > 1_000_000_000_000 ? value : value * 1000);
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
    if (!normalized) {
      return 0;
    }
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

const normalizeOrder = (raw: unknown): NormalizedTransaction | null => {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const row = raw as Record<string, unknown>;
  const attributes =
    row.attributes && typeof row.attributes === 'object'
      ? (row.attributes as Record<string, unknown>)
      : row;

  const id =
    (typeof row.id === 'string' && row.id) ||
    (typeof attributes.identifier === 'string' && attributes.identifier) ||
    '';
  if (!id) {
    return null;
  }

  const status =
    (typeof attributes.status === 'string' && attributes.status.toLowerCase()) ||
    (typeof attributes.order_status === 'string' && attributes.order_status.toLowerCase()) ||
    '';
  if (status && !['paid', 'succeeded', 'completed', 'processed'].includes(status)) {
    return null;
  }

  const cents = Math.max(
    toCents(attributes.total),
    toCents(attributes.total_usd),
    toCents(attributes.subtotal),
    toCents(attributes.subtotal_usd),
    0,
  );
  if (cents <= 0) {
    return null;
  }

  const firstOrderItem =
    attributes.first_order_item && typeof attributes.first_order_item === 'object'
      ? (attributes.first_order_item as Record<string, unknown>)
      : null;
  const isSubscription =
    firstOrderItem?.is_subscription === true
    || String(firstOrderItem?.type ?? '').toLowerCase().includes('subscription')
    || String(attributes.billing_reason ?? '').toLowerCase().includes('subscription');

  const customerId =
    (typeof attributes.customer_id === 'string' && attributes.customer_id) ||
    (typeof attributes.user_email === 'string' && attributes.user_email) ||
    undefined;

  return {
    id,
    timestamp: toIsoDate(attributes.created_at ?? attributes.createdAt ?? attributes.updated_at),
    amount_cents: cents,
    currency: String(attributes.currency ?? attributes.currency_code ?? 'USD').toUpperCase(),
    type: isSubscription ? 'subscription' : 'one_time',
    customer_id: customerId,
    subscription_id:
      (typeof attributes.subscription_id === 'string' && attributes.subscription_id) ||
      (typeof firstOrderItem?.subscription_id === 'string' && firstOrderItem.subscription_id) ||
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

export const lemonsqueezyAdapter: ProviderAdapter = {
  provider: 'lemonsqueezy',

  async validateKey(key: string) {
    const trimmed = key.trim();
    if (!trimmed || trimmed.length < 12) {
      throw new Error('LemonSqueezy key format is invalid.');
    }

    const ping = await lemonsqueezyRequest(trimmed, '/v1/users/me');
    if (ping.status === 401 || ping.status === 403) {
      throw new Error('Invalid key or insufficient permissions.');
    }
    if (ping.status < 200 || ping.status >= 300) {
      throw new Error(asErrorMessage(ping.payload, ping.status));
    }

    return {
      readOnlyLikely: false,
      warning:
        'Use read-only scopes for Orders and Subscriptions in LemonSqueezy for least-privilege access.',
    };
  },

  async *fetchHistoricalTransactions(key: string, since: Date): AsyncGenerator<NormalizedTransaction> {
    const trimmed = key.trim();
    let page = 1;
    while (page <= 10) {
      const response = await lemonsqueezyRequest(trimmed, '/v1/orders', {
        query: {
          'page[number]': page,
          'page[size]': 100,
          sort: '-createdAt',
        },
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error('Invalid key or insufficient permissions.');
      }
      if (response.status < 200 || response.status >= 300) {
        break;
      }

      const list = Array.isArray(response.payload?.data) ? response.payload.data : [];
      if (list.length === 0) {
        break;
      }

      for (const row of list) {
        const normalized = normalizeOrder(row);
        if (!normalized) {
          continue;
        }
        if (new Date(normalized.timestamp).getTime() < since.getTime()) {
          continue;
        }
        yield normalized;
      }

      if (list.length < 100) {
        break;
      }
      page += 1;
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

