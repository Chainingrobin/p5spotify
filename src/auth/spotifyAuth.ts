  // src/auth/spotifyAuth.ts
  // PKCE + Spotify OAuth helpers for frontend (Vite)
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

  /* ---------- PKCE helpers (self-contained) ---------- */

  // base64-url encode an ArrayBuffer
  function base64urlencode(buffer: ArrayBuffer) {
    // Convert buffer to string then base64, then make URL-safe
    return btoa(String.fromCharCode(...new Uint8Array(buffer)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }

  // sha256 digest and base64url output
  async function sha256Base64url(input: string) {
    const enc = new TextEncoder();
    const data = enc.encode(input);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return base64urlencode(digest);
  }

  // generate a random code verifier string
  export function generateCodeVerifier(length = 96) {
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
    let out = "";
    const array = new Uint32Array(length);
    crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) out += possible[array[i] % possible.length];
    return out;
  }

  // generate code challenge (S256) from verifier
  export async function generateCodeChallenge(verifier: string) {
    return await sha256Base64url(verifier);
  }

  /* ---------- OAuth actions ---------- */

  // Start login - generates verifier + challenge, saves verifier, then redirects
  export async function startSpotifyLogin() {
    if (!CLIENT_ID || !REDIRECT_URI) {
      console.error("Missing VITE_SPOTIFY_CLIENT_ID or VITE_SPOTIFY_REDIRECT_URI");
      return;
    }

    const verifier = generateCodeVerifier();
    const challenge = await generateCodeChallenge(verifier);

    // Save verifier for later exchange (sessionStorage is safer for this short-lived secret)
    sessionStorage.setItem(VERIFIER_KEY, verifier);

    const params = new URLSearchParams({
      response_type: "code",
      client_id: CLIENT_ID,
      scope: SCOPES,
      redirect_uri: REDIRECT_URI,
      code_challenge_method: "S256",
      code_challenge: challenge,
      show_dialog: "true", // optional: force Spotify to show auth dialog
    });

    window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  // Handle redirect back from Spotify (/callback) - exchanges code for tokens
// src/auth/spotifyAuth.ts
export async function handleSpotifyCallback(): Promise<string | null> {
  console.log("[SpotifyAuth] Starting handleSpotifyCallback...");

  const url = new URL(window.location.href);
  const error = url.searchParams.get("error");
  if (error) {
    console.error("[SpotifyAuth] Spotify auth error:", error);
    window.history.replaceState({}, document.title, url.pathname);
    return null;
  }

  const code = url.searchParams.get("code");
  if (!code) {
    console.warn("[SpotifyAuth] No 'code' parameter found in callback URL.");
    return null;
  }

  // Clean the URL so code isn’t visible
  window.history.replaceState({}, document.title, url.pathname);

  const verifier = sessionStorage.getItem(VERIFIER_KEY);
  console.log("[SpotifyAuth] PKCE verifier from sessionStorage:", verifier);

  if (!verifier) {
    console.error("[SpotifyAuth] PKCE verifier not found in sessionStorage — cannot exchange token.");
    return null;
  }

  try {
    console.log("[SpotifyAuth] Sending token exchange request to /api/spotify-token...");
    const res = await fetch("/api/spotify-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        redirectUri: REDIRECT_URI,
        codeVerifier: verifier,
      }),
    });

    console.log("[SpotifyAuth] Token exchange response status:", res.status);
    const responseText = await res.text();
    console.log("[SpotifyAuth] Raw token exchange response text:", responseText);

    if (!res.ok) {
      console.error("[SpotifyAuth] Token exchange failed with status", res.status);
      return null;
    }

    const tokens = JSON.parse(responseText) as Tokens;
    console.log("[SpotifyAuth] Parsed token object:", tokens);

    const data = { ...tokens, obtained_at: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    console.log("[SpotifyAuth] Tokens stored in localStorage under key:", STORAGE_KEY);

    sessionStorage.removeItem(VERIFIER_KEY);
    console.log("[SpotifyAuth] PKCE verifier removed from sessionStorage");

    return tokens.access_token;
  } catch (e) {
    console.error("[SpotifyAuth] Error exchanging code:", e);
    return null;
  }
}



  /* ---------- Token helpers ---------- */

  export function getStoredAccessToken(): string | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      const data = JSON.parse(raw) as Tokens & { obtained_at: number };
      const expiresAt = data.obtained_at + data.expires_in * 1000 - 30_000; // expire 30s early
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
    const data = { ...stored, ...tokens, obtained_at: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return data.access_token;
  }

  export async function getValidAccessToken(): Promise<string | null> {
    const stored = getStoredAccessToken();
    if (stored) return stored;
    return refreshAccessToken();
  }

  export function logoutSpotify() {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(VERIFIER_KEY);
  }
