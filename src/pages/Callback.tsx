import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { handleSpotifyCallback } from "../auth/spotifyAuth";

export default function Callback() {
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const token = await handleSpotifyCallback();
      if (token) {
        console.log("Spotify access token stored:", token);
        navigate("/");
      } else {
        console.error("Spotify login failed.");
        navigate("/"); // Could send to an error page if you prefer
      }
    })();
  }, [navigate]);

  return (
    <div style={{ textAlign: "center", marginTop: "2rem" }}>
      <h2>Finishing Spotify Login…</h2>
      <p>Please wait while we connect to Spotify.</p>
    </div>
  );
}
