export function createCrosshair(): HTMLDivElement {
  const crosshair = document.createElement("div");
  crosshair.className = "crosshair";
  return crosshair;
}

export function setCrosshairActive(crosshair: HTMLDivElement, active: boolean): void {
  crosshair.classList.toggle("is-active", active);
}
