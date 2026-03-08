export type EscrowConfig = {
  email: string;
  apiKey: string;
  baseUrl: string;
  authHeader: string;
};

const trimEnv = (value: unknown): string => String(value ?? '').trim();

const ESCROW_PRODUCTION_URL = 'https://api.escrow.com/2017-09-01';
const ESCROW_SANDBOX_URL = 'https://api.escrow-sandbox.com/2017-09-01';
const ESCROW_WEB_PRODUCTION_URL = 'https://www.escrow.com';
const ESCROW_WEB_SANDBOX_URL = 'https://www.escrow-sandbox.com';
const DEFAULT_INSPECTION_PERIOD_SECONDS = 3 * 24 * 60 * 60;

const normalizeBaseUrl = (value: string): string => value.replace(/\/+$/, '');

const resolveEscrowBaseUrl = (): string => {
  const explicitBaseUrl = normalizeBaseUrl(trimEnv(process.env.ESCROW_BASE_URL));
  if (explicitBaseUrl) {
    return explicitBaseUrl;
  }

  const escrowEnv = trimEnv(process.env.ESCROW_ENV).toLowerCase();
  if (escrowEnv === 'sandbox' || escrowEnv === 'test') {
    return ESCROW_SANDBOX_URL;
  }
  if (escrowEnv === 'production' || escrowEnv === 'live') {
    return ESCROW_PRODUCTION_URL;
  }

  return process.env.NODE_ENV === 'production' ? ESCROW_PRODUCTION_URL : ESCROW_SANDBOX_URL;
};

export const ESCROW_BASE_URL = resolveEscrowBaseUrl();

const resolveEscrowWebAppBaseUrl = (): string => {
  if (ESCROW_BASE_URL.includes('escrow-sandbox.com')) {
    return ESCROW_WEB_SANDBOX_URL;
  }
  return ESCROW_WEB_PRODUCTION_URL;
};

const getEscrowAuthHeader = (email: string, apiKey: string): string =>
  `Basic ${Buffer.from(`${email}:${apiKey}`).toString('base64')}`;

const coerceId = (value: unknown): string => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(Math.trunc(value));
  }
  if (typeof value !== 'string') {
    return '';
  }
  const normalized = value.trim();
  if (!normalized) {
    return '';
  }
  if (normalized.includes('/')) {
    const tail = normalized.split('/').filter(Boolean).pop() ?? '';
    return tail.trim() || normalized;
  }
  return normalized;
};

export const getEscrowConfig = (): EscrowConfig => {
  const email = trimEnv(process.env.ESCROW_EMAIL);
  const apiKey = trimEnv(process.env.ESCROW_API_KEY);

  if (!email || !apiKey) {
    throw new Error('Escrow is not configured. Set ESCROW_EMAIL and ESCROW_API_KEY.');
  }

  return {
    email,
    apiKey,
    baseUrl: ESCROW_BASE_URL,
    authHeader: getEscrowAuthHeader(email, apiKey),
  };
};

const extractEscrowId = (payload: any): string => {
  const candidates: unknown[] = [
    payload?.id,
    payload?.transaction_id,
    payload?.transaction?.id,
    payload?.transaction?.transaction_id,
    payload?.data?.id,
    payload?.data?.transaction_id,
    payload?.data?.transaction?.id,
    payload?.transactions?.[0]?.id,
    Array.isArray(payload) ? payload[0]?.id : undefined,
    payload?.url,
    payload?.self,
  ];

  for (const candidate of candidates) {
    const id = coerceId(candidate);
    if (id) {
      return id;
    }
  }
  return '';
};

const extractEscrowStatus = (payload: any): string | null => {
  const status = payload?.status ?? payload?.state ?? payload?.transaction?.status;
  if (typeof status !== 'string') {
    return null;
  }
  const normalized = status.trim();
  return normalized.length > 0 ? normalized : null;
};

const readUrlCandidate = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }
  const normalized = value.trim();
  if (!normalized) {
    return null;
  }
  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    return normalized;
  }
  if (normalized.startsWith('/')) {
    return `${resolveEscrowWebAppBaseUrl()}${normalized}`;
  }
  return null;
};

const extractBuyerLandingPage = (payload: any): string | null => {
  const topLevelCandidates: unknown[] = [
    payload?.buyer_landing_page,
    payload?.buyer_landing_page_url,
    payload?.landing_page,
    payload?.landing_page_url,
    payload?.links?.landing_page,
    payload?.links?.redirect,
    payload?.transaction?.buyer_landing_page,
    payload?.transaction?.landing_page,
    payload?.transaction?.links?.landing_page,
  ];

  for (const candidate of topLevelCandidates) {
    const resolved = readUrlCandidate(candidate);
    if (resolved) {
      return resolved;
    }
  }

  const candidates = Array.isArray(payload?.parties)
    ? payload.parties
    : Array.isArray(payload?.transaction?.parties)
      ? payload.transaction.parties
      : [];

  const partyUrlCandidates = (party: any): unknown[] => [
    party?.landing_page,
    party?.landing_page_url,
    party?.url,
    party?.href,
    party?.action_url,
    party?.links?.landing_page,
    party?.links?.redirect,
    party?.links?.self,
    party?.links?.show,
  ];

  for (const party of candidates) {
    const role = String(party?.role ?? party?.type ?? '').trim().toLowerCase();
    const isBuyerParty =
      role === 'buyer'
      || role === 'buyer_customer'
      || role === 'buyer_party'
      || role === 'buyer_user';
    if (!isBuyerParty) {
      continue;
    }

    for (const candidate of partyUrlCandidates(party)) {
      const resolved = readUrlCandidate(candidate);
      if (resolved) {
        return resolved;
      }
    }
  }

  // Fallback to any party URL when buyer-specific role metadata is absent.
  for (const party of candidates) {
    for (const candidate of partyUrlCandidates(party)) {
      const resolved = readUrlCandidate(candidate);
      if (resolved) {
        return resolved;
      }
    }
  }

  return null;
};

export const getEscrowTransactionPortalUrl = (transactionId: string): string | null => {
  const normalizedId = coerceId(transactionId);
  if (!normalizedId) {
    return null;
  }
  return `${resolveEscrowWebAppBaseUrl()}/transaction/${encodeURIComponent(normalizedId)}`;
};

const escrowJsonRequest = async (input: {
  config: EscrowConfig;
  method: 'GET' | 'POST';
  path: string;
  body?: any;
}) => {
  const response = await fetch(`${input.config.baseUrl}${input.path}`, {
    method: input.method,
    headers: {
      Authorization: input.config.authHeader,
      Accept: 'application/json',
      ...(input.method === 'POST' ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(input.body ? { body: JSON.stringify(input.body) } : {}),
  });

  const requestId = trimEnv(response.headers.get('x-request-id'));
  const rawText = await response.text();
  const rawBody = rawText.trim();
  let payload: any = null;
  if (rawBody) {
    try {
      payload = JSON.parse(rawBody);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const payloadErrorMessage =
      (typeof payload?.error === 'string' && payload.error.trim())
      || (typeof payload?.message === 'string' && payload.message.trim())
      || (typeof payload?.detail === 'string' && payload.detail.trim())
      || '';
    const rawBodyMessage = rawBody && rawBody !== 'null' ? rawBody : '';
    const detail =
      payloadErrorMessage
      || rawBodyMessage
      || (response.status === 401
        ? `Unauthorized. Verify ESCROW_EMAIL/ESCROW_API_KEY and ensure credentials match the selected Escrow environment (${input.config.baseUrl.includes('sandbox') ? 'sandbox' : 'production'}).`
        : `Escrow request failed with status ${response.status}`);
    const requestHint = requestId ? ` [x-request-id: ${requestId}]` : '';
    throw new Error(`Escrow API error (${response.status}): ${detail}${requestHint}`);
  }

  return {
    payload,
    rawBody,
    response,
  };
};

export const createEscrowTransaction = async (input: {
  description: string;
  title: string;
  itemDescription: string;
  priceUsd: number;
  buyerEmail: string;
  sellerEmail: string;
}) => {
  const config = getEscrowConfig();
  const inspectionPeriodSeconds = Number(
    trimEnv(process.env.ESCROW_INSPECTION_PERIOD_SECONDS) || DEFAULT_INSPECTION_PERIOD_SECONDS,
  );
  const { payload, rawBody, response } = await escrowJsonRequest({
    config,
    method: 'POST',
    path: '/transaction',
    body: {
      currency: 'usd',
      description: input.description,
      items: [
        {
          description: input.itemDescription,
          schedule: [],
          title: input.title,
          quantity: 1,
          type: 'domain_name',
          inspection_period: Number.isFinite(inspectionPeriodSeconds) && inspectionPeriodSeconds > 0
            ? Math.round(inspectionPeriodSeconds)
            : DEFAULT_INSPECTION_PERIOD_SECONDS,
          price: input.priceUsd,
        },
      ],
      parties: [
        { customer: input.buyerEmail, role: 'buyer' },
        { customer: input.sellerEmail, role: 'seller' },
        { customer: config.email, role: 'broker' },
      ],
      fee_split: {
        buyer: 0.5,
        seller: 0.5,
        broker: 0.0,
      },
    },
  });

  const headerIdCandidates = [
    response.headers.get('x-transaction-id'),
    response.headers.get('location'),
    response.headers.get('content-location'),
    response.headers.get('x-resource-uri'),
  ];

  const transactionId =
    extractEscrowId(payload)
    || headerIdCandidates.map((candidate) => coerceId(candidate)).find(Boolean)
    || coerceId(rawBody);

  if (!transactionId) {
    const topLevelKeys = payload && typeof payload === 'object'
      ? Object.keys(payload).slice(0, 12).join(', ')
      : '(non-object payload)';
    throw new Error(
      `Escrow API response did not include a transaction id. Response keys: ${topLevelKeys}.`,
    );
  }

  return {
    transactionId,
    escrowStatus: extractEscrowStatus(payload),
    buyerLandingPage: extractBuyerLandingPage(payload),
    transactionPortalUrl: getEscrowTransactionPortalUrl(transactionId),
    raw: payload,
  };
};

export const fetchEscrowTransaction = async (transactionId: string) => {
  const config = getEscrowConfig();
  const { payload } = await escrowJsonRequest({
    config,
    method: 'GET',
    path: `/transaction/${encodeURIComponent(transactionId)}`,
  });

  const resolvedId = extractEscrowId(payload) || transactionId;
  return {
    transactionId: resolvedId,
    escrowStatus: extractEscrowStatus(payload),
    buyerLandingPage: extractBuyerLandingPage(payload),
    transactionPortalUrl: getEscrowTransactionPortalUrl(resolvedId),
    raw: payload,
  };
};

export const normalizeEscrowStatus = (value: unknown): string => String(value ?? '').trim().toLowerCase();
