import type { NormalizedTransaction, ProviderAdapter, ProviderMetrics } from './types.js';

const STRIPE_API_BASE = 'https://api.stripe.com/v1';
const DAY_MS = 24 * 60 * 60 * 1000;
const THIRTY_DAYS_MS = 30 * DAY_MS;
const SIXTY_DAYS_MS = 60 * DAY_MS;

const stripeRequest = async (path: string, apiKey: string, query?: Record<string, string | number>) => {
  const url = new URL(`${STRIPE_API_BASE}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const details = (body?.error?.message as string | undefined) || `Stripe request failed (${response.status})`;
    throw new Error(details);
  }

  return body;
};

const toInteger = (value: unknown): number => {
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

const toIsoFromUnix = (value: unknown, fallbackMs: number): string => {
  const unix = toInteger(value);
  if (unix > 0) {
    return new Date(unix * 1000).toISOString();
  }
  return new Date(fallbackMs).toISOString();
};

const isRevenueTx = (tx: NormalizedTransaction): boolean => {
  if (tx.amount_cents <= 0) {
    return false;
  }
  const kind = String((tx as any)?.meta?.kind ?? 'revenue').toLowerCase();
  return kind === 'revenue';
};

const computeGrowthBps = (transactions: NormalizedTransaction[]): number => {
  const now = Date.now();
  const startRecent = now - THIRTY_DAYS_MS;
  const startPrevious = now - SIXTY_DAYS_MS;

  const recent = transactions
    .filter((tx) => {
      const ts = new Date(tx.timestamp).getTime();
      return ts >= startRecent && ts < now && isRevenueTx(tx);
    })
    .reduce((sum, tx) => sum + tx.amount_cents, 0);

  const previous = transactions
    .filter((tx) => {
      const ts = new Date(tx.timestamp).getTime();
      return ts >= startPrevious && ts < startRecent && isRevenueTx(tx);
    })
    .reduce((sum, tx) => sum + tx.amount_cents, 0);

  if (previous <= 0) {
    return recent > 0 ? 10_000 : 0;
  }

  return Math.round(((recent - previous) / previous) * 10_000);
};

const toMonthlyEquivalentCents = (amountCents: number, interval: string, intervalCount: number): number => {
  if (amountCents <= 0) {
    return 0;
  }
  const normalizedCount = Math.max(1, intervalCount);
  if (interval === 'month') {
    return Math.round(amountCents / normalizedCount);
  }
  if (interval === 'year') {
    return Math.round(amountCents / (12 * normalizedCount));
  }
  if (interval === 'week') {
    return Math.round((amountCents * 52) / (12 * normalizedCount));
  }
  if (interval === 'day') {
    return Math.round((amountCents * 30) / normalizedCount);
  }
  return Math.round(amountCents / normalizedCount);
};

const computeSubscriptionMonthlyAmountCents = (subscription: any): number => {
  const items = Array.isArray(subscription?.items?.data) ? subscription.items.data : [];
  let total = 0;

  for (const item of items) {
    const quantity = Math.max(1, toInteger(item?.quantity) || 1);
    const price = item?.price ?? item?.plan ?? {};
    const recurring = price?.recurring ?? item?.plan ?? {};
    const interval = String(recurring?.interval ?? '').toLowerCase();
    const intervalCount = Math.max(1, toInteger(recurring?.interval_count) || 1);

    const unitAmountCents =
      toInteger(price?.unit_amount) ||
      toInteger(price?.amount) ||
      toInteger(price?.unit_amount_decimal);
    const lineAmountCents = Math.max(0, unitAmountCents) * quantity;
    total += toMonthlyEquivalentCents(lineAmountCents, interval, intervalCount);
  }

  return Math.max(0, total);
};

const paginateStripeList = async (
  path: string,
  apiKey: string,
  baseQuery: Record<string, string | number>,
  maxPages = 120,
) => {
  const rows: any[] = [];
  let startingAfter: string | null = null;
  let hasMore = true;
  let pages = 0;

  while (hasMore && pages < maxPages) {
    pages += 1;
    const query: Record<string, string | number> = {
      ...baseQuery,
      limit: 100,
    };
    if (startingAfter) {
      query.starting_after = startingAfter;
    }

    const payload = await stripeRequest(path, apiKey, query);
    const pageRows = Array.isArray(payload?.data) ? payload.data : [];
    rows.push(...pageRows);

    hasMore = Boolean(payload?.has_more) && pageRows.length > 0;
    if (!hasMore) {
      break;
    }

    const next = String(pageRows[pageRows.length - 1]?.id ?? '').trim();
    if (!next) {
      break;
    }
    startingAfter = next;
  }

  return rows;
};

const buildRevenueTransactions = async (apiKey: string, createdGteUnix: number): Promise<NormalizedTransaction[]> => {
  const [invoices, charges] = await Promise.all([
    paginateStripeList('/invoices', apiKey, {
      status: 'paid',
      'created[gte]': createdGteUnix,
    }),
    paginateStripeList('/charges', apiKey, {
      status: 'succeeded',
      'created[gte]': createdGteUnix,
    }),
  ]);

  const transactions: NormalizedTransaction[] = [];

  for (const invoice of invoices) {
    const amountPaid = Math.max(0, toInteger(invoice?.amount_paid));
    const amountRefunded = Math.max(0, toInteger(invoice?.amount_refunded));
    const creditNotes = Math.max(0, toInteger(invoice?.post_payment_credit_notes_amount));
    const netAmountCents = Math.max(0, amountPaid - amountRefunded - creditNotes);
    if (netAmountCents <= 0) {
      continue;
    }

    const paidAtUnix = toInteger(invoice?.status_transitions?.paid_at) || toInteger(invoice?.created);
    const billingReason = String(invoice?.billing_reason ?? '').toLowerCase();
    const kind = billingReason.includes('subscription') ? 'subscription' : 'one_time';

    transactions.push({
      id: String(invoice?.id ?? `stripe_invoice_${paidAtUnix}`),
      timestamp: toIsoFromUnix(paidAtUnix, Date.now()),
      amount_cents: netAmountCents,
      currency: String(invoice?.currency ?? 'usd').toUpperCase(),
      type: kind,
      customer_id: typeof invoice?.customer === 'string' ? invoice.customer : undefined,
      subscription_id: typeof invoice?.subscription === 'string' ? invoice.subscription : undefined,
      meta: { kind: 'revenue', source: 'invoice' },
    } as NormalizedTransaction);
  }

  for (const charge of charges) {
    // Invoice-backed charges are already represented via invoice revenue.
    if (charge?.invoice) {
      continue;
    }

    const amount = Math.max(0, toInteger(charge?.amount));
    const refunded = Math.max(0, toInteger(charge?.amount_refunded));
    const netAmountCents = Math.max(0, amount - refunded);
    if (netAmountCents <= 0) {
      continue;
    }

    const createdUnix = toInteger(charge?.created);
    transactions.push({
      id: String(charge?.id ?? `stripe_charge_${createdUnix}`),
      timestamp: toIsoFromUnix(createdUnix, Date.now()),
      amount_cents: netAmountCents,
      currency: String(charge?.currency ?? 'usd').toUpperCase(),
      type: 'one_time',
      customer_id: typeof charge?.customer === 'string' ? charge.customer : undefined,
      subscription_id: undefined,
      meta: { kind: 'revenue', source: 'charge' },
    } as NormalizedTransaction);
  }

  return transactions;
};

const buildSubscriptionStateTransactions = async (apiKey: string): Promise<NormalizedTransaction[]> => {
  const nowMs = Date.now();
  const canceledSinceUnix = Math.floor((nowMs - THIRTY_DAYS_MS) / 1000);

  const [activeRows, pastDueRows, canceledRows] = await Promise.all([
    paginateStripeList('/subscriptions', apiKey, { status: 'active' }),
    paginateStripeList('/subscriptions', apiKey, { status: 'past_due' }),
    paginateStripeList('/subscriptions', apiKey, { status: 'canceled' }),
  ]);

  const transactions: NormalizedTransaction[] = [];
  const activeLike = [...activeRows, ...pastDueRows];

  for (const subscription of activeLike) {
    const monthlyAmountCents = computeSubscriptionMonthlyAmountCents(subscription);
    const createdUnix = toInteger(subscription?.created) || Math.floor(nowMs / 1000);

    transactions.push({
      id: `stripe_sub_mrr_${String(subscription?.id ?? createdUnix)}`,
      timestamp: toIsoFromUnix(createdUnix, nowMs),
      amount_cents: monthlyAmountCents,
      currency: 'USD',
      type: 'subscription',
      customer_id: typeof subscription?.customer === 'string' ? subscription.customer : undefined,
      subscription_id: typeof subscription?.id === 'string' ? subscription.id : undefined,
      meta: {
        kind: 'subscription_mrr',
        status: String(subscription?.status ?? ''),
      },
    } as NormalizedTransaction);
  }

  for (const subscription of canceledRows) {
    const canceledAtUnix = toInteger(subscription?.canceled_at);
    if (!canceledAtUnix || canceledAtUnix < canceledSinceUnix) {
      continue;
    }

    transactions.push({
      id: `stripe_sub_canceled_${String(subscription?.id ?? canceledAtUnix)}`,
      timestamp: toIsoFromUnix(canceledAtUnix, nowMs),
      amount_cents: 0,
      currency: 'USD',
      type: 'subscription',
      customer_id: typeof subscription?.customer === 'string' ? subscription.customer : undefined,
      subscription_id: typeof subscription?.id === 'string' ? subscription.id : undefined,
      meta: {
        kind: 'subscription_canceled',
        canceled_at_unix: canceledAtUnix,
      },
    } as NormalizedTransaction);
  }

  return transactions;
};

const computeChurnRateBps = (transactions: NormalizedTransaction[]): number => {
  const activeCustomers = new Set<string>();
  const canceledCustomers = new Set<string>();

  for (const tx of transactions) {
    const kind = String((tx as any)?.meta?.kind ?? '').toLowerCase();
    if (kind === 'subscription_mrr' && tx.customer_id) {
      activeCustomers.add(tx.customer_id);
    } else if (kind === 'subscription_canceled' && tx.customer_id) {
      canceledCustomers.add(tx.customer_id);
    }
  }

  if (activeCustomers.size <= 0) {
    return 0;
  }

  return Math.max(0, Math.round((canceledCustomers.size / activeCustomers.size) * 10_000));
};

export const stripeAdapter: ProviderAdapter = {
  provider: 'stripe',

  async validateKey(key: string, _options) {
    if (!key.startsWith('rk_live_')) {
      throw new Error('Stripe key must be a live restricted key (rk_live_...).');
    }

    const [account, _balance] = await Promise.all([
      stripeRequest('/account', key),
      stripeRequest('/balance', key),
    ]);
    const accountId = String(account?.id ?? '').trim();
    if (!accountId) {
      throw new Error('Stripe account id could not be resolved from this key.');
    }

    return {
      readOnlyLikely: true,
      providerAccountId: accountId,
    };
  },

  async *fetchHistoricalTransactions(key: string, since: Date) {
    const nowMs = Date.now();
    const extendedWindowStartMs = Math.min(since.getTime(), nowMs - SIXTY_DAYS_MS);
    const createdGteUnix = Math.floor(extendedWindowStartMs / 1000);

    const [revenueTransactions, subscriptionStateTransactions] = await Promise.all([
      buildRevenueTransactions(key, createdGteUnix),
      buildSubscriptionStateTransactions(key),
    ]);

    for (const tx of [...revenueTransactions, ...subscriptionStateTransactions]) {
      yield tx;
    }
  },

  async computeMetrics(transactions): Promise<ProviderMetrics> {
    const now = Date.now();
    const startRecent = now - THIRTY_DAYS_MS;
    const revenueTransactions = transactions.filter((tx) => isRevenueTx(tx));
    const last30dRevenue = revenueTransactions
      .filter((tx) => {
        const ts = new Date(tx.timestamp).getTime();
        return ts >= startRecent && ts < now;
      })
      .reduce((sum, tx) => sum + tx.amount_cents, 0);

    const activeSubscribers = new Set<string>(
      transactions
        .filter((tx) => {
          const kind = String((tx as any)?.meta?.kind ?? '').toLowerCase();
          return kind === 'subscription_mrr' && tx.amount_cents > 0;
        })
        .map((tx) => tx.customer_id)
        .filter((value): value is string => Boolean(value)),
    ).size;

    const mrrCents = transactions
      .filter((tx) => String((tx as any)?.meta?.kind ?? '').toLowerCase() === 'subscription_mrr')
      .reduce((sum, tx) => sum + Math.max(0, tx.amount_cents), 0);

    const churnRateBps = computeChurnRateBps(transactions);

    return {
      last30d_revenue_cents: Math.max(0, Math.round(last30dRevenue)),
      mrr_cents: Math.max(0, Math.round(mrrCents)),
      last30d_growth_bps: computeGrowthBps(transactions),
      active_subscribers: activeSubscribers,
      // churn_rate_bps mapped to existing revenue_snapshots.churn_bps column.
      churn_bps: churnRateBps,
    };
  },
};
