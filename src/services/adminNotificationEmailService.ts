import { supabase, isSupabaseConfigured, getSupabaseClient } from '../utils/supabaseClient';
import { AdvertStory } from '../data/mockAdverts';

export type AdminAdvertEmailEventType = 'new_campaign' | 'edited_campaign';

const DEFAULT_ADMIN_EMAILS = ['admin@setlla.com', 'desk.lvisconsult@gmail.com'];
const ADMIN_PORTAL_URL = 'https://private.setlla.com';

function escapeHtml(raw?: string): string {
  if (!raw) return '';
  return String(raw)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Dispatches an immediate email notification and real-time audit log alert to Setlla Super Admins
 * whenever a user or partner submits a new advert campaign or updates creative fields requiring moderation.
 */
export async function sendAdminAdvertNotificationEmail(
  advert: AdvertStory,
  eventType: AdminAdvertEmailEventType = 'new_campaign'
): Promise<{ success: boolean; message: string }> {
  const isEdit = eventType === 'edited_campaign';
  const headline = isEdit && advert.pendingChanges?.headline ? advert.pendingChanges.headline : advert.headline;
  const description =
    isEdit && advert.pendingChanges?.description !== undefined
      ? advert.pendingChanges.description
      : advert.description || '';
  const category = isEdit && advert.pendingChanges?.category ? advert.pendingChanges.category : advert.category;
  const location = isEdit && advert.pendingChanges?.location ? advert.pendingChanges.location : advert.location;
  const mediaUrl = isEdit && advert.pendingChanges?.mediaUrl ? advert.pendingChanges.mediaUrl : advert.mediaUrl;
  const mediaType = isEdit && advert.pendingChanges?.mediaType ? advert.pendingChanges.mediaType : advert.mediaType;

  const advertiserName = advert.advertiserName || 'Setlla Partner';
  const partnerEmail = advert.partnerEmail || 'Not provided';
  const budgetFormatted = `₦${Number(advert.budgetAmount || 0).toLocaleString()}`;
  const paymentMethod = advert.paymentMethod || 'Ad Wallet Credits';
  const paymentRef = advert.paymentReference || advert.apiKeyRef || 'N/A';
  const packageTier = (advert.packageTier || 'starter').toUpperCase();
  const submittedAt = new Date().toLocaleString('en-NG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const subject = isEdit
    ? `[Setlla Ad Review] Creative Updated: "${headline}" by ${advertiserName}`
    : `[Setlla Ad Review] New Sponsored Ad: "${headline}" (${budgetFormatted}) by ${advertiserName}`;

  const textBody = `${isEdit ? 'ADVERT CREATIVE UPDATE REQUIRING REVIEW' : 'NEW SPONSORED ADVERT SUBMITTED FOR REVIEW'}
============================================================

Campaign Headline: ${headline}
Advertiser / Brand: ${advertiserName}
Partner Email: ${partnerEmail}
Category: ${category || 'Promo'}
Target Location: ${location || 'Delta State'}
Package Tier: ${packageTier}
Amount Paid: ${budgetFormatted} (${paymentMethod})
Payment Reference: ${paymentRef}
WhatsApp / Phone: ${advert.whatsappNumber || advert.phone || 'N/A'}
Destination URL: ${advert.websiteUrl || 'Direct Contact'}
Creative Media (${mediaType}): ${mediaUrl || 'N/A'}
Submitted At: ${submittedAt}

Ad Copy / Description:
${description || 'No additional description provided.'}

------------------------------------------------------------
REVIEW & RESPOND IN ADMIN PORTAL:
Open the Setlla Admin Console to Approve or Deny this campaign:
${ADMIN_PORTAL_URL}
`;

  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FCF9F5; border: 1px solid #EDDAA6; border-radius: 22px; overflow: hidden; color: #1A1410;">
      <div style="height: 5px; background: linear-gradient(90deg, #342A21 0%, #FFAD05 50%, #342A21 100%);"></div>
      <div style="padding: 28px 26px;">
        <div style="margin-bottom: 16px;">
          <span style="display: inline-block; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; background-color: #FFF8E6; color: #342A21; border: 1px solid #EDD595; padding: 5px 12px; border-radius: 9999px;">
            ${isEdit ? '● Creative Update Pending Review' : '● New Sponsored Ad Pending Review'}
          </span>
        </div>

        <h2 style="font-size: 20px; font-weight: 800; color: #1A1410; margin: 0 0 8px 0; line-height: 1.35;">
          ${escapeHtml(headline)}
        </h2>
        <p style="font-size: 13px; color: #5C5346; margin: 0 0 20px 0; line-height: 1.5;">
          Submitted by <strong>${escapeHtml(advertiserName)}</strong> (${escapeHtml(partnerEmail)}) on ${escapeHtml(submittedAt)}.
        </p>

        <div style="background-color: #FFFFFF; border: 1px solid #EDE3CC; border-radius: 16px; padding: 18px; margin-bottom: 20px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 6px 0; color: #70798C; width: 38%;">Advertiser:</td>
              <td style="padding: 6px 0; color: #1A1410; font-weight: 700;">${escapeHtml(advertiserName)}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #70798C;">Category &amp; City:</td>
              <td style="padding: 6px 0; color: #1A1410; font-weight: 600;">${escapeHtml(category)} &bull; ${escapeHtml(location || 'Delta State')}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #70798C;">Tier &amp; Budget:</td>
              <td style="padding: 6px 0; color: #047857; font-weight: 800;">${escapeHtml(packageTier)} &bull; ${escapeHtml(budgetFormatted)}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #70798C;">Payment Verification:</td>
              <td style="padding: 6px 0; color: #1A1410; font-weight: 600;">PAID (${escapeHtml(paymentMethod)})<br/><span style="font-size: 11px; color: #70798C; font-family: monospace;">Ref: ${escapeHtml(paymentRef)}</span></td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #70798C;">Contact / Destination:</td>
              <td style="padding: 6px 0; color: #1A1410;">
                ${escapeHtml(advert.whatsappNumber || advert.phone || 'N/A')}
                ${advert.websiteUrl ? `<br/><a href="${escapeHtml(advert.websiteUrl)}" style="color: #8A5A00; font-size: 12px;">${escapeHtml(advert.websiteUrl)}</a>` : ''}
              </td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #70798C;">Creative Asset:</td>
              <td style="padding: 6px 0; color: #1A1410;">
                <span style="text-transform: uppercase; font-size: 11px; font-weight: 700; color: #342A21;">${escapeHtml(mediaType)}</span>
                ${mediaUrl && mediaUrl.startsWith('http') ? ` &mdash; <a href="${escapeHtml(mediaUrl)}" style="color: #8A5A00; font-weight: 600;">Preview Creative &nearr;</a>` : ''}
              </td>
            </tr>
          </table>

          ${
            description && description !== 'NaN'
              ? `<div style="margin-top: 14px; padding-top: 12px; border-top: 1px solid #F0E7D5;">
                  <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #70798C; margin-bottom: 4px;">Ad Copy</div>
                  <div style="font-size: 13px; color: #342A21; line-height: 1.55;">${escapeHtml(description)}</div>
                </div>`
              : ''
          }
        </div>

        <div style="text-align: center; margin: 24px 0 18px 0;">
          <a href="${ADMIN_PORTAL_URL}" style="display: inline-block; background-color: #342A21; color: #FFF9EB; border: 1px solid #FFAD05; text-decoration: none; font-size: 13px; font-weight: 800; padding: 13px 26px; border-radius: 14px;">
            Open Admin Portal to Approve / Deny &rarr;
          </a>
        </div>

        <p style="font-size: 11px; color: #70798C; text-align: center; margin: 0; line-height: 1.5;">
          Setlla Adverts &amp; Campaigns Moderation System &bull; <a href="${ADMIN_PORTAL_URL}" style="color: #342A21; font-weight: 600;">private.setlla.com</a>
        </p>
      </div>
    </div>
  `;

  // 1. Dispatch via Vercel Serverless API (/api/send-admin-notification)
  try {
    await fetch('/api/send-admin-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: DEFAULT_ADMIN_EMAILS,
        replyTo: advert.partnerEmail || undefined,
        subject,
        text: textBody,
        html: htmlBody,
        eventType,
        advert: {
          id: advert.id,
          headline,
          advertiserName,
          partnerEmail: advert.partnerEmail,
          category,
          location,
          packageTier: advert.packageTier,
          budgetAmount: advert.budgetAmount,
          paymentMethod,
          paymentReference: paymentRef,
          whatsappNumber: advert.whatsappNumber,
          phone: advert.phone,
          websiteUrl: advert.websiteUrl,
          mediaUrl: mediaUrl && mediaUrl.startsWith('http') ? mediaUrl : 'Uploaded Media Asset',
          mediaType,
        },
      }),
    });
  } catch (err) {
    console.warn('[AdminAdvertEmail] Serverless API dispatch notice:', err);
  }

  // 2. Also invoke Supabase Edge Function (`send-email`) & record Admin Audit Log if Supabase is connected
  if (isSupabaseConfigured()) {
    try {
      await supabase.functions.invoke('send-email', {
        body: {
          to: DEFAULT_ADMIN_EMAILS,
          replyTo: advert.partnerEmail || undefined,
          subject,
          text: textBody,
          html: htmlBody,
          from: 'Setlla Adverts Alert <admin@setlla.com>',
        },
      });
    } catch (_) {
      // Non-blocking fallback
    }

    try {
      const client = getSupabaseClient();
      if (client) {
        await client.from('admin_audit_logs').insert([
          {
            id: `audit-ad-submit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            action: isEdit ? 'ADVERT_CREATIVE_UPDATED' : 'NEW_ADVERT_SUBMITTED',
            target_type: 'advert',
            target_id: advert.id,
            target_name: `${headline} (${advertiserName})`,
            admin_name: advertiserName,
            details: `${isEdit ? 'Updated creative submitted' : 'New campaign submitted'} (${packageTier} • ${budgetFormatted} via ${paymentMethod}, Ref: ${paymentRef}). Awaiting Admin approval.`,
            created_at: new Date().toISOString(),
          },
        ]);
      }
    } catch (_) {}
  }

  return {
    success: true,
    message: `Admin review notification dispatched for "${headline}".`,
  };
}
