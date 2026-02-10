import { methodNotAllowed, sendJson } from './_lib/http';
import { supabaseAdmin } from './_lib/supabase-admin';
import { toNotifications } from './_lib/transformers';

const SELECT_FIELDS = `id, title, message, type, timestamp_label, is_read, jam_id`;

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'GET') {
      return methodNotAllowed(res, ['GET']);
    }

    const { data, error } = await supabaseAdmin
      .from('notifications')
      .select(SELECT_FIELDS)
      .order('created_at', { ascending: false })
      .limit(25);

    if (error) {
      throw error;
    }

    return sendJson(res, 200, { data: toNotifications((data ?? []) as any) });
  } catch (error: any) {
    return sendJson(res, 500, {
      error: 'Failed to load notifications.',
      details: error?.message ?? 'Unknown error',
    });
  }
}
