/**
 * 创建准星 UI 元素
 */
export function createCrosshair(): HTMLDivElement {
  const crosshair = document.createElement("div");
  crosshair.className = "crosshair";
  return crosshair;
}

/**
 * 设置准星的激活状态（如指向可交互的方块时变色或放大等效果）
 */
export function setCrosshairActive(crosshair: HTMLDivElement, active: boolean): void {
  crosshair.classList.toggle("is-active", active);
}
