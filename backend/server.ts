import express, { Request, Response } from "express";
import axios from "axios";
import path from "path";
import dotenv from "dotenv";
import cors from "cors";
import { fileURLToPath } from 'url';

// Load env from root .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, ".env") });
console.log("Loaded SPOTIFY_CLIENT_ID:", process.env.SPOTIFY_CLIENT_ID ? "YES" : "NO");
console.log("Loaded SPOTIFY_CLIENT_SECRET:", process.env.SPOTIFY_CLIENT_SECRET ? "YES" : "NO");
console.log("Backend port:", process.env.PORT || 3001);


const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get("/api/playlist/:id", async (req: Request, res: Response) => {
  console.log("Fetching playlist:", req.params.id);
  try {
    const playlistId = req.params.id;
    if (!playlistId) {
      return res.status(400).json({ error: "Missing playlist ID" });
    }

    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error("Missing Spotify API credentials");
    }

    // Step 1: Get app access token (Client Credentials Flow)
    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const tokenResponse = await axios.post(
      "https://accounts.spotify.com/api/token",
      new URLSearchParams({ grant_type: "client_credentials" }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${authHeader}`,
        },
      }
    );

    const token = tokenResponse.data.access_token;

    // Step 2: Fetch playlist details
    const playlistResponse = await axios.get(
      `https://api.spotify.com/v1/playlists/${encodeURIComponent(playlistId)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    res.json(playlistResponse.data);
  } catch (error: any) {
    if (error.response) {
      console.error("Spotify API error:", error.response.data);
    } else {
      console.error("Error:", error.message);
    }
    res.status(500).json({ error: "Failed to fetch playlist" });
  }
});


app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
