import type { Vector3 } from "three";

// 尺寸类型
export interface Size {
  width: number;
  height: number;
}

// 三维向量元组类型
export type Vector3Tuple = [number, number, number];

// 可更新接口，包含更新方法
export interface Updatable {
  update(deltaTime: number): void;
}

// 可释放接口，包含释放资源方法
export interface Disposable {
  dispose(): void;
}

// 游戏模块接口，结合了可释放和可更新
export interface GameModule extends Disposable, Updatable {}

// 方块类型枚举（空气、草方块、石头、泥土、木头、树叶、砖块、沙子、水、冰）
export type BlockType = "air" | "grass" | "stone" | "dirt" | "wood" | "leaves" | "brick" | "sand" | "water" | "ice";

// 方块数据接口
export interface BlockData {
  type: BlockType;  // 方块类型
  solid: boolean;   // 是否为固体（用于碰撞检测）
  color: number;    // 方块颜色（十六进制）
}

// 网格位置接口（整数坐标）
export interface GridPosition {
  x: number;
  y: number;
  z: number;
}

// 世界中的方块，不包含空气
export interface WorldBlock {
  position: GridPosition;
  type: Exclude<BlockType, "air">;
}

// 被修改的方块记录（可包含空气，表示被挖除的方块）
export interface ModifiedBlock {
  position: GridPosition;
  type: BlockType;
}

// 射线检测命中结果
export interface WorldRaycastHit {
  distance: number;                   // 距离
  blockPosition: GridPosition;        // 命中的方块位置
  placementPosition: GridPosition;    // 放置新方块的相邻位置
  normal: GridPosition;               // 命中的表面法线向量
  blockType: Exclude<BlockType, "air">; // 命中的方块类型
}

// 玩家状态
export interface PlayerState {
  position: Vector3;    // 玩家位置
  velocity: Vector3;    // 玩家速度
  yaw: number;          // 偏航角
  pitch: number;        // 俯仰角
  isGrounded: boolean;  // 是否在地面上
}

// 玩家存档数据
export interface PlayerSaveData {
  position: Vector3Tuple;
  velocity: Vector3Tuple;
  yaw: number;
  pitch: number;
}

// 本地存档状态
export interface LocalSaveState {
  player: PlayerSaveData;   // 玩家状态
  blocks: ModifiedBlock[];  // 被修改的方块列表
}

// HUD（抬头显示）状态
export interface HudState {
  fps: number;                // 帧率
  pointerLocked: boolean;     // 鼠标是否被锁定
  selectedBlockText: string;  // 选中的方块文本
  placementBlockText: string; // 准备放置的方块文本
  blockCount: number;         // 渲染的方块数量
}
