// src/App.tsx
import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import { TarotLayout } from "components/Tarotcards/TarotCards";
import Background from "./components/Background/Background";
import { p5logopic } from "assets";
import clickSound from "assets/fr.mp3";
import "./App.css";
import callingcard from "assets/images/imagetexts/callingcard.png";

// Import your actual callback page
import CallbackPage from "./pages/Callback";

function Home() {
  const [showModal, setShowModal] = useState(true);

  const playSound = () => {
    const audio = new Audio(clickSound);
    audio.play();
  };

  return (
    <Background>
      //testinggggg
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
