// api/spotify-token.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { code, redirectUri, codeVerifier } = req.body;

  if (!code || !redirectUri || !codeVerifier) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: 'Missing Spotify credentials' });
  }

  try {
    const tokenResponse = await axios.post(
      'https://accounts.spotify.com/api/token',
      new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    res.status(200).json(tokenResponse.data);
  } catch (err: any) {
    console.error('Spotify token exchange failed:', err.response?.data || err.message);
    res.status(500).json({ error: 'Token exchange failed' });
  }
}
