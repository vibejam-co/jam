import { getMethod, methodNotAllowed, sendJson } from '../lib/server/http.js';
import { getSupabaseAdmin } from '../lib/server/supabase-admin.js';
import { getAuthenticatedUser } from '../lib/server/auth.js';
import { getQueryValue, isRecoverableSchemaError, sanitizeErrorDetails } from '../lib/server/marketplace-utils.js';
import { sendNewsletterWelcomeEmail } from '../lib/server/email.js';

const NOTIFICATION_SELECT = [
  'id',
  'title',
  'message',
  'type',
  'timestamp_label',
  'is_read',
  'jam_id',
  'metadata',
  'created_at',
].join(',');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const parseJsonBody = async (req: any) => {
  if (!req) {
    return {};
  }
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
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
    const method = getMethod(req);
    const scope = getQueryValue(req, 'scope');

    if (scope === 'newsletter') {
      if (method !== 'POST') {
        return methodNotAllowed(res, ['POST']);
      }

      const body = await parseJsonBody(req);
      const email = String(body?.email ?? '').trim().toLowerCase();
      const sourceRaw = String(body?.source ?? '').trim();
      const source = sourceRaw.length > 0 ? sourceRaw.slice(0, 64) : 'vibejam-web';
      if (!EMAIL_REGEX.test(email)) {
        return sendJson(res, 400, { error: 'Please provide a valid email address.' });
      }

      const supabase = await getSupabaseAdmin();
      const { data: existing, error: existingError } = await supabase
        .from('newsletter_subscriptions')
        .select('id')
        .eq('email', email)
        .limit(1)
        .maybeSingle();

      if (existingError && !isRecoverableSchemaError(existingError)) {
        throw existingError;
      }

      if (existing?.id) {
        return sendJson(res, 200, {
          data: {
            success: true,
            alreadySubscribed: true,
            emailStatus: 'skipped',
          },
        });
      }

      const { error: insertError } = await supabase
        .from('newsletter_subscriptions')
        .insert({
          email,
          source,
        });

      if (insertError && !isRecoverableSchemaError(insertError)) {
        if (String((insertError as any)?.code ?? '') === '23505') {
          return sendJson(res, 200, {
            data: {
              success: true,
              alreadySubscribed: true,
              emailStatus: 'skipped',
            },
          });
        }
        throw insertError;
      }

      let emailStatus: 'sent' | 'skipped' | 'failed' = 'skipped';
      let emailMessageId: string | null = null;
      try {
        const result = await sendNewsletterWelcomeEmail({ toEmail: email });
        emailStatus = result.sent ? 'sent' : 'skipped';
        emailMessageId = result.messageId ?? null;
      } catch {
        emailStatus = 'failed';
      }

      return sendJson(res, 200, {
        data: {
          success: true,
          alreadySubscribed: false,
          emailStatus,
          emailMessageId,
        },
      });
    }

    if (method !== 'GET') {
      return methodNotAllowed(res, ['GET', 'POST']);
    }

    const user = await getAuthenticatedUser(req);
    const supabase = await getSupabaseAdmin();

    let query = supabase
      .from('notifications')
      .select(NOTIFICATION_SELECT)
      .order('created_at', { ascending: false })
      .limit(40);

    if (user?.id) {
      query = query.or(`recipient_user_id.is.null,recipient_user_id.eq.${user.id}`);
    } else {
      query = query.is('recipient_user_id', null);
    }

    let { data, error } = await query;
    if (error && isRecoverableSchemaError(error)) {
      const legacyResult = await supabase
        .from('notifications')
        .select('id,title,message,type,timestamp_label,is_read,jam_id,created_at')
        .order('created_at', { ascending: false })
        .limit(40);

      data = legacyResult.data;
      error = legacyResult.error;
    }
    if (error) {
      throw error;
    }

    const notifications = (Array.isArray(data) ? data : []).map((row: any) => ({
      id: row.id,
      title: row.title,
      message: row.message,
      type: row.type,
      timestamp: row.timestamp_label,
      isRead: Boolean(row.is_read),
      appId: row.jam_id ?? undefined,
      link: row?.metadata?.asset_id ? `/marketplace/${row.metadata.asset_id}` : undefined,
    }));

    return sendJson(res, 200, { data: notifications });
  } catch (error) {
    return sendJson(res, 500, {
      error: 'Failed to load notifications.',
      details: sanitizeErrorDetails(error),
    });
  }
}
