import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  if (!clientId) {
    return res.status(500).json({ error: "Missing SPOTIFY_CLIENT_ID env var" });
  }

  const { code, redirectUri, codeVerifier } =
    typeof req.body === "string" ? JSON.parse(req.body) : req.body ?? {};

  if (!code || !redirectUri || !codeVerifier) {
    return res
      .status(400)
      .json({ error: "Missing code, redirectUri, or codeVerifier" });
  }

  try {
    const form = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
      client_id: clientId,
    });

    const headers: Record<string, string> = {
      "Content-Type": "application/x-www-form-urlencoded",
    };
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    if (clientSecret) {
      const basic = Buffer.from(`${clientId}:${clientSecret}`).toString(
        "base64"
      );
      headers.Authorization = `Basic ${basic}`;
      form.append("client_secret", clientSecret);
    }

    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers,
      body: form,
    });

    const body = await tokenRes.json();
    if (!tokenRes.ok) {
      return res.status(tokenRes.status).json(body);
    }

    return res.status(200).json(body);
  } catch (err) {
    console.error("Spotify token exchange failed", err);
    return res.status(500).json({ error: "Spotify token exchange failed" });
  }
}
