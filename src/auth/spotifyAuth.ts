// src/auth/spotifyAuth.ts
// PKCE + Spotify OAuth helpers for Vite frontend

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI;

const SCOPES = [
  "user-top-read",
  "streaming",
  "user-read-email",
  "user-read-private",
  "user-read-playback-state",
  "user-modify-playback-state",
  "app-remote-control"
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

/* ---------- PKCE Helpers ---------- */

// base64-url encode an ArrayBuffer
function base64urlencode(buffer: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// sha256 digest → base64url
async function sha256Base64url(input: string) {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64urlencode(digest);
}

// generate a random PKCE code verifier
export function generateCodeVerifier(length = 96) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  let out = "";
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) out += chars[array[i] % chars.length];
  return out;
}

// generate PKCE challenge from verifier
export async function generateCodeChallenge(verifier: string) {
  return await sha256Base64url(verifier);
}

/* ---------- OAuth Actions ---------- */

// Start login - saves verifier then redirects to Spotify
export async function startSpotifyLogin() {
  if (!CLIENT_ID || !REDIRECT_URI) {
    console.error("Missing VITE_SPOTIFY_CLIENT_ID or VITE_SPOTIFY_REDIRECT_URI");
    return;
  }

  const verifier = generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);

  // Store PKCE verifier (use localStorage to survive reloads)
  localStorage.setItem(VERIFIER_KEY, verifier);

  const params = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    scope: SCOPES,
    redirect_uri: REDIRECT_URI,
    code_challenge_method: "S256",
    code_challenge: challenge,
    show_dialog: "true",
  });

  window.location.href = `https://accounts.spotify.com/authorize?${params}`;
}

// Handle callback from Spotify → exchange code for tokens
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
  console.log(url);
  
  if (!code) {
    console.warn("[SpotifyAuth] No code found in callback URL");
    return null;
  }

  // Remove code from URL
  window.history.replaceState({}, document.title, url.pathname);

  const verifier = localStorage.getItem(VERIFIER_KEY);
  console.log("[SpotifyAuth] PKCE verifier from localStorage:", verifier);
  if (!verifier) {
    console.error("[SpotifyAuth] Missing PKCE verifier — cannot exchange token");
    return null;
  }

  try {
    const res = await fetch("/api/spotify-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        redirectUri: REDIRECT_URI,
        codeVerifier: verifier,
      }),
    });

    const rawText = await res.text();
    console.log("[SpotifyAuth] Raw response:", rawText);

    if (!res.ok) {
      console.error("[SpotifyAuth] Token exchange failed", res.status, rawText);
      return null;
    }

    const tokens = JSON.parse(rawText) as Tokens;
    console.log("[SpotifyAuth] Parsed tokens:", tokens);

    // Save tokens with timestamp
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...tokens,
      obtained_at: Date.now(),
    }));

    // Remove verifier — no longer needed
    localStorage.removeItem(VERIFIER_KEY);

    return tokens.access_token;
  } catch (err) {
    console.error("[SpotifyAuth] Error exchanging code:", err);
    return null;
  }
}

/* ---------- Token Helpers ---------- */

export function getStoredAccessToken(): string | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as Tokens & { obtained_at: number };
    const expiresAt = data.obtained_at + data.expires_in * 1000 - 30_000;
    if (Date.now() < expiresAt) return data.access_token;
    return null;
  } catch (e) {
    console.error("Failed to parse stored tokens", e);
    return null;
  }
}

export async function refreshAccessToken(): Promise<string | null> {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  const stored = JSON.parse(raw) as Tokens & { obtained_at: number };
  if (!stored.refresh_token) return null;

  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    grant_type: "refresh_token",
    refresh_token: stored.refresh_token,
  });

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    console.error("Refresh failed:", await res.text());
    return null;
  }

  const tokens = (await res.json()) as Tokens;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    ...stored,
    ...tokens,
    obtained_at: Date.now(),
  }));
  return tokens.access_token;
}

export async function getValidAccessToken(): Promise<string | null> {
  const stored = getStoredAccessToken();
  if (stored) return stored;
  return refreshAccessToken();
}

export function logoutSpotify() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(VERIFIER_KEY);
}
