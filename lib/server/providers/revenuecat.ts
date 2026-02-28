import type { NormalizedTransaction, ProviderAdapter, ProviderMetrics } from './types.js';

const REVENUECAT_API_BASE = (process.env.REVENUECAT_API_BASE_URL?.trim() || 'https://api.revenuecat.com')
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

const revenueCatRequest = async (
  key: string,
  path: string,
): Promise<{ status: number; payload: any }> => {
  const url = new URL(`${REVENUECAT_API_BASE}${path}`);

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
      throw new Error('Unable to reach RevenueCat right now. Please retry shortly.');
    }
    throw error;
  }

  const payload = await response.json().catch(() => null);
  return { status: response.status, payload };
};

const parseProjects = (payload: any): unknown[] => {
  if (Array.isArray(payload?.items)) {
    return payload.items;
  }
  if (Array.isArray(payload?.data?.items)) {
    return payload.data.items;
  }
  if (Array.isArray(payload?.data)) {
    return payload.data;
  }
  return [];
};

export const revenueCatAdapter: ProviderAdapter = {
  provider: 'revenuecat',

  async validateKey(key: string) {
    const trimmed = key.trim();
    if (!trimmed.startsWith('sk_')) {
      throw new Error('RevenueCat key must start with sk_.');
    }

    const ping = await revenueCatRequest(trimmed, '/v2/projects');
    if (ping.status === 401 || ping.status === 403) {
      throw new Error('Invalid key or insufficient permissions.');
    }
    if (ping.status < 200 || ping.status >= 300) {
      throw new Error(`RevenueCat validation failed (${ping.status}).`);
    }

    return {
      readOnlyLikely: true,
      warning:
        'RevenueCat is read-focused for subscription state. Payment collection remains in app stores.',
    };
  },

  async *fetchHistoricalTransactions(key: string, since: Date): AsyncGenerator<NormalizedTransaction> {
    void since;
    const ping = await revenueCatRequest(key.trim(), '/v2/projects');
    if (ping.status === 401 || ping.status === 403) {
      throw new Error('Invalid key or insufficient permissions.');
    }
    if (ping.status < 200 || ping.status >= 300) {
      return;
    }

    // RevenueCat currently runs in connection-health mode in this adapter.
    // Ping success confirms credentials and read access; metrics extraction
    // can be expanded as project-level subscriber endpoints are finalized.
    void parseProjects(ping.payload);
  },

  async computeMetrics(transactions): Promise<ProviderMetrics> {
    void transactions;
    return {
      ...emptyMetrics,
    };
  },
};
