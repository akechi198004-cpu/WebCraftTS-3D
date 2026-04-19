import { GAME_TITLE } from "../constants";
import type { HudState } from "../types";

export interface HudView {
  root: HTMLDivElement;
  info: HTMLDivElement;
  clearSaveButton: HTMLButtonElement;
}

export function createHud(onClearSave: () => void): HudView {
  const root = document.createElement("div");
  root.className = "hud";

  const info = document.createElement("div");
  const clearSaveButton = document.createElement("button");
  clearSaveButton.type = "button";
  clearSaveButton.textContent = "Clear Save";
  clearSaveButton.addEventListener("click", onClearSave);

  root.append(info, clearSaveButton);

  return {
    root,
    info,
    clearSaveButton
  };
}

export function renderHud(view: HudView, state: HudState): void {
  view.info.innerHTML = [
    `<strong>${GAME_TITLE}</strong>`,
    `FPS: ${state.fps}`,
    `Pointer Lock: ${state.pointerLocked ? "Locked" : "Click canvas to lock"}`,
    `Looking at: ${state.selectedBlockText}`,
    `Placing: ${state.placementBlockText}`,
    `Blocks: ${state.blockCount}`,
    `Controls: WASD=move | Space=jump | LMB=rm | RMB=pl | 1-9=select | Esc=unlock`
  ].join("<br />");
}
