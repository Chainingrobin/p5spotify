import { TarotLayout } from "components/Tarotcards/TarotCards";
import Background from "./components/Background/Background";
import { p5logopic } from "assets";
import clickSound from "assets/fr.mp3"; // Change filename to your actual mp3
import "./App.css";

function App() {
  const playSound = () => {
    const audio = new Audio(clickSound);
    audio.play();
  };

  return (
    <Background>
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
