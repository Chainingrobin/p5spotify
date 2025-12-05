/// <reference types="spotify-web-playback-sdk" />

import React, { useEffect, useState } from "react";
import "./PlaylistModal.css";

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
    spotifyUrl?: string; // 👈 optional now (Top Songs has no playlist URL)
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
  const [currentTrackUri, setCurrentTrackUri] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(true);

  //check play or pause
  useEffect(() => {
    if (!player) return;
    player.addListener("player_state_changed", (state) => {
      if (!state) return;
      setIsPaused(state.paused);
      const currentTrack = state.track_window.current_track?.uri;
      setCurrentTrackUri(currentTrack);
    });
  }, [player]);

  const handlePlayPause = async (uri: string) => {
    if (!player || !playerReady || !accessToken) return;

    if (uri === currentTrackUri) {
      // If same track, toggle pause/play
      await player.togglePlay();
    } else {
      // If different track, start playing it
      playUri(uri);
      setCurrentTrackUri(uri);
      setIsPaused(false);
    }
  };

  //handle restart
  const restartTrack = async (uri: string) => {
    if (!player || !playerReady || !accessToken) return;

    if (uri === currentTrackUri) {
      await player.seek(0); // restart current track
    } else {
      // If restarting a different track, just play from start
      playUri(uri);
      setCurrentTrackUri(uri);
      setIsPaused(false);
    }
  };

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
  useEffect(() => {
    if (!accessToken) return;

    let currentPlayer: Spotify.Player | null = null;

    const initializePlayer = () => {
      console.log("[Player] Initializing Spotify Web Playback SDK...");

      const newPlayer = new window.Spotify.Player({
        name: "Tarot Browser Player",
        getOAuthToken: (cb) => {
          console.log("[Player] Getting OAuth token...");
          cb(accessToken);
        },
        volume: 0.5,
      });

      newPlayer.addListener("ready", ({ device_id }) => {
        console.log("[Player] Ready with device ID:", device_id);
        setDeviceId(device_id);
        setPlayerReady(true);

        // Transfer playback to this device
        fetch("https://api.spotify.com/v1/me/player", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ device_ids: [device_id], play: false }),
        })
          .then((res) => {
            if (res.ok) {
              console.log("[Player] Device set as active");
            } else {
              console.error(
                "[Player] Failed to set active device:",
                res.status
              );
            }
          })
          .catch((err) => console.error("Error setting active device:", err));
      });

      newPlayer.addListener("not_ready", ({ device_id }) => {
        console.warn("[Player] Device went offline:", device_id);
        setPlayerReady(false);
      });

      newPlayer.addListener(
        "initialization_error",
        (err: { message: string }) => {
          console.error("[Player] Init error:", err.message);
        }
      );

      newPlayer.addListener(
        "authentication_error",
        (err: { message: string }) => {
          console.error("[Player] Auth error:", err.message);
          alert(
            "Spotify Web Player authentication failed.\n\n" +
              "If you're using LibreWolf or a privacy-focused browser:\n" +
              "1. Enable WebSockets in about:config (network.websocket.enabled)\n" +
              "2. Disable Enhanced Tracking Protection for this site\n" +
              "3. Or try using Chrome/Firefox instead"
          );
        }
      );

      newPlayer.addListener("account_error", (err: { message: string }) => {
        console.error("[Player] Account error:", err.message);
        alert("Spotify Premium is required for in-browser playback.");
      });

      newPlayer.addListener("playback_error", (err: { message: string }) => {
        console.error("[Player] Playback error:", err.message);
      });

      console.log("[Player] Connecting to Spotify...");
      newPlayer.connect().then((success) => {
        if (success) {
          console.log("[Player] Successfully connected to Spotify!");
          currentPlayer = newPlayer;
          setPlayer(newPlayer);
        } else {
          console.error("[Player] Failed to connect to Spotify");
          console.error(
            "[Player] This is likely due to WebSocket blocking in your browser. " +
              "LibreWolf and some privacy browsers block WebSockets by default."
          );
        }
      });
    };

    // Set up SDK ready callback
    window.onSpotifyWebPlaybackSDKReady = initializePlayer;

    // If SDK is already loaded, initialize immediately
    if (window.Spotify) {
      initializePlayer();
    }

    // Cleanup
    return () => {
      if (currentPlayer) {
        console.log("[Player] Disconnecting player...");
        currentPlayer.disconnect();
      }
    };
  }, [accessToken]);

  // Load Spotify SDK script
  useEffect(() => {
    if (!document.getElementById("spotify-player")) {
      console.log("[SDK] Loading Spotify Web Playback SDK script...");
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
      alert("Player is not ready yet. Please wait a moment and try again.");
      console.error("[Play] No device ID available");
      return;
    }

    console.log(`[Play] Attempting to play: ${uri} on device: ${deviceId}`);

    try {
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
        console.error("[Play] Error response:", res.status, text);

        if (res.status === 403) {
          alert("Spotify Premium is required for web playback.");
        } else if (res.status === 404) {
          alert("Device not found. The player may not be ready yet.");
        } else if (res.status === 401) {
          alert("Your session has expired. Please log in again.");
        } else {
          alert(`Playback failed: ${text}`);
        }
      } else {
        console.log("[Play] Successfully started playback");
      }
    } catch (err) {
      console.error("[Play] Network error:", err);
      alert("Failed to connect to Spotify. Check your internet connection.");
    }
  }

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>
          ✖
        </button>

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
                <img
                  src={profileImage}
                  alt="User Profile"
                  className="playlist-cover"
                />
              ) : playlist.image ? (
                <img
                  src={playlist.image}
                  alt={playlist.name}
                  className="playlist-cover"
                />
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
                  <div className="track-controls">
                    <button
                      className="restart-btn"
                      onClick={() => restartTrack(track.spotifyUri)}
                      disabled={!playerReady || !accessToken}
                    >
                      ⟲
                    </button>
                    <button
                      className="play-btn"
                      onClick={() => handlePlayPause(track.spotifyUri)}
                      disabled={!playerReady || !accessToken}
                    >
                      {currentTrackUri === track.spotifyUri && !isPaused
                        ? "⏸"
                        : "▶"}
                    </button>
                  </div>
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
