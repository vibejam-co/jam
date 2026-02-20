import { CANVAS_TEMPLATES, CANVAS_THEMES, featuredFrameworks } from './_lib/canvas-catalog.js';
import { getMethod, methodNotAllowed, parseJsonBody, sendJson } from './_lib/http.js';
import { getSupabaseAdmin } from './_lib/supabase-admin.js';

const BASE_CANVAS_URL = 'https://vibejam.co';
const META_OWNER_KEY = '__owner_uid';
const META_TEMPLATE_KEY = '__selected_template_id';
const META_PUBLISHED_AT_KEY = '__published_at';
const META_MONETIZATION_KEY = '__monetization';
const META_LAYOUT_KEY = '__layout_schema';
const META_LINK_ITEMS_KEY = '__link_items';
const META_THEME_CONTAINERS_KEY = '__theme_containers';
const LAYOUT_SCHEMA_VERSION = 1;
const MAX_LAYOUT_BLOCKS = 24;

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

const sanitizeLinkItems = (value: unknown): Array<{ id: string; title: string; url: string; clicks?: string }> => {
  if (!Array.isArray(value)) {
    return [];
  }

  const seen = new Set<string>();
  return value
    .filter((item): item is Record<string, unknown> => isRecord(item))
    .map((item, index) => {
      const title = typeof item.title === 'string' ? item.title.trim() : '';
      const url = typeof item.url === 'string' ? item.url.trim() : '';
      if (!title || !url) {
        return null;
      }
      const idRaw = typeof item.id === 'string' && item.id.trim().length > 0
        ? item.id.trim()
        : `link-${Date.now()}-${index}`;
      if (seen.has(idRaw)) {
        return null;
      }
      seen.add(idRaw);
      const clicks = typeof item.clicks === 'string' && item.clicks.trim().length > 0
        ? item.clicks.trim()
        : undefined;
      return {
        id: idRaw,
        title,
        url,
        clicks,
      };
    })
    .filter(Boolean)
    .slice(0, 64) as Array<{ id: string; title: string; url: string; clicks?: string }>;
};

const sanitizeThemeContainers = (value: unknown) => {
  if (!isRecord(value)) {
    return {} as Record<string, Array<{
      id: string;
      size: 'full' | 'standard' | 'profile';
      kind: 'link' | 'image' | 'widget' | 'note';
      title: string;
      subtitle?: string;
      url?: string;
      mediaUrl?: string;
    }>>;
  }

  const normalizeSize = (input: unknown): 'full' | 'standard' | 'profile' =>
    input === 'full' || input === 'standard' || input === 'profile' ? input : 'standard';
  const normalizeKind = (input: unknown): 'link' | 'image' | 'widget' | 'note' =>
    input === 'link' || input === 'image' || input === 'widget' || input === 'note' ? input : 'note';

  const out: Record<string, Array<{
    id: string;
    size: 'full' | 'standard' | 'profile';
    kind: 'link' | 'image' | 'widget' | 'note';
    title: string;
    subtitle?: string;
    url?: string;
    mediaUrl?: string;
  }>> = {};

  Object.entries(value).forEach(([themeId, raw]) => {
    if (!Array.isArray(raw)) {
      return;
    }
    const seen = new Set<string>();
    const items = raw
      .filter((item): item is Record<string, unknown> => isRecord(item))
      .map((item, index) => {
        const title = typeof item.title === 'string' ? item.title.trim() : '';
        if (!title) {
          return null;
        }
        const idRaw = typeof item.id === 'string' && item.id.trim().length > 0
          ? item.id.trim()
          : `container-${Date.now()}-${index}`;
        if (seen.has(idRaw)) {
          return null;
        }
        seen.add(idRaw);
        const subtitle = typeof item.subtitle === 'string' && item.subtitle.trim().length > 0
          ? item.subtitle.trim()
          : undefined;
        const url = typeof item.url === 'string' && item.url.trim().length > 0
          ? item.url.trim()
          : undefined;
        const mediaUrl = typeof item.mediaUrl === 'string' && item.mediaUrl.trim().length > 0
          ? item.mediaUrl.trim()
          : undefined;
        return {
          id: idRaw,
          size: normalizeSize(item.size),
          kind: normalizeKind(item.kind),
          title,
          subtitle,
          url,
          mediaUrl,
        };
      })
      .filter(Boolean)
      .slice(0, 48) as Array<{
      id: string;
      size: 'full' | 'standard' | 'profile';
      kind: 'link' | 'image' | 'widget' | 'note';
      title: string;
      subtitle?: string;
      url?: string;
      mediaUrl?: string;
    }>;
    if (items.length > 0) {
      out[themeId] = items;
    }
  });

  return out;
};

const stripCanvasMeta = (links: Record<string, string>): Record<string, string> => {
  const next = { ...links };
  delete next[META_OWNER_KEY];
  delete next[META_TEMPLATE_KEY];
  delete next[META_PUBLISHED_AT_KEY];
  delete next[META_MONETIZATION_KEY];
  delete next[META_LAYOUT_KEY];
  delete next[META_LINK_ITEMS_KEY];
  delete next[META_THEME_CONTAINERS_KEY];
  return next;
};

const sanitizeLayout = (value: unknown) => {
  const blockTypeSet = new Set([
    'hero',
    'stats',
    'links',
    'products',
    'music',
    'socials',
    'brand_collabs',
    'featured_link',
    'text',
    'image',
    'embed',
    'divider',
  ]);
  const blockTitleMap: Record<string, string> = {
    hero: 'Hero',
    stats: 'Stats',
    links: 'Link List',
    products: 'Product Grid',
    music: 'Music',
    socials: 'Social Icons',
    brand_collabs: 'Brand Collabs',
    featured_link: 'Featured Link',
    text: 'Text Block',
    image: 'Image Block',
    embed: 'Custom Embed',
    divider: 'Divider',
  };

  const createDefault = () => ({
    version: LAYOUT_SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
    blocks: [
      { id: 'hero-default', type: 'hero', title: 'Hero', position: 0, visible: true, data: {} },
      { id: 'featured-default', type: 'featured_link', title: 'Featured Link', position: 1, visible: true, data: {} },
      { id: 'links-default', type: 'links', title: 'Link List', position: 2, visible: true, data: {} },
      { id: 'socials-default', type: 'socials', title: 'Social Icons', position: 3, visible: true, data: {} },
      { id: 'stats-default', type: 'stats', title: 'Stats', position: 4, visible: true, data: {} },
    ],
  });

  if (!isRecord(value)) {
    return createDefault();
  }

  const versionParsed = Number(value.version);
  const version = Number.isFinite(versionParsed) ? Math.max(1, Math.round(versionParsed)) : LAYOUT_SCHEMA_VERSION;
  const updatedAt = typeof value.updatedAt === 'string' && value.updatedAt.length > 0 ? value.updatedAt : new Date().toISOString();
  const rawBlocks = Array.isArray(value.blocks) ? value.blocks : [];
  const seenIds = new Set<string>();
  const blocks = rawBlocks
    .filter((item): item is Record<string, unknown> => isRecord(item))
    .map((item, index) => {
      const typeRaw = typeof item.type === 'string' ? item.type : 'links';
      if (!blockTypeSet.has(typeRaw)) {
        return null;
      }
      const id = typeof item.id === 'string' && item.id.length > 0 ? item.id : `${typeRaw}-${Date.now()}-${index}`;
      if (seenIds.has(id)) {
        return null;
      }
      seenIds.add(id);
      const title = typeof item.title === 'string' && item.title.trim().length > 0 ? item.title.trim() : (blockTitleMap[typeRaw] || 'Block');
      const visible = Boolean(item.visible ?? true);
      const data = isRecord(item.data) ? item.data : {};
      return {
        id,
        type: typeRaw,
        title,
        position: index,
        visible,
        data,
      };
    })
    .filter((item): item is { id: string; type: string; title: string; position: number; visible: boolean; data: Record<string, unknown> } => Boolean(item))
    .slice(0, MAX_LAYOUT_BLOCKS);

  if (blocks.length === 0) {
    return createDefault();
  }

  if (!blocks.some((item) => item.type === 'links') && blocks.length < MAX_LAYOUT_BLOCKS) {
    blocks.push({
      id: `links-${Date.now()}`,
      type: 'links',
      title: 'Link List',
      position: blocks.length,
      visible: true,
      data: {},
    });
  }

  return {
    version,
    updatedAt,
    blocks: blocks.map((item, index) => ({ ...item, position: index })),
  };
};

const sanitizeMonetization = (value: unknown) => {
  const sanitizeBrandCollabs = (input: unknown) => {
    if (!isRecord(input)) {
      return {
        enabled: false,
        contactEmail: '',
        rateCardUrl: '',
        minBudgetUsd: 500,
        inbox: [] as Array<{
          id: string;
          brand: string;
          campaign: string;
          contactEmail: string;
          budgetUsd: number;
          timeline: string;
          deliverables: string;
          notes?: string;
          status: 'new' | 'reviewing' | 'accepted' | 'declined';
          submittedAt: string;
        }>,
      };
    }

    const rawInbox = Array.isArray(input.inbox) ? input.inbox : [];
    const inbox = rawInbox
      .filter((item): item is Record<string, unknown> => isRecord(item))
      .map((item, index) => {
        const id = typeof item.id === 'string' && item.id.length > 0 ? item.id : `${Date.now()}-deal-${index}`;
        const brand = typeof item.brand === 'string' ? item.brand.trim() : '';
        const campaign = typeof item.campaign === 'string' ? item.campaign.trim() : '';
        const contactEmail = typeof item.contactEmail === 'string' ? item.contactEmail.trim() : '';
        const budgetParsed = Number(item.budgetUsd);
        const budgetUsd = Number.isFinite(budgetParsed) ? Math.max(0, Math.round(budgetParsed * 100) / 100) : 0;
        const timeline = typeof item.timeline === 'string' ? item.timeline.trim() : '';
        const deliverables = typeof item.deliverables === 'string' ? item.deliverables.trim() : '';
        const notes = typeof item.notes === 'string' ? item.notes.trim() : '';
        const statusRaw = typeof item.status === 'string' ? item.status : 'new';
        const status = (['new', 'reviewing', 'accepted', 'declined'] as const).includes(statusRaw as any)
          ? (statusRaw as 'new' | 'reviewing' | 'accepted' | 'declined')
          : 'new';
        const submittedAt = typeof item.submittedAt === 'string' && item.submittedAt.length > 0
          ? item.submittedAt
          : new Date().toISOString();

        return {
          id,
          brand,
          campaign,
          contactEmail,
          budgetUsd,
          timeline,
          deliverables,
          notes: notes || undefined,
          status,
          submittedAt,
        };
      })
      .filter((item) => item.brand.length > 0 && item.campaign.length > 0 && item.contactEmail.length > 0);

    const minBudgetParsed = Number(input.minBudgetUsd);
    return {
      enabled: Boolean(input.enabled),
      contactEmail: typeof input.contactEmail === 'string' ? input.contactEmail.trim() : '',
      rateCardUrl: typeof input.rateCardUrl === 'string' ? input.rateCardUrl.trim() : '',
      minBudgetUsd: Number.isFinite(minBudgetParsed) ? Math.max(0, Math.round(minBudgetParsed)) : 500,
      inbox,
    };
  };

  if (!isRecord(value)) {
    return {
      tipJarEnabled: false,
      tipJarUrl: '',
      products: [] as Array<{
        id: string;
        title: string;
        description?: string;
        category: 'files' | 'presets' | 'code' | 'digital';
        priceUsd: number;
        url: string;
      }>,
      brandCollabs: sanitizeBrandCollabs(null),
    };
  }

  const rawProducts = Array.isArray(value.products) ? value.products : [];
  const products = rawProducts
    .filter((item): item is Record<string, unknown> => isRecord(item))
    .map((item, index) => {
      const id = typeof item.id === 'string' && item.id.length > 0 ? item.id : `${Date.now()}-${index}`;
      const title = typeof item.title === 'string' ? item.title.trim() : '';
      const description = typeof item.description === 'string' ? item.description.trim() : '';
      const categoryRaw = typeof item.category === 'string' ? item.category : 'digital';
      const category = (['files', 'presets', 'code', 'digital'] as const).includes(categoryRaw as any)
        ? (categoryRaw as 'files' | 'presets' | 'code' | 'digital')
        : 'digital';
      const priceParsed = Number(item.priceUsd);
      const priceUsd = Number.isFinite(priceParsed) ? Math.max(0, Math.round(priceParsed * 100) / 100) : 0;
      const url = typeof item.url === 'string' ? item.url.trim() : '';

      return { id, title, description, category, priceUsd, url };
    })
    .filter((item) => item.title.length > 0 && item.url.length > 0);

  return {
    tipJarEnabled: Boolean(value.tipJarEnabled),
    tipJarUrl: typeof value.tipJarUrl === 'string' ? value.tipJarUrl.trim() : '',
    products,
    brandCollabs: sanitizeBrandCollabs(value.brandCollabs),
  };
};

const getCanvasMonetization = (row: any) => {
  if (!isRecord(row?.links)) {
    return sanitizeMonetization(null);
  }

  const raw = row.links[META_MONETIZATION_KEY];
  if (typeof raw !== 'string' || raw.length === 0) {
    return sanitizeMonetization(null);
  }

  try {
    return sanitizeMonetization(JSON.parse(raw));
  } catch {
    return sanitizeMonetization(null);
  }
};

const getCanvasLayout = (row: any) => {
  if (!isRecord(row?.links)) {
    return sanitizeLayout(null);
  }

  const raw = row.links[META_LAYOUT_KEY];
  if (typeof raw !== 'string' || raw.length === 0) {
    return sanitizeLayout(null);
  }

  try {
    return sanitizeLayout(JSON.parse(raw));
  } catch {
    return sanitizeLayout(null);
  }
};

const getCanvasLinkItems = (row: any) => {
  if (!isRecord(row?.links)) {
    return [];
  }

  const raw = row.links[META_LINK_ITEMS_KEY];
  if (typeof raw !== 'string' || raw.length === 0) {
    return [];
  }

  try {
    return sanitizeLinkItems(JSON.parse(raw));
  } catch {
    return [];
  }
};

const getCanvasThemeContainers = (row: any) => {
  if (!isRecord(row?.links)) {
    return sanitizeThemeContainers(null);
  }
  const raw = row.links[META_THEME_CONTAINERS_KEY];
  if (typeof raw !== 'string' || raw.length === 0) {
    return sanitizeThemeContainers(null);
  }
  try {
    return sanitizeThemeContainers(JSON.parse(raw));
  } catch {
    return sanitizeThemeContainers(null);
  }
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
      linkItems: getCanvasLinkItems(row),
      themeContainers: getCanvasThemeContainers(row),
      monetization: getCanvasMonetization(row),
      layout: getCanvasLayout(row),
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
    const linkItems = sanitizeLinkItems(body?.linkItems);
    const themeContainers = sanitizeThemeContainers(body?.themeContainers);
    const monetization = sanitizeMonetization(body?.monetization);
    const layout = sanitizeLayout(body?.layout);
    const publishedAt = new Date().toISOString();
    const persistedLinks = {
      ...cleanLinks,
      [META_OWNER_KEY]: user.id,
      [META_PUBLISHED_AT_KEY]: publishedAt,
      [META_MONETIZATION_KEY]: JSON.stringify(monetization),
      [META_LAYOUT_KEY]: JSON.stringify(layout),
      [META_LINK_ITEMS_KEY]: JSON.stringify(linkItems),
      [META_THEME_CONTAINERS_KEY]: JSON.stringify(themeContainers),
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
