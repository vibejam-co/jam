import { stripeAdapter } from './stripe.js';
import type { ProviderAdapter, ProviderName } from './types.js';
import { dodoAdapter } from './dodo.js';
import { lemonsqueezyAdapter } from './lemonsqueezy.js';
import { polarAdapter } from './polar.js';
import { revenueCatAdapter } from './revenuecat.js';

const adapters: Record<ProviderName, ProviderAdapter> = {
  stripe: stripeAdapter,
  lemonsqueezy: lemonsqueezyAdapter,
  polar: polarAdapter,
  dodo: dodoAdapter,
  revenuecat: revenueCatAdapter,
};

export const getProviderAdapter = (provider: ProviderName): ProviderAdapter => {
  const adapter = adapters[provider];
  if (!adapter) {
    throw new Error(`Unsupported provider: ${provider}`);
  }
  return adapter;
};
