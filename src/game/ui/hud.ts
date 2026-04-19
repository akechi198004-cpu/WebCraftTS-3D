import { GAME_TITLE } from "../constants";
import type { HudState } from "../types";

// 抬头显示器 (HUD) 视图接口
export interface HudView {
  root: HTMLDivElement;               // HUD 根容器
  info: HTMLDivElement;               // 信息显示区
  clearSaveButton: HTMLButtonElement; // 清除存档按钮
}

/**
 * 创建 HUD 界面
 */
export function createHud(onClearSave: () => void): HudView {
  const root = document.createElement("div");
  root.className = "hud";

  // 创建显示游戏信息的容器
  const info = document.createElement("div");

  // 创建“清除存档”按钮
  const clearSaveButton = document.createElement("button");
  clearSaveButton.type = "button";
  clearSaveButton.textContent = "Clear Save"; // 按钮文本：清除存档
  clearSaveButton.addEventListener("click", onClearSave);

  root.append(info, clearSaveButton);

  return {
    root,
    info,
    clearSaveButton
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
    `Blocks: ${state.blockCount}`,            // 已生成的方块数量
    `Controls: WASD=move | Space=jump | LMB=rm | RMB=pl | 1-9=select | Esc=unlock` // 操作提示
  ].join("<br />");
}
