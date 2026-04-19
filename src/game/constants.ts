import type { Vector3Tuple } from "./types";

// 游戏标题
export const GAME_TITLE = "webcraft-ts";

// 相机配置
export const CAMERA_FOV = 90;
export const CAMERA_NEAR = 0.1;
export const CAMERA_FAR = 200;
// 场景背景色（天空蓝）
export const SCENE_BACKGROUND = 0x8dc7ff;

// 本地存档键名
export const SAVE_KEY = "webcraft-ts:save:v11";

// 运行初始清理操作，清除旧版本存档
try {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    // 如果找到旧版本的存档键，则加入移除列表
    if (key && key.startsWith("webcraft-ts:save:") && key !== SAVE_KEY) {
      keysToRemove.push(key);
    }
  }
  for (const key of keysToRemove) {
    localStorage.removeItem(key);
  }
} catch (e) {}

// 世界配置参数
export const WORLD_FLOOR_Y = 0;           // 世界地面初始Y坐标
export const CHUNK_SIZE = 16;             // 区块大小（16x16x16或其他，当前表示XZ维度的大小）
export const RENDER_DISTANCE = 4;         // 渲染距离（区块数）
export const INTERACTION_DISTANCE = 6;    // 玩家与方块的互动距离

// 玩家物理/控制参数
export const PLAYER_MOVE_SPEED = 5;       // 玩家移动速度
export const PLAYER_JUMP_SPEED = 8.5;     // 玩家跳跃初始速度
export const PLAYER_RADIUS = 0.35;        // 玩家碰撞体半径
export const PLAYER_HEIGHT = 1.8;         // 玩家碰撞体高度
export const PLAYER_EYE_HEIGHT = 1.62;    // 玩家眼睛高度（相机位置相对于脚底的偏移）

// 出生点设置
// 建筑物如Taj(-32,-32), Tower(32,-32), Pyramid(0,32) 的中心大约在 (0, -10.6).
// 我们设置出生点在 (0, -11) 并朝向Pyramid (Z+).
export const PLAYER_START_POSITION: Vector3Tuple = [0.0, 2.0, -11.0];
export const PLAYER_START_YAW = 0;        // 初始水平偏航角
export const PLAYER_START_PITCH = 0.15;   // 初始垂直俯仰角
export const PLAYER_MAX_PITCH = Math.PI / 2 - 0.01; // 最大俯仰角（限制在将近90度，避免相机翻转）
export const GRAVITY_ACCELERATION = 24;   // 重力加速度

// 鼠标控制灵敏度
export const POINTER_SENSITIVITY = 0.0025;
