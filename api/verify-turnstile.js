export default async function handler(req, res) {
  // Set CORS headers
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
    const { token } = req.body || {};
    if (!token) {
      return res.status(400).json({ success: false, error: 'Token is required' });
    }

    const secretKey =
      process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY ||
      '0x4AAAAAAF0F0REUM9f2DCH_AeFS3ZQAKbY';

    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);

    const clientIp =
      req.headers['cf-connecting-ip'] ||
      req.headers['x-forwarded-for'] ||
      req.socket?.remoteAddress;

    if (clientIp) {
      formData.append('remoteip', clientIp);
    }

    const cfResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData.toString(),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const result = await cfResponse.json();
    return res.status(200).json(result);
  } catch (err) {
    console.error('[Siteverify Error]', err);
    return res.status(500).json({ success: false, error: err?.message || 'Internal verification error' });
  }
}

