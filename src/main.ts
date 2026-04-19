import "./style.css";
import { Game } from "./game/Game";

// 获取挂载游戏的根元素
const app = document.querySelector<HTMLDivElement>("#app");

if (app === null) {
  throw new Error("App root element #app was not found."); // 如果没有找到挂载点，抛出错误
}

// 实例化并启动游戏
const game = new Game(app);
game.start();

