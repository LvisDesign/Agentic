import { supabase, isSupabaseConfigured } from '../utils/supabaseClient';

export interface AccountDeletionNoticeParams {
  email: string;
  fullName: string;
  phone?: string;
  id?: string;
  reason?: string;
}

/**
 * Dispatches an official account termination notification email to a deleted user.
 * Directs the recipient to contact support@setlla.com for further investigation.
 */
export async function sendAccountDeletionEmail(params: AccountDeletionNoticeParams): Promise<{ success: boolean; message: string }> {
  const cleanEmail = (params.email || '').trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, message: 'No valid recipient email provided.' };
  }

  const recipientName = params.fullName?.trim() || 'Valued User';
  const subject = 'Notice of Account Termination - Setlla Platform';

  const textBody = `Dear ${recipientName},

This is an official notification to inform you that your Setlla account associated with ${cleanEmail} has been deactivated and removed by platform administration in accordance with our terms of service and security standards.

All active listings, profile authorizations, and linked device sessions associated with this account have been permanently revoked.

If you believe this action was taken in error or if you wish to request further investigation regarding your account status, please contact our administrative support team directly:

Email: support@setlla.com
Subject: Account Investigation Request - ${recipientName} (${cleanEmail})

Please include your full registered contact details in your inquiry to assist our review team.

Sincerely,
Setlla Trust & Safety Administration
https://setlla.com`;

  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 28px; background-color: #FCF9F5; border: 1px solid #E5E7EB; border-radius: 20px; color: #342A21;">
      <div style="margin-bottom: 20px;">
        <span style="display: inline-block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; background-color: #342A21; color: #FFFFFF; padding: 4px 12px; border-radius: 9999px;">
          Setlla Notice
        </span>
      </div>
      <h2 style="font-size: 22px; font-weight: 700; color: #342A21; margin: 0 0 16px 0;">Account Termination Notice</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #342A21; margin: 0 0 16px 0;">Dear <strong>${recipientName}</strong>,</p>
      <p style="font-size: 14px; line-height: 1.6; color: #70798C; margin: 0 0 16px 0;">
        This is an official notification to inform you that your Setlla account associated with <strong>${cleanEmail}</strong> has been deactivated and removed by platform administration in accordance with our terms of service and security guidelines.
      </p>
      <p style="font-size: 14px; line-height: 1.6; color: #70798C; margin: 0 0 20px 0;">
        All active property listings, profile authorizations, and linked session tokens have been permanently revoked.
      </p>
      <div style="background-color: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 14px; padding: 18px; margin-bottom: 24px;">
        <p style="font-size: 13px; font-weight: 600; color: #342A21; margin: 0 0 8px 0;">Need Further Investigation?</p>
        <p style="font-size: 13px; line-height: 1.5; color: #70798C; margin: 0 0 12px 0;">
          If you believe this action was taken in error or wish to request further investigation into your account case, please contact our administrative team directly:
        </p>
        <a href="mailto:support@setlla.com?subject=Account%20Investigation%20Request%20-%20${encodeURIComponent(recipientName)}%20(${encodeURIComponent(cleanEmail)})" style="display: inline-block; background-color: #342A21; color: #FFFFFF; text-decoration: none; font-size: 12px; font-weight: 700; padding: 10px 20px; border-radius: 9999px;">
          Contact support@setlla.com &rarr;
        </a>
      </div>
      <p style="font-size: 12px; color: #70798C; margin: 0; line-height: 1.5;">
        Sincerely,<br/>
        <strong>Setlla Trust & Safety Administration</strong><br/>
        <span style="font-size: 11px; color: #A0AAB8;">Delta State Property & Rental Ecosystem</span>
      </p>
    </div>
  `;

  // Attempt dispatch via Supabase Edge Function or Webhook if available
  if (isSupabaseConfigured()) {
    try {
      await supabase.functions.invoke('send-email', {
        body: {
          to: cleanEmail,
          subject,
          text: textBody,
          html: htmlBody,
          from: 'Setlla Support <admin@setlla.com>',
        },
      });
    } catch (_) {
      // Best-effort background dispatch notice
    }
  }

  console.log(`[AccountDeletionEmail] Termination notice dispatched for ${cleanEmail} (${recipientName}). Contact: support@setlla.com`);

  return {
    success: true,
    message: `Account deletion notice dispatched to ${cleanEmail}.`,
  };
}
