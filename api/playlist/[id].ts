// api/playlist/[id].ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const playlistId = req.query.id as string;
    if (!playlistId) {
      return res.status(400).json({ error: 'Missing playlist ID' });
    }

    const userAuth = req.headers.authorization; // From frontend

    let token: string;

    if (userAuth) {
      // ✅ Use user token from frontend login
      token = userAuth.replace("Bearer ", "");
    } else {
      // ❌ No user token — use app credentials
      const clientId = process.env.SPOTIFY_CLIENT_ID;
      const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
      if (!clientId || !clientSecret) {
        return res.status(500).json({ error: 'Missing Spotify API credentials' });
      }

      const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
      const tokenResponse = await axios.post(
        'https://accounts.spotify.com/api/token',
        new URLSearchParams({ grant_type: 'client_credentials' }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${authHeader}`,
          },
        }
      );

      token = tokenResponse.data.access_token;
    }

    // Fetch playlist details
    const playlistResponse = await axios.get(
      `https://api.spotify.com/v1/playlists/${encodeURIComponent(playlistId)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    res.status(200).json(playlistResponse.data);
  } catch (error: any) {
    if (error.response) {
      console.error('Spotify API error:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
    res.status(500).json({ error: 'Failed to fetch playlist' });
  }
}
