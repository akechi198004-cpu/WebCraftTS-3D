import type { BlockData, BlockType } from "../types";

/**
 * 方块数据注册表
 * 定义了所有方块类型的物理属性（如是否为固体）和基础颜色
 */
export const BLOCK_REGISTRY: Record<BlockType, BlockData> = {
  air: {
    type: "air",
    solid: false,   // 空气不是固体，可以穿透
    color: 0x000000
  },
  grass: {
    type: "grass",
    solid: true,    // 草方块是固体
    color: 0x59a14f
  },
  stone: {
    type: "stone",
    solid: true,
    color: 0x8a8f98
  },
  dirt: {
    type: "dirt",
    solid: true,
    color: 0x79553a
  },
  wood: {
    type: "wood",
    solid: true,
    color: 0x6e4523
  },
  leaves: {
    type: "leaves",
    solid: true,
    color: 0x228b22
  },
  brick: {
    type: "brick",
    solid: true,
    color: 0xb22222
  },
  sand: {
    type: "sand",
    solid: true,
    color: 0xedc9af
  },
  water: {
    type: "water",
    solid: false,   // 水不是固体（可以掉进去或游过去）
    color: 0x34a1eb
  },
  ice: {
    type: "ice",
    solid: true,
    color: 0xa5f2f3
  }
};

/**
 * 根据方块类型获取对应的方块数据
 */
export function getBlockData(type: BlockType): BlockData {
  return BLOCK_REGISTRY[type];
}
