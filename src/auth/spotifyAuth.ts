// src/auth/spotifyAuth.ts
// Spotify OAuth + PKCE frontend helpers (Vite)

import { generateCodeVerifier, generateCodeChallenge } from "../pkceUtils";

const STORAGE_KEY = "spotify_tokens";
const VERIFIER_KEY = "spotify_pkce_verifier";

const DEFAULT_ORIGIN =
  typeof window !== "undefined" ? window.location.origin : "";

const RAW_API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";

const NORMALIZED_API_BASE = RAW_API_BASE.replace(/\/$/, "");

const API_BASE_URL = NORMALIZED_API_BASE || DEFAULT_ORIGIN;

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const REDIRECT_URI =
  import.meta.env.VITE_SPOTIFY_REDIRECT_URI ?? "http://127.0.0.1:5173/callback";

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

  // Check for errors in query params or hash
  const error =
    url.searchParams.get("error") ||
    new URLSearchParams(url.hash.slice(1)).get("error");
  if (error) {
    console.error("[SpotifyAuth] Spotify auth error:", error);
    window.history.replaceState({}, document.title, url.pathname);
    return null;
  }

  // Try to get tokens from hash (Implicit Grant)
  const hashParams = new URLSearchParams(url.hash.slice(1));
  const accessToken = hashParams.get("access_token");

  if (accessToken) {
    console.log("[SpotifyAuth] Using Implicit Grant flow (hash params)");

    const tokens: Tokens = {
      access_token: accessToken,
      token_type: (hashParams.get("token_type") as "Bearer") || "Bearer",
      scope: hashParams.get("scope") || SCOPES,
      expires_in: parseInt(hashParams.get("expires_in") || "3600"),
      refresh_token: hashParams.get("refresh_token") || undefined,
    };

    console.log("[SpotifyAuth] Parsed tokens:", tokens);

    // Save tokens with timestamp
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...tokens,
        obtained_at: Date.now(),
      })
    );

    // Clean up URL - remove hash
    window.history.replaceState({}, document.title, url.pathname);

    return tokens.access_token;
  }

  // Try Authorization Code Flow (query params)
  const code = url.searchParams.get("code");
  if (!code) {
    console.warn("[SpotifyAuth] No token or code found in callback URL");
    return null;
  }

  console.log("[SpotifyAuth] Using Authorization Code flow (query params)");

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
    const res = await fetch(`${API_BASE_URL}/api/spotify-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        redirectUri: REDIRECT_URI,
        codeVerifier: verifier,
      }),
    });

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
      `${API_BASE_URL}/api/refresh-token?refresh_token=${encodeURIComponent(
        stored.refresh_token
      )}`
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
