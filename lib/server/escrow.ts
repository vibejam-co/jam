export type EscrowConfig = {
  email: string;
  apiKey: string;
  baseUrl: string;
  authHeader: string;
};

export type EscrowEnvironment = 'sandbox' | 'production';

export type EscrowPaymentDiagnostics = {
  transactionId: string | null;
  totalAmount: number;
  itemAmount: number;
  scheduleAmount: number;
  payableAmount: number;
  currency: string;
  environment: EscrowEnvironment;
  reason: string | null;
};

export type EscrowSandboxPartyRole = 'buyer' | 'seller' | 'broker';

export type EscrowSandboxVerificationResult = {
  attempted: boolean;
  succeeded: boolean;
  role: EscrowSandboxPartyRole;
  customerEmail: string | null;
  customerId: string | null;
  submissionId: string | null;
  reason: string | null;
  credentialsSource: string | null;
};

const trimEnv = (value: unknown): string => String(value ?? '').trim();
const normalizeEmail = (value: unknown): string => trimEnv(value).toLowerCase();

const ESCROW_PRODUCTION_URL = 'https://api.escrow.com/2017-09-01';
const ESCROW_SANDBOX_URL = 'https://api.escrow-sandbox.com/2017-09-01';
const ESCROW_WEB_PRODUCTION_URL = 'https://www.escrow.com';
const ESCROW_WEB_SANDBOX_URL = 'https://www.escrow-sandbox.com';
const ESCROW_INTEGRATION_HELPER_SANDBOX_BASE_URL = 'https://integrationhelper.escrow-sandbox.com/v1';
const DEFAULT_INSPECTION_PERIOD_SECONDS = 3 * 24 * 60 * 60;

const normalizeBaseUrl = (value: string): string => value.replace(/\/+$/, '');
const roundMoney = (value: number): number => Number(Math.max(0, value).toFixed(2));

const toMoneyAmount = (value: unknown): number => {
  const raw =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number(value.trim())
        : Number.NaN;
  if (!Number.isFinite(raw) || raw <= 0) {
    return 0;
  }
  return roundMoney(raw);
};

const readMoneyCandidate = (value: unknown): number | null => {
  const raw =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number(value.trim())
        : Number.NaN;
  if (!Number.isFinite(raw) || raw < 0) {
    return null;
  }
  return roundMoney(raw);
};

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

const resolveEscrowEnvironmentFromBaseUrl = (baseUrl: string): EscrowEnvironment =>
  baseUrl.includes('escrow-sandbox.com') ? 'sandbox' : 'production';

export const getEscrowEnvironment = (): EscrowEnvironment => resolveEscrowEnvironmentFromBaseUrl(ESCROW_BASE_URL);
export const isEscrowSandboxEnvironment = (): boolean => getEscrowEnvironment() === 'sandbox';

const resolveEscrowWebAppBaseUrl = (): string => {
  if (ESCROW_BASE_URL.includes('escrow-sandbox.com')) {
    return ESCROW_WEB_SANDBOX_URL;
  }
  return ESCROW_WEB_PRODUCTION_URL;
};

const getEscrowAuthHeader = (email: string, apiKey: string): string =>
  `Basic ${Buffer.from(`${email}:${apiKey}`).toString('base64')}`;

const buildEscrowConfig = (email: string, apiKey: string): EscrowConfig => ({
  email,
  apiKey,
  baseUrl: ESCROW_BASE_URL,
  authHeader: getEscrowAuthHeader(email, apiKey),
});

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

  return buildEscrowConfig(email, apiKey);
};

type EscrowIntegrationHelperConfig = {
  email: string;
  password: string;
  baseUrl: string;
  authHeader: string;
};

type SandboxPartyCredential = {
  email: string;
  secret: string;
  source: string;
};

const buildIntegrationHelperConfig = (
  email: string,
  password: string,
): EscrowIntegrationHelperConfig => ({
  email,
  password,
  baseUrl: ESCROW_INTEGRATION_HELPER_SANDBOX_BASE_URL,
  authHeader: getEscrowAuthHeader(email, password),
});

const getEscrowIntegrationHelperConfig = (): EscrowIntegrationHelperConfig => {
  if (!isEscrowSandboxEnvironment()) {
    throw new Error('Integration Helper is only available in Escrow sandbox environment.');
  }

  const email = trimEnv(process.env.ESCROW_INTEGRATION_HELPER_EMAIL || process.env.ESCROW_EMAIL);
  const password = trimEnv(
    process.env.ESCROW_INTEGRATION_HELPER_PASSWORD
    || process.env.ESCROW_SANDBOX_PASSWORD
    || process.env.ESCROW_API_KEY,
  );

  if (!email || !password) {
    throw new Error(
      'Escrow Integration Helper is not configured. Set ESCROW_INTEGRATION_HELPER_EMAIL and ESCROW_INTEGRATION_HELPER_PASSWORD.',
    );
  }

  return buildIntegrationHelperConfig(email, password);
};

const resolveSandboxRolePrefix = (role: EscrowSandboxPartyRole): 'ESCROW_SANDBOX_BUYER' | 'ESCROW_SANDBOX_SELLER' | 'ESCROW_SANDBOX_BROKER' => {
  if (role === 'seller') {
    return 'ESCROW_SANDBOX_SELLER';
  }
  if (role === 'broker') {
    return 'ESCROW_SANDBOX_BROKER';
  }
  return 'ESCROW_SANDBOX_BUYER';
};

const readSandboxRoleSecret = (prefix: string): string =>
  trimEnv(
    process.env[`${prefix}_SECRET`]
    || process.env[`${prefix}_PASSWORD`]
    || process.env[`${prefix}_API_KEY`],
  );

const resolveSandboxPartyCredential = (input: {
  role: EscrowSandboxPartyRole;
  customerEmail: string;
}): SandboxPartyCredential | null => {
  const expectedEmail = normalizeEmail(input.customerEmail);
  if (!expectedEmail) {
    return null;
  }

  const candidates: SandboxPartyCredential[] = [];
  const pushCandidate = (email: string, secret: string, source: string) => {
    const normalizedEmail = normalizeEmail(email);
    const normalizedSecret = trimEnv(secret);
    if (!normalizedEmail || !normalizedSecret) {
      return;
    }
    if (candidates.some((candidate) => candidate.email === normalizedEmail && candidate.secret === normalizedSecret)) {
      return;
    }
    candidates.push({
      email: normalizedEmail,
      secret: normalizedSecret,
      source,
    });
  };

  const rolePrefix = resolveSandboxRolePrefix(input.role);
  pushCandidate(
    trimEnv(process.env[`${rolePrefix}_EMAIL`]),
    readSandboxRoleSecret(rolePrefix),
    rolePrefix.toLowerCase(),
  );

  pushCandidate(
    trimEnv(process.env.ESCROW_INTEGRATION_HELPER_EMAIL || process.env.ESCROW_EMAIL),
    trimEnv(
      process.env.ESCROW_INTEGRATION_HELPER_PASSWORD
      || process.env.ESCROW_SANDBOX_PASSWORD
      || process.env.ESCROW_API_KEY,
    ),
    'integration_helper_default',
  );

  const exact = candidates.find((candidate) => candidate.email === expectedEmail);
  return exact ?? null;
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

const readTransactionItems = (payload: any): any[] => {
  if (Array.isArray(payload?.items)) {
    return payload.items;
  }
  if (Array.isArray(payload?.transaction?.items)) {
    return payload.transaction.items;
  }
  if (Array.isArray(payload?.data?.items)) {
    return payload.data.items;
  }
  return [];
};

const extractEscrowCurrency = (payload: any, items: any[]): string => {
  const itemCurrency =
    (typeof items[0]?.currency === 'string' && items[0].currency.trim())
    || (typeof items[0]?.schedule?.[0]?.currency === 'string' && items[0].schedule[0].currency.trim())
    || '';
  const transactionCurrency =
    (typeof payload?.currency === 'string' && payload.currency.trim())
    || (typeof payload?.transaction?.currency === 'string' && payload.transaction.currency.trim())
    || (typeof payload?.data?.currency === 'string' && payload.data.currency.trim())
    || itemCurrency;
  return (transactionCurrency || 'usd').toLowerCase();
};

const extractEscrowScheduleAmount = (items: any[]): number => {
  let total = 0;
  for (const item of items) {
    if (!Array.isArray(item?.schedule)) {
      continue;
    }
    for (const scheduleEntry of item.schedule) {
      total += toMoneyAmount(scheduleEntry?.amount);
    }
  }
  return roundMoney(total);
};

const extractEscrowItemAmount = (items: any[]): number => {
  let total = 0;
  for (const item of items) {
    const candidate =
      readMoneyCandidate(item?.price)
      ?? readMoneyCandidate(item?.amount)
      ?? readMoneyCandidate(item?.total)
      ?? readMoneyCandidate(item?.total_amount)
      ?? 0;
    total += candidate;
  }
  return roundMoney(total);
};

const extractEscrowTransactionTotal = (payload: any, scheduleAmount: number, itemAmount: number): number => {
  const directCandidate =
    readMoneyCandidate(payload?.total)
    ?? readMoneyCandidate(payload?.amount)
    ?? readMoneyCandidate(payload?.total_amount)
    ?? readMoneyCandidate(payload?.total_without_payment_fee)
    ?? readMoneyCandidate(payload?.transaction?.total)
    ?? readMoneyCandidate(payload?.transaction?.amount)
    ?? readMoneyCandidate(payload?.transaction?.total_amount)
    ?? readMoneyCandidate(payload?.data?.total)
    ?? readMoneyCandidate(payload?.data?.amount)
    ?? readMoneyCandidate(payload?.data?.total_amount);

  if (directCandidate !== null) {
    return directCandidate;
  }

  return roundMoney(Math.max(scheduleAmount, itemAmount));
};

export const getEscrowPaymentDiagnostics = (
  payload: any,
  fallbackTransactionId: string | null = null,
): EscrowPaymentDiagnostics => {
  const items = readTransactionItems(payload);
  const scheduleAmount = extractEscrowScheduleAmount(items);
  const itemAmount = extractEscrowItemAmount(items);
  const totalAmount = extractEscrowTransactionTotal(payload, scheduleAmount, itemAmount);
  const payableAmount = roundMoney(Math.max(totalAmount, scheduleAmount, itemAmount));
  const transactionId = extractEscrowId(payload) || coerceId(fallbackTransactionId ?? '') || null;

  return {
    transactionId,
    totalAmount,
    itemAmount,
    scheduleAmount,
    payableAmount,
    currency: extractEscrowCurrency(payload, items),
    environment: getEscrowEnvironment(),
    reason: payableAmount > 0 ? null : 'zero_payable_amount',
  };
};

export const extractEscrowTransactionTotalUsd = (payload: any): number =>
  getEscrowPaymentDiagnostics(payload).totalAmount;

export const getEscrowSandboxApprovalGuidance = (transactionId: string) => ({
  integrationHelperEndpoint: `https://integrationhelper.escrow-sandbox.com/v1/transaction/${encodeURIComponent(transactionId)}/payments_in`,
  partnerDashboardUrl: `https://www.escrow-sandbox.com/transaction/${encodeURIComponent(transactionId)}`,
  note:
    'Sandbox payments can be approved via Integration Helper or Partner Dashboard. After marking payment as paid, sandbox approval secures in about 20 minutes.',
});

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
  headers?: Record<string, string>;
}) => {
  const response = await fetch(`${input.config.baseUrl}${input.path}`, {
    method: input.method,
    headers: {
      Authorization: input.config.authHeader,
      Accept: 'application/json',
      ...(input.method === 'POST' ? { 'Content-Type': 'application/json' } : {}),
      ...(input.headers ?? {}),
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

const integrationHelperJsonRequest = async (input: {
  config: EscrowIntegrationHelperConfig;
  method: 'POST' | 'PATCH';
  path: string;
  body?: any;
}) => {
  const response = await fetch(`${input.config.baseUrl}${input.path}`, {
    method: input.method,
    headers: {
      Authorization: input.config.authHeader,
      Accept: 'application/json',
      'Content-Type': 'application/json',
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
      || '';
    const detail = payloadErrorMessage || rawBody || `Integration Helper request failed with status ${response.status}`;
    const requestHint = requestId ? ` [x-request-id: ${requestId}]` : '';
    throw new Error(`Integration Helper API error (${response.status}): ${detail}${requestHint}`);
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
  const normalizedPriceUsd = toMoneyAmount(input.priceUsd);
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
          title: input.title,
          quantity: 1,
          type: 'domain_name',
          inspection_period: Number.isFinite(inspectionPeriodSeconds) && inspectionPeriodSeconds > 0
            ? Math.round(inspectionPeriodSeconds)
            : DEFAULT_INSPECTION_PERIOD_SECONDS,
          schedule: [
            {
              amount: normalizedPriceUsd,
              payer_customer: input.buyerEmail,
              beneficiary_customer: input.sellerEmail,
            },
          ],
          fees: [
            {
              payer_customer: input.buyerEmail,
              type: 'escrow',
              split: 0.5,
            },
            {
              payer_customer: input.sellerEmail,
              type: 'escrow',
              split: 0.5,
            },
          ],
        },
      ],
      parties: [
        { customer: input.buyerEmail, role: 'buyer' },
        { customer: input.sellerEmail, role: 'seller' },
        { customer: config.email, role: 'broker' },
      ],
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

  const paymentDiagnostics = getEscrowPaymentDiagnostics(payload, transactionId);
  return {
    transactionId,
    escrowStatus: extractEscrowStatus(payload),
    buyerLandingPage: extractBuyerLandingPage(payload),
    totalAmountUsd: paymentDiagnostics.totalAmount,
    paymentDiagnostics,
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
  const paymentDiagnostics = getEscrowPaymentDiagnostics(payload, resolvedId);
  return {
    transactionId: resolvedId,
    escrowStatus: extractEscrowStatus(payload),
    buyerLandingPage: extractBuyerLandingPage(payload),
    totalAmountUsd: paymentDiagnostics.totalAmount,
    paymentDiagnostics,
    transactionPortalUrl: getEscrowTransactionPortalUrl(resolvedId),
    raw: payload,
  };
};

export const fundEscrowTransactionInSandbox = async (input: {
  transactionId: string;
  paymentMethod?: 'wire_transfer';
}) => {
  if (!isEscrowSandboxEnvironment()) {
    throw new Error('Sandbox funding is only available when ESCROW environment is sandbox.');
  }

  const normalizedId = coerceId(input.transactionId);
  if (!normalizedId) {
    throw new Error('Missing Escrow transaction id for sandbox funding.');
  }

  const method = input.paymentMethod ?? 'wire_transfer';
  if (method !== 'wire_transfer') {
    throw new Error('Only wire_transfer funding is supported through the API sandbox funding path.');
  }

  const config = getEscrowConfig();
  const { payload } = await escrowJsonRequest({
    config,
    method: 'POST',
    path: `/transaction/${encodeURIComponent(normalizedId)}/payment_methods/${encodeURIComponent(method)}`,
    body: {},
  });

  return {
    transactionId: normalizedId,
    paymentMethod: method,
    funded: true,
    raw: payload,
  };
};

export const approveEscrowSandboxPaymentViaIntegrationHelper = async (input: {
  transactionId: string;
  amountUsd: number;
  method?: 'wire_transfer';
}) => {
  if (!isEscrowSandboxEnvironment()) {
    throw new Error('Integration Helper approval is only available in Escrow sandbox environment.');
  }

  const normalizedId = coerceId(input.transactionId);
  if (!normalizedId) {
    throw new Error('Missing Escrow transaction id for Integration Helper approval.');
  }

  const method = input.method ?? 'wire_transfer';
  if (method !== 'wire_transfer') {
    throw new Error('Only wire_transfer approval is supported through Integration Helper.');
  }

  const amountUsd = toMoneyAmount(input.amountUsd);
  if (!(amountUsd > 0)) {
    throw new Error('Integration Helper approval amount must be greater than zero.');
  }

  const config = getEscrowIntegrationHelperConfig();
  const { payload } = await integrationHelperJsonRequest({
    config,
    method: 'POST',
    path: `/transaction/${encodeURIComponent(normalizedId)}/payments_in`,
    body: {
      method,
      amount: amountUsd.toFixed(2),
    },
  });

  return {
    transactionId: normalizedId,
    method,
    amountUsd,
    approved: true,
    raw: payload,
  };
};

export const approveEscrowSandboxVerificationViaIntegrationHelper = async (input: {
  role: EscrowSandboxPartyRole;
  customerEmail: string;
}): Promise<EscrowSandboxVerificationResult> => {
  if (!isEscrowSandboxEnvironment()) {
    throw new Error('Sandbox verification approval is only available in Escrow sandbox environment.');
  }

  const normalizedEmail = normalizeEmail(input.customerEmail);
  if (!normalizedEmail) {
    throw new Error('Missing customer email for sandbox verification approval.');
  }

  const credential = resolveSandboxPartyCredential({
    role: input.role,
    customerEmail: normalizedEmail,
  });
  if (!credential) {
    const rolePrefix = resolveSandboxRolePrefix(input.role);
    throw new Error(
      `Missing sandbox credentials for ${input.role} verification (${normalizedEmail}). `
      + `Set ${rolePrefix}_EMAIL and ${rolePrefix}_SECRET (or ${rolePrefix}_PASSWORD/${rolePrefix}_API_KEY).`,
    );
  }

  const customerConfig = buildEscrowConfig(credential.email, credential.secret);
  const { payload: customerPayload } = await escrowJsonRequest({
    config: customerConfig,
    method: 'GET',
    path: '/customer/me',
  });

  const customerId = coerceId(customerPayload?.id);
  if (!customerId) {
    throw new Error('Escrow /customer/me response did not include a customer id.');
  }

  const profileEmail = normalizeEmail(customerPayload?.email);
  if (profileEmail && profileEmail !== normalizedEmail) {
    throw new Error(
      `Sandbox credential email mismatch. Expected ${normalizedEmail}, resolved ${profileEmail}. `
      + 'Use matching sandbox credentials for the transaction buyer.',
    );
  }

  const personalStatus = normalizeEmail(customerPayload?.verification?.personal?.status);
  if (personalStatus === 'verified' || personalStatus === 'not_required') {
    return {
      attempted: false,
      succeeded: true,
      role: input.role,
      customerEmail: normalizedEmail,
      customerId,
      submissionId: null,
      reason: 'already_verified',
      credentialsSource: credential.source,
    };
  }

  const helperConfig = buildIntegrationHelperConfig(credential.email, credential.secret);
  const { payload: submissionPayload } = await integrationHelperJsonRequest({
    config: helperConfig,
    method: 'POST',
    path: `/customer/${encodeURIComponent(customerId)}/verification`,
    body: {
      personal: true,
      company: false,
    },
  });

  const submissionId = coerceId(submissionPayload?.submission_id ?? submissionPayload?.id);
  if (!submissionId) {
    throw new Error('Integration Helper verification submission did not include submission_id.');
  }

  await integrationHelperJsonRequest({
    config: helperConfig,
    method: 'PATCH',
    path: `/customer/${encodeURIComponent(customerId)}/verification/${encodeURIComponent(submissionId)}`,
    body: {
      action: 'approve',
    },
  });

  return {
    attempted: true,
    succeeded: true,
    role: input.role,
    customerEmail: normalizedEmail,
    customerId,
    submissionId,
    reason: null,
    credentialsSource: credential.source,
  };
};

export const normalizeEscrowStatus = (value: unknown): string => String(value ?? '').trim().toLowerCase();
