type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export const checkRateLimit = (
  key: string,
  options?: {
    limit?: number;
    windowMs?: number;
  },
): { ok: boolean; retryAfterMs: number } => {
  const limit = options?.limit ?? 8;
  const windowMs = options?.windowMs ?? 10 * 60 * 1000;
  const now = Date.now();

  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return { ok: true, retryAfterMs: 0 };
  }

  if (current.count >= limit) {
    return {
      ok: false,
      retryAfterMs: Math.max(0, current.resetAt - now),
    };
  }

  current.count += 1;
  buckets.set(key, current);
  return { ok: true, retryAfterMs: 0 };
};
