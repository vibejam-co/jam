import { getSupabaseAdmin } from './supabase-admin.js';
import { isRecoverableSchemaError } from './marketplace-utils.js';

export const writeMarketplaceAuditLog = async (input: {
  actorUserId?: string | null;
  assetId?: string | null;
  action: string;
  severity?: 'INFO' | 'WARN' | 'BLOCK';
  reason?: string;
  metadata?: Record<string, unknown>;
}) => {
  try {
    const supabase = await getSupabaseAdmin();
    const payload = {
      actor_user_id: input.actorUserId ?? null,
      asset_id: input.assetId ?? null,
      severity: input.severity ?? 'INFO',
      reason: input.reason ?? input.action,
      action: input.action,
      metadata: input.metadata ?? {},
    };

    const { error } = await supabase.from('marketplace_audit_logs').insert(payload);

    if (error && isRecoverableSchemaError(error)) {
      await supabase.from('marketplace_audit_logs').insert({
        actor_user_id: input.actorUserId ?? null,
        asset_id: input.assetId ?? null,
        action: input.action,
        metadata: input.metadata ?? {},
      });
    }
  } catch {
    // Never block core marketplace actions when audit logging fails.
  }
};
