import { z } from 'zod';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getMethod, methodNotAllowed, parseJsonBody, sendJson } from '../../lib/server/http.js';
import { getSupabaseAdmin } from '../../lib/server/supabase-admin.js';
import { getAuthenticatedUser, isMemberUser } from '../../lib/server/auth.js';
import {
  isRecoverableSchemaError,
  sanitizeErrorDetails,
} from '../../lib/server/marketplace-utils.js';
import { writeMarketplaceAuditLog } from '../../lib/server/marketplace-audit.js';

export const config = {
  maxDuration: 60,
};

const RequestPayloadSchema = z.object({
  forceRegenerate: z.boolean().optional().default(false),
});

const ResearchDeckSlideSchema = z.object({
  slide_number: z.number().int().min(1).max(6),
  theme: z.string().trim().min(1).max(240),
  headline: z.string().trim().min(1).max(400),
  subheadline: z.string().trim().min(1).max(400),
  data_points: z.array(z.string().trim().min(1).max(500)).length(2),
  nano_banana_prompt: z.string().trim().min(1).max(4000),
});

const ResearchDeckSchema = z.array(ResearchDeckSlideSchema).length(6);

const PersistedFinalDeckSlideSchema = z.object({
  slideNumber: z.number().int().min(1).max(6),
  theme: z.string().trim().min(1).max(240),
  headline: z.string().trim().min(1).max(400),
  subheadline: z.string().trim().min(1).max(400),
  dataPoints: z.array(z.string().trim().min(1).max(500)).min(1),
  imagePrompt: z.string().trim().min(1).max(4000),
  backgroundImageBase64: z.string().trim().min(1),
});

const PersistedFinalDeckSchema = z.object({
  slides: z.array(PersistedFinalDeckSlideSchema).length(6),
});

const GeminiPhase3SlideSchema = z.object({
  slideNumber: z.number().int().min(1).max(20),
  title: z.string().trim().min(1).max(180),
  bodyText: z.string().trim().min(1).max(6000),
  metricsToHighlight: z.array(z.string().trim().min(1).max(180)).max(12).default([]),
  imagePrompt: z.string().trim().min(1).max(4000),
});

const GeminiPhase3DeckSchema = z.object({
  themeDeduced: z.string().trim().min(1).max(240),
  slides: z.array(GeminiPhase3SlideSchema).length(8),
});

const FinalDeckSlideSchema = z.object({
  slideNumber: z.number().int().min(1).max(20),
  title: z.string().trim().min(1).max(180),
  bodyText: z.string().trim().min(1).max(6000),
  metricsToHighlight: z.array(z.string().trim().min(1).max(180)).max(12).default([]),
  imagePrompt: z.string().trim().min(1).max(4000),
  backgroundImageBase64: z.string().trim().min(1),
});

const FinalDeckSchema = z.object({
  themeDeduced: z.string().trim().min(1).max(240),
  slides: z.array(FinalDeckSlideSchema).length(8),
});

const GeneratedSlideSchema = z.object({
  slideNumber: z.number().int().min(1).max(20),
  title: z.string().trim().min(2).max(140),
  copy: z.string().trim().min(20).max(3200),
  metricsToHighlight: z.array(z.string().trim().min(1).max(140)).max(8).default([]),
  nanoBananaPrompt: z.string().trim().min(20).max(2000),
});

const GeminiDeckSchema = z.object({
  slides: z.array(GeneratedSlideSchema).min(1).max(20),
});

const StoredDeckSlideSchema = GeneratedSlideSchema.extend({
  imageUrl: z.string().trim().url().optional(),
});

const StoredDeckSchema = z.object({
  generatedAt: z.string().datetime().optional(),
  model: z.string().trim().min(2).max(200).optional(),
  imageModel: z.string().trim().min(2).max(200).optional(),
  slides: z.array(StoredDeckSlideSchema).min(1),
});

const SENDER_DECK_SEQUENCE = [
  'Title',
  'Market Problem',
  'Product Solution',
  'Business Model',
  'Traction & Verification',
  'Financial Profile',
  'Acquisition Terms',
  'Closing Thesis',
] as const;

const getAssetId = (req: any): string => {
  const raw = req?.query?.assetId;
  if (typeof raw === 'string') {
    return raw;
  }
  if (Array.isArray(raw) && typeof raw[0] === 'string') {
    return raw[0];
  }
  return '';
};

const clampNonNegativeInt = (value: unknown): number => {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return Math.max(0, Math.round(numeric));
};

const dedupeNonEmpty = (values: Array<unknown>): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const normalized = String(value ?? '').trim();
    if (!normalized) {
      continue;
    }
    const key = normalized.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(normalized);
  }
  return result;
};

const formatUsd = (cents: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Math.max(0, Number(cents ?? 0)) / 100);

const formatPercent = (bps: number | null): string => {
  if (typeof bps !== 'number' || !Number.isFinite(bps)) {
    return 'N/A';
  }
  return `${(bps / 100).toFixed(1)}%`;
};

type DeckContext = {
  assetId: string;
  assetName: string;
  tagline: string;
  pitch: string;
  problem: string;
  solution: string;
  description: string;
  category: string;
  websiteUrl: string;
  askingPriceCents: number;
  mrrCents: number;
  profitMarginBps: number;
  traffic30d: number;
  expenses30dCents: number;
  netProfit30dCents: number;
  techStack: string[];
};

type DeckSlide = z.infer<typeof StoredDeckSlideSchema>;

type DeckPayload = {
  generatedAt: string;
  model: string;
  imageModel: string;
  slides: DeckSlide[];
};

const createFallbackSlides = (context: DeckContext): DeckSlide[] => {
  const metrics = {
    asking: `Ask: ${formatUsd(context.askingPriceCents)}`,
    mrr: `Verified MRR: ${formatUsd(context.mrrCents)}`,
    margin: `Margin: ${formatPercent(context.profitMarginBps)}`,
    traffic: `Traffic (30D): ${context.traffic30d.toLocaleString()}`,
    expenses: `Expenses (30D): ${formatUsd(context.expenses30dCents)}`,
    profit: `Net Profit (30D): ${formatUsd(context.netProfit30dCents)}`,
  };

  const slides: DeckSlide[] = [
    {
      slideNumber: 1,
      title: `${context.assetName} Acquisition Opportunity`,
      copy:
        `${context.assetName} is a live ${context.category} asset listed on VibeJam. `
        + `This sender deck presents the verified traction, financial profile, and acquisition terms for a high-conviction buyer review.`,
      metricsToHighlight: [metrics.asking, metrics.mrr, metrics.margin],
      nanoBananaPrompt:
        `Cinematic dark-mode venture capital presentation background, premium SaaS acquisition theme, neon cyan and gold accents, subtle grid, 16:9, ultra-detailed, no text.`,
    },
    {
      slideNumber: 2,
      title: 'Market Problem',
      copy: context.problem || `${context.category} buyers and teams face fragmented workflows, high switching costs, and poor tooling reliability.`,
      metricsToHighlight: [context.category, metrics.traffic],
      nanoBananaPrompt:
        `Moody enterprise workflow pain visualization, dark modern UI fragments, bottleneck concept, cinematic lighting, 16:9, no text.`,
    },
    {
      slideNumber: 3,
      title: 'Product Solution',
      copy:
        context.solution
        || context.pitch
        || context.description
        || `${context.assetName} delivers a focused solution with measurable retention and practical workflow improvements.`,
      metricsToHighlight: [metrics.mrr, metrics.margin],
      nanoBananaPrompt:
        `Futuristic product interface composition, dark premium SaaS dashboard, glowing success indicators, cinematic depth, 16:9, no text.`,
    },
    {
      slideNumber: 4,
      title: 'Business Model',
      copy:
        `${context.assetName} monetizes through recurring revenue with clean unit economics and room for pricing optimization post-acquisition.`,
      metricsToHighlight: [metrics.mrr, metrics.expenses, metrics.profit],
      nanoBananaPrompt:
        `Elegant financial model abstraction with charts and recurring revenue motifs, dark luxury style, neon accents, 16:9, no text.`,
    },
    {
      slideNumber: 5,
      title: 'Traction & Verification',
      copy:
        `VibeJam verifies traction directly from connected providers and operating signals, giving buyers an API-grounded view of business momentum.`,
      metricsToHighlight: [metrics.mrr, metrics.traffic, metrics.margin],
      nanoBananaPrompt:
        `High-trust verification control center visual, dark cybersecurity aesthetics, glowing validation badges, 16:9, no text.`,
    },
    {
      slideNumber: 6,
      title: 'Financial Profile',
      copy:
        `${context.assetName} currently tracks ${formatUsd(context.mrrCents)} in MRR with `
        + `${formatPercent(context.profitMarginBps)} profitability and disciplined monthly operating costs.`,
      metricsToHighlight: [metrics.mrr, metrics.expenses, metrics.profit, metrics.margin],
      nanoBananaPrompt:
        `Institutional-grade financial dashboard scene, dark marble and glass textures, emerald KPI lines, cinematic 16:9, no text.`,
    },
    {
      slideNumber: 7,
      title: 'Acquisition Terms',
      copy:
        `Seller is seeking ${formatUsd(context.askingPriceCents)} for full ownership transfer. `
        + `Transaction can proceed via VibeJam Deal Room with LOI/APA flow and Escrow.com settlement.`,
      metricsToHighlight: [metrics.asking, 'Escrow.com supported'],
      nanoBananaPrompt:
        `Premium M&A deal room aesthetic, secure escrow vault motif, dark cinematic environment with gold highlights, 16:9, no text.`,
    },
    {
      slideNumber: 8,
      title: 'Closing Thesis',
      copy:
        `${context.assetName} offers an attractive buyout profile: proven monetization, verified operating data, and a structured close path for serious acquirers.`,
      metricsToHighlight: [metrics.asking, metrics.mrr, metrics.margin],
      nanoBananaPrompt:
        `Triumphant acquisition finale visual, dark premium stage lighting, subtle upward motion graphics style, 16:9, no text.`,
    },
  ];

  return slides;
};

const normalizeSlides = (candidate: z.infer<typeof GeneratedSlideSchema>[], fallback: DeckSlide[]): DeckSlide[] =>
  SENDER_DECK_SEQUENCE.map((defaultTitle, index) => {
    const source = candidate[index] ?? fallback[index];
    const fallbackSlide = fallback[index];
    const metrics = Array.isArray(source?.metricsToHighlight)
      ? source.metricsToHighlight.map((item) => String(item ?? '').trim()).filter(Boolean).slice(0, 8)
      : fallbackSlide.metricsToHighlight;

    return {
      slideNumber: index + 1,
      title: String(source?.title ?? '').trim() || defaultTitle,
      copy: String(source?.copy ?? '').trim() || fallbackSlide.copy,
      metricsToHighlight: metrics.length > 0 ? metrics : fallbackSlide.metricsToHighlight,
      nanoBananaPrompt: String(source?.nanoBananaPrompt ?? '').trim() || fallbackSlide.nanoBananaPrompt,
      imageUrl: fallbackSlide.imageUrl,
    };
  });

const buildGeminiPrompt = (context: DeckContext): string => {
  const payload = {
    asset: {
      id: context.assetId,
      name: context.assetName,
      tagline: context.tagline,
      category: context.category,
      websiteUrl: context.websiteUrl,
      techStack: context.techStack,
    },
    narrative: {
      pitch: context.pitch,
      problem: context.problem,
      solution: context.solution,
      description: context.description,
    },
    metrics: {
      askingPriceUsd: formatUsd(context.askingPriceCents),
      mrrUsd: formatUsd(context.mrrCents),
      profitMarginPercent: formatPercent(context.profitMarginBps),
      traffic30d: context.traffic30d,
      expenses30dUsd: formatUsd(context.expenses30dCents),
      netProfit30dUsd: formatUsd(context.netProfit30dCents),
    },
    requiredSlideSequence: SENDER_DECK_SEQUENCE,
  };

  return [
    'You are a top-tier M&A investment banker and elite pitch strategist.',
    'Build an 8-slide Sender Deck for acquisition outreach.',
    'Output STRICT JSON only. No markdown. No explanation outside JSON.',
    'Follow this exact schema:',
    '{"slides":[{"slideNumber":1,"title":"...","copy":"...","metricsToHighlight":["..."],"nanoBananaPrompt":"..."}]}',
    'Rules:',
    '- Exactly 8 slides in the exact required sequence.',
    '- Sender deck copy should be detailed, persuasive, and buyer-facing.',
    '- metricsToHighlight should be crisp and acquisition-relevant.',
    '- nanoBananaPrompt must be highly descriptive for cinematic dark-mode visuals and always include 16:9 composition intent.',
    '- Do not invent unavailable facts. Stay aligned with input.',
    `INPUT:\n${JSON.stringify(payload, null, 2)}`,
  ].join('\n');
};

const resolveGoogleImageApiKey = (): string => {
  const key =
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim()
    || process.env.NANO_BANANA_API_KEY?.trim()
    || process.env.GEMINI_API_KEY?.trim();

  return key || '';
};

const parseImagenBase64 = (payload: any): string | null => {
  const predictions = Array.isArray(payload?.predictions) ? payload.predictions : [];
  const first = predictions[0];
  const encoded = typeof first?.bytesBase64Encoded === 'string' ? first.bytesBase64Encoded.trim() : '';
  if (!encoded) {
    return null;
  }
  return encoded;
};

const stripJsonFences = (raw: string): string => {
  const trimmed = String(raw ?? '').trim();
  if (!trimmed.startsWith('```')) {
    return trimmed;
  }

  return trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
};

export default async function handler(req: any, res: any) {
  try {
    const method = getMethod(req);
    if (method !== 'POST' && method !== 'GET') {
      return methodNotAllowed(res, ['GET', 'POST']);
    }

    const assetId = getAssetId(req);
    if (!assetId) {
      return sendJson(res, 400, { error: 'Missing asset id.' });
    }

    const supabase = await getSupabaseAdmin();

    if (method === 'GET') {
      const viewer = await getAuthenticatedUser(req);
      const canViewMembers = isMemberUser(viewer);

      const fetchDeckAsset = async (selectClause: string) =>
        supabase
          .from('marketplace_assets')
          .select(selectClause)
          .eq('id', assetId)
          .limit(1)
          .maybeSingle();

      let assetResult = await fetchDeckAsset(
        'id, owner_user_id, pitch_decks, is_listed, listing_status, status, visibility',
      );

      if (assetResult.error && isRecoverableSchemaError(assetResult.error)) {
        assetResult = await fetchDeckAsset('id, owner_user_id, pitch_decks, is_listed, listing_status, visibility');
      }

      if (assetResult.error && isRecoverableSchemaError(assetResult.error)) {
        assetResult = await fetchDeckAsset('id, owner_user_id, pitch_decks, is_listed');
      }

      if (assetResult.error) {
        throw assetResult.error;
      }

      const asset = assetResult.data;
      if (!asset) {
        return sendJson(res, 404, { error: 'Marketplace asset not found.' });
      }

      const isOwner = Boolean(viewer?.id && asset.owner_user_id === viewer.id);
      const listingStatus = String((asset as any).listing_status ?? (asset as any).status ?? '').toUpperCase();
      const isListed = asset.is_listed === true || listingStatus === 'LISTED' || listingStatus === 'LIVE';
      const visibility = String((asset as any).visibility ?? 'public').toLowerCase();

      if (!isOwner) {
        if (!isListed || visibility === 'private') {
          return sendJson(res, 404, { error: 'Pitch deck not available.' });
        }

        if (visibility === 'members_only' && !canViewMembers) {
          return sendJson(res, 403, { error: 'Membership required to view this pitch deck.' });
        }
      }

      const existingDecks = StoredDeckSchema.safeParse((asset as any).pitch_decks ?? null);
      if (!existingDecks.success) {
        return sendJson(res, 404, {
          error: 'Pitch deck has not been generated yet.',
          details: 'Generate this deck from the seller console first.',
        });
      }

      return sendJson(res, 200, {
        data: {
          assetId: String(asset.id),
          reused: true,
          pitchDecks: existingDecks.data,
        },
      });
    }

    const user = await getAuthenticatedUser(req);
    if (!user?.id) {
      return sendJson(res, 401, { error: 'Authentication required.' });
    }

    const body = await parseJsonBody(req);
    const payload = RequestPayloadSchema.safeParse(body);
    if (!payload.success) {
      return sendJson(res, 400, {
        error: 'Invalid request payload.',
        details: payload.error.issues[0]?.message,
      });
    }

    const { data: asset, error: assetError } = await supabase
      .from('marketplace_assets')
      .select(
        [
          'id',
          'owner_user_id',
          'jam_id',
          'name',
          'title',
          'tagline',
          'description',
          'website_url',
          'category',
          'tech_stack',
          'asking_price_cents',
          'last30d_revenue_cents',
          'mrr_cents',
          'trailing_30d_expenses_cents',
          'trailing_30d_profit_cents',
          'profit_margin_bps',
          'monthly_unique_visitors',
          'pitch_decks',
          'generated_deck_json',
        ].join(','),
      )
      .eq('id', assetId)
      .limit(1)
      .maybeSingle();

    if (assetError) {
      if (isRecoverableSchemaError(assetError)) {
        return sendJson(res, 503, {
          error: 'Pitch deck schema is not ready yet.',
          details: 'Run the latest Supabase migration to enable pitch deck storage.',
        });
      }
      throw assetError;
    }

    if (!asset || asset.owner_user_id !== user.id) {
      return sendJson(res, 404, { error: 'Marketplace asset not found.' });
    }

    const existingGeneratedDeck = FinalDeckSchema.safeParse((asset as any).generated_deck_json ?? null);
    if (!payload.data.forceRegenerate && existingGeneratedDeck.success) {
      return sendJson(res, 200, {
        data: {
          assetId: String(asset.id),
          reused: true,
          pitchDecks: existingGeneratedDeck.data,
        },
        deck: existingGeneratedDeck.data,
      });
    }

    const existingDecks = StoredDeckSchema.safeParse(asset.pitch_decks ?? null);
    if (!payload.data.forceRegenerate && existingDecks.success) {
      return sendJson(res, 200, {
        data: {
          assetId: String(asset.id),
          reused: true,
          pitchDecks: existingDecks.data,
        },
      });
    }

    const [{ data: jam, error: jamError }, { data: snapshots, error: snapshotsError }] = await Promise.all([
      asset.jam_id
        ? supabase
            .from('jams')
            .select('id,pitch,problem,solution,monthly_revenue,monthly_expenses_cents,tech_stack,website_url')
            .eq('id', asset.jam_id)
            .limit(1)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      supabase
        .from('revenue_snapshots')
        .select('period_end,revenue_cents,mrr_cents,churn_bps')
        .eq('asset_id', asset.id)
        .order('period_end', { ascending: false })
        .limit(12),
    ]);

    if (jamError && !isRecoverableSchemaError(jamError)) {
      throw jamError;
    }
    if (snapshotsError && !isRecoverableSchemaError(snapshotsError)) {
      throw snapshotsError;
    }

    const latestSnapshot = Array.isArray(snapshots) && snapshots.length > 0 ? snapshots[0] : null;

    const verifiedMrrCents = Math.max(
      clampNonNegativeInt(asset.mrr_cents),
      clampNonNegativeInt(latestSnapshot?.mrr_cents),
    );

    const last30dRevenueCents = Math.max(
      clampNonNegativeInt((asset as any).last30d_revenue_cents),
      clampNonNegativeInt(latestSnapshot?.revenue_cents),
    );

    const expenses30dCents = Math.max(
      clampNonNegativeInt(asset.trailing_30d_expenses_cents),
      clampNonNegativeInt(jam?.monthly_expenses_cents),
    );

    const netProfit30dCents = Math.max(
      clampNonNegativeInt(asset.trailing_30d_profit_cents),
      verifiedMrrCents - expenses30dCents,
    );

    const computedMarginBps = verifiedMrrCents > 0 ? Math.round((netProfit30dCents / verifiedMrrCents) * 10_000) : 0;

    const rawIntelligencePayload = {
      project_name: String(asset.title ?? asset.name ?? 'Untitled Asset').trim() || 'Untitled Asset',
      website_url: String(asset.website_url ?? jam?.website_url ?? '').trim() || null,
      category: String(asset.category ?? '').trim() || null,
      verified_mrr: verifiedMrrCents,
      last_30d_revenue: last30dRevenueCents,
      profit_margin: clampNonNegativeInt(asset.profit_margin_bps) || computedMarginBps,
      monthly_expenses: expenses30dCents,
      active_users: clampNonNegativeInt(asset.monthly_unique_visitors),
      asking_price: clampNonNegativeInt(asset.asking_price_cents),
      tech_stack: dedupeNonEmpty([...(asset.tech_stack ?? []), ...(jam?.tech_stack ?? [])]),
      founder_pitch: String(jam?.pitch ?? asset.tagline ?? asset.description ?? '').trim() || null,
    };

    const rawIntelligencePayloadJson = JSON.stringify(rawIntelligencePayload, null, 2);

    const apiKey = process.env.GOOGLE_AI_MASTER_KEY?.trim();
    if (!apiKey) {
      return sendJson(res, 500, { error: 'GOOGLE_AI_MASTER_KEY is not configured.' });
    }

    const systemPrompt = `You are an elite Private Equity Analyst and M&A Due Diligence AI. Your objective is to take raw, minimal data provided by a startup founder, autonomously research the gaps using Google Search, and output a highly analytical, 6-slide Acquisition Pitch Deck.

Do NOT use marketing fluff (e.g., "revolutionary", "magic"). Use clinical, investment-grade business terminology (LTV, CAC, Moat, Arbitrage, EBITDA).

### RAW INTELLIGENCE PAYLOAD (From VibeJam API):
${rawIntelligencePayloadJson}

### YOUR REQUIRED CHAIN OF THOUGHT & RESEARCH:
1. SCRAPE: Analyze the \`website_url\` and \`founder_pitch\` to strictly define what this product does.
2. FINANCIAL MATH: Calculate the Annualized Run Rate (ARR) based on MRR. Calculate the Valuation Multiple (Asking Price / ARR).
3. MARKET SIZING: Use your real-time search capabilities to estimate the Total Addressable Market (TAM) for the \`category\` and identify two direct competitors.
4. TECH ANALYSIS: Look at the \`tech_stack\` and define why this specific stack is scalable or defensible.

### OUTPUT SCHEMA:
Return ONLY a valid JSON array of 6 slide objects. Follow this exact structure:

[
  {
    "slide_number": 1,
    "theme": "The Asset (Executive Summary)",
    "headline": "[Project Name] - [Precise 3-word category description, e.g., B2B Legal API]",
    "subheadline": "Verified at $[ARR] ARR | [Margin]% Margin | [Calculated Valuation Multiple]x Multiple",
    "data_points": [
      "Strict definition of the product derived from the URL scrape.",
      "The core value proposition translated from the founder's pitch."
    ],
    "nano_banana_prompt": "A brutalist industrial macro shot representing [Product Category], Pitch Black and Safety Yellow (#FEE101), heavy film grain, technical blueprint overlay, 8k --ar 16:9"
  },
  {
    "slide_number": 2,
    "theme": "Financial Health & Unit Economics",
    "headline": "Zero-BS Financial Verification",
    "subheadline": "API-Verified via VibeJam Escrow Protocol.",
    "data_points": [
      "Verified MRR: $[MRR] | TTM Revenue Projection: $[ARR]",
      "Monthly OPEX: $[Expenses] | Net Profit Margin: [Margin]%",
      "Active User Base: [Active Users]"
    ],
    "nano_banana_prompt": "Abstract brutalist data visualization of financial growth charts, thick yellow API lines on pitch black background, monospace data overlay, heavy noise --ar 16:9"
  },
  {
    "slide_number": 3,
    "theme": "Market Dynamics & TAM",
    "headline": "The Market Gap in [Category]",
    "subheadline": "Estimated TAM: $[Autonomously Researched TAM Value]",
    "data_points": [
      "Detail the specific industry pain point this product solves.",
      "Explain the macro-trend driving demand in this sector based on current market research."
    ],
    "nano_banana_prompt": "Brutalist editorial illustration of a targeted radar or crosshair locking onto a target, pitch black and safety yellow, technical UI, grainy --ar 16:9"
  },
  {
    "slide_number": 4,
    "theme": "The Defensible Moat (Infrastructure)",
    "headline": "Technical Architecture",
    "subheadline": "Built for scale with [Tech Stack].",
    "data_points": [
      "Analyze the [Tech Stack] and explain its specific scalability/cost advantages.",
      "Identify the 'unforkable' component or IP moat of the project."
    ],
    "nano_banana_prompt": "High-contrast geometric diagram of server nodes, hacker terminal aesthetic, yellow connection lines on black background, brutalist --ar 16:9"
  },
  {
    "slide_number": 5,
    "theme": "Competitive Positioning",
    "headline": "Positioning Matrix",
    "subheadline": "Disrupting [Researched Competitor 1] and [Researched Competitor 2].",
    "data_points": [
      "How this asset wins against [Competitor 1] (e.g., UX, Price, Niche focus).",
      "How this asset wins against [Competitor 2]."
    ],
    "nano_banana_prompt": "Minimalist aggressive graphic of a glowing yellow wedge splitting a solid black block, industrial power dynamic, high noise --ar 16:9"
  },
  {
    "slide_number": 6,
    "theme": "Asymmetric Upside (Growth Levers)",
    "headline": "The Post-Acquisition Playbook",
    "subheadline": "Immediate arbitrage opportunities for the new owner.",
    "data_points": [
      "Suggest Growth Lever 1 based on the product's nature (e.g., SEO expansion, Programmatic Ads).",
      "Suggest Growth Lever 2 (e.g., Pricing optimization, B2B enterprise tier)."
    ],
    "nano_banana_prompt": "Brutalist icon of a heavy industrial switch flipped to the ON position, glowing safety yellow on pitch black, UI graphic, tactile grain --ar 16:9"
  }
]`;

    const configuredGeminiModel = String(process.env.GEMINI_MODEL ?? '')
      .trim()
      .toLowerCase();
    const geminiModel =
      configuredGeminiModel === 'gemini-3.1-pro'
        ? 'gemini-3.1-pro-preview'
        : configuredGeminiModel || 'gemini-3.1-pro-preview';

    const genAI = new GoogleGenerativeAI(apiKey);
    let deckDraft: z.infer<typeof ResearchDeckSchema>;
    try {
      const model = genAI.getGenerativeModel({ model: geminiModel });
      const result = await model.generateContent(systemPrompt);
      const rawText = result.response.text();
      deckDraft = ResearchDeckSchema.parse(JSON.parse(stripJsonFences(rawText)));
    } catch (generationError) {
      return sendJson(res, 500, {
        error: 'Deck generation failed.',
        details: sanitizeErrorDetails(generationError),
      });
    }

    if (!Array.isArray(deckDraft) || deckDraft.length !== 6) {
      return sendJson(res, 500, {
        error: 'Deck normalization failed.',
        details: 'Gemini output did not contain exactly 6 validated slides.',
      });
    }

    const normalizedSlides = deckDraft.map((slide) => ({
      slideNumber: slide.slide_number,
      theme: slide.theme,
      headline: slide.headline,
      subheadline: slide.subheadline,
      dataPoints: slide.data_points,
      imagePrompt: slide.nano_banana_prompt,
    }));

    if (!Array.isArray(normalizedSlides) || normalizedSlides.length !== 6) {
      return sendJson(res, 500, {
        error: 'Slide image generation failed.',
        details: 'Normalized deck must contain exactly 6 slides before image generation.',
      });
    }

    const configuredNanoBananaModel = String(
      process.env.NANO_BANANA_MODEL ?? process.env.GOOGLE_IMAGEN_MODEL ?? '',
    )
      .trim()
      .toLowerCase();
    const nanoBananaModel = configuredNanoBananaModel || 'nano-banana-2';

    let slidesWithBackgrounds: Array<{
      slideNumber: number;
      theme: string;
      headline: string;
      subheadline: string;
      dataPoints: string[];
      imagePrompt: string;
      backgroundImageBase64: string;
    }>;
    try {
      slidesWithBackgrounds = await Promise.all(
        normalizedSlides.map(async (slide) => {
          const prompt = String(slide.imagePrompt ?? '').trim();
          if (!prompt) {
            throw new Error(`Slide ${slide.slideNumber} is missing imagePrompt.`);
          }

          const imageResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(nanoBananaModel)}:predict?key=${encodeURIComponent(apiKey)}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                instances: [{ prompt }],
                parameters: {
                  sampleCount: 1,
                  aspectRatio: '16:9',
                },
              }),
            },
          );

          const imageRaw = await imageResponse.text();
          let imageParsed: any = null;
          try {
            imageParsed = imageRaw ? JSON.parse(imageRaw) : null;
          } catch {
            imageParsed = null;
          }

          if (!imageResponse.ok) {
            throw new Error(
              `Slide ${slide.slideNumber} image generation failed: Nano Banana 2 API ${imageResponse.status} ${
                (imageParsed && JSON.stringify(imageParsed).slice(0, 500)) || imageRaw.slice(0, 500) || 'No response body.'
              }`,
            );
          }

          const backgroundImageBase64 = parseImagenBase64(imageParsed);
          if (!backgroundImageBase64) {
            throw new Error(
              `Slide ${slide.slideNumber} image extraction failed: missing predictions[0].bytesBase64Encoded.`,
            );
          }

          return {
            ...slide,
            backgroundImageBase64,
          };
        }),
      );
    } catch (imageError) {
      return sendJson(res, 500, {
        error: 'Slide image generation failed.',
        details: sanitizeErrorDetails(imageError),
      });
    }

    const finalDeckResult = PersistedFinalDeckSchema.safeParse({
      slides: slidesWithBackgrounds,
    });
    if (!finalDeckResult.success) {
      return sendJson(res, 500, {
        error: 'Deck validation failed.',
        details: finalDeckResult.error.issues[0]?.message ?? 'Final deck shape is invalid.',
      });
    }

    const finalDeck = finalDeckResult.data;

    const { error: persistError } = await supabase
      .from('marketplace_assets')
      .update({
        generated_deck_json: finalDeck,
      })
      .eq('id', assetId)
      .eq('owner_user_id', user.id);

    if (persistError) {
      if (isRecoverableSchemaError(persistError)) {
        return sendJson(res, 503, {
          error: 'Deck persistence failed.',
          details: 'Run the latest Supabase migration to add marketplace_assets.generated_deck_json.',
        });
      }
      return sendJson(res, 500, {
        error: 'Deck persistence failed.',
        details: sanitizeErrorDetails(persistError),
      });
    }

    return sendJson(res, 200, {
      deck: finalDeck,
    });
  } catch (error) {
    return sendJson(res, 500, {
      error: 'Failed to generate AI pitch deck.',
      details: sanitizeErrorDetails(error),
    });
  }
}
