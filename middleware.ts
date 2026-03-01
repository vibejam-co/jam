const BOT_UA_REGEX =
  /twitterbot|facebookexternalhit|slackbot|discordbot|linkedinbot|whatsapp|telegrambot|skypeuripreview|applebot|pinterest|googlebot/i;
const ASSET_PATH_REGEX = /^\/(assets|acquire)\/([^/?#]+)/i;
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface AssetMeta {
  title: string;
  mrrCents: number;
  askingPriceCents: number;
  profitMarginBps: number;
}

const parseCents = (value: unknown): number => {
  const parsed = Number(value ?? 0);
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  return Math.max(0, Math.round(parsed));
};

const parseBps = (value: unknown): number => {
  const parsed = Number(value ?? 0);
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  return Math.round(parsed);
};

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatUsd = (cents: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(cents / 100);

const toPercentFromBps = (bps: number): string => `${(bps / 100).toFixed(1)}%`;

const stripExistingSeoTags = (html: string): string =>
  html
    .replace(/<title[^>]*>[\s\S]*?<\/title>\s*/i, '')
    .replace(/<meta[^>]+property=["']og:[^"']+["'][^>]*>\s*/gi, '')
    .replace(/<meta[^>]+name=["']twitter:[^"']+["'][^>]*>\s*/gi, '');

const injectIntoHead = (html: string, tags: string): string => {
  if (!/<head[^>]*>/i.test(html)) {
    return html;
  }
  return html.replace(/<head([^>]*)>/i, `<head$1>\n${tags}\n`);
};

const getSupabaseConfig = () => {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const key =
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    '';

  if (!url || !key) {
    return null;
  }

  return { url: url.replace(/\/$/, ''), key };
};

const buildAssetQueryUrl = (baseUrl: string, identifier: string): string => {
  const params = new URLSearchParams({
    select:
      'id,slug,title,name,mrr_cents,asking_price_cents,profit_margin_bps,is_listed,listing_status,visibility',
    limit: '1',
  });

  if (UUID_REGEX.test(identifier)) {
    params.set('id', `eq.${identifier}`);
  } else {
    params.set('slug', `eq.${identifier}`);
  }

  return `${baseUrl}/rest/v1/marketplace_assets?${params.toString()}`;
};

const isPublicListed = (row: any): boolean => {
  const visibility = String(row?.visibility ?? '').toLowerCase();
  const listingStatus = String(row?.listing_status ?? '').toUpperCase();
  const listed = row?.is_listed === true || listingStatus === 'LISTED' || listingStatus === 'LIVE';
  return listed && (visibility === '' || visibility === 'public');
};

const fetchAssetMeta = async (identifier: string): Promise<AssetMeta | null> => {
  const supabase = getSupabaseConfig();
  if (!supabase) {
    return null;
  }

  try {
    const response = await fetch(buildAssetQueryUrl(supabase.url, identifier), {
      method: 'GET',
      headers: {
        apikey: supabase.key,
        Authorization: `Bearer ${supabase.key}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    const payload = await response.json();
    const row = Array.isArray(payload) ? payload[0] : null;
    if (!row || !isPublicListed(row)) {
      return null;
    }

    const title = String(row.title || row.name || 'VibeJam Marketplace Asset').trim();
    return {
      title: title.slice(0, 100),
      mrrCents: parseCents(row.mrr_cents),
      askingPriceCents: parseCents(row.asking_price_cents),
      profitMarginBps: parseBps(row.profit_margin_bps),
    };
  } catch {
    return null;
  }
};

const buildOgImageUrl = (origin: string, asset: AssetMeta): string => {
  const url = new URL('/api/og', origin);
  url.searchParams.set('title', asset.title);
  url.searchParams.set('mrr', String(asset.mrrCents / 100));
  url.searchParams.set('askingPrice', String(asset.askingPriceCents / 100));
  url.searchParams.set('margin', String(asset.profitMarginBps / 100));
  return url.toString();
};

const buildSeoTags = (pageUrl: string, imageUrl: string, asset: AssetMeta | null): string => {
  const title = asset ? `${asset.title} | VibeJam` : 'VibeJam Marketplace | Verified Revenue Deals';
  const description = asset
    ? `Verified revenue ${formatUsd(asset.mrrCents)}/mo. Asking ${formatUsd(asset.askingPriceCents)}. Profit margin ${toPercentFromBps(asset.profitMarginBps)}.`
    : 'Discover verified software assets on VibeJam with transparent MRR, pricing, and margin metrics.';

  const escapedTitle = escapeHtml(title);
  const escapedDescription = escapeHtml(description);
  const escapedImage = escapeHtml(imageUrl);
  const escapedPage = escapeHtml(pageUrl);

  return [
    `<title>${escapedTitle}</title>`,
    `<meta name="description" content="${escapedDescription}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${escapedTitle}" />`,
    `<meta property="og:description" content="${escapedDescription}" />`,
    `<meta property="og:url" content="${escapedPage}" />`,
    `<meta property="og:image" content="${escapedImage}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapedTitle}" />`,
    `<meta name="twitter:description" content="${escapedDescription}" />`,
    `<meta name="twitter:image" content="${escapedImage}" />`,
  ].join('\n');
};

export const config = {
  matcher: ['/assets/:path*', '/acquire/:path*'],
};

export default async function middleware(request: Request) {
  const url = new URL(request.url);
  const routeMatch = ASSET_PATH_REGEX.exec(url.pathname);

  if (!routeMatch) {
    return;
  }

  const userAgent = request.headers.get('user-agent') || '';
  if (!BOT_UA_REGEX.test(userAgent)) {
    return;
  }

  const identifier = decodeURIComponent(routeMatch[2] || '').trim();
  const asset = identifier ? await fetchAssetMeta(identifier) : null;

  const fallbackAsset: AssetMeta = asset || {
    title: 'VibeJam Marketplace Asset',
    mrrCents: 0,
    askingPriceCents: 0,
    profitMarginBps: 0,
  };

  const ogImageUrl = buildOgImageUrl(url.origin, fallbackAsset);
  const seoTags = buildSeoTags(url.toString(), ogImageUrl, asset);

  const upstream = await fetch(new URL('/index.html', url.origin).toString(), {
    headers: {
      accept: 'text/html',
    },
  });

  const contentType = upstream.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) {
    return upstream;
  }

  const html = await upstream.text();
  const withTags = injectIntoHead(stripExistingSeoTags(html), seoTags);

  const headers = new Headers(upstream.headers);
  headers.set('content-type', 'text/html; charset=utf-8');
  headers.set('cache-control', 'public, s-maxage=120, stale-while-revalidate=300');
  headers.delete('content-length');

  return new Response(withTags, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  });
}
