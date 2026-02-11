const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

export default async function handler(req: any, res: any) {
  try {
    if (getMethod(req) !== 'POST') {
      return sendJson(res, 405, { error: 'Method Not Allowed' });
    }

    const body = await parseJsonBody(req);
    const email = String(body?.email ?? '').trim().toLowerCase();

    if (!EMAIL_REGEX.test(email)) {
      return sendJson(res, 400, { error: 'Please provide a valid email address.' });
    }

    return sendJson(res, 200, { data: { success: true } });
  } catch (error: any) {
    return sendJson(res, 500, {
      error: 'Failed to subscribe email.',
      details: error?.message ?? 'Unknown error',
    });
  }
}
