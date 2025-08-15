import type { VercelRequest, VercelResponse } from '@vercel/node';
import fetch from 'node-fetch';

export default async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, redirectUri, codeVerifier } = req.body;

  if (!code || !redirectUri || !codeVerifier) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    console.log("Env vars:", {
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET ? "set" : "missing",
    });

    const body = new URLSearchParams({
      client_id: process.env.SPOTIFY_CLIENT_ID!,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    });

    const r = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    const data = await r.json();
    if (!r.ok) {
      console.error('Spotify token error:', data);
      return res.status(r.status).json(data);
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error('Server error exchanging Spotify code:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};
