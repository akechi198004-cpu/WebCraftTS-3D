import "./style.css";
import { Game } from "./game/Game";

const app = document.querySelector<HTMLDivElement>("#app");

if (app === null) {
  throw new Error("App root element #app was not found.");
}

const game = new Game(app);
game.start();

