import { SAVE_KEY } from "../constants";
import type { LocalSaveState } from "../types";

export function loadLocalSave(): LocalSaveState | null {
  try {
    const rawValue = window.localStorage.getItem(SAVE_KEY);
    if (!rawValue) return null;

    const parsed = JSON.parse(rawValue);
    if (!parsed || typeof parsed !== "object") return null;

    // Basic structural validation
    if (!parsed.player || typeof parsed.player !== "object") return null;
    if (!Array.isArray(parsed.blocks)) return null;

    // Ensure numeric values exist in player data
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

export function saveLocalState(state: LocalSaveState): void {
  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch (err) {
    // Handle QuotaExceededError or other storage issues
    if (err instanceof Error && err.name === "QuotaExceededError") {
      console.warn("Storage quota exceeded, save failed.");
    } else {
      console.error("Failed to save local state:", err);
    }
  }
}

export function clearLocalSave(): void {
  window.localStorage.removeItem(SAVE_KEY);
}
