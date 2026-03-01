import { Resend } from 'resend';

type EmailResult = {
  sent: boolean;
  reason?: 'email_provider_not_configured' | 'missing_recipient';
  messageId?: string | null;
};

const appBaseUrl = process.env.APP_BASE_URL?.trim() || 'https://www.vibejam.co';
const offersFromEmail = process.env.OFFERS_FROM_EMAIL?.trim() || 'offers@vibejam.co';
const inboxFromEmail = process.env.INBOX_FROM_EMAIL?.trim() || offersFromEmail;
const supportEmail = process.env.SUPPORT_EMAIL?.trim() || null;

const getResendClient = (): Resend | null => {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }
  return new Resend(apiKey);
};

const formatMoney = (cents: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Math.max(0, Number(cents ?? 0)) / 100);

const buildInboxUrl = (): string => `${appBaseUrl}/`;

const escapeHtml = (input: string): string =>
  input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const sendViaResend = async (input: {
  toEmail?: string | null;
  fromEmail: string;
  subject: string;
  text: string;
  html: string;
}): Promise<EmailResult> => {
  const client = getResendClient();
  const toEmail = input.toEmail?.trim();

  if (!client) {
    return { sent: false, reason: 'email_provider_not_configured' };
  }
  if (!toEmail) {
    return { sent: false, reason: 'missing_recipient' };
  }

  const { data, error } = await client.emails.send({
    from: input.fromEmail,
    to: [toEmail],
    ...(supportEmail ? { replyTo: supportEmail } : {}),
    subject: input.subject,
    text: input.text,
    html: input.html,
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }

  return {
    sent: true,
    messageId: data?.id ?? null,
  };
};

export const sendOfferNotificationEmail = async (input: {
  toEmail?: string | null;
  assetName: string;
  offerPriceCents: number;
  message: string;
  buyerLabel?: string;
}) => {
  const formattedPrice = formatMoney(input.offerPriceCents);
  const buyerLabel = input.buyerLabel?.trim() || 'A buyer';
  const safeMessage = input.message?.trim() || '(No message)';
  const inboxUrl = buildInboxUrl();

  return sendViaResend({
    toEmail: input.toEmail,
    fromEmail: offersFromEmail,
    subject: `New Offer Received for ${input.assetName}`,
    text:
      `${buyerLabel} sent an offer of ${formattedPrice} for ${input.assetName}.\n\n`
      + `Message:\n${safeMessage}\n\n`
      + `Open Profile > Inbox: ${inboxUrl}`,
    html: `
      <div style="font-family:Inter,Segoe UI,Arial,sans-serif;line-height:1.5;color:#111827">
        <h2 style="margin:0 0 12px">New Offer Received</h2>
        <p style="margin:0 0 8px">${buyerLabel} sent an offer for <strong>${input.assetName}</strong>.</p>
        <p style="margin:0 0 8px">Offer amount: <strong>${formattedPrice}</strong></p>
        <p style="margin:0 0 16px">Message: ${safeMessage}</p>
        <a href="${inboxUrl}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:10px 14px;border-radius:8px;font-weight:600">Open Inbox</a>
      </div>
    `,
  });
};

export const sendInboxMessageNotificationEmail = async (input: {
  toEmail?: string | null;
  senderLabel: string;
  listingName: string;
  message: string;
}) => {
  const senderLabel = input.senderLabel.trim() || 'Someone';
  const listingName = input.listingName.trim() || 'Marketplace Listing';
  const safeMessage = input.message.trim() || '(No message)';
  const inboxUrl = buildInboxUrl();

  return sendViaResend({
    toEmail: input.toEmail,
    fromEmail: inboxFromEmail,
    subject: `New Inbox Message about ${listingName}`,
    text:
      `${senderLabel} sent a new inbox message about ${listingName}.\n\n`
      + `Message:\n${safeMessage}\n\n`
      + `Open Profile > Inbox: ${inboxUrl}`,
    html: `
      <div style="font-family:Inter,Segoe UI,Arial,sans-serif;line-height:1.5;color:#111827">
        <h2 style="margin:0 0 12px">New Inbox Message</h2>
        <p style="margin:0 0 8px"><strong>${senderLabel}</strong> messaged you about <strong>${listingName}</strong>.</p>
        <p style="margin:0 0 16px">${safeMessage}</p>
        <a href="${inboxUrl}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:10px 14px;border-radius:8px;font-weight:600">Open Inbox</a>
      </div>
    `,
  });
};

export const sendBuyerDealAlertEmail = async (input: {
  toEmail?: string | null;
  assetName: string;
  mrrCents: number;
  askingPriceCents: number;
  profitMarginBps?: number | null;
  dealUrl?: string | null;
}) => {
  const assetName = input.assetName.trim() || 'New Marketplace Asset';
  const mrr = formatMoney(input.mrrCents);
  const askingPrice = formatMoney(input.askingPriceCents);
  const marginPercent =
    typeof input.profitMarginBps === 'number' && Number.isFinite(input.profitMarginBps)
      ? `${(Math.round(input.profitMarginBps) / 100).toFixed(1)}%`
      : 'N/A';
  const dealUrl = input.dealUrl?.trim() || buildInboxUrl();

  return sendViaResend({
    toEmail: input.toEmail,
    fromEmail: offersFromEmail,
    subject: `New Deal Alert: ${assetName}`,
    text:
      `New deal alert on VibeJam.\n\n`
      + `${assetName} is making ${mrr} and listed for ${askingPrice}.\n`
      + `Profit Margin: ${marginPercent}\n\n`
      + `View Deal: ${dealUrl}`,
    html: `
      <div style="font-family:Inter,Segoe UI,Arial,sans-serif;line-height:1.5;color:#e5e7eb;background:#020617;padding:24px;border-radius:12px">
        <p style="margin:0 0 10px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#22d3ee;font-weight:700">Deal Alert</p>
        <h2 style="margin:0 0 14px;font-size:26px;line-height:1.2;color:#ffffff">New listing matches your search</h2>
        <p style="margin:0 0 12px;color:#cbd5e1"><strong>${escapeHtml(assetName)}</strong> was just published on VibeJam.</p>
        <table style="width:100%;border-collapse:separate;border-spacing:0 8px;margin:0 0 16px">
          <tr>
            <td style="font-size:13px;color:#94a3b8">Verified Revenue</td>
            <td style="font-size:14px;color:#22c55e;font-weight:700;text-align:right">${mrr}/mo</td>
          </tr>
          <tr>
            <td style="font-size:13px;color:#94a3b8">Asking Price</td>
            <td style="font-size:14px;color:#f8fafc;font-weight:700;text-align:right">${askingPrice}</td>
          </tr>
          <tr>
            <td style="font-size:13px;color:#94a3b8">Profit Margin</td>
            <td style="font-size:14px;color:#f8fafc;font-weight:700;text-align:right">${marginPercent}</td>
          </tr>
        </table>
        <a href="${dealUrl}" style="display:inline-block;background:#22d3ee;color:#082f49;text-decoration:none;padding:10px 16px;border-radius:999px;font-weight:700">View Deal on VibeJam</a>
      </div>
    `,
  });
};
