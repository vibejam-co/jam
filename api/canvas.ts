import { methodNotAllowed, parseJsonBody, sendJson } from './_lib/http';
import { supabaseAdmin } from './_lib/supabase-admin';

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'POST') {
      return methodNotAllowed(res, ['POST']);
    }

    const body = parseJsonBody(req);
    const profile = body?.profile;

    if (!profile?.name) {
      return sendJson(res, 400, { error: 'Canvas payload is missing profile name.' });
    }

    const payload = {
      claimed_name: String(body?.claimedName ?? profile.name),
      display_name: String(profile.name),
      bio: String(profile.bio ?? ''),
      avatar_url: String(profile.avatar ?? ''),
      selected_theme: String(body?.selectedTheme ?? 'midnight-zenith'),
      selected_signals: Array.isArray(body?.selectedSignals) ? body.selectedSignals : [],
      links: typeof body?.links === 'object' && body.links !== null ? body.links : {},
    };

    const { error } = await supabaseAdmin.from('canvas_profiles').insert(payload);

    if (error) {
      throw error;
    }

    return sendJson(res, 200, { data: { success: true } });
  } catch (error: any) {
    return sendJson(res, 500, {
      error: 'Failed to save canvas profile.',
      details: error?.message ?? 'Unknown error',
    });
  }
}
