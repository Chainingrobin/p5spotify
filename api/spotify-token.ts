// api/spotify-token.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed", method: req.method });
  }

  res.status(200).json({
    message: "POST accepted",
    body: req.body,
  });
}
