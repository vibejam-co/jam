import { z } from 'zod';

export const ProviderSchema = z.enum(['stripe', 'lemonsqueezy', 'polar', 'dodo', 'revenuecat']);
export const BoostTierSchema = z.enum(['free', 'pro', 'elite']);
export const VisibilitySchema = z.enum(['public', 'members_only', 'private']);
export const AcquireStageSchema = z.enum([
  'WATCHLISTED',
  'OFFER_SENT',
  'LOI_SIGNED',
  'DUE_DILIGENCE',
  'APA_SIGNED',
  'ESCROW_FUNDED',
  'CLOSED',
]);

export const CreateMarketplaceAssetDraftSchema = z.object({
  name: z.string().trim().min(2).max(120),
  tagline: z.string().trim().min(2).max(220),
  description: z.string().trim().min(10).max(4000).optional().default(''),
  logoUrl: z.string().trim().url().optional().or(z.literal('')).default(''),
  category: z.string().trim().min(2).max(80),
  subcategory: z.string().trim().max(80).optional().default(''),
  techStack: z.array(z.string().trim().min(1).max(60)).max(24).optional().default([]),
  founderName: z.string().trim().min(2).max(120),
  founderEmail: z.string().trim().email(),
  isAnonymous: z.boolean().optional().default(false),
  visibility: VisibilitySchema.optional().default('public'),
  jamId: z.string().uuid().optional(),
});

export const ConnectMarketplaceAssetSchema = z.object({
  provider: ProviderSchema,
  apiKey: z.string().trim().min(8).max(512),
  isAnonymous: z.boolean().optional(),
});

export const PublishMarketplaceAssetSchema = z.object({
  askingPriceCents: z.number().int().positive().max(2_000_000_000).optional(),
  askingPriceUsd: z.string().trim().optional(),
  profitMarginPercent: z.number().min(0).max(100).nullable().optional(),
  tier: BoostTierSchema.default('free'),
  visibility: VisibilitySchema.optional(),
  boostCheckoutSessionId: z.string().trim().min(3).max(200).optional(),
});

export const CreateOfferSchema = z.object({
  assetId: z.string().uuid(),
  offerPriceCents: z.number().int().positive().max(2_000_000_000).optional(),
  offerPriceUsd: z.string().trim().optional(),
  message: z.string().trim().min(4).max(4000),
});

export const UpdateMarketplaceAssetSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  tagline: z.string().trim().min(2).max(220).optional(),
  description: z.string().trim().min(10).max(4000).optional(),
  logoUrl: z.string().trim().url().optional().or(z.literal('')),
  category: z.string().trim().min(2).max(80).optional(),
  subcategory: z.string().trim().max(80).optional(),
  techStack: z.array(z.string().trim().min(1).max(60)).max(24).optional(),
  founderName: z.string().trim().min(2).max(120).optional(),
  founderEmail: z.string().trim().email().optional(),
  askingPriceCents: z.number().int().positive().max(2_000_000_000).optional(),
  askingPriceUsd: z.string().trim().optional(),
  profitMarginPercent: z.number().min(0).max(100).nullable().optional(),
  isAnonymous: z.boolean().optional(),
  visibility: VisibilitySchema.optional(),
});

export const MarketplaceAssetsQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  category: z.string().trim().max(80).optional(),
  min_mrr: z.coerce.number().int().min(0).optional(),
  max_price: z.coerce.number().int().min(0).optional(),
  min_rev30: z.coerce.number().int().min(0).optional(),
  max_multiple: z.coerce.number().int().min(0).optional(),
  verified_only: z.coerce.boolean().optional(),
  sort: z.enum(['latest', 'mrr', 'rev30', 'multiple']).optional().default('latest'),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(48).optional().default(12),
});

export const InboxStartConversationSchema = z.object({
  listingId: z.string().uuid(),
  initialMessage: z.string().trim().min(1).max(4000).optional(),
});

export const InboxMessagesQuerySchema = z.object({
  conversationId: z.string().uuid(),
});

export const InboxSendMessageSchema = z.object({
  conversationId: z.string().uuid(),
  body: z.string().trim().min(1).max(4000),
});

export const WishlistMutationSchema = z.object({
  listingId: z.string().uuid(),
});

export const AcquirePipelineUpsertSchema = z.object({
  listingId: z.string().uuid(),
  stage: AcquireStageSchema.optional().default('WATCHLISTED'),
  notes: z.string().trim().max(4000).optional(),
});

export const AcquirePipelineStageUpdateSchema = z.object({
  listingId: z.string().uuid(),
  stage: AcquireStageSchema,
  notes: z.string().trim().max(4000).optional(),
  message: z.string().trim().max(4000).optional(),
});
