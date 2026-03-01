import { z } from 'zod';
import { getMethod, methodNotAllowed, parseJsonBody, sendJson } from '../../lib/server/http.js';
import { getSupabaseAdmin } from '../../lib/server/supabase-admin.js';
import { getAuthenticatedUser } from '../../lib/server/auth.js';
import {
  isRecoverableSchemaError,
  parseUsdToCents,
  sanitizeErrorDetails,
} from '../../lib/server/marketplace-utils.js';
import { writeMarketplaceAuditLog } from '../../lib/server/marketplace-audit.js';

const FinancialsPayloadSchema = z.object({
  operatingExpenses: z.union([z.number(), z.string()]),
  expenseBreakdown: z.string().trim().max(4000).optional().default(''),
});

const TrafficPayloadSchema = z.object({
  monthlyUniqueVisitors: z.union([z.number(), z.string()]),
  analyticsProofUrl: z.string().trim().max(2000).optional().default(''),
});

const resolveSection = (req: any): 'financials' | 'traffic' => {
  const raw = req?.query?.section;
  const value = typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] : '';
  return value === 'traffic' ? 'traffic' : 'financials';
};

const parseVisitors = (input: string | number): number => {
  if (typeof input === 'number' && Number.isFinite(input)) {
    return Math.max(0, Math.round(input));
  }
  const normalized = String(input ?? '').trim().replace(/[, ]/g, '');
  if (!normalized) {
    return 0;
  }
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) {
    return NaN;
  }
  return Math.max(0, Math.round(parsed));
};

const parseHttpsUrl = (input: string): string | null => {
  const trimmed = String(input ?? '').trim();
  if (!trimmed) {
    return null;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:') {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
};

const resolveAssetId = (req: any): string => {
  const raw = req?.query?.assetId;
  if (typeof raw === 'string') {
    return raw;
  }
  if (Array.isArray(raw) && typeof raw[0] === 'string') {
    return raw[0];
  }
  return '';
};

export default async function handler(req: any, res: any) {
  try {
    const method = getMethod(req);
    if (method !== 'GET' && method !== 'PATCH') {
      return methodNotAllowed(res, ['GET', 'PATCH']);
    }

    const user = await getAuthenticatedUser(req);
    if (!user?.id) {
      return sendJson(res, 401, { error: 'Authentication required.' });
    }

    const assetId = resolveAssetId(req);
    const section = resolveSection(req);
    if (!assetId) {
      return sendJson(res, 400, { error: 'Missing asset id.' });
    }

    const supabase = await getSupabaseAdmin();
    const selectFields = section === 'traffic'
      ? 'id, owner_user_id, monthly_unique_visitors, analytics_proof_url'
      : 'id, owner_user_id, mrr_cents, operating_expenses_cents, expense_breakdown, profit_margin_bps';
    const baseQuery = supabase.from('marketplace_assets').select(selectFields).limit(1);
    const query = /^[0-9a-fA-F-]{36}$/.test(assetId)
      ? baseQuery.eq('id', assetId)
      : baseQuery.eq('slug', assetId);

    const { data: asset, error: assetError } = await query.maybeSingle();
    if (assetError) {
      if (isRecoverableSchemaError(assetError)) {
        return sendJson(res, 503, {
          error: section === 'traffic'
            ? 'Traffic schema is not ready yet.'
            : 'Profitability schema is not ready yet.',
          details: section === 'traffic'
            ? 'Run the latest Supabase migration to enable traffic fields.'
            : 'Run the latest Supabase migration to enable operating expenses and profit margin fields.',
        });
      }
      throw assetError;
    }

    if (!asset) {
      return sendJson(res, 404, { error: 'Marketplace asset not found.' });
    }

    if (asset.owner_user_id !== user.id) {
      return sendJson(res, 403, { error: `Only the listing owner can update ${section}.` });
    }

    if (section === 'traffic') {
      if (method === 'GET') {
        return sendJson(res, 200, {
          data: {
            assetId: asset.id,
            monthlyUniqueVisitors: Math.max(0, Number(asset.monthly_unique_visitors ?? 0)),
            analyticsProofUrl:
              typeof asset.analytics_proof_url === 'string' && asset.analytics_proof_url.trim()
                ? asset.analytics_proof_url.trim()
                : '',
          },
        });
      }

      const body = await parseJsonBody(req);
      const parsed = TrafficPayloadSchema.safeParse(body);
      if (!parsed.success) {
        return sendJson(res, 400, {
          error: 'Invalid traffic payload.',
          details: parsed.error.issues[0]?.message,
        });
      }

      const visitors = parseVisitors(parsed.data.monthlyUniqueVisitors);
      if (!Number.isFinite(visitors) || visitors < 0) {
        return sendJson(res, 400, {
          error: 'monthlyUniqueVisitors must be a valid non-negative integer.',
        });
      }

      const rawProofUrl = String(parsed.data.analyticsProofUrl ?? '').trim();
      const proofUrl = parseHttpsUrl(rawProofUrl);
      if (rawProofUrl && !proofUrl) {
        return sendJson(res, 400, {
          error: 'analyticsProofUrl must be a valid https:// URL.',
        });
      }

      const { error: updateError } = await supabase
        .from('marketplace_assets')
        .update({
          monthly_unique_visitors: visitors,
          analytics_proof_url: proofUrl,
        })
        .eq('id', asset.id);

      if (updateError) {
        throw updateError;
      }

      await writeMarketplaceAuditLog({
        actorUserId: user.id,
        assetId: asset.id,
        action: 'asset_traffic_updated',
        metadata: {
          monthly_unique_visitors: visitors,
          analytics_proof_url: proofUrl,
        },
      });

      return sendJson(res, 200, {
        data: {
          assetId: asset.id,
          monthlyUniqueVisitors: visitors,
          analyticsProofUrl: proofUrl ?? '',
        },
      });
    }

    if (method === 'GET') {
      const mrrCents = Math.max(0, Number(asset.mrr_cents ?? 0));
      const operatingExpensesCents = Math.max(0, Number(asset.operating_expenses_cents ?? 0));
      const netProfitCents = mrrCents - operatingExpensesCents;
      const profitMarginBps = mrrCents <= 0
        ? 0
        : Math.round((netProfitCents / mrrCents) * 10_000);

      return sendJson(res, 200, {
        data: {
          assetId: asset.id,
          mrrCents,
          operatingExpensesCents,
          expenseBreakdown: typeof asset.expense_breakdown === 'string' ? asset.expense_breakdown : '',
          netProfitCents,
          profitMarginBps,
          profitMarginPercent: profitMarginBps / 100,
        },
      });
    }

    const body = await parseJsonBody(req);
    const parsed = FinancialsPayloadSchema.safeParse(body);
    if (!parsed.success) {
      return sendJson(res, 400, {
        error: 'Invalid financial payload.',
        details: parsed.error.issues[0]?.message,
      });
    }

    const operatingExpensesCents = parseUsdToCents(parsed.data.operatingExpenses);
    if (!Number.isFinite(operatingExpensesCents) || operatingExpensesCents < 0) {
      return sendJson(res, 400, {
        error: 'Operating expenses must be zero or greater.',
      });
    }

    const mrrCents = Math.max(0, Number(asset.mrr_cents ?? 0));
    const netProfitCents = mrrCents - Math.round(operatingExpensesCents);
    const profitMarginBps = mrrCents <= 0
      ? 0
      : Math.round((netProfitCents / mrrCents) * 10_000);

    const expenseBreakdown = String(parsed.data.expenseBreakdown ?? '').trim();

    const { error: updateError } = await supabase
      .from('marketplace_assets')
      .update({
        operating_expenses_cents: Math.round(operatingExpensesCents),
        expense_breakdown: expenseBreakdown || null,
        profit_margin_bps: profitMarginBps,
      })
      .eq('id', asset.id);

    if (updateError) {
      throw updateError;
    }

    await writeMarketplaceAuditLog({
      actorUserId: user.id,
      assetId: asset.id,
      action: 'asset_financials_updated',
      metadata: {
        mrr_cents: mrrCents,
        operating_expenses_cents: Math.round(operatingExpensesCents),
        net_profit_cents: netProfitCents,
        profit_margin_bps: profitMarginBps,
      },
    });

    return sendJson(res, 200, {
      data: {
        assetId: asset.id,
        mrrCents,
        operatingExpensesCents: Math.round(operatingExpensesCents),
        expenseBreakdown,
        netProfitCents,
        profitMarginBps,
        profitMarginPercent: profitMarginBps / 100,
      },
    });
  } catch (error) {
    const section = resolveSection(req);
    return sendJson(res, 500, {
      error: section === 'traffic'
        ? 'Failed to update marketplace traffic.'
        : 'Failed to update marketplace financials.',
      details: sanitizeErrorDetails(error),
    });
  }
}
