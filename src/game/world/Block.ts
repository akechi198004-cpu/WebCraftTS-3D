import type { BlockData, BlockType } from "../types";

export const BLOCK_REGISTRY: Record<BlockType, BlockData> = {
  air: {
    type: "air",
    solid: false,
    color: 0x000000
  },
  grass: {
    type: "grass",
    solid: true,
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
    solid: false,
    color: 0x34a1eb
  },
  ice: {
    type: "ice",
    solid: true,
    color: 0xa5f2f3
  }
};

export function getBlockData(type: BlockType): BlockData {
  return BLOCK_REGISTRY[type];
}
