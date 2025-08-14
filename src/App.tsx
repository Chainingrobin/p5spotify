import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { handleSpotifyCallback } from "./auth/spotifyAuth";
import { TarotLayout } from "components/Tarotcards/TarotCards";
import Background from "./components/Background/Background";
import { p5logopic } from "assets";
import clickSound from "assets/fr.mp3"; // Change filename to your actual mp3
import "./App.css";
import callingcard from "assets/images/imagetexts/callingcard.png";

// This component only runs when Spotify redirects back to /callback
function Callback() {
  useEffect(() => {
    handleSpotifyCallback().then((token) => {
      console.log("Access token:", token);
      // Redirect back to main page
      window.location.href = "/";
    });
  }, []);

  return <p>Completing Spotify login...</p>;
}

// Your main tarot page layout moved into its own component
function HomePage() {
  const [showModal, setShowModal] = useState(true);

  const playSound = () => {
    const audio = new Audio(clickSound);
    audio.play();
  };

  return (
    <Background>
      <div>
        {showModal && (
          <div className="calling-card-overlay">
            <div className="calling-card-modal">
              <img
                src={callingcard}
                alt="Instructions"
                className="calling-card-image"
              />
              <button
                className="close-calling-card"
                onClick={() => setShowModal(false)}
              >
                ✖
              </button>
            </div>
          </div>
        )}
      </div>

      <header className="header">
        <img
          src={p5logopic}
          alt="P5 Logo"
          className="LogoCenter"
          onClick={playSound}
          style={{ cursor: "pointer" }}
        />
      </header>

      <TarotLayout />
    </Background>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />        {/* main tarot UI */}
      <Route path="/callback" element={<Callback />} /> {/* Spotify redirect */}
    </Routes>
  );
}
