// Backgrounds
import jokerbg from "images/backgrounds/jokerbg.jpeg";

//logos
import jokermask from "images/logos/jokermask.svg"
import p5logo from "images/logos/p5logo.svg"

export const jokermaskpic =jokermask
export const p5logopic = p5logo


//text images
import choose from "images/imagetexts/choose.png"
import yourfate from "images/imagetexts/yourfate.png"

// Tarot
import card1 from "images/cards/1morgana.png";
import card2 from "images/cards/2makoto.png";
import card3 from "images/cards/3haru.png";
import card4 from "images/cards/4yusuke.png";
import card5 from "images/cards/5sojiro.png";
import card6 from "images/cards/6ann.png";
import card7 from "images/cards/7ryuji.png";
import card8 from "images/cards/8akechi.png";
import card9 from "images/cards/9futaba.png";
import card10 from "images/cards/13takemi.png";
import card11 from "images/cards/14kawakami.png";
import card12  from "images/cards/15kasumi.png";
import card13 from "images/cards/16Ren.png";


//confidant pfps

import joker from './images/confidantpfps/jokerpfp.png';       
import makoto from './images/confidantpfps/makotopfp.png';     
import futaba from './images/confidantpfps/futabapfp.png';     
import haru from './images/confidantpfps/harupfp.png';         
import yusuke from './images/confidantpfps/yusukepfp.png';     
import sojiro from './images/confidantpfps/sojiropfp.png';      
import ann from './images/confidantpfps/annpfp.png';           
import ryuji from './images/confidantpfps/ryujipfp.png';       
import akechi from './images/confidantpfps/akechipfp.png';     
import takemi from './images/confidantpfps/takemipfp.png';     
import kawakami from './images/confidantpfps/kawakamipfp.png'; 
import morgana from './images/confidantpfps/morganapfp.png';   
import kasumi from './images/confidantpfps/kasumipfp.png'; 


// Playlists in exact tarot card layout order
// tarotPlaylists.ts
export const tarotPlaylists: Record<string, string> = {
  card1:  "3ddNmQDYqnTN7QwlU6yNBc", // Morgana
  card2:  "6YqSw3aECyDfVZA3SVsBPf", // Makoto
  card3:  "3b6wv7e6uof5zbPBrFujiR", // Haru
  card4:  "00G7quUXEKOIzgBvoqm5bY", // Yusuke
  card5: "1HTTcCDEYRcCKSS5oCiUIx", // Sojiro
  card6:  "5N4F7MK6cdAI1GhcVm02fB", // Ann
  // card7 → Joker (Fool) — intentionally skipped
  card8: "3jkf40aA4HcesRnzPjTtsu",//ryuji
  card9:  "4otzOHM4cM4P0Cuc2FeOXc", // Akechi
  card10:  "5HLlDGnCeFJ3ySLPkqEh4C", // Futaba
  card11: "0cioH6fnO8VF5JD6PASKpf", // Takemi
  card12: "0nz3cRJG7ZdCzdWQmIPp56", // Kawakami
  card13:  "4zrpI3hiSt6GNRpRmrBMdr", // Kasumi
};


export const confidants = [
  morgana,   
  makoto,     
  haru,     
  yusuke,    
  sojiro,     
  ann,  
  joker,       
  ryuji,    
  akechi,
  futaba,    
  takemi,    
  kawakami,    
  kasumi,    
];


export const backgrounds = { jokerbg };
export const tarotCards = { card1, card2, card3,card4,card5,card6,card7,card8,card9,card10,card11,card12,card13 };
export const imagetexts = {choose,yourfate}
