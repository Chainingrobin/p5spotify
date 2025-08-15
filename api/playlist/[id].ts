// api/playlist/[id].ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import axios from "axios";

// Self-contained API route to fetch Spotify playlist by ID
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  const playlistId = req.query.id as string;
  if (!playlistId) {
    res.status(400).json({ error: "Missing playlist ID" });
    return;
  }

  try {
    let token: string;

    // Try to use the user's access token from request
    const userAuth = req.headers.authorization;
    if (userAuth) {
      token = userAuth.replace("Bearer ", "");
    } else {
      // Fallback to client credentials flow
      const clientId = process.env.SPOTIFY_CLIENT_ID;
      const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        res.status(500).json({ error: "Missing Spotify API credentials" });
        return;
      }

      const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
      const tokenResponse = await axios.post(
        "https://accounts.spotify.com/api/token",
        "grant_type=client_credentials",
        {
          headers: {
            Authorization: `Basic ${authHeader}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      token = tokenResponse.data.access_token;
    }

    // Fetch the playlist from Spotify API
    const playlistResponse = await axios.get(
      `https://api.spotify.com/v1/playlists/${encodeURIComponent(playlistId)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    res.status(200).json(playlistResponse.data);
  } catch (error: any) {
    if (error.response) {
      console.error("Spotify API error:", error.response.data);
      res
        .status(error.response.status || 500)
        .json({ error: error.response.data || "Spotify API request failed" });
    } else {
      console.error("Error:", error.message);
      res.status(500).json({ error: "Failed to fetch playlist" });
    }
  }
}
