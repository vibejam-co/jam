const sendJson = (res: any, status: number, body: unknown) => {
  const payload = JSON.stringify(body);

  if (res && typeof res.setHeader === 'function' && typeof res.end === 'function') {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.end(payload);
    return;
  }

  return new Response(payload, {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
};

const getMethod = (req: any): string => (req && typeof req.method === 'string' ? req.method : '');

const parseJsonBody = async (req: any) => {
  if (!req) {
    return {};
  }

  if (typeof req.body === 'string') {
    return JSON.parse(req.body);
  }

  if (req.body && typeof req.body === 'object') {
    return req.body;
  }

  if (typeof req.json === 'function') {
    try {
      return await req.json();
    } catch {
      return {};
    }
  }

  return {};
};

// Reliability fallback endpoint. Frontend keeps local seed data when this returns an empty array.
export default async function handler(req: any, res: any) {
  try {
    const method = getMethod(req);

    if (method === 'GET') {
      return sendJson(res, 200, { data: [] });
    }

    if (method === 'POST') {
      const body = await parseJsonBody(req);
      const app = body?.app;

      if (!app?.name || !app?.pitch || !app?.category) {
        return sendJson(res, 400, { error: 'Invalid app payload.' });
      }

      return sendJson(res, 201, { data: [] });
    }

    return sendJson(res, 405, { error: 'Method Not Allowed' });
  } catch (error: any) {
    return sendJson(res, 500, {
      error: 'Failed to process apps request.',
      details: error?.message ?? 'Unknown error',
    });
  }
}
