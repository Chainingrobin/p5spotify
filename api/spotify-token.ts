// api/spotify-token.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log("=== [Spotify Token API] Incoming request ===");
  console.log("Method:", req.method);
  console.log("Body received:", req.body);

  if (req.method !== 'POST') {
    console.error("Method not allowed:", req.method);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { code, redirectUri, codeVerifier } = req.body || {};

  if (!code || !redirectUri || !codeVerifier) {
    console.error("Missing required parameters:", { code, redirectUri, codeVerifier });
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  console.log("Env check - Client ID present:", !!clientId, "Client Secret present:", !!clientSecret);

  if (!clientId || !clientSecret) {
    console.error("Spotify credentials missing in environment variables!");
    return res.status(500).json({ error: 'Missing Spotify credentials' });
  }

  try {
    console.log("Exchanging code for token with Spotify...");

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

    console.log("Spotify token exchange success:", tokenResponse.data);

    res.status(200).json(tokenResponse.data);
  } catch (err: any) {
    console.error("Spotify token exchange failed:");
    if (err.response) {
      console.error("Status:", err.response.status);
      console.error("Data:", err.response.data);
    } else {
      console.error("Error message:", err.message);
    }
    res.status(500).json({ error: 'Token exchange failed', details: err.response?.data || err.message });
  }
}
