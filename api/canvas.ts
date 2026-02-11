import { CANVAS_TEMPLATES, CANVAS_THEMES, featuredFrameworks } from './_lib/canvas-catalog.js';

const BASE_CANVAS_URL = 'https://vibejam.co';

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

const sanitizeSlug = (input: string): string =>
  input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\/(www\.)?vibejam\.co\//, '')
    .replace(/^vibejam\.co\//, '')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);

export default async function handler(req: any, res: any) {
  try {
    const method = getMethod(req);

    if (method === 'GET') {
      return sendJson(res, 200, {
        data: {
          themes: CANVAS_THEMES,
          templates: CANVAS_TEMPLATES,
          featuredFrameworks,
        },
      });
    }

    if (method !== 'POST') {
      return sendJson(res, 405, { error: 'Method Not Allowed' });
    }

    const body = await parseJsonBody(req);
    const profile = body?.profile;

    if (!profile?.name) {
      return sendJson(res, 400, { error: 'Canvas payload is missing profile name.' });
    }

    const desiredSlug = sanitizeSlug(String(body?.vanitySlug ?? body?.claimedName ?? profile.name ?? ''));
    if (!desiredSlug) {
      return sendJson(res, 400, { error: 'Canvas slug is invalid.' });
    }

    return sendJson(res, 200, {
      data: {
        success: true,
        profileId: `local-${Date.now()}`,
        slug: desiredSlug,
        url: `${BASE_CANVAS_URL}/${desiredSlug}`,
        publishedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    return sendJson(res, 500, {
      error: 'Failed to save canvas profile.',
      details: error?.message ?? 'Unknown error',
    });
  }
}
