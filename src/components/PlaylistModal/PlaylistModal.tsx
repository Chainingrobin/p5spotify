/// <reference types="spotify-web-playback-sdk" />

import React, { useEffect, useState } from "react";
import "./playlistModal.css";

// ---- GLOBAL DECLARATIONS FOR SPOTIFY SDK ----
declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: typeof Spotify;
  }
}

interface PlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  loading: boolean;
  accessToken: string | null;
  extraControls?: React.ReactNode; // 👈 will be rendered below the title
  playlist: {
    name: string;
    image: string | null;
    spotifyUrl?: string;           // 👈 optional now (Top Songs has no playlist URL)
    tracks: {
      name: string;
      artist: string;
      albumCover: string | null;
      spotifyUri: string;
    }[];
    isTopSongs?: boolean;
  } | null;
}

const PlaylistModal: React.FC<PlaylistModalProps> = ({
  isOpen,
  onClose,
  loading,
  accessToken,
  extraControls, // 👈 receive dropdown from parent
  playlist,
}) => {
  const [player, setPlayer] = useState<Spotify.Player | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Fetch user profile image if top songs list
  useEffect(() => {
    if (playlist?.isTopSongs && accessToken) {
      fetch("https://api.spotify.com/v1/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.images?.length > 0) {
            setProfileImage(data.images[0].url);
          }
        })
        .catch((err) => console.error("Error fetching profile image:", err));
    }
  }, [playlist?.isTopSongs, accessToken]);

  // Initialize Spotify Web Playback SDK
  window.onSpotifyWebPlaybackSDKReady = () => {
    if (!accessToken || player) return;

    const newPlayer = new window.Spotify.Player({
      name: "Tarot Browser Player",
      getOAuthToken: (cb) => cb(accessToken),
      volume: 0.5,
    });

    newPlayer.addListener("ready", ({ device_id }) => {
      setDeviceId(device_id);
      setPlayerReady(true);

      fetch("https://api.spotify.com/v1/me/player", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ device_ids: [device_id], play: false }),
      }).catch((err) => console.error("Error setting active device:", err));
    });

    newPlayer.addListener("not_ready", ({ device_id }) => {
      console.warn("Device went offline", device_id);
      setPlayerReady(false);
    });

    newPlayer.addListener("initialization_error", (err: { message: string }) =>
      console.error("Init error:", err.message)
    );
    newPlayer.addListener("authentication_error", (err: { message: string }) =>
      console.error("Auth error:", err.message)
    );
    newPlayer.addListener("account_error", (err: { message: string }) => {
      console.error("Account error:", err.message);
      alert("Spotify Premium is required for in-browser playback.");
    });

    newPlayer.connect();
    setPlayer(newPlayer);
  };

  // Load Spotify SDK script
  useEffect(() => {
    if (!document.getElementById("spotify-player")) {
      const script = document.createElement("script");
      script.id = "spotify-player";
      script.src = "https://sdk.scdn.co/spotify-player.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  async function playUri(uri: string) {
    if (!accessToken) {
      alert("Please login with Spotify first.");
      return;
    }
    if (!deviceId) {
      alert("Player is not ready yet. One sec…");
      return;
    }

    const res = await fetch(
      `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ uris: [uri] }),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error("Play error:", text);
      if (res.status === 403) alert("Spotify Premium is required to play.");
      if (res.status === 404) alert("No active device found (SDK not ready).");
    }
  }

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>✖</button>

        {loading && (
          <div className="skeleton-container">
            <div className="skeleton skeleton-cover"></div>
            <div className="skeleton skeleton-title"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skeleton skeleton-track"></div>
            ))}
          </div>
        )}

        {!loading && playlist && (
          <>
            <div className="playlist-header">
              {playlist.isTopSongs && profileImage ? (
                <img src={profileImage} alt="User Profile" className="playlist-cover" />
              ) : playlist.image ? (
                <img src={playlist.image} alt={playlist.name} className="playlist-cover" />
              ) : null}

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <h2>{playlist.name}</h2>

                {/* 👇 RENDER EXTRA CONTROLS (e.g., time-range dropdown) */}
                {extraControls ? (
                  <div
                    className="extra-controls"
                    style={{ display: "flex", gap: 8, alignItems: "center" }}
                  >
                    {extraControls}
                  </div>
                ) : null}

                {/* Show "Open in Spotify" only when a URL exists and it’s not the Top Songs modal */}
                {!playlist.isTopSongs && playlist.spotifyUrl ? (
                  <a
                    href={playlist.spotifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="spotify-button"
                  >
                    Open in Spotify
                  </a>
                ) : null}

                {!accessToken && (
                  <p style={{ marginTop: 6, fontSize: 12 }}>
                    Log in with Spotify to play tracks.
                  </p>
                )}
              </div>
            </div>

            <div className="track-list">
              {playlist.tracks.map((track, index) => (
                <div key={index} className="track-item">
                  {track.albumCover && (
                    <img
                      src={track.albumCover}
                      alt={track.name}
                      className="track-cover"
                    />
                  )}
                  <div className="track-info">
                    <div className="track-name">{track.name}</div>
                    <div className="track-artist">{track.artist}</div>
                  </div>
                  <button
                    className="play-btn"
                    onClick={() => playUri(track.spotifyUri)}
                    disabled={!playerReady || !accessToken}
                  >
                    ▶
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PlaylistModal;
