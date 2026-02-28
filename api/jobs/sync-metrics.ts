import { getMethod, methodNotAllowed, sendJson } from '../../lib/server/http.js';
import { syncActiveConnections, syncConnectionById } from '../../lib/server/marketplace-sync.js';
import { getQueryValue, sanitizeErrorDetails } from '../../lib/server/marketplace-utils.js';

const hasValidCronSecret = (req: any): boolean => {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    throw new Error('Missing CRON_SECRET env var.');
  }

  const direct = req?.headers?.['x-cron-secret'];
  if (typeof direct === 'string' && direct === expected) {
    return true;
  }

  if (Array.isArray(direct) && direct[0] === expected) {
    return true;
  }

  const getHeader = req?.headers && typeof req.headers.get === 'function'
    ? req.headers.get.bind(req.headers)
    : null;

  const fromGetter = getHeader ? getHeader('x-cron-secret') : null;
  if (typeof fromGetter === 'string' && fromGetter === expected) {
    return true;
  }

  const authHeader = getHeader ? getHeader('authorization') : req?.headers?.authorization;
  if (typeof authHeader === 'string' && authHeader.trim() === `Bearer ${expected}`) {
    return true;
  }

  if (Array.isArray(authHeader) && authHeader[0] === `Bearer ${expected}`) {
    return true;
  }

  return false;
};

export default async function handler(req: any, res: any) {
  try {
    const method = getMethod(req);
    if (method !== 'POST' && method !== 'GET') {
      return methodNotAllowed(res, ['GET', 'POST']);
    }

    if (!hasValidCronSecret(req)) {
      return sendJson(res, 401, { error: 'Unauthorized cron request.' });
    }

    const connectionId = getQueryValue(req, 'connection_id');
    const limitRaw = getQueryValue(req, 'limit');
    const limit = limitRaw && Number.isFinite(Number(limitRaw)) ? Math.max(1, Math.min(100, Number(limitRaw))) : 30;

    if (connectionId) {
      const result = await syncConnectionById(connectionId);
      return sendJson(res, 200, {
        data: {
          attempted: 1,
          success: result.ok ? 1 : 0,
          failed: result.ok ? 0 : 1,
          results: [result],
        },
      });
    }

    const summary = await syncActiveConnections(limit);
    return sendJson(res, 200, { data: summary });
  } catch (error) {
    return sendJson(res, 500, {
      error: 'Failed to run metrics sync job.',
      details: sanitizeErrorDetails(error),
    });
  }
}
