export default async function handler(_req: any, res: any) {
  try {
    const body = {
      data: {
        ok: true,
        runtime: typeof process !== 'undefined' ? process.version : 'unknown',
        env: {
          hasSupabaseUrl: Boolean(typeof process !== 'undefined' && process.env?.SUPABASE_URL),
          hasSupabaseServiceRoleKey: Boolean(
            typeof process !== 'undefined' && process.env?.SUPABASE_SERVICE_ROLE_KEY,
          ),
        },
        now: new Date().toISOString(),
      },
    };

    const payload = JSON.stringify(body);

    if (res && typeof res.setHeader === 'function' && typeof res.end === 'function') {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(payload);
      return;
    }

    return new Response(payload, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    const payload = JSON.stringify({
      error: 'Health handler failed.',
      details: error?.message ?? 'Unknown error',
    });

    if (res && typeof res.setHeader === 'function' && typeof res.end === 'function') {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(payload);
      return;
    }

    return new Response(payload, {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
