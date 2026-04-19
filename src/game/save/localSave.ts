import { SAVE_KEY } from "../constants";
import type { LocalSaveState } from "../types";

/**
 * 从 localStorage 中加载本地存档状态
 */
export function loadLocalSave(): LocalSaveState | null {
  try {
    const rawValue = window.localStorage.getItem(SAVE_KEY);
    if (!rawValue) return null;

    const parsed = JSON.parse(rawValue);
    if (!parsed || typeof parsed !== "object") return null;

    // 基本的结构校验，确保核心数据字段存在
    if (!parsed.player || typeof parsed.player !== "object") return null;
    if (!Array.isArray(parsed.blocks)) return null;

    // 确保玩家数据包含必要的数值类型
    const p = parsed.player;
    if (typeof p.yaw !== "number" || typeof p.pitch !== "number" || !Array.isArray(p.position)) {
      return null;
    }

    return parsed as LocalSaveState;
  } catch (err) {
    console.error("Failed to load local save:", err);
    return null;
  }
}

/**
 * 将状态保存到 localStorage 中
 */
export function saveLocalState(state: LocalSaveState): void {
  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch (err) {
    // 处理存储容量超限等问题（通常为 5MB 左右限制）
    if (err instanceof Error && err.name === "QuotaExceededError") {
      console.warn("Storage quota exceeded, save failed.");
    } else {
      console.error("Failed to save local state:", err);
    }
  }
}

/**
 * 清除本地的存档数据
 */
export function clearLocalSave(): void {
  try {
    window.localStorage.removeItem(SAVE_KEY);
  } catch (err) {
    console.error("Failed to clear local save:", err);
  }
}
