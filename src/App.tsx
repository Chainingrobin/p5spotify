// src/App.tsx
import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { handleSpotifyCallback } from "./auth/spotifyAuth";
import { TarotLayout } from "components/Tarotcards/TarotCards";
import Background from "./components/Background/Background";
import { p5logopic } from "assets";
import clickSound from "assets/fr.mp3";
import "./App.css";
import callingcard from "assets/images/imagetexts/callingcard.png";


function Callback() {
  useEffect(() => {
    handleSpotifyCallback().then((token) => {
      console.log("Access token:", token);
      // After finishing the login, go back to the main page
      window.location.href = "/";
    });
  }, []);

  return <p>Completing Spotify login...</p>;
}

function Home() {
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
      <Route path="/" element={<Home />} />
      <Route path="/callback" element={<Callback />} />
    </Routes>
  );
}
