import { methodNotAllowed, parseJsonBody, sendJson } from './_lib/http';
import { supabaseAdmin } from './_lib/supabase-admin';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'POST') {
      return methodNotAllowed(res, ['POST']);
    }

    const body = parseJsonBody(req);
    const email = String(body?.email ?? '').trim().toLowerCase();

    if (!EMAIL_REGEX.test(email)) {
      return sendJson(res, 400, { error: 'Please provide a valid email address.' });
    }

    const { error } = await supabaseAdmin
      .from('newsletter_subscriptions')
      .upsert({ email, source: 'vibejam-web' }, { onConflict: 'email' });

    if (error) {
      throw error;
    }

    return sendJson(res, 200, { data: { success: true } });
  } catch (error: any) {
    return sendJson(res, 500, {
      error: 'Failed to subscribe email.',
      details: error?.message ?? 'Unknown error',
    });
  }
}
