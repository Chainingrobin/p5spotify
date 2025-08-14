import {useState } from "react";
import { TarotLayout } from "components/Tarotcards/TarotCards";
import Background from "./components/Background/Background";
import { p5logopic } from "assets";
import clickSound from "assets/fr.mp3"; // Change filename to your actual mp3
import "./App.css";
import callingcard from "assets/images/imagetexts/callingcard.png"

function App() {
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
              src={callingcard} // Put your calling card image path here
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
      )}</div>

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

export default App;
