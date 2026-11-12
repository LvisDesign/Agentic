export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const {
      to,
      subject,
      text,
      html,
      replyTo,
      fromName,
      advert,
      metadata,
      eventType = 'new_campaign',
    } = req.body || {};

    if (!subject || (!text && !html)) {
      return res.status(400).json({ success: false, error: 'Missing email subject or body' });
    }

    const configuredRecipients = (
      process.env.ADMIN_NOTIFICATION_EMAILS ||
      process.env.VITE_ADMIN_NOTIFICATION_EMAILS ||
      'admin@setlla.com,desk.lvisconsult@gmail.com'
    )
      .split(',')
      .map((email) => email.trim())
      .filter(Boolean);

    const recipients = Array.isArray(to) && to.length > 0
      ? to.map((e) => String(e).trim()).filter(Boolean)
      : typeof to === 'string' && to.trim()
      ? [to.trim()]
      : configuredRecipients;

    const resendApiKey = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY;
    const defaultFromName = fromName || (advert ? 'Setlla Adverts Alert' : 'Setlla Notifications');
    const fromAddress =
      process.env.RESEND_FROM_EMAIL ||
      `${defaultFromName} <notifications@setlla.com>`;

    let deliveredVia = null;

    // 1. Primary Delivery: Resend API (if RESEND_API_KEY is configured in Vercel)
    if (resendApiKey) {
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromAddress,
          to: recipients,
          reply_to: replyTo || advert?.partnerEmail || 'support@setlla.com',
          subject,
          text,
          html,
        }),
      });

      if (resendRes.ok) {
        deliveredVia = 'resend';
      } else {
        const errText = await resendRes.text().catch(() => '');
        console.warn('[NotificationAPI] Resend response notice:', errText);
      }
    }

    // 2. Secondary Delivery: Custom Webhook / SMTP Bridge if configured
    if (!deliveredVia && process.env.ADMIN_EMAIL_WEBHOOK_URL) {
      const hookRes = await fetch(process.env.ADMIN_EMAIL_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipients,
          subject,
          text,
          html,
          replyTo,
          advert,
          metadata,
          eventType,
        }),
      });
      if (hookRes.ok) {
        deliveredVia = 'webhook';
      }
    }

    // 3. Fallback Delivery: FormSubmit AJAX relay to recipient inboxes
    if (!deliveredVia) {
      const formPayload = metadata && typeof metadata === 'object'
        ? {
            _subject: subject,
            _template: 'box',
            _captcha: 'false',
            ...metadata,
            Message: text,
          }
        : {
            _subject: subject,
            _template: 'box',
            _captcha: 'false',
            Event: eventType === 'edited_campaign' ? 'Advert Creative Updated (Needs Review)' : 'New Sponsored Advert Submitted',
            Advertiser: advert?.advertiserName || 'Setlla Partner',
            Partner_Email: advert?.partnerEmail || replyTo || 'N/A',
            Headline: advert?.headline || 'N/A',
            Category: advert?.category || 'Promo',
            Location: advert?.location || 'Delta State',
            Package_Tier: advert?.packageTier || 'starter',
            Budget_Paid: advert?.budgetAmount ? `NGN ${Number(advert.budgetAmount).toLocaleString()}` : 'N/A',
            Payment_Method: advert?.paymentMethod || 'Ad Wallet Credits',
            Payment_Reference: advert?.paymentReference || 'N/A',
            WhatsApp: advert?.whatsappNumber || advert?.phone || 'N/A',
            Website_URL: advert?.websiteUrl || 'N/A',
            Media_URL: advert?.mediaUrl || 'N/A',
            Admin_Portal_Action: 'https://private.setlla.com',
            Message: text,
          };

      const relayPromises = recipients.map((recipientEmail) =>
        fetch(`https://formsubmit.co/ajax/${encodeURIComponent(recipientEmail)}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(formPayload),
        }).catch(() => null)
      );

      await Promise.allSettled(relayPromises);
      deliveredVia = 'formsubmit_relay';
    }

    return res.status(200).json({
      success: true,
      deliveredVia,
      recipients,
    });
  } catch (err) {
    console.error('[AdminNotificationAPI Error]', err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'Failed to dispatch admin notification email',
    });
  }
}

