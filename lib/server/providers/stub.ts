import type { NormalizedTransaction, ProviderAdapter, ProviderMetrics, ProviderName } from './types.js';

const emptyMetrics: ProviderMetrics = {
  last30d_revenue_cents: 0,
  mrr_cents: 0,
  last30d_growth_bps: 0,
  active_subscribers: 0,
  churn_bps: null,
};

const validateFormat = (provider: ProviderName, key: string) => {
  if (!key || key.length < 8) {
    throw new Error(`${provider} key format is invalid.`);
  }
};

export const buildStubAdapter = (provider: ProviderName): ProviderAdapter => ({
  provider,

  async validateKey(key: string, _options) {
    validateFormat(provider, key);
    return {
      readOnlyLikely: false,
      warning: `${provider} live validation is in beta. Key saved; verification sync will run after adapter expansion.`,
    };
  },

  async *fetchHistoricalTransactions(_key: string, _since: Date): AsyncGenerator<NormalizedTransaction> {
    // Intentionally empty until provider adapter is implemented.
  },

  async computeMetrics(_transactions: NormalizedTransaction[]): Promise<ProviderMetrics> {
    return emptyMetrics;
  },
});
