import { z } from 'zod';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { getMethod, methodNotAllowed, parseJsonBody, sendJson } from '../../lib/server/http.js';
import { getSupabaseAdmin } from '../../lib/server/supabase-admin.js';
import { getAuthenticatedUser, isMemberUser } from '../../lib/server/auth.js';
import { isRecoverableSchemaError, sanitizeErrorDetails } from '../../lib/server/marketplace-utils.js';

export const config = {
  maxDuration: 300,
};

const RequestPayloadSchema = z.object({
  forceRegenerate: z.boolean().optional().default(false),
});

const RawIntelligencePayloadSchema = z.object({
  project_name: z.string().trim().min(1),
  website_url: z.string().trim().nullable(),
  website_context_text: z.string().trim().nullable(),
  website_context_note: z.string().trim().min(1),
  category: z.string().trim().nullable(),
  verified_mrr: z.number().int().nonnegative(),
  last_30d_revenue: z.number().int().nonnegative(),
  profit_margin: z.number().int().nonnegative(),
  monthly_expenses: z.number().int().nonnegative(),
  active_users: z.number().int().nonnegative(),
  asking_price: z.number().int().nonnegative(),
  tech_stack: z.array(z.string().trim().min(1)).default([]),
  founder_pitch: z.string().trim().nullable(),
});

const UnifiedAnalysisSchema = z.object({
  truthSummary: z.string().trim().min(1).max(2500),
  marketResearchFindings: z.string().trim().min(1).max(3500),
  buyerCaseSummary: z.string().trim().min(1).max(2500),
  qualityScore: z.preprocess((value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return value;
    }
    return Math.max(1, Math.min(10, Math.round(numeric)));
  }, z.number().int().min(1).max(10)),
});

const UnifiedSlideSchema = z.object({
  slideNumber: z.number().int().min(1).max(6),
  theme: z.string().trim().min(1).max(240),
  headline: z.string().trim().min(1).max(420),
  subheadline: z.string().trim().min(1).max(520),
  dataPoints: z.array(z.string().trim().min(1).max(500)).min(2).max(3),
  nanoBananaPrompt: z.string().trim().min(1).max(8000),
});

const UnifiedDeckSchema = z.object({
  analysis: UnifiedAnalysisSchema,
  slides: z.array(UnifiedSlideSchema).length(6).superRefine((slides, ctx) => {
    slides.forEach((slide, index) => {
      if (slide.slideNumber !== index + 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `slideNumber must be ${index + 1} at index ${index}.`,
        });
      }
    });
  }),
});

const FinalDeckSlideSchema = UnifiedSlideSchema.extend({
  backgroundImageBase64: z.string().trim().min(1),
});

const FinalDeckSchema = z.object({
  analysis: UnifiedAnalysisSchema,
  slides: z.array(FinalDeckSlideSchema).length(6).superRefine((slides, ctx) => {
    slides.forEach((slide, index) => {
      if (slide.slideNumber !== index + 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `slideNumber must be ${index + 1} at index ${index}.`,
        });
      }
    });
  }),
});

const UNIFIED_DECK_SYSTEM_INSTRUCTION = `You are a dual-role AI:
1) an elite M&A due diligence analyst
2) a high-end editorial art director

Use the provided raw intelligence payload as the core source of truth.
Use Google Search grounding to verify market context, current TAM framing, and relevant competitors.
Do not invent traction, moat, pricing logic, or market facts.
Stay honest about weak numbers and uncertainty.

Write 6 buyer-facing slides in plain English for a smart 10th grader.
Use short sentences. Keep one clear point per slide.
Avoid banker jargon, consultant jargon, startup buzzwords, hype, and robotic phrasing.

Content quality rules:
- Prioritize clarity over clever language.
- Keep the product narrative ownable and specific, not generic.
- Describe the actual interaction model, not broad "community" claims.
- When relevant, explain private space, owned audience, trust-first interaction, focused participation, and intentional smaller groups.
- Keep weak metrics, weak moat, and weak pricing logic visible, but do not use self-sabotaging phrasing when a fair truthful framing exists.
- Reduce repetition of "codebase", "foundation", "asset", "built shell", and "ready-made platform". These ideas can appear, but must not dominate the deck.
- Do not reuse the same framing across too many slides. Vary by product interaction, user behavior, buyer fit, activation path, and niche advantage.
- Avoid language that is technically honest but commercially deflating unless strictly required by facts.
- Reduce or avoid phrases like: blank-slate, empty container, day zero, nothing there, no reason to care, financially meaningless, dead product.

Slide-specific copy guidance:
- Slide 1 (Identity): define what kind of product this is, what kind of interaction it supports, and why it is different from generic social/community software. Make it distinctive and ownable without hype.
- Slide 4 (Moat/Product Truth): explain the strongest believable product edge in a product-native way, why that design might matter, and what is still weak or unproven. Do not overstate defensibility.
- Slide 6 (Path to Value): give a specific and believable path to value. Clarify the first real wedge, the kind of operator who can unlock it, and the practical next step that turns product usage into a business.

For visuals, provide one Nano Banana prompt per slide using natural-language art direction.
Visual philosophy:
- premium, minimal, cinematic editorialism
- financial honesty
- 60/40 asymmetry
- left side pure dark negative space for text
- one strong symbolic visual anchor per slide
- image supports the slide and does not compete with it

Hard bans:
- no fake charts
- no fake dashboards
- no fake UI
- no pseudo-infographics
- no generic hero-object filler
- no noisy clutter under the text zone

Output strict JSON only, matching the required schema exactly.`;

const UNIFIED_DECK_USER_PROMPT = `Generate one unified deck package from the input payload.

Requirements:
- Return one analysis object and exactly 6 slides.
- Slide order must be 1 through 6.
- dataPoints must contain exactly 2 or 3 short bullets.
- Keep buyer logic grounded and honest.
- Use grounded market context, but do not overstate confidence.
- Keep wording commercially fair: honest but not needlessly punishing.
- Keep Slide 1 specific and ownable, not generic.
- Make Slide 4 deeper and more product-native, with clear edge and clear weakness.
- Make Slide 6 concrete with a realistic first wedge, operator fit, and practical next step.
- Avoid repetitive "codebase/foundation/asset" framing across multiple slides.
- Make Nano Banana prompts scene-based, material-aware, composition-aware, lighting-aware, and mood-aware.
- Enforce 16:9 framing with left-side dark text-safe space and right-side focal composition.
- Do not include fake business graphics, fake numbers, or pseudo-dashboard elements.
- Output JSON only.`;

const UNIFIED_DECK_RESPONSE_SCHEMA = {
  type: SchemaType.OBJECT,
  required: ['analysis', 'slides'],
  properties: {
    analysis: {
      type: SchemaType.OBJECT,
      required: ['truthSummary', 'marketResearchFindings', 'buyerCaseSummary', 'qualityScore'],
      properties: {
        truthSummary: { type: SchemaType.STRING },
        marketResearchFindings: { type: SchemaType.STRING },
        buyerCaseSummary: { type: SchemaType.STRING },
        qualityScore: { type: SchemaType.INTEGER },
      },
    },
    slides: {
      type: SchemaType.ARRAY,
      minItems: 6,
      maxItems: 6,
      items: {
        type: SchemaType.OBJECT,
        required: ['slideNumber', 'theme', 'headline', 'subheadline', 'dataPoints', 'nanoBananaPrompt'],
        properties: {
          slideNumber: { type: SchemaType.INTEGER },
          theme: { type: SchemaType.STRING },
          headline: { type: SchemaType.STRING },
          subheadline: { type: SchemaType.STRING },
          dataPoints: {
            type: SchemaType.ARRAY,
            minItems: 2,
            maxItems: 3,
            items: { type: SchemaType.STRING },
          },
          nanoBananaPrompt: { type: SchemaType.STRING },
        },
      },
    },
  },
} as const;

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

const normalizeWebsiteUrl = (input: unknown): string | null => {
  if (typeof input !== 'string') {
    return null;
  }
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  if (/^[a-z0-9.-]+\.[a-z]{2,}/i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return null;
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

const extractWebsiteText = (html: string): string => {
  const withoutScripts = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');

  const text = withoutScripts
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();

  return text.slice(0, 12000);
};

const fetchWebsiteContext = async (
  websiteUrl: string | null,
): Promise<{ website_context_text: string | null; website_context_note: string }> => {
  if (!websiteUrl) {
    return {
      website_context_text: null,
      website_context_note: 'No website URL provided.',
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(websiteUrl, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        Accept: 'text/html,application/xhtml+xml',
      },
    });

    if (!response.ok) {
      return {
        website_context_text: null,
        website_context_note: `Website fetch unavailable: HTTP ${response.status}.`,
      };
    }

    const contentType = String(response.headers.get('content-type') ?? '').toLowerCase();
    const raw = await response.text();
    if (!raw.trim()) {
      return {
        website_context_text: null,
        website_context_note: 'Website fetch succeeded but page text was empty.',
      };
    }

    const source = contentType.includes('html') ? raw : raw.slice(0, 150000);
    const extracted = extractWebsiteText(source);
    if (!extracted) {
      return {
        website_context_text: null,
        website_context_note: 'Website fetch succeeded but visible text extraction was empty.',
      };
    }

    return {
      website_context_text: extracted,
      website_context_note: `Website context extracted from ${websiteUrl}.`,
    };
  } catch (error) {
    return {
      website_context_text: null,
      website_context_note: `Website text unavailable: ${sanitizeErrorDetails(error)}`,
    };
  } finally {
    clearTimeout(timeout);
  }
};

const parseImageBase64 = (payload: any): string | null => {
  const predictions = Array.isArray(payload?.predictions) ? payload.predictions : [];
  const predictionEncoded = typeof predictions[0]?.bytesBase64Encoded === 'string'
    ? predictions[0].bytesBase64Encoded.trim()
    : '';
  if (predictionEncoded) {
    return predictionEncoded;
  }

  const candidates = Array.isArray(payload?.candidates) ? payload.candidates : [];
  for (const candidate of candidates) {
    const parts = Array.isArray(candidate?.content?.parts) ? candidate.content.parts : [];
    for (const part of parts) {
      const inlineData = part?.inlineData;
      if (
        inlineData
        && typeof inlineData?.data === 'string'
        && inlineData.data.trim()
        && typeof inlineData?.mimeType === 'string'
        && inlineData.mimeType.toLowerCase().startsWith('image/')
      ) {
        return inlineData.data.trim();
      }
    }
  }

  return null;
};

const parseUnifiedDeckJson = (rawText: string): z.infer<typeof UnifiedDeckSchema> => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripJsonFences(rawText));
  } catch (error) {
    throw new Error(`Gemini 3.1 Pro structured-output parse failure: invalid JSON. ${sanitizeErrorDetails(error)}`);
  }

  const validated = UnifiedDeckSchema.safeParse(parsed);
  if (!validated.success) {
    throw new Error(
      `Gemini 3.1 Pro structured-output parse failure: ${validated.error.issues[0]?.message ?? 'Invalid schema.'}`,
    );
  }
  return validated.data;
};

const buildRawIntelligencePayload = (asset: any, jam: any, latestSnapshot: any, websiteContext: {
  website_context_text: string | null;
  website_context_note: string;
}) => {
  const verifiedMrrCents = Math.max(
    clampNonNegativeInt(asset.mrr_cents),
    clampNonNegativeInt(latestSnapshot?.mrr_cents),
  );

  const last30dRevenueCents = Math.max(
    clampNonNegativeInt(asset.last30d_revenue_cents),
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

  const candidate = {
    project_name: String(asset.title ?? asset.name ?? 'Untitled Asset').trim() || 'Untitled Asset',
    website_url: normalizeWebsiteUrl(asset.website_url) ?? normalizeWebsiteUrl(jam?.website_url),
    website_context_text: websiteContext.website_context_text,
    website_context_note: websiteContext.website_context_note,
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

  return RawIntelligencePayloadSchema.safeParse(candidate);
};

const generateSlideBackgroundImage = async ({
  apiKey,
  model,
  prompt,
  slideNumber,
}: {
  apiKey: string;
  model: string;
  prompt: string;
  slideNumber: number;
}): Promise<{ slideNumber: number; backgroundImageBase64: string }> => {
  const isGeminiImageModel = model.startsWith('gemini-');
  const endpoint = isGeminiImageModel
    ? `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`
    : `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:predict?key=${encodeURIComponent(apiKey)}`;

  const body = isGeminiImageModel
    ? JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      })
    : JSON.stringify({
        instances: [{ prompt }],
        parameters: {
          sampleCount: 1,
          aspectRatio: '16:9',
        },
      });

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body,
  });

  const raw = await response.text();
  let parsed: any = null;
  try {
    parsed = raw ? JSON.parse(raw) : null;
  } catch {
    parsed = null;
  }

  if (!response.ok) {
    const details = (parsed && JSON.stringify(parsed).slice(0, 500)) || raw.slice(0, 500) || 'No response body.';
    throw new Error(`Slide ${slideNumber} image generation failed: API ${response.status} ${details}`);
  }

  const backgroundImageBase64 = parseImageBase64(parsed);
  if (!backgroundImageBase64) {
    throw new Error(`Slide ${slideNumber} image generation failed: missing bytesBase64Encoded.`);
  }

  return { slideNumber, backgroundImageBase64 };
};

export default async function handler(req: any, res: any) {
  try {
    const method = getMethod(req);
    if (method !== 'GET' && method !== 'POST') {
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
        'id, owner_user_id, generated_deck_json, pitch_decks, is_listed, listing_status, status, visibility',
      );

      if (assetResult.error && isRecoverableSchemaError(assetResult.error)) {
        assetResult = await fetchDeckAsset(
          'id, owner_user_id, generated_deck_json, pitch_decks, is_listed, listing_status, visibility',
        );
      }

      if (assetResult.error && isRecoverableSchemaError(assetResult.error)) {
        assetResult = await fetchDeckAsset('id, owner_user_id, generated_deck_json, pitch_decks, is_listed');
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

      const deck = (asset as any).generated_deck_json ?? (asset as any).pitch_decks ?? null;
      if (!deck) {
        return sendJson(res, 404, {
          error: 'Pitch deck has not been generated yet.',
          details: 'Generate this deck from the seller console first.',
        });
      }

      return sendJson(res, 200, { deck });
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
          error: 'Asset fetch failure.',
          details: 'Run the latest Supabase migration to enable pitch deck storage.',
        });
      }
      return sendJson(res, 500, {
        error: 'Asset fetch failure.',
        details: sanitizeErrorDetails(assetError),
      });
    }

    if (!asset || asset.owner_user_id !== user.id) {
      return sendJson(res, 404, { error: 'Marketplace asset not found.' });
    }

    const existingFinalDeck = FinalDeckSchema.safeParse((asset as any).generated_deck_json ?? null);
    if (!payload.data.forceRegenerate && existingFinalDeck.success) {
      return sendJson(res, 200, { deck: existingFinalDeck.data });
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
      return sendJson(res, 500, {
        error: 'Asset fetch failure.',
        details: sanitizeErrorDetails(jamError),
      });
    }

    if (snapshotsError && !isRecoverableSchemaError(snapshotsError)) {
      return sendJson(res, 500, {
        error: 'Asset fetch failure.',
        details: sanitizeErrorDetails(snapshotsError),
      });
    }

    const latestSnapshot = Array.isArray(snapshots) && snapshots.length > 0 ? snapshots[0] : null;

    const websiteUrl = normalizeWebsiteUrl(asset.website_url) ?? normalizeWebsiteUrl(jam?.website_url);
    const websiteContext = await fetchWebsiteContext(websiteUrl);

    const rawPayloadParse = buildRawIntelligencePayload(asset, jam, latestSnapshot, websiteContext);
    if (!rawPayloadParse.success) {
      return sendJson(res, 500, {
        error: 'Payload assembly failure.',
        details: rawPayloadParse.error.issues[0]?.message ?? 'Raw intelligence payload is invalid.',
      });
    }

    const rawIntelligencePayload = rawPayloadParse.data;

    const apiKey = process.env.GOOGLE_AI_MASTER_KEY?.trim();
    if (!apiKey) {
      return sendJson(res, 500, { error: 'GOOGLE_AI_MASTER_KEY is not configured.' });
    }

    const configuredTextModel = String(process.env.GEMINI_MODEL ?? '').trim().toLowerCase();
    const textModelName =
      configuredTextModel === 'gemini-3.1-pro'
        ? 'gemini-3.1-pro-preview'
        : configuredTextModel || 'gemini-3.1-pro-preview';

    const configuredImageModel = String(
      process.env.NANO_BANANA_MODEL ?? process.env.GEMINI_IMAGE_MODEL ?? 'gemini-3.1-flash-image-preview',
    )
      .trim()
      .toLowerCase();
    const imageModelCandidates = Array.from(
      new Set(
        [
          configuredImageModel,
          configuredImageModel === 'nano-banana-2' ? 'gemini-3.1-flash-image-preview' : null,
          'gemini-3.1-flash-image-preview',
          'imagen-4.0-fast-generate-001',
          'imagen-3.0-generate-001',
        ].filter(Boolean) as string[],
      ),
    );

    const genAI = new GoogleGenerativeAI(apiKey);
    const textModel = genAI.getGenerativeModel({ model: textModelName });

    let unifiedDeck: z.infer<typeof UnifiedDeckSchema>;
    try {
      const response = await textModel.generateContent({
        systemInstruction: UNIFIED_DECK_SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} } as any],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: UNIFIED_DECK_RESPONSE_SCHEMA,
          temperature: 0.2,
        },
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `${UNIFIED_DECK_USER_PROMPT}\n\nRAW INTELLIGENCE PAYLOAD:\n${JSON.stringify(rawIntelligencePayload, null, 2)}`,
              },
            ],
          },
        ],
      });

      unifiedDeck = parseUnifiedDeckJson(response.response.text());
    } catch (proError) {
      return sendJson(res, 500, {
        error: 'Gemini 3.1 Pro structured-output parse failure.',
        details: sanitizeErrorDetails(proError),
      });
    }

    let generatedImages: Array<{ slideNumber: number; backgroundImageBase64: string }>;
    try {
      generatedImages = await Promise.all(
        unifiedDeck.slides.map(async (slide) => {
          let lastError: unknown = null;
          for (const imageModel of imageModelCandidates) {
            try {
              return await generateSlideBackgroundImage({
                apiKey,
                model: imageModel,
                prompt: slide.nanoBananaPrompt,
                slideNumber: slide.slideNumber,
              });
            } catch (error) {
              lastError = error;
              const normalized = sanitizeErrorDetails(error).toLowerCase();
              const modelUnavailable = normalized.includes('404')
                || normalized.includes('not found')
                || normalized.includes('not supported');
              if (modelUnavailable) {
                continue;
              }
              throw error;
            }
          }
          throw (lastError ?? new Error(`Slide ${slide.slideNumber} image generation failed: no supported model available.`));
        }),
      );
    } catch (imageError) {
      return sendJson(res, 500, {
        error: 'Image generation failure.',
        details: sanitizeErrorDetails(imageError),
      });
    }

    if (generatedImages.length !== 6) {
      return sendJson(res, 500, {
        error: 'Image generation failure.',
        details: `Expected 6 images, received ${generatedImages.length}.`,
      });
    }

    const imageBySlide = new Map(generatedImages.map((image) => [image.slideNumber, image.backgroundImageBase64]));
    if (imageBySlide.size !== 6) {
      return sendJson(res, 500, {
        error: 'Image generation failure.',
        details: 'Image generation returned duplicate or missing slide numbers.',
      });
    }

    const finalDeckCandidate = {
      analysis: unifiedDeck.analysis,
      slides: unifiedDeck.slides.map((slide) => ({
        ...slide,
        backgroundImageBase64: imageBySlide.get(slide.slideNumber) ?? '',
      })),
    };

    const finalDeckParse = FinalDeckSchema.safeParse(finalDeckCandidate);
    if (!finalDeckParse.success) {
      return sendJson(res, 500, {
        error: 'Image generation failure.',
        details: finalDeckParse.error.issues[0]?.message ?? 'Final deck shape invalid.',
      });
    }

    const finalDeck = finalDeckParse.data;

    const { error: persistError } = await supabase
      .from('marketplace_assets')
      .update({ generated_deck_json: finalDeck })
      .eq('id', assetId)
      .eq('owner_user_id', user.id);

    if (persistError) {
      if (isRecoverableSchemaError(persistError)) {
        return sendJson(res, 503, {
          error: 'Persistence failure.',
          details: 'Run the latest Supabase migration to add marketplace_assets.generated_deck_json.',
        });
      }
      return sendJson(res, 500, {
        error: 'Persistence failure.',
        details: sanitizeErrorDetails(persistError),
      });
    }

    return sendJson(res, 200, { deck: finalDeck });
  } catch (error) {
    return sendJson(res, 500, {
      error: 'Failed to generate AI pitch deck.',
      details: sanitizeErrorDetails(error),
    });
  }
}
