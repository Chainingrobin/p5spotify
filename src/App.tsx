// src/App.tsx
import { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { TarotLayout } from "components/Tarotcards/TarotCards";
import Background from "./components/Background/Background";
import { p5logopic } from "assets";
import clickSound from "assets/fr.mp3";
import "./App.css";
import callingcard from "assets/images/imagetexts/callingcard.png";

// Import your actual callback page
import CallbackPage from "./pages/Callback";

const CALLING_CARD_KEY = "calling_card_seen";

function Home() {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Check if user has seen the calling card before
    const hasSeenCard = localStorage.getItem(CALLING_CARD_KEY);
    if (!hasSeenCard) {
      setShowModal(true);
    }
  }, []);

  const handleCloseModal = () => {
    setShowModal(false);
    // Mark as seen in localStorage
    localStorage.setItem(CALLING_CARD_KEY, "true");
  };

  const playSound = () => {
    const audio = new Audio(clickSound);
    audio.play();
  };

  return (
    <Background>
      {showModal && (
        <div className="calling-card-overlay">
          <div className="calling-card-modal">
            <img
              src={callingcard}
              alt="Instructions"
              className="calling-card-image"
            />
            <button className="close-calling-card" onClick={handleCloseModal}>
              ✖
            </button>
          </div>
        </div>
      )}

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
      <Route path="/callback" element={<CallbackPage />} />
    </Routes>
  );
}
