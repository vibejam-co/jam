import { listDodoPayments } from '../dodo-payments.js';
import type { NormalizedTransaction, ProviderAdapter, ProviderMetrics } from './types.js';

const DODO_API_BASE = (process.env.DODO_API_BASE_URL?.trim() || 'https://api.dodopayments.com')
  .replace(/\/+$/, '');

const toCents = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.round(value);
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return Math.round(parsed);
    }
  }
  return 0;
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

const toStatus = (payment: Record<string, unknown>): string => {
  const candidates = [payment.payment_status, payment.status, payment.state];
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim().toLowerCase();
    }
  }
  return '';
};

const isSucceeded = (status: string): boolean =>
  status === 'succeeded' || status === 'paid' || status === 'completed' || status === 'captured';

const normalizePayment = (raw: unknown): NormalizedTransaction | null => {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const payment = raw as Record<string, unknown>;
  const status = toStatus(payment);
  if (status && !isSucceeded(status)) {
    return null;
  }

  const paymentId =
    (typeof payment.payment_id === 'string' && payment.payment_id) ||
    (typeof payment.id === 'string' && payment.id) ||
    '';
  if (!paymentId) {
    return null;
  }

  const amountCandidates = [
    payment.total_amount,
    payment.amount,
    payment.captured_amount,
    payment.paid_amount,
  ];

  let amountCents = 0;
  for (const amount of amountCandidates) {
    amountCents = toCents(amount);
    if (amountCents > 0) {
      break;
    }
  }

  if (amountCents <= 0 && Array.isArray(payment.product_cart)) {
    amountCents = payment.product_cart
      .map((item) => (item && typeof item === 'object' ? (item as Record<string, unknown>) : null))
      .filter((item): item is Record<string, unknown> => Boolean(item))
      .reduce((sum, item) => sum + Math.max(0, toCents(item.total_amount ?? item.amount)), 0);
  }

  if (amountCents <= 0) {
    return null;
  }

  const currency =
    (typeof payment.currency === 'string' && payment.currency) ||
    (typeof payment.base_currency === 'string' && payment.base_currency) ||
    'USD';

  const customer =
    payment.customer && typeof payment.customer === 'object'
      ? (payment.customer as Record<string, unknown>)
      : null;

  const subscriptionId =
    (typeof payment.subscription_id === 'string' && payment.subscription_id) ||
    (typeof payment.plan_id === 'string' && payment.plan_id) ||
    undefined;

  let isSubscription = Boolean(subscriptionId);
  if (!isSubscription && Array.isArray(payment.product_cart)) {
    isSubscription = payment.product_cart.some((item) => {
      if (!item || typeof item !== 'object') {
        return false;
      }
      const row = item as Record<string, unknown>;
      const billingType = typeof row.billing_type === 'string' ? row.billing_type.toLowerCase() : '';
      const recurring = row.recurring === true;
      return recurring || billingType.includes('subscription') || billingType.includes('recurring');
    });
  }

  return {
    id: paymentId,
    timestamp: toIsoDate(
      payment.created_at ?? payment.createdAt ?? payment.paid_at ?? payment.updated_at ?? payment.timestamp,
    ),
    amount_cents: amountCents,
    currency: String(currency).toUpperCase(),
    type: isSubscription ? 'subscription' : 'one_time',
    customer_id:
      (customer && typeof customer.customer_id === 'string' && customer.customer_id) ||
      (customer && typeof customer.id === 'string' && customer.id) ||
      undefined,
    subscription_id: subscriptionId,
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

const isAuthError = (error: unknown): boolean => {
  if (!(error instanceof Error)) {
    return false;
  }
  const message = error.message.toLowerCase();
  return (
    message.includes('unauthorized') ||
    message.includes('forbidden') ||
    message.includes('invalid') ||
    message.includes('(401') ||
    message.includes('(403')
  );
};

const isTransientError = (error: unknown): boolean => {
  if (!(error instanceof Error)) {
    return false;
  }
  const message = error.message.toLowerCase();
  return (
    message.includes('unable to reach dodo api') ||
    message.includes('fetch failed') ||
    message.includes('network') ||
    message.includes('timed out') ||
    message.includes('socket')
  );
};

const dodoRequest = async (key: string, path: string): Promise<any> => {
  const url = new URL(`${DODO_API_BASE}${path}`);
  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${key}`,
      Accept: 'application/json',
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorMessage =
      (typeof payload?.message === 'string' && payload.message.trim()) ||
      (typeof payload?.error === 'string' && payload.error.trim()) ||
      `Dodo request failed (${response.status}).`;
    throw new Error(`${errorMessage} (HTTP ${response.status})`);
  }
  return payload;
};

const pingDodoReadOnlyKey = async (key: string): Promise<void> => {
  const probeErrors: unknown[] = [];

  try {
    await listDodoPayments(key, { limit: 1 });
    return;
  } catch (error) {
    probeErrors.push(error);
  }

  try {
    await dodoRequest(key, '/subscriptions?limit=1');
    return;
  } catch (error) {
    probeErrors.push(error);
  }

  const transientError = probeErrors.find((error) => isTransientError(error));
  if (transientError) {
    throw transientError;
  }

  const authError = probeErrors.find((error) => isAuthError(error));
  if (authError) {
    throw authError;
  }

  const lastError = probeErrors.length > 0 ? probeErrors[probeErrors.length - 1] : null;
  throw (lastError ?? new Error('Unable to validate Dodo key.'));
};

export const dodoAdapter: ProviderAdapter = {
  provider: 'dodo',

  async validateKey(key: string, options) {
    if (!key || key.trim().length < 12) {
      throw new Error('Dodo key format is invalid.');
    }
    const providerAccountId = String(options?.providerAccountId ?? '').trim();
    if (!providerAccountId) {
      throw new Error('Dodo Store ID is required.');
    }

    try {
      await pingDodoReadOnlyKey(key.trim());
      return {
        readOnlyLikely: true,
        providerAccountId,
      };
    } catch (error) {
      if (isAuthError(error)) {
        throw new Error(
          'Dodo key was rejected or lacks read scope for payments/subscriptions. Please confirm key permissions.',
        );
      }

      if (isTransientError(error)) {
        return {
          readOnlyLikely: false,
          warning:
            'Dodo validation is queued. Key saved; verification will retry in background.',
          providerAccountId,
        };
      }

      return {
        readOnlyLikely: false,
        warning:
          'Dodo validation is currently limited. Key saved; verification sync will continue in background.',
        providerAccountId,
      };
    }
  },

  async *fetchHistoricalTransactions(key: string, since: Date): AsyncGenerator<NormalizedTransaction> {
    let cursor: string | undefined;
    let pages = 0;

    while (pages < 20) {
      pages += 1;

      const { items, nextCursor } = await listDodoPayments(key, {
        limit: 100,
        cursor,
      });

      for (const raw of items) {
        const normalized = normalizePayment(raw);
        if (!normalized) {
          continue;
        }

        const timestamp = new Date(normalized.timestamp).getTime();
        if (timestamp < since.getTime()) {
          continue;
        }

        yield normalized;
      }

      if (!nextCursor) {
        break;
      }
      cursor = nextCursor;
    }
  },

  async computeMetrics(transactions): Promise<ProviderMetrics> {
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
