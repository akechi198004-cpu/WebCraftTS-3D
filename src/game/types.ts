import type { Vector3 } from "three";

export interface Size {
  width: number;
  height: number;
}

export type Vector3Tuple = [number, number, number];

export interface Updatable {
  update(deltaTime: number): void;
}

export interface Disposable {
  dispose(): void;
}

export interface GameModule extends Disposable, Updatable {}

export type BlockType = "air" | "grass" | "stone" | "dirt" | "wood" | "leaves" | "brick" | "sand" | "water" | "ice";

export interface BlockData {
  type: BlockType;
  solid: boolean;
  color: number;
}

export interface GridPosition {
  x: number;
  y: number;
  z: number;
}

export interface WorldBlock {
  position: GridPosition;
  type: Exclude<BlockType, "air">;
}

export interface ModifiedBlock {
  position: GridPosition;
  type: BlockType;
}

export interface WorldRaycastHit {
  distance: number;
  blockPosition: GridPosition;
  placementPosition: GridPosition;
  normal: GridPosition;
  blockType: Exclude<BlockType, "air">;
}

export interface PlayerState {
  position: Vector3;
  velocity: Vector3;
  yaw: number;
  pitch: number;
  isGrounded: boolean;
}

export interface PlayerSaveData {
  position: Vector3Tuple;
  velocity: Vector3Tuple;
  yaw: number;
  pitch: number;
}

export interface LocalSaveState {
  player: PlayerSaveData;
  blocks: ModifiedBlock[];
}

export interface HudState {
  fps: number;
  pointerLocked: boolean;
  selectedBlockText: string;
  placementBlockText: string;
  blockCount: number;
}
