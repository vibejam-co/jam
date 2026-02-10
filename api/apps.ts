import type { VibeApp } from '../types';
import { methodNotAllowed, parseJsonBody, sendJson } from './_lib/http';
import { supabaseAdmin } from './_lib/supabase-admin';
import { toDbJamInput, toDbRevenueInput, toVibeApps } from './_lib/transformers';

const JAM_SELECT = `
  id,
  rank,
  name,
  pitch,
  icon,
  accent_color,
  monthly_revenue,
  lifetime_revenue,
  active_users,
  build_streak,
  growth,
  tags,
  verified,
  category,
  founder_name,
  founder_handle,
  founder_avatar,
  founder_email,
  tech_stack,
  problem,
  solution,
  pricing,
  is_for_sale,
  asking_price,
  profit_margin,
  is_anonymous,
  boost_tier,
  created_at
`;

const REVENUE_SELECT = `jam_id, period_label, revenue, sort_order`;

const loadApps = async () => {
  const { data: jams, error: jamsError } = await supabaseAdmin
    .from('jams')
    .select(JAM_SELECT)
    .order('created_at', { ascending: false });

  if (jamsError) {
    throw jamsError;
  }

  if (!jams || jams.length === 0) {
    return [];
  }

  const jamIds = jams.map((jam) => jam.id);
  const { data: revenueRows, error: revenueError } = await supabaseAdmin
    .from('jam_revenue_history')
    .select(REVENUE_SELECT)
    .in('jam_id', jamIds)
    .order('sort_order', { ascending: true });

  if (revenueError) {
    throw revenueError;
  }

  return toVibeApps(jams as any, (revenueRows ?? []) as any);
};

const insertJam = async (app: VibeApp) => {
  const { data: jam, error: jamError } = await supabaseAdmin
    .from('jams')
    .insert(toDbJamInput(app))
    .select('id')
    .single();

  if (jamError) {
    throw jamError;
  }

  const revenueRows = toDbRevenueInput(jam.id, app.revenueHistory);
  const { error: revenueError } = await supabaseAdmin.from('jam_revenue_history').insert(revenueRows);

  if (revenueError) {
    throw revenueError;
  }

  const { error: notificationError } = await supabaseAdmin.from('notifications').insert({
    title: app.isForSale ? 'New Asset Listed' : 'New Jam Published',
    message: `${app.name} is now live on VibeJam.`,
    type: 'update',
    timestamp_label: 'Just now',
    is_read: false,
    jam_id: jam.id,
  });

  if (notificationError) {
    throw notificationError;
  }
};

export default async function handler(req: any, res: any) {
  try {
    if (req.method === 'GET') {
      const apps = await loadApps();
      return sendJson(res, 200, { data: apps });
    }

    if (req.method === 'POST') {
      const body = parseJsonBody(req);
      const app = body?.app as VibeApp | undefined;

      if (!app?.name || !app?.pitch || !app?.category) {
        return sendJson(res, 400, { error: 'Invalid app payload.' });
      }

      await insertJam(app);
      const apps = await loadApps();

      return sendJson(res, 201, { data: apps });
    }

    return methodNotAllowed(res, ['GET', 'POST']);
  } catch (error: any) {
    return sendJson(res, 500, {
      error: 'Failed to process apps request.',
      details: error?.message ?? 'Unknown error',
    });
  }
}
