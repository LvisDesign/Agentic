import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const webpush = require('web-push');

const DEFAULT_SUPABASE_URL = 'https://qxxheinizxyyrfcrijbs.supabase.co';
const DEFAULT_SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4eGhlaW5penh5eXJmY3JpamJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMyNjAzOTksImV4cCI6MjEwODgzNjM5OX0.xMzIyxs9JVluL5kmbcpLSyb1WKRcopnNzJhl8cB41PI';

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

  const vapidPublicKey = (
    process.env.VAPID_PUBLIC_KEY || process.env.VITE_VAPID_PUBLIC_KEY || ''
  ).trim();
  const vapidPrivateKey = (process.env.VAPID_PRIVATE_KEY || '').trim();
  const vapidSubject = (process.env.VAPID_SUBJECT || 'mailto:support@setlla.com').trim();

  if (!vapidPublicKey || !vapidPrivateKey) {
    return res.status(200).json({
      success: false,
      skipped: true,
      reason: 'VAPID keys not configured on server',
    });
  }

  try {
    const {
      targetPersonas = ['tenant', 'agent'],
      excludeUserId,
      title,
      body,
      url = '/',
      tag = 'setlla-alert',
      actions,
      supabaseUrl: reqSupabaseUrl,
      supabaseKey: reqSupabaseKey,
    } = req.body || {};

    if (!title || !body) {
      return res.status(400).json({ success: false, error: 'Missing title or body' });
    }

    const supabaseUrl = (
      reqSupabaseUrl ||
      process.env.SUPABASE_URL ||
      process.env.VITE_SUPABASE_URL ||
      DEFAULT_SUPABASE_URL
    ).replace(/\/+$/, '');
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      reqSupabaseKey ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      DEFAULT_SUPABASE_KEY;

    const personasFilter = Array.isArray(targetPersonas) && targetPersonas.length > 0
      ? targetPersonas.map((p) => String(p).trim()).filter(Boolean)
      : ['tenant', 'agent'];

    const queryUrl = `${supabaseUrl}/rest/v1/push_subscriptions?select=endpoint,user_id,persona,subscription&persona=in.(${personasFilter.join(',')})&limit=500`;
    const dbRes = await fetch(queryUrl, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    });

    if (!dbRes.ok) {
      const errText = await dbRes.text().catch(() => '');
      return res.status(200).json({
        success: false,
        reason: `Could not query push_subscriptions: ${errText}`,
      });
    }

    const rows = await dbRes.json();
    const targets = (Array.isArray(rows) ? rows : []).filter(
      (r) => r && r.subscription && (!excludeUserId || r.user_id !== excludeUserId)
    );

    if (targets.length === 0) {
      return res.status(200).json({ success: true, sent: 0, totalTargets: 0 });
    }

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

    const payload = JSON.stringify({
      title,
      body,
      url,
      tag,
      actions,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/notification-badge.png',
    });

    const expiredEndpoints = [];
    const results = await Promise.allSettled(
      targets.map(async (row) => {
        try {
          await webpush.sendNotification(row.subscription, payload);
          return true;
        } catch (err) {
          if (err && (err.statusCode === 410 || err.statusCode === 404)) {
            expiredEndpoints.push(row.endpoint);
          }
          throw err;
        }
      })
    );

    // Clean up expired/unsubscribed endpoints
    if (expiredEndpoints.length > 0) {
      await Promise.allSettled(
        expiredEndpoints.map((ep) =>
          fetch(
            `${supabaseUrl}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(ep)}`,
            {
              method: 'DELETE',
              headers: {
                apikey: supabaseKey,
                Authorization: `Bearer ${supabaseKey}`,
              },
            }
          )
        )
      );
    }

    const sentCount = results.filter((r) => r.status === 'fulfilled').length;
    return res.status(200).json({
      success: true,
      sent: sentCount,
      totalTargets: targets.length,
      cleanedExpired: expiredEndpoints.length,
    });
  } catch (err) {
    console.error('[PushAPI Error]', err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'Failed to send push notifications',
    });
  }
}
