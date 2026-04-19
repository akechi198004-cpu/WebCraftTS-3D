import { BLOCK_REGISTRY } from "../world/Block";
import { getBlockDataUrl } from "../world/textures";
import type { BlockType } from "../types";

/**
 * 创建图例（快捷栏）UI 元素，显示按键 1-9 对应的方块材质
 */
export function createLegend(): HTMLDivElement {
  const legend = document.createElement("div");
  legend.className = "legend";

  const title = document.createElement("strong");
  title.textContent = "Materials (1-9)";
  legend.append(title);

  // 可放置方块的键名列表，与键盘 1-9 对应
  const blockKeys: Exclude<BlockType, "air">[] = [
    "grass", "stone", "dirt", "wood", "leaves", "brick", "sand", "water", "ice"
  ];

  blockKeys.forEach((key, index) => {
    const data = BLOCK_REGISTRY[key];
    const item = document.createElement("div");
    item.className = "legend-item";
    item.id = `legend-item-${key}`;

    // 使用方块的材质作为预览图标
    const colorBox = document.createElement("div");
    colorBox.className = "legend-color";
    const dataUrl = getBlockDataUrl(key, data.color);
    colorBox.style.backgroundImage = `url(${dataUrl})`;
    colorBox.style.backgroundSize = "cover";
    colorBox.style.imageRendering = "pixelated"; // 保持 8 位像素风格，不进行模糊处理

    const label = document.createElement("span");
    label.textContent = `${index + 1} - ${key}`; // 例如：1 - grass

    item.append(colorBox, label);
    legend.append(item);
  });

  return legend;
}

/**
 * 更新图例激活状态，高亮显示当前选中的方块
 */
export function updateLegendActive(legend: HTMLDivElement, activeBlock: Exclude<BlockType, "air">): void {
  const items = Array.from(legend.querySelectorAll(".legend-item"));
  for (const item of items) {
    if (item.id === `legend-item-${activeBlock}`) {
      item.classList.add("is-active"); // 高亮当前选中的项
    } else {
      item.classList.remove("is-active"); // 移除其它项的高亮
    }
  }
}
