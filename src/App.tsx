import { TarotLayout } from "components/Tarotcards/TarotCards";
import Background from "./components/Background/Background";
import { p5logopic } from "assets";
import "./App.css"


function App() {
  return (
    <Background>
      <header className="header">
      <img src={p5logopic} alt="P5 Logo" className="LogoCenter"/>
    </header>
      <TarotLayout></TarotLayout>
    </Background>
  );
}

export default App;