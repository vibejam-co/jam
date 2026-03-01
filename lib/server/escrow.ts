const ESCROW_PRODUCTION_URL = 'https://api.escrow.com/2017-09-01';
const ESCROW_SANDBOX_URL = 'https://api.escrow-sandbox.com/2017-09-01';

export const ESCROW_BASE_URL =
  process.env.NODE_ENV === 'production' ? ESCROW_PRODUCTION_URL : ESCROW_SANDBOX_URL;

export type EscrowConfig = {
  email: string;
  apiKey: string;
  baseUrl: string;
  authHeader: string;
};

const trimEnv = (value: unknown): string => String(value ?? '').trim();

const getEscrowAuthHeader = (email: string, apiKey: string): string =>
  `Basic ${Buffer.from(`${email}:${apiKey}`).toString('base64')}`;

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
  const direct = payload?.id ?? payload?.transaction_id ?? payload?.transaction?.id;
  return typeof direct === 'string' ? direct.trim() : '';
};

const extractEscrowStatus = (payload: any): string | null => {
  const status = payload?.status ?? payload?.state ?? payload?.transaction?.status;
  if (typeof status !== 'string') {
    return null;
  }
  const normalized = status.trim();
  return normalized.length > 0 ? normalized : null;
};

const extractBuyerLandingPage = (payload: any): string | null => {
  const candidates = Array.isArray(payload?.parties)
    ? payload.parties
    : Array.isArray(payload?.transaction?.parties)
      ? payload.transaction.parties
      : [];

  for (const party of candidates) {
    const role = String(party?.role ?? '').trim().toLowerCase();
    if (role !== 'buyer') {
      continue;
    }

    const landingPage =
      party?.landing_page
      ?? party?.landing_page_url
      ?? party?.links?.landing_page
      ?? null;
    if (typeof landingPage === 'string' && landingPage.trim().length > 0) {
      return landingPage.trim();
    }
  }

  return null;
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

  const rawText = await response.text();
  let payload: any = {};
  if (rawText) {
    try {
      payload = JSON.parse(rawText);
    } catch {
      payload = {};
    }
  }

  if (!response.ok) {
    const detail =
      (typeof payload?.error === 'string' && payload.error)
      || (typeof payload?.message === 'string' && payload.message)
      || rawText
      || `Escrow request failed with status ${response.status}`;
    throw new Error(`Escrow API error (${response.status}): ${detail}`);
  }

  return payload;
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
  const payload = await escrowJsonRequest({
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
          inspection_period: 3,
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

  const transactionId = extractEscrowId(payload);
  if (!transactionId) {
    throw new Error('Escrow API response did not include a transaction id.');
  }

  return {
    transactionId,
    escrowStatus: extractEscrowStatus(payload),
    buyerLandingPage: extractBuyerLandingPage(payload),
    raw: payload,
  };
};

export const fetchEscrowTransaction = async (transactionId: string) => {
  const config = getEscrowConfig();
  const payload = await escrowJsonRequest({
    config,
    method: 'GET',
    path: `/transaction/${encodeURIComponent(transactionId)}`,
  });

  const resolvedId = extractEscrowId(payload) || transactionId;
  return {
    transactionId: resolvedId,
    escrowStatus: extractEscrowStatus(payload),
    buyerLandingPage: extractBuyerLandingPage(payload),
    raw: payload,
  };
};

export const normalizeEscrowStatus = (value: unknown): string => String(value ?? '').trim().toLowerCase();
