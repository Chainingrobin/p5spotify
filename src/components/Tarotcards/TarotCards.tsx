import React, { useEffect, useState } from "react";
import Tarotstyle from "./TarotCards.module.css";
import { tarotCards, imagetexts, confidants, tarotPlaylists } from "assets";
import { getPlaylist } from "../../api";
import PlaylistModal from "../PlaylistModal/PlaylistModal";
import {
  startSpotifyLogin,
  handleSpotifyCallback,
  getValidAccessToken,
  logoutSpotify,
} from "../../auth/spotifyAuth";

const PlaylistSkeleton = () => (
  <div className={Tarotstyle.skeleton}>
    <div className={Tarotstyle.skeletonImage}></div>
    <div className={Tarotstyle.skeletonText}></div>
    <div className={Tarotstyle.skeletonText}></div>
  </div>
);

export const TarotLayout: React.FC = () => {
  const allCardsArray = Object.values(tarotCards);
  const LeftCards = allCardsArray.slice(0, 6);
  const FoolCard = tarotCards.card13;
  const RightCards = allCardsArray.slice(6, 12);

  const [playlist, setPlaylist] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<"short_term" | "medium_term" | "long_term">("short_term");

  // Get Spotify token
  useEffect(() => {
    (async () => {
      const tokenFromCallback = await handleSpotifyCallback();
      if (tokenFromCallback) {
        setAccessToken(tokenFromCallback);
        window.history.replaceState({}, document.title, window.location.pathname);
      } else {
        const stored = await getValidAccessToken();
        if (stored) setAccessToken(stored);
      }
    })();
  }, []);

  // Fetch profile pic once
  useEffect(() => {
    if (!accessToken) return;
    (async () => {
      try {
        const res = await fetch("https://api.spotify.com/v1/me", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok) throw new Error("Failed to fetch profile");
        const data = await res.json();
        if (data.images?.length > 0) {
          setProfilePic(data.images[0].url);
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    })();
  }, [accessToken]);

  // Fetch top songs
  const fetchTopSongs = async (range: "short_term" | "medium_term" | "long_term") => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `https://api.spotify.com/v1/me/top/tracks?time_range=${range}&limit=20`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch top tracks");
      const data = await res.json();

      setPlaylist({
        name: "Your Top Songs",
        image: profilePic,
        isTopSongs: true,
        tracks: data.items.map((track: any) => ({
          name: track.name,
          artist: track.artists.map((a: any) => a.name).join(", "),
          albumCover: track.album.images?.[0]?.url || null,
          spotifyUri: track.uri,
        })),
      });
    } catch (err: any) {
      console.error("Error fetching top songs:", err);
      setError(err.message || "Failed to load top songs.");
    } finally {
      setLoading(false);
    }
  };

  // Handle card click
  const handleCardClick = async (cardKey: string) => {
    if (cardKey === "fool") {
      await fetchTopSongs(timeRange);
      setIsModalOpen(true);
      return;
    }

    const playlistId = tarotPlaylists[cardKey];
    if (!playlistId) {
      setError("No playlist found for this card.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getPlaylist(playlistId);
      if (!data?.tracks?.items?.length) {
        throw new Error("Playlist data is empty or invalid.");
      }
      setPlaylist({
        name: data.name,
        image: data.images?.[0]?.url || null,
        spotifyUrl: data.external_urls.spotify,
        tracks: data.tracks.items.map((item: any) => ({
          name: item.track.name,
          artist: item.track.artists.map((a: any) => a.name).join(", "),
          albumCover: item.track.album.images?.[0]?.url || null,
          spotifyUri: item.track.uri,
        })),
      });
      setIsModalOpen(true);
    } catch (err: any) {
      setError(err.message || "Failed to load playlist.");
    } finally {
      setLoading(false);
    }
  };

  const renderCard = (card: string, confidant: string, cardKey: string, i: number) => (
    <div
      key={i}
      className={Tarotstyle.cardContainer}
      onClick={() => handleCardClick(cardKey)}
      style={{ cursor: "pointer" }}
    >
      <img src={confidant} alt={`Confidant ${i + 1}`} className={Tarotstyle.confidantImage} />
      <img src={card} alt={`Card ${i + 1}`} className={Tarotstyle.tarotCard} />
    </div>
  );

  const handleLogout = () => {
    logoutSpotify();
    setAccessToken(null);
    setProfilePic(null);
  };

  return (
    <>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {!accessToken ? (
          <button onClick={startSpotifyLogin}>Login with Spotify</button>
        ) : (
          <button onClick={handleLogout}>Logout Spotify</button>
        )}
      </div>

      <div className={Tarotstyle.layout}>
        {/* LEFT */}
        <div className={Tarotstyle.left}>
          {LeftCards.slice(0, 3).map((card, i) =>
            renderCard(card, confidants[i], `card${i + 1}`, i)
          )}
          <img src={imagetexts.choose} alt="Left Column Text" className={Tarotstyle.textImagechoose} />
          {LeftCards.slice(3, 6).map((card, i) =>
            renderCard(card, confidants[i + 3], `card${i + 4}`, i + 3)
          )}
        </div>

        {/* CENTER — Fool card */}
        <div className={Tarotstyle.center}>
          <div
            className={`${Tarotstyle.cardContainer} ${Tarotstyle.foolCardstyle}`}
            onClick={() => handleCardClick("fool")}
            style={{ cursor: "pointer" }}
          >
            <img
              src={profilePic || confidants[6]}
              alt="User Profile or Joker"
              className={`${Tarotstyle.confidantImage} ${Tarotstyle.jokerimage} `}
            />
            <img src={FoolCard} alt="Fool Card" className={Tarotstyle.tarotCard} />
          </div>
        </div>

        {/* RIGHT */}
        <div className={Tarotstyle.right}>
          {RightCards.slice(0, 3).map((card, i) =>
            renderCard(card, confidants[i + 7], `card${i + 8}`, i)
          )}
          <img src={imagetexts.yourfate} alt="YOUR FATE" className={Tarotstyle.textImagefate} />
          {RightCards.slice(3, 6).map((card, i) =>
            renderCard(card, confidants[i + 10], `card${i + 11}`, i + 3)
          )}
        </div>
      </div>

      {loading && <PlaylistSkeleton />}

      {accessToken && (
        <PlaylistModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          loading={loading}
          accessToken={accessToken}
          playlist={playlist}
          extraControls={
            playlist?.isTopSongs && (
              <select
                value={timeRange}
                onChange={(e) => {
                  const newRange = e.target.value as "short_term" | "medium_term" | "long_term";
                  setTimeRange(newRange);
                  fetchTopSongs(newRange);
                }}
                style={{ marginBottom: "10px" }}
              >
                <option value="short_term">Last 4 Weeks</option>
                <option value="medium_term">Last 6 Months</option>
                <option value="long_term">All Time</option>
              </select>
            )
          }
        />
      )}

      {error && <p style={{ color: "red" }}>{error}</p>}
    </>
  );
};
