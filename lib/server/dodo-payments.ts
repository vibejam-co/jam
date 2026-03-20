const DODO_DEFAULT_API_BASE = 'https://api.dodopayments.com';

export type DodoCheckoutPaymentStatus =
  | 'succeeded'
  | 'failed'
  | 'cancelled'
  | 'processing'
  | 'requires_customer_action'
  | 'requires_merchant_action'
  | 'requires_payment_method'
  | 'requires_confirmation'
  | 'requires_capture'
  | 'partially_captured'
  | 'partially_captured_and_capturable'
  | null;

type DodoRequestInit = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  query?: Record<string, string | number | boolean | null | undefined>;
  body?: unknown;
};

const getDodoApiBase = (): string => {
  const fromEnv = process.env.DODO_API_BASE_URL?.trim();
  if (!fromEnv) {
    return DODO_DEFAULT_API_BASE;
  }
  const normalized = fromEnv.replace(/\/+$/, '');
  try {
    return new URL(normalized).toString().replace(/\/+$/, '');
  } catch {
    return DODO_DEFAULT_API_BASE;
  }
};

const getErrorMessage = (payload: unknown, status: number): string => {
  if (!payload || typeof payload !== 'object') {
    return `Dodo request failed (${status}).`;
  }

  const candidate = payload as {
    error?: unknown;
    message?: unknown;
    detail?: unknown;
    details?: unknown;
  };

  if (typeof candidate.error === 'string' && candidate.error.trim()) {
    return candidate.error.trim();
  }
  if (typeof candidate.message === 'string' && candidate.message.trim()) {
    return candidate.message.trim();
  }
  if (typeof candidate.detail === 'string' && candidate.detail.trim()) {
    return candidate.detail.trim();
  }
  if (typeof candidate.details === 'string' && candidate.details.trim()) {
    return candidate.details.trim();
  }

  return `Dodo request failed (${status}).`;
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
    message.includes('socket hang up')
  );
};

const dodoRequest = async <T>(
  apiKey: string,
  path: string,
  init: DodoRequestInit = {},
): Promise<T> => {
  if (!apiKey?.trim()) {
    throw new Error('Missing Dodo API key.');
  }

  const url = new URL(`${getDodoApiBase()}${path}`);
  if (init.query) {
    for (const [key, value] of Object.entries(init.query)) {
      if (value === null || value === undefined) {
        continue;
      }
      url.searchParams.set(key, String(value));
    }
  }

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      method: init.method ?? 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
  } catch (error) {
    if (isNetworkError(error)) {
      throw new Error('Unable to reach Dodo API right now. Please retry in a moment.');
    }
    throw error;
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(getErrorMessage(payload, response.status));
  }

  return (payload ?? {}) as T;
};

export type DodoCheckoutCreateResponse = {
  session_id: string;
  checkout_url: string;
};

export type DodoCheckoutStatusResponse = {
  id: string;
  payment_id: string | null;
  payment_status: DodoCheckoutPaymentStatus;
  customer_email?: string | null;
  customer_name?: string | null;
};

export const createDodoCheckoutSession = async (
  apiKey: string,
  input: {
    productId: string;
    quantity?: number;
    returnUrl?: string;
    customer?: { email?: string; name?: string };
    metadata?: Record<string, string>;
  },
): Promise<DodoCheckoutCreateResponse> => {
  const body: Record<string, unknown> = {
    product_cart: [
      {
        product_id: input.productId,
        quantity: Math.max(1, Math.floor(input.quantity ?? 1)),
      },
    ],
    metadata: input.metadata ?? {},
    short_link: false,
  };

  if (input.returnUrl) {
    body.return_url = input.returnUrl;
  }

  if (input.customer && (input.customer.email || input.customer.name)) {
    body.customer = {
      email: input.customer.email,
      name: input.customer.name,
    };
  }

  const response = await dodoRequest<DodoCheckoutCreateResponse>(apiKey, '/checkouts', {
    method: 'POST',
    body,
  });

  if (!response?.session_id || !response?.checkout_url) {
    throw new Error('Dodo checkout session response was incomplete.');
  }

  return response;
};

export const getDodoCheckoutSession = async (
  apiKey: string,
  checkoutSessionId: string,
): Promise<DodoCheckoutStatusResponse> => {
  if (!checkoutSessionId?.trim()) {
    throw new Error('Missing checkout session id.');
  }

  return dodoRequest<DodoCheckoutStatusResponse>(
    apiKey,
    `/checkouts/${encodeURIComponent(checkoutSessionId.trim())}`,
    { method: 'GET' },
  );
};

type DodoListPaymentsResponse = {
  items?: unknown[];
  data?: unknown[];
  payments?: unknown[];
  next_cursor?: string | null;
  nextCursor?: string | null;
};

export const listDodoPayments = async (
  apiKey: string,
  input: { limit?: number; cursor?: string; status?: string },
): Promise<{ items: unknown[]; nextCursor: string | null }> => {
  const response = await dodoRequest<DodoListPaymentsResponse>(apiKey, '/payments', {
    method: 'GET',
    query: {
      limit: input.limit ?? 100,
      cursor: input.cursor,
      status: input.status,
    },
  });

  const items = Array.isArray(response?.items)
    ? response.items
    : Array.isArray(response?.data)
      ? response.data
      : Array.isArray(response?.payments)
        ? response.payments
        : [];

  return {
    items,
    nextCursor:
      (typeof response?.next_cursor === 'string' && response.next_cursor) ||
      (typeof response?.nextCursor === 'string' && response.nextCursor) ||
      null,
  };
};
