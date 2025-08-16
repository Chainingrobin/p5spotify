// /api/refresh-token.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import axios from "axios";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const refreshToken = req.query.refresh_token as string;

  if (!refreshToken) {
    return res.status(400).json({ error: "Missing refresh token" });
  }

  try {
    const params = new URLSearchParams();
    params.append("grant_type", "refresh_token");
    params.append("refresh_token", refreshToken);

    const authHeader = Buffer.from(
      `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
    ).toString("base64");

    const response = await axios.post("https://accounts.spotify.com/api/token", params, {
      headers: {
        Authorization: `Basic ${authHeader}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    res.status(200).json(response.data); // includes new access_token
  } catch (error: any) {
    console.error("Error refreshing token:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to refresh token" });
  }
}
