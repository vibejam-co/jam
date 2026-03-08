const KEY_REDACTION_REGEX = /(sk_(live|test)_[A-Za-z0-9_]+|rk_(live|test)_[A-Za-z0-9_]+)/g;

export const slugify = (input: string): string =>
  input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 64);

export const parseUsdToCents = (value: string | number): number => {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      return 0;
    }
    return Math.max(0, Math.round(value));
  }

  const normalized = String(value)
    .trim()
    .replace(/[$,\s]/g, '');

  if (!normalized) {
    return 0;
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) {
    return 0;
  }

  if (parsed > 0 && parsed < 1000) {
    // Treat values like "499" as dollars in UI contexts where users enter dollars.
    return Math.round(parsed * 100);
  }

  if (Number.isInteger(parsed)) {
    // If it looks like a large integer amount, assume dollars and convert to cents.
    return Math.round(parsed * 100);
  }

  return Math.round(parsed * 100);
};

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const toPercentBps = (input: number | null | undefined): number | null => {
  if (input === null || input === undefined || !Number.isFinite(input)) {
    return null;
  }
  return Math.round(input * 100);
};

export const fromBpsToPercent = (input: number | null | undefined): number | null => {
  if (input === null || input === undefined || !Number.isFinite(input)) {
    return null;
  }
  return input / 100;
};

export const computeValuationMultipleX100 = (askingPriceCents: number, last30dRevenueCents: number): number | null => {
  if (askingPriceCents <= 0 || last30dRevenueCents <= 0) {
    return null;
  }

  const annualized = last30dRevenueCents * 12;
  if (annualized <= 0) {
    return null;
  }

  return Math.round((askingPriceCents / annualized) * 100);
};

export const sanitizeErrorDetails = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message.replace(KEY_REDACTION_REGEX, '[REDACTED_KEY]');
  }
  if (typeof error === 'string') {
    return error.replace(KEY_REDACTION_REGEX, '[REDACTED_KEY]');
  }
  if (error && typeof error === 'object') {
    const maybeError = error as {
      message?: unknown;
      details?: unknown;
      hint?: unknown;
      code?: unknown;
    };

    const parts: string[] = [];
    if (typeof maybeError.message === 'string' && maybeError.message.trim()) {
      parts.push(maybeError.message.trim());
    }
    if (typeof maybeError.details === 'string' && maybeError.details.trim()) {
      parts.push(maybeError.details.trim());
    }
    if (typeof maybeError.hint === 'string' && maybeError.hint.trim()) {
      parts.push(`Hint: ${maybeError.hint.trim()}`);
    }
    if (typeof maybeError.code === 'string' && maybeError.code.trim()) {
      parts.push(`Code: ${maybeError.code.trim()}`);
    }

    if (parts.length > 0) {
      return parts.join(' | ').replace(KEY_REDACTION_REGEX, '[REDACTED_KEY]');
    }
  }
  return 'Unknown error';
};

export const isRecoverableSchemaError = (error: unknown): boolean => {
  const errorCode =
    error && typeof error === 'object' && 'code' in error
      ? String((error as { code?: unknown }).code ?? '').trim()
      : '';
  const message = sanitizeErrorDetails(error).toLowerCase();

  const isPostgrestSchemaCode = errorCode.toUpperCase().startsWith('PGRST2');

  // If Postgres returned a concrete non-schema code (e.g. NOT NULL / UNIQUE),
  // do not treat it as a schema fallback scenario.
  if (errorCode && errorCode !== '42703' && errorCode !== '42P01' && !isPostgrestSchemaCode) {
    return false;
  }

  return (
    errorCode === '42703' ||
    errorCode === '42P01' ||
    isPostgrestSchemaCode ||
    message.includes('does not exist') ||
    message.includes('schema cache') ||
    message.includes('could not find') ||
    message.includes('undefined column') ||
    message.includes('42703') ||
    message.includes('42p01') ||
    message.includes('pgrst20')
  );
};

export const getQueryValue = (req: any, key: string): string | null => {
  const queryValue = req?.query?.[key];
  if (typeof queryValue === 'string') {
    return queryValue;
  }
  if (Array.isArray(queryValue) && typeof queryValue[0] === 'string') {
    return queryValue[0];
  }

  if (req?.url && typeof req.url === 'string') {
    try {
      const url = new URL(req.url, 'http://localhost');
      return url.searchParams.get(key);
    } catch {
      return null;
    }
  }

  return null;
};

export const parseBooleanQuery = (value: string | null): boolean | undefined => {
  if (value === null) {
    return undefined;
  }
  if (value === '1' || value.toLowerCase() === 'true') {
    return true;
  }
  if (value === '0' || value.toLowerCase() === 'false') {
    return false;
  }
  return undefined;
};

export const normalizeWebsiteUrl = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const withProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)
    ? trimmed
    : /^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(trimmed)
      ? `https://${trimmed}`
      : null;

  if (!withProtocol) {
    return null;
  }

  try {
    const parsed = new URL(withProtocol);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }

    const host = parsed.host.toLowerCase();
    const normalizedPath = parsed.pathname.replace(/\/+$/, '') || '/';
    if (normalizedPath === '/') {
      return `${parsed.protocol}//${host}`;
    }

    return `${parsed.protocol}//${host}${normalizedPath}`;
  } catch {
    return null;
  }
};
