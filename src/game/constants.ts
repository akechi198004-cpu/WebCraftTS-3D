import type { Vector3Tuple } from "./types";

export const GAME_TITLE = "webcraft-ts";

export const CAMERA_FOV = 90;
export const CAMERA_NEAR = 0.1;
export const CAMERA_FAR = 200;
export const SCENE_BACKGROUND = 0x8dc7ff;

export const SAVE_KEY = "webcraft-ts:save:v11";

// Run initial cleanup for old save keys
try {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith("webcraft-ts:save:") && key !== SAVE_KEY) {
      keysToRemove.push(key);
    }
  }
  for (const key of keysToRemove) {
    localStorage.removeItem(key);
  }
} catch (e) {}

export const WORLD_FLOOR_Y = 0;
export const CHUNK_SIZE = 16;
export const RENDER_DISTANCE = 4;
export const INTERACTION_DISTANCE = 6;

export const PLAYER_MOVE_SPEED = 5;
export const PLAYER_JUMP_SPEED = 8.5;
export const PLAYER_RADIUS = 0.35;
export const PLAYER_HEIGHT = 1.8;
export const PLAYER_EYE_HEIGHT = 1.62;
// Center of Taj(-32,-32), Tower(32,-32), Pyramid(0,32) is (0, -10.6).
// We'll spawn at (0, -11) looking somewhat towards the pyramid (Z+).
export const PLAYER_START_POSITION: Vector3Tuple = [0.0, 2.0, -11.0];
export const PLAYER_START_YAW = 0;
export const PLAYER_START_PITCH = 0.15;
export const PLAYER_MAX_PITCH = Math.PI / 2 - 0.01;
export const GRAVITY_ACCELERATION = 24;

export const POINTER_SENSITIVITY = 0.0025;
