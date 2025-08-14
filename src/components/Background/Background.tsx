import { ReactNode } from "react";
import { backgrounds } from "assets";
import backgroundStyles from "./Background.module.css";

interface BackgroundProps {
  children: ReactNode;
}

export default function Background({ children }: BackgroundProps) {
  return (
    <div
      className={backgroundStyles.backgroundContainer} 
      style={{ backgroundImage: `url(${backgrounds.jokerbg})` }}>
      <div className={backgroundStyles.content}>
        {children}
      </div>
    </div>
  );
}
