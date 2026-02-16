import { CANVAS_TEMPLATES, CANVAS_THEMES, featuredFrameworks } from './_lib/canvas-catalog.js';
import { getMethod, methodNotAllowed, parseJsonBody, sendJson } from './_lib/http.js';
import { getSupabaseAdmin } from './_lib/supabase-admin.js';

const BASE_CANVAS_URL = 'https://vibejam.co';
const META_OWNER_KEY = '__owner_uid';
const META_TEMPLATE_KEY = '__selected_template_id';
const META_PUBLISHED_AT_KEY = '__published_at';

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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const sanitizeStringMap = (value: unknown): Record<string, string> => {
  if (!isRecord(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
  );
};

const sanitizeSignals = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((signal): signal is string => typeof signal === 'string') : [];

const stripCanvasMeta = (links: Record<string, string>): Record<string, string> => {
  const next = { ...links };
  delete next[META_OWNER_KEY];
  delete next[META_TEMPLATE_KEY];
  delete next[META_PUBLISHED_AT_KEY];
  return next;
};

const getCanvasOwnerId = (linksValue: unknown): string | null => {
  if (!isRecord(linksValue)) {
    return null;
  }

  const owner = linksValue[META_OWNER_KEY];
  return typeof owner === 'string' && owner.length > 0 ? owner : null;
};

const getCanvasTemplateId = (row: any): string | undefined => {
  if (typeof row?.selected_template_id === 'string' && row.selected_template_id.length > 0) {
    return row.selected_template_id;
  }

  if (!isRecord(row?.links)) {
    return undefined;
  }

  const fromLinks = row.links[META_TEMPLATE_KEY];
  return typeof fromLinks === 'string' && fromLinks.length > 0 ? fromLinks : undefined;
};

const getCanvasPublishedAt = (row: any): string => {
  if (typeof row?.published_at === 'string' && row.published_at.length > 0) {
    return row.published_at;
  }

  if (isRecord(row?.links)) {
    const fromLinks = row.links[META_PUBLISHED_AT_KEY];
    if (typeof fromLinks === 'string' && fromLinks.length > 0) {
      return fromLinks;
    }
  }

  if (typeof row?.updated_at === 'string' && row.updated_at.length > 0) {
    return row.updated_at;
  }

  if (typeof row?.created_at === 'string' && row.created_at.length > 0) {
    return row.created_at;
  }

  return new Date().toISOString();
};

const toOwnedProfile = (row: any) => {
  const slug = String(row?.claimed_name ?? '');
  const publishedAt = getCanvasPublishedAt(row);
  return {
    profileId: String(row?.id ?? ''),
    slug,
    url: `${BASE_CANVAS_URL}/${slug}`,
    publishedAt,
  };
};

const toCanvasSession = (row: any) => {
  const rawLinks = sanitizeStringMap(row?.links);
  const cleanLinks = stripCanvasMeta(rawLinks);
  const slug = String(row?.claimed_name ?? '');
  const publishedAt = getCanvasPublishedAt(row);

  return {
    onboarding: {
      claimedName: slug,
      vanitySlug: slug,
      profile: {
        name: String(row?.display_name ?? slug),
        bio: String(row?.bio ?? ''),
        avatar: String(row?.avatar_url ?? ''),
      },
      selectedTheme: String(row?.selected_theme ?? 'midnight-zenith'),
      selectedTemplateId: getCanvasTemplateId(row),
      selectedSignals: sanitizeSignals(row?.selected_signals),
      links: cleanLinks,
    },
    publish: {
      success: true,
      profileId: String(row?.id ?? ''),
      slug,
      url: `${BASE_CANVAS_URL}/${slug}`,
      publishedAt,
    },
  };
};

const getQueryValue = (req: any, key: string): string | null => {
  const queryValue = req?.query?.[key];
  if (typeof queryValue === 'string') {
    return queryValue;
  }
  if (Array.isArray(queryValue) && typeof queryValue[0] === 'string') {
    return queryValue[0];
  }

  if (req?.url && typeof req.url === 'string') {
    try {
      const url = new URL(req.url, 'http://localhost');
      return url.searchParams.get(key);
    } catch {
      return null;
    }
  }

  return null;
};

const getAuthHeader = (req: any): string => {
  if (req?.headers) {
    if (typeof req.headers.get === 'function') {
      return req.headers.get('authorization') || '';
    }

    const direct = req.headers.authorization;
    if (typeof direct === 'string') {
      return direct;
    }

    if (Array.isArray(direct) && typeof direct[0] === 'string') {
      return direct[0];
    }
  }

  return '';
};

const getAuthenticatedUser = async (req: any) => {
  const authHeader = getAuthHeader(req);
  if (!authHeader.toLowerCase().startsWith('bearer ')) {
    return null;
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return null;
  }

  const supabase = await getSupabaseAdmin();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    return null;
  }

  return data.user;
};

export default async function handler(req: any, res: any) {
  try {
    const method = getMethod(req);

    if (method === 'GET') {
      const mode = getQueryValue(req, 'mode');
      if (mode === 'public') {
        const rawSlug = getQueryValue(req, 'slug') ?? '';
        const slug = sanitizeSlug(rawSlug);
        if (!slug) {
          return sendJson(res, 400, { error: 'Missing or invalid slug.' });
        }

        const supabase = await getSupabaseAdmin();
        const { data, error } = await supabase
          .from('canvas_profiles')
          .select('*')
          .eq('claimed_name', slug)
          .order('updated_at', { ascending: false })
          .limit(1);

        if (error) {
          throw error;
        }

        const rows = Array.isArray(data) ? data : [];
        return sendJson(res, 200, {
          data: {
            session: rows.length > 0 ? toCanvasSession(rows[0]) : null,
          },
        });
      }

      if (mode === 'session') {
        const user = await getAuthenticatedUser(req);
        if (!user) {
          return sendJson(res, 401, { error: 'Authentication required.' });
        }

        const supabase = await getSupabaseAdmin();
        const { data, error } = await supabase
          .from('canvas_profiles')
          .select('*')
          .contains('links', { [META_OWNER_KEY]: user.id })
          .order('updated_at', { ascending: false })
          .limit(50);

        let rows: any[] = [];
        if (!error) {
          rows = Array.isArray(data) ? data : [];
        } else {
          // Some environments store `links` differently; fall back to a broader read
          // and filter by owner id in-process so dashboard access still works.
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('canvas_profiles')
            .select('*')
            .order('updated_at', { ascending: false })
            .limit(500);

          if (fallbackError) {
            throw fallbackError;
          }

          const fallbackRows = Array.isArray(fallbackData) ? fallbackData : [];
          rows = fallbackRows.filter((row) => getCanvasOwnerId(row?.links) === user.id);
        }
        return sendJson(res, 200, {
          data: {
            session: rows.length > 0 ? toCanvasSession(rows[0]) : null,
            profiles: rows.map(toOwnedProfile),
          },
        });
      }

      return sendJson(res, 200, {
        data: {
          themes: CANVAS_THEMES,
          templates: CANVAS_TEMPLATES,
          featuredFrameworks,
        },
      });
    }

    if (method !== 'POST') {
      return methodNotAllowed(res, ['GET', 'POST']);
    }

    const user = await getAuthenticatedUser(req);
    if (!user) {
      return sendJson(res, 401, { error: 'Sign in required to publish Canvas.' });
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

    const selectedTemplateId =
      typeof body?.selectedTemplateId === 'string' && body.selectedTemplateId.length > 0
        ? body.selectedTemplateId
        : null;
    const selectedSignals = sanitizeSignals(body?.selectedSignals);
    const cleanLinks = stripCanvasMeta(sanitizeStringMap(body?.links));
    const publishedAt = new Date().toISOString();
    const persistedLinks = {
      ...cleanLinks,
      [META_OWNER_KEY]: user.id,
      [META_PUBLISHED_AT_KEY]: publishedAt,
      ...(selectedTemplateId ? { [META_TEMPLATE_KEY]: selectedTemplateId } : {}),
    };

    const supabase = await getSupabaseAdmin();
    const { data: slugRows, error: slugLookupError } = await supabase
      .from('canvas_profiles')
      .select('*')
      .eq('claimed_name', desiredSlug)
      .order('created_at', { ascending: true });

    if (slugLookupError) {
      throw slugLookupError;
    }

    const rows = Array.isArray(slugRows) ? slugRows : [];
    const foreignOwnerRow = rows.find((row) => {
      const ownerId = getCanvasOwnerId(row.links);
      return ownerId !== null && ownerId !== user.id;
    });

    if (foreignOwnerRow) {
      return sendJson(res, 409, { error: 'That Canvas name is already claimed. Choose another one.' });
    }

    const ownedOrLegacyRow =
      rows.find((row) => getCanvasOwnerId(row.links) === user.id) ??
      rows.find((row) => getCanvasOwnerId(row.links) === null) ??
      null;

    const writePayload = {
      claimed_name: desiredSlug,
      display_name: String(profile?.name ?? desiredSlug),
      bio: String(profile?.bio ?? ''),
      avatar_url: String(profile?.avatar ?? ''),
      selected_theme: String(body?.selectedTheme ?? 'midnight-zenith'),
      selected_signals: selectedSignals,
      links: persistedLinks,
    };

    let savedRow: any;
    if (ownedOrLegacyRow?.id) {
      const { data: updated, error: updateError } = await supabase
        .from('canvas_profiles')
        .update(writePayload)
        .eq('id', ownedOrLegacyRow.id)
        .select('*')
        .single();

      if (updateError) {
        throw updateError;
      }
      savedRow = updated;
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from('canvas_profiles')
        .insert(writePayload)
        .select('*')
        .single();

      if (insertError) {
        throw insertError;
      }
      savedRow = inserted;
    }

    return sendJson(res, 200, { data: toCanvasSession(savedRow).publish });
  } catch (error: any) {
    return sendJson(res, 500, {
      error: 'Failed to save canvas profile.',
      details: error?.message ?? 'Unknown error',
    });
  }
}
