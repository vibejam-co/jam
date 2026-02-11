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

export default async function handler(req: any, res: any) {
  try {
    if (getMethod(req) !== 'GET') {
      return sendJson(res, 405, { error: 'Method Not Allowed' });
    }

    // Reliability fallback endpoint.
    return sendJson(res, 200, { data: [] });
  } catch (error: any) {
    return sendJson(res, 500, {
      error: 'Failed to load notifications.',
      details: error?.message ?? 'Unknown error',
    });
  }
}
