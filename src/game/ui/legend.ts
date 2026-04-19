import { BLOCK_REGISTRY } from "../world/Block";
import { getBlockDataUrl } from "../world/textures";
import type { BlockType } from "../types";

export function createLegend(): HTMLDivElement {
  const legend = document.createElement("div");
  legend.className = "legend";

  const title = document.createElement("strong");
  title.textContent = "Materials (1-9)";
  legend.append(title);

  const blockKeys: Exclude<BlockType, "air">[] = [
    "grass", "stone", "dirt", "wood", "leaves", "brick", "sand", "water", "ice"
  ];

  blockKeys.forEach((key, index) => {
    const data = BLOCK_REGISTRY[key];
    const item = document.createElement("div");
    item.className = "legend-item";
    item.id = `legend-item-${key}`;

    const colorBox = document.createElement("div");
    colorBox.className = "legend-color";
    const dataUrl = getBlockDataUrl(key, data.color);
    colorBox.style.backgroundImage = `url(${dataUrl})`;
    colorBox.style.backgroundSize = "cover";
    colorBox.style.imageRendering = "pixelated"; // Preserve the 8-bit style

    const label = document.createElement("span");
    label.textContent = `${index + 1} - ${key}`;

    item.append(colorBox, label);
    legend.append(item);
  });

  return legend;
}

export function updateLegendActive(legend: HTMLDivElement, activeBlock: Exclude<BlockType, "air">): void {
  const items = Array.from(legend.querySelectorAll(".legend-item"));
  for (const item of items) {
    if (item.id === `legend-item-${activeBlock}`) {
      item.classList.add("is-active");
    } else {
      item.classList.remove("is-active");
    }
  }
}
