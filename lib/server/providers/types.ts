export type ProviderName = 'stripe' | 'lemonsqueezy' | 'polar' | 'dodo' | 'revenuecat';

export type NormalizedTransaction = {
  id: string;
  timestamp: string;
  amount_cents: number;
  currency: string;
  type: 'subscription' | 'one_time';
  customer_id?: string;
  subscription_id?: string;
};

export type ProviderMetrics = {
  last30d_revenue_cents: number;
  mrr_cents: number;
  last30d_growth_bps: number;
  active_subscribers: number;
  churn_bps: number | null;
};

export type ProviderValidationResult = {
  readOnlyLikely: boolean;
  warning?: string;
  providerAccountId?: string | null;
};

export type ProviderValidateOptions = {
  providerAccountId?: string | null;
};

export interface ProviderAdapter {
  provider: ProviderName;
  validateKey(key: string, options?: ProviderValidateOptions): Promise<ProviderValidationResult>;
  fetchHistoricalTransactions(key: string, since: Date): AsyncGenerator<NormalizedTransaction>;
  computeMetrics(transactions: NormalizedTransaction[]): Promise<ProviderMetrics> | ProviderMetrics;
}
