import { parseJsonBody, sendJson } from './http.js';
import { getSupabaseAdmin } from './supabase-admin.js';
import { isRecoverableSchemaError, sanitizeErrorDetails } from './marketplace-utils.js';
import { writeMarketplaceAuditLog } from './marketplace-audit.js';
import { normalizeEscrowStatus } from './escrow.js';
import { ensureConversation } from './profile-marketplace.js';
import { sendInboxMessageNotificationEmail } from './email.js';

type DealRoomStatus = 'ESCROW_FUNDED' | 'CLOSED';
type DomainPipelineStage =
  | 'OFFER_RECEIVED'
  | 'LOI_SIGNED'
  | 'DUE_DILIGENCE'
  | 'APA_SIGNED'
  | 'ESCROW_FUNDED'
  | 'TRANSFER_IN_PROGRESS'
  | 'CLOSED'
  | 'CANCELLED';

const dealRoomStageByStatus: Record<DealRoomStatus, DomainPipelineStage> = {
  ESCROW_FUNDED: 'ESCROW_FUNDED',
  CLOSED: 'CLOSED',
};

const dealRoomStatusLabelByStatus: Record<DealRoomStatus, string> = {
  ESCROW_FUNDED: 'Escrow Funded',
  CLOSED: 'Closed',
};

const toDomainStorageStatusFromDealStatus = (status: DealRoomStatus): 'ACCEPTED' | 'REJECTED' => {
  if (status === 'ESCROW_FUNDED' || status === 'CLOSED') {
    return 'ACCEPTED';
  }
  return 'REJECTED';
};

const toLegacyStorageStatusFromDealStatus = (status: DealRoomStatus): 'accepted' | 'rejected' => {
  if (status === 'ESCROW_FUNDED' || status === 'CLOSED') {
    return 'accepted';
  }
  return 'rejected';
};

const extractTransactionId = (payload: any): string => {
  const value = payload?.transaction_id ?? payload?.id ?? payload?.transaction?.id;
  return typeof value === 'string' ? value.trim() : '';
};

const extractEscrowStatus = (payload: any): string => {
  const value =
    payload?.status
    ?? payload?.state
    ?? payload?.transaction?.status
    ?? payload?.event?.status
    ?? payload?.event_status;
  return typeof value === 'string' ? value.trim() : '';
};

const extractEventHint = (payload: any): string => {
  const value =
    payload?.event
    ?? payload?.event_type
    ?? payload?.type
    ?? payload?.action
    ?? payload?.name;
  return typeof value === 'string' ? value.trim() : '';
};

const mapEscrowToDealStatus = (escrowStatus: string, eventHint: string): DealRoomStatus | null => {
  const fingerprint = `${normalizeEscrowStatus(escrowStatus)} ${normalizeEscrowStatus(eventHint)}`;
  if (fingerprint.includes('secured')) {
    return 'ESCROW_FUNDED';
  }
  if (fingerprint.includes('complete') || fingerprint.includes('completed')) {
    return 'CLOSED';
  }
  return null;
};

const resolveUserEmailById = async (supabase: any, userId: string): Promise<string | null> => {
  if (!userId) {
    return null;
  }
  const { data, error } = await supabase.auth.admin.getUserById(userId);
  if (error) {
    return null;
  }
  const email = data?.user?.email;
  if (typeof email === 'string' && email.trim()) {
    return email.trim();
  }
  return null;
};

const resolveAssetDisplayName = async (supabase: any, assetId: string): Promise<string> => {
  if (!assetId) {
    return 'Marketplace Listing';
  }
  const { data, error } = await supabase
    .from('marketplace_assets')
    .select('name, title')
    .eq('id', assetId)
    .limit(1)
    .maybeSingle();
  if (error) {
    if (isRecoverableSchemaError(error)) {
      return 'Marketplace Listing';
    }
    throw error;
  }
  const label = String(data?.name ?? data?.title ?? '').trim();
  return label || 'Marketplace Listing';
};

const notifyEscrowStatusTransition = async (input: {
  supabase: any;
  pipeline: any;
  previousStatus: string | null;
  mappedStatus: DealRoomStatus | null;
  transactionId: string;
}) => {
  if (!input.mappedStatus) {
    return;
  }
  if (String(input.previousStatus ?? '').toUpperCase() === input.mappedStatus) {
    return;
  }

  const listingId = String(input.pipeline?.asset_id ?? '');
  const buyerId = String(input.pipeline?.buyer_user_id ?? '');
  const sellerId = String(input.pipeline?.seller_user_id ?? '');
  if (!listingId || !buyerId || !sellerId) {
    return;
  }

  const listingName = await resolveAssetDisplayName(input.supabase, listingId);
  const stageLabel = dealRoomStatusLabelByStatus[input.mappedStatus] ?? input.mappedStatus;
  const senderId = input.mappedStatus === 'CLOSED' ? sellerId : buyerId;
  const senderLabel = 'Escrow Service';
  const messageBody =
    input.mappedStatus === 'ESCROW_FUNDED'
      ? `Escrow is funded. Deal advanced to ${stageLabel}.`
      : `Deal marked ${stageLabel}.`;

  const conversationId = await ensureConversation({
    supabase: input.supabase,
    listingId,
    buyerId,
    sellerId,
  });

  const { error: messageError } = await input.supabase.from('messages').insert({
    conversation_id: conversationId,
    sender_id: senderId,
    body: messageBody,
  });
  if (messageError && !isRecoverableSchemaError(messageError)) {
    throw messageError;
  }

  const { error: conversationUpdateError } = await input.supabase
    .from('conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', conversationId);
  if (conversationUpdateError && !isRecoverableSchemaError(conversationUpdateError)) {
    throw conversationUpdateError;
  }

  const recipientUserIds =
    input.mappedStatus === 'CLOSED'
      ? [buyerId, sellerId]
      : [sellerId];

  for (const recipientUserId of recipientUserIds) {
    const { error: notificationError } = await input.supabase.from('notifications').insert({
      title: 'Deal Room Update',
      message: `${listingName} advanced to ${stageLabel}.`,
      type: 'update',
      timestamp_label: 'just now',
      is_read: false,
      jam_id: null,
      recipient_user_id: recipientUserId,
      metadata: {
        listing_id: listingId,
        conversation_id: conversationId,
        stage: input.mappedStatus,
        escrow_transaction_id: input.transactionId,
      },
    });
    if (notificationError && !isRecoverableSchemaError(notificationError)) {
      throw notificationError;
    }

    const recipientEmail = await resolveUserEmailById(input.supabase, recipientUserId);
    try {
      await sendInboxMessageNotificationEmail({
        toEmail: recipientEmail,
        senderLabel,
        listingName,
        message: messageBody,
      });
    } catch {
      // Non-blocking: webhook sync should not fail on email provider errors.
    }
  }
};

export const handleEscrowWebhook = async (req: any, res: any) => {
  try {
    const payload = await parseJsonBody(req);
    const transactionId = extractTransactionId(payload);
    const escrowStatus = extractEscrowStatus(payload);
    const eventHint = extractEventHint(payload);

    if (!transactionId) {
      return sendJson(res, 400, {
        error: 'Missing transaction_id in Escrow webhook payload.',
        code: 'MISSING_ESCROW_TRANSACTION_ID',
      });
    }

    const mappedStatus = mapEscrowToDealStatus(escrowStatus, eventHint);
    const normalizedEscrowStatus = escrowStatus || eventHint || null;
    const supabase = await getSupabaseAdmin();

    const { data: pipelineRows, error: pipelineLookupError } = await supabase
      .from('marketplace_deal_pipeline')
      .select('id, asset_id, buyer_user_id, seller_user_id, status')
      .eq('escrow_transaction_id', transactionId)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (pipelineLookupError && !isRecoverableSchemaError(pipelineLookupError)) {
      throw pipelineLookupError;
    }

    let pipeline = Array.isArray(pipelineRows) && pipelineRows.length > 0 ? pipelineRows[0] : null;
    const initialPipelineStatus = typeof pipeline?.status === 'string' ? pipeline.status : null;

    if (!pipeline) {
      const { data: domainOfferRows, error: domainOfferLookupError } = await supabase
        .from('marketplace_offers')
        .select('id, asset_id, buyer_user_id, seller_user_id')
        .eq('escrow_transaction_id', transactionId)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (domainOfferLookupError && !isRecoverableSchemaError(domainOfferLookupError)) {
        throw domainOfferLookupError;
      }

      const fallbackDomainOffer = Array.isArray(domainOfferRows) && domainOfferRows.length > 0 ? domainOfferRows[0] : null;
      if (fallbackDomainOffer) {
        const { error: pipelineUpsertError } = await supabase
          .from('marketplace_deal_pipeline')
          .upsert(
            {
              asset_id: fallbackDomainOffer.asset_id,
              buyer_user_id: fallbackDomainOffer.buyer_user_id,
              seller_user_id: fallbackDomainOffer.seller_user_id,
              stage: mappedStatus ? dealRoomStageByStatus[mappedStatus] : 'APA_SIGNED',
              status: mappedStatus ?? 'APA_SIGNED',
              escrow_transaction_id: transactionId,
              escrow_status: normalizedEscrowStatus,
            },
            { onConflict: 'asset_id,buyer_user_id,seller_user_id' },
          );

        if (pipelineUpsertError && !isRecoverableSchemaError(pipelineUpsertError)) {
          throw pipelineUpsertError;
        }

        const { data: refreshedRows, error: refreshedError } = await supabase
          .from('marketplace_deal_pipeline')
          .select('id, asset_id, buyer_user_id, seller_user_id, status')
          .eq('asset_id', fallbackDomainOffer.asset_id)
          .eq('buyer_user_id', fallbackDomainOffer.buyer_user_id)
          .eq('seller_user_id', fallbackDomainOffer.seller_user_id)
          .limit(1);

        if (refreshedError && !isRecoverableSchemaError(refreshedError)) {
          throw refreshedError;
        }
        pipeline = Array.isArray(refreshedRows) && refreshedRows.length > 0 ? refreshedRows[0] : null;
      }
    }

    if (!pipeline) {
      return sendJson(res, 200, {
        data: {
          received: true,
          ignored: true,
          reason: 'transaction_not_found',
          transactionId,
          escrowStatus: normalizedEscrowStatus,
          mappedDealStatus: mappedStatus,
        },
      });
    }

    const pipelineUpdatePayload: Record<string, unknown> = {
      escrow_transaction_id: transactionId,
      escrow_status: normalizedEscrowStatus,
    };
    if (mappedStatus) {
      pipelineUpdatePayload.status = mappedStatus;
      pipelineUpdatePayload.stage = dealRoomStageByStatus[mappedStatus];
    }

    const { error: pipelineUpdateError } = await supabase
      .from('marketplace_deal_pipeline')
      .update(pipelineUpdatePayload)
      .eq('id', pipeline.id);

    if (pipelineUpdateError && !isRecoverableSchemaError(pipelineUpdateError)) {
      throw pipelineUpdateError;
    }

    const offerUpdatePayload: Record<string, unknown> = {
      escrow_transaction_id: transactionId,
      escrow_status: normalizedEscrowStatus,
    };
    if (mappedStatus) {
      offerUpdatePayload.status = toDomainStorageStatusFromDealStatus(mappedStatus);
    }

    const { error: domainOfferUpdateError } = await supabase
      .from('marketplace_offers')
      .update(offerUpdatePayload)
      .eq('asset_id', pipeline.asset_id)
      .eq('buyer_user_id', pipeline.buyer_user_id)
      .eq('seller_user_id', pipeline.seller_user_id);

    if (domainOfferUpdateError && !isRecoverableSchemaError(domainOfferUpdateError)) {
      throw domainOfferUpdateError;
    }

    const legacyOfferUpdatePayload: Record<string, unknown> = {
      escrow_transaction_id: transactionId,
      escrow_status: normalizedEscrowStatus,
    };
    if (mappedStatus) {
      legacyOfferUpdatePayload.status = toLegacyStorageStatusFromDealStatus(mappedStatus);
    }

    const { error: legacyOfferUpdateError } = await supabase
      .from('offers')
      .update(legacyOfferUpdatePayload)
      .eq('asset_id', pipeline.asset_id)
      .eq('buyer_user_id', pipeline.buyer_user_id)
      .eq('seller_user_id', pipeline.seller_user_id);

    if (legacyOfferUpdateError && !isRecoverableSchemaError(legacyOfferUpdateError)) {
      throw legacyOfferUpdateError;
    }

    await notifyEscrowStatusTransition({
      supabase,
      pipeline,
      previousStatus: initialPipelineStatus,
      mappedStatus,
      transactionId,
    });

    await writeMarketplaceAuditLog({
      actorUserId: null,
      assetId: String(pipeline.asset_id),
      action: 'deal_room_escrow_webhook_sync',
      severity: 'INFO',
      reason: mappedStatus ?? 'ESCROW_WEBHOOK',
      metadata: {
        escrow_transaction_id: transactionId,
        escrow_status: normalizedEscrowStatus,
        webhook_event: eventHint || null,
        mapped_status: mappedStatus,
      },
    });

    return sendJson(res, 200, {
      data: {
        received: true,
        transactionId,
        escrowStatus: normalizedEscrowStatus,
        mappedDealStatus: mappedStatus,
      },
    });
  } catch (error) {
    return sendJson(res, 500, {
      error: 'Failed to process Escrow webhook.',
      details: sanitizeErrorDetails(error),
      code: 'ESCROW_WEBHOOK_FAILED',
    });
  }
};
