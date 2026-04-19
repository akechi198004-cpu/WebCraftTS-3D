import { GAME_TITLE } from "../constants";
import type { HudState } from "../types";

// 抬头显示器 (HUD) 视图接口
export interface HudView {
  root: HTMLDivElement;               // HUD 根容器
  info: HTMLDivElement;               // 信息显示区
  clearSaveButton: HTMLButtonElement; // 清除存档按钮
  autoParkourButton: HTMLButtonElement; // 自动跑酷按钮
}

/**
 * 创建 HUD 界面
 */
export function createHud(onClearSave: () => void, onToggleParkour: () => void): HudView {
  const root = document.createElement("div");
  root.className = "hud";

  // 创建显示游戏信息的容器
  const info = document.createElement("div");

  // 创建“清除存档”按钮
  const clearSaveButton = document.createElement("button");
  clearSaveButton.type = "button";
  clearSaveButton.textContent = "Clear Save"; // 按钮文本：清除存档
  clearSaveButton.addEventListener("click", onClearSave);

  // 创建“自动跑酷”按钮
  const autoParkourButton = document.createElement("button");
  autoParkourButton.type = "button";
  autoParkourButton.textContent = "Auto-Parkour"; // 按钮文本：自动跑酷
  autoParkourButton.style.marginLeft = "10px";
  autoParkourButton.addEventListener("click", onToggleParkour);

  root.append(info, clearSaveButton, autoParkourButton);

  return {
    root,
    info,
    clearSaveButton,
    autoParkourButton
  };
}

/**
 * 更新并渲染 HUD 的状态信息
 */
export function renderHud(view: HudView, state: HudState): void {
  // 使用 innerHTML 更新多行文本，利用 <br /> 进行换行
  view.info.innerHTML = [
    `<strong>${GAME_TITLE}</strong>`, // 游戏标题
    `FPS: ${state.fps}`,              // 当前帧率
    `Pointer Lock: ${state.pointerLocked ? "Locked" : "Click canvas to lock"}`, // 鼠标锁定状态
    `Looking at: ${state.selectedBlockText}`, // 准星指向的方块
    `Placing: ${state.placementBlockText}`,   // 当前准备放置的方块类型
    `Blocks: ${state.blockCount}`             // 已生成的方块数量
  ].join("<br />");

  // 将 Git Hash 和操作指南渲染到 body 的固定位置以确保独立显示
  let gitHashEl = document.getElementById("git-hash-overlay");
  if (!gitHashEl) {
    gitHashEl = document.createElement("div");
    gitHashEl.id = "git-hash-overlay";
    gitHashEl.className = "git-hash";
    document.body.appendChild(gitHashEl);
  }
  gitHashEl.textContent = `#${state.gitHash}`;

  let helpTextEl = document.getElementById("help-text-overlay");
  if (!helpTextEl) {
    helpTextEl = document.createElement("div");
    helpTextEl.id = "help-text-overlay";
    helpTextEl.className = "help-text";
    helpTextEl.textContent = "操作指南: Tab 切换视角，WASD 移动，空格跳跃，鼠标左右键交互，1-9 选方块";
    document.body.appendChild(helpTextEl);
  }
}
