// src/auth/spotifyAuth.ts
// Spotify OAuth + PKCE frontend helpers (Vite)

import { generateCodeVerifier, generateCodeChallenge } from "../pkceUtils";

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI;

const SCOPES = [
  "user-top-read",
  "streaming",
  "user-read-email",
  "user-read-private",
  "user-read-playback-state",
  "user-modify-playback-state",
  "app-remote-control",
].join(" ");

type Tokens = {
  access_token: string;
  token_type: "Bearer";
  scope: string;
  expires_in: number; // seconds
  refresh_token?: string;
};

const STORAGE_KEY = "spotify_tokens";
const VERIFIER_KEY = "spotify_pkce_verifier";

/* ---------- OAuth Actions ---------- */

// Step 1: Start login
export async function startSpotifyLogin() {
  if (!CLIENT_ID || !REDIRECT_URI) {
    console.error(
      "Missing VITE_SPOTIFY_CLIENT_ID or VITE_SPOTIFY_REDIRECT_URI"
    );
    return;
  }

  // Generate PKCE values using utils
  const verifier = generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);

  // Save PKCE verifier locally
  localStorage.setItem(VERIFIER_KEY, verifier);

  // Build Spotify auth URL
  const params = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    scope: SCOPES,
    redirect_uri: REDIRECT_URI,
    code_challenge_method: "S256",
    code_challenge: challenge,
    show_dialog: "true",
    access_type: "offline", // ✅ ensure refresh_token is issued
  });

  window.location.href = `https://accounts.spotify.com/authorize?${params}`;
}

// Step 2: Handle callback after login
export async function handleSpotifyCallback(): Promise<string | null> {
  console.log("[SpotifyAuth] Callback started...");

  const url = new URL(window.location.href);
  const error = url.searchParams.get("error");
  if (error) {
    console.error("[SpotifyAuth] Spotify auth error:", error);
    window.history.replaceState({}, document.title, url.pathname);
    return null;
  }

  const code = url.searchParams.get("code");
  if (!code) {
    console.warn("[SpotifyAuth] No code found in callback URL");
    return null;
  }

  // Remove code from URL
  window.history.replaceState({}, document.title, url.pathname);

  const verifier = localStorage.getItem(VERIFIER_KEY);
  if (!verifier) {
    console.error(
      "[SpotifyAuth] Missing PKCE verifier — cannot exchange token"
    );
    return null;
  }

  try {
    // Exchange code for tokens via backend
    const res = await fetch(
      "https://p5spotify-443y.vercel.app/api/spotify-token",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          redirectUri: REDIRECT_URI,
          codeVerifier: verifier,
        }),
      }
    );

    const rawText = await res.text();
    if (!res.ok) {
      console.error("[SpotifyAuth] Token exchange failed", res.status, rawText);
      return null;
    }

    const tokens = JSON.parse(rawText) as Tokens;
    console.log("[SpotifyAuth] Parsed tokens:", tokens);

    // Save tokens with timestamp
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...tokens,
        obtained_at: Date.now(),
      })
    );

    // Remove verifier
    localStorage.removeItem(VERIFIER_KEY);

    return tokens.access_token;
  } catch (err) {
    console.error("[SpotifyAuth] Error exchanging code:", err);
    return null;
  }
}

/* ---------- Token Helpers ---------- */

// Get access token if still valid
export function getStoredAccessToken(): string | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as Tokens & { obtained_at: number };
    const expiresAt = data.obtained_at + data.expires_in * 1000 - 30_000; // 30s buffer
    if (Date.now() < expiresAt) return data.access_token;
    return null;
  } catch (e) {
    console.error("Failed to parse stored tokens", e);
    return null;
  }
}

// Refresh token using backend API
export async function refreshAccessToken(): Promise<string | null> {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  const stored = JSON.parse(raw) as Tokens & { obtained_at: number };
  if (!stored.refresh_token) return null;

  try {
    const res = await fetch(
      `/api/refresh-token?refresh_token=${stored.refresh_token}`
    );
    if (!res.ok) {
      console.error("Refresh failed:", await res.text());
      return null;
    }

    const tokens = (await res.json()) as Tokens;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...stored,
        ...tokens,
        obtained_at: Date.now(),
      })
    );
    return tokens.access_token;
  } catch (err) {
    console.error("Error refreshing access token:", err);
    return null;
  }
}

// Always use this to get a valid token
export async function getValidAccessToken(): Promise<string | null> {
  const stored = getStoredAccessToken();
  if (stored) return stored;
  return refreshAccessToken();
}

// Logout
export function logoutSpotify() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(VERIFIER_KEY);
}
