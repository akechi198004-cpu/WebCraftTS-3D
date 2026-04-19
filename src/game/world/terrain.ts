import { CHUNK_SIZE, WORLD_FLOOR_Y } from "../constants";
import type { WorldBlock } from "../types";

/**
 * 判断给定的世界坐标 (x, z) 是否属于指定的区块 (cx, cz)
 */
function isBlockInChunk(x: number, z: number, cx: number, cz: number): boolean {
  return Math.floor(x / CHUNK_SIZE) === cx && Math.floor(z / CHUNK_SIZE) === cz;
}

/**
 * 构建地标：泰姬陵
 * （由于建筑可能跨越多个区块，此函数只推入属于当前生成区块 cx, cz 的方块）
 */
function buildTajMahal(blocks: WorldBlock[], centerWorldX: number, centerWorldZ: number, cx: number, cz: number, baseY: number) {
  const baseR = 24;
  // 构建底部平台
  for (let x = -baseR; x <= baseR; x++) {
    for (let z = -baseR; z <= baseR; z++) {
      const wx = centerWorldX + x;
      const wz = centerWorldZ + z;
      if (isBlockInChunk(wx, wz, cx, cz)) {
        blocks.push({ position: { x: wx, y: baseY + 1, z: wz }, type: "stone" });
      }
    }
  }

  const minaretR = 22;
  // 四个角落的宣礼塔
  const minarets = [[-minaretR, -minaretR], [-minaretR, minaretR], [minaretR, -minaretR], [minaretR, minaretR]];
  for (const [mx, mz] of minarets) {
    for (let y = 2; y <= 30; y++) {
      for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
          // 将塔身变成圆柱（去掉角落），顶部保留尖顶
          if (Math.abs(dx) === 1 && Math.abs(dz) === 1 && y < 28) continue;
          const wx = centerWorldX + mx + dx;
          const wz = centerWorldZ + mz + dz;
          if (isBlockInChunk(wx, wz, cx, cz)) {
            blocks.push({ position: { x: wx, y: baseY + y, z: wz }, type: y >= 28 ? "sand" : "brick" });
          }
        }
      }
    }
  }

  // 主体建筑
  const buildR = 14;
  for (let y = 2; y <= 16; y++) {
    for (let x = -buildR; x <= buildR; x++) {
      for (let z = -buildR; z <= buildR; z++) {
        if (Math.abs(x) + Math.abs(z) > 22) continue; // 切掉外角
        if (Math.abs(x) < 12 && Math.abs(z) < 12 && y < 16) continue; // 内部中空
        if (y <= 12 && (Math.abs(x) < 4 && Math.abs(z) >= 12)) continue; // 前后门洞
        if (y <= 12 && (Math.abs(z) < 4 && Math.abs(x) >= 12)) continue; // 左右门洞
        const wx = centerWorldX + x;
        const wz = centerWorldZ + z;
        if (isBlockInChunk(wx, wz, cx, cz)) {
          blocks.push({ position: { x: wx, y: baseY + y, z: wz }, type: "stone" });
        }
      }
    }
  }

  // 中央圆顶
  const domeProfile = [ 8, 9, 10, 10, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 1, 1 ];
  for (let i = 0; i < domeProfile.length; i++) {
    const y = baseY + 17 + i;
    const r = domeProfile[i];
    for (let x = -r; x <= r; x++) {
      for (let z = -r; z <= r; z++) {
        if (Math.sqrt(x*x + z*z) <= r) {
            const wx = centerWorldX + x;
            const wz = centerWorldZ + z;
            if (isBlockInChunk(wx, wz, cx, cz)) {
              blocks.push({ position: { x: wx, y, z: wz }, type: "sand" });
            }
        }
      }
    }
  }
}

/**
 * 构建地标：比萨斜塔
 */
function buildLeaningTower(blocks: WorldBlock[], lx: number, lz: number, cx: number, cz: number, baseY: number) {
  const radius = 6;
  const height = 42;
  for (let y = 1; y <= height; y++) {
    const leanShift = Math.floor(y / 4); // 随高度增加，向 X 正方向倾斜
    const isFloorRing = (y % 6 === 1) || (y === height); // 楼层分隔环
    for (let x = -radius; x <= radius; x++) {
      for (let z = -radius; z <= radius; z++) {
        const dist = Math.sqrt(x * x + z * z);
        // 绘制圆环轮廓
        if (dist >= radius - 1.5 && dist <= radius + 0.5) {
          const isPillar = (Math.abs(x) % 2 === 0) || (Math.abs(z) % 2 === 0);
          if (!isFloorRing && !isPillar) continue; // 只有在环上或者是柱子才绘制
          const wx = lx + x + leanShift;
          const wz = lz + z;
          if (isBlockInChunk(wx, wz, cx, cz)) {
            blocks.push({
              position: { x: wx, y: baseY + y, z: wz },
              type: "stone"
            });
          }
        }
      }
    }
  }
}

/**
 * 构建地标：玛雅金字塔 (奇琴伊察)
 */
function buildMayanPyramid(blocks: WorldBlock[], centerWorldX: number, centerWorldZ: number, cx: number, cz: number, baseY: number) {
  const tiers = 9;
  const tierHeight = 2;
  const baseRadius = 20;

  // 建造 9 层阶梯
  for (let t = 0; t < tiers; t++) {
    const yStart = baseY + 1 + t * tierHeight;
    const radius = baseRadius - t * 2;
    for (let y = yStart; y < yStart + tierHeight; y++) {
      for (let x = -radius; x <= radius; x++) {
        for (let z = -radius; z <= radius; z++) {
          // 只建造空心的外壳，以节省多边形
          const isOuter = x === -radius || x === radius || z === -radius || z === radius || y === yStart + tierHeight - 1;
          if (isOuter) {
            const wx = centerWorldX + x;
            const wz = centerWorldZ + z;
            if (isBlockInChunk(wx, wz, cx, cz)) {
              blocks.push({ position: { x: wx, y, z: wz }, type: "stone" });
            }
          }
        }
      }
    }
  }
  
  // 建造四面的阶梯
  for (let y = 1; y <= tiers * tierHeight; y++) {
    const extension = baseRadius + 1 - (y - 1);
    for (let w = -2; w <= 2; w++) {
      const sides = [
        {x: w, z: extension}, {x: w, z: -extension},
        {x: extension, z: w}, {x: -extension, z: w}
      ];
      for (const s of sides) {
        const wx = centerWorldX + s.x;
        const wz = centerWorldZ + s.z;
        if (isBlockInChunk(wx, wz, cx, cz)) {
          blocks.push({position: {x: wx, y: baseY + y, z: wz}, type: "brick"});
        }
      }
    }
  }

  // 顶部神庙
  const topY = baseY + 1 + tiers * tierHeight;
  const topRadius = baseRadius - tiers * 2 + 1;
  for (let y = topY; y < topY + 4; y++) {
    for (let x = -topRadius; x <= topRadius; x++) {
      for (let z = -topRadius; z <= topRadius; z++) {
        const isOuter = x === -topRadius || x === topRadius || z === -topRadius || z === topRadius;
        if (isOuter || y === topY + 3) {
          if (y < topY + 3 && z === topRadius && Math.abs(x) <= 1) continue; // 门洞
          const wx = centerWorldX + x;
          const wz = centerWorldZ + z;
          if (isBlockInChunk(wx, wz, cx, cz)) {
            blocks.push({ position: { x: wx, y, z: wz }, type: "stone" });
          }
        }
      }
    }
  }
}

/**
 * 种植树木。
 * 增加了边界检测，防止树叶跨越区块导致渲染异常和存档不同步。
 */
function buildTree(blocks: WorldBlock[], tx: number, tz: number, cx: number, cz: number, baseY: number) {
  const trunkHeight = 4;
  // 树干
  for (let y = 1; y <= trunkHeight; y++) {
    blocks.push({ position: { x: tx, y: baseY + y, z: tz }, type: "wood" });
  }
  // 树叶 (两层大)
  for (let y = trunkHeight - 1; y <= trunkHeight; y++) {
    for (let x = -2; x <= 2; x++) {
      for (let z = -2; z <= 2; z++) {
        if (Math.abs(x) === 2 && Math.abs(z) === 2) continue; // 切掉角
        if (x === 0 && z === 0) continue; // 中心留给树干
        const wx = tx + x;
        const wz = tz + z;
        if (isBlockInChunk(wx, wz, cx, cz)) {
          blocks.push({ position: { x: wx, y: baseY + y, z: wz }, type: "leaves" });
        }
      }
    }
  }
  // 树叶 (顶层小)
  for (let x = -1; x <= 1; x++) {
    for (let z = -1; z <= 1; z++) {
      if (Math.abs(x) === 1 && Math.abs(z) === 1) continue;
      const wx = tx + x;
      const wz = tz + z;
      if (isBlockInChunk(wx, wz, cx, cz)) {
        blocks.push({ position: { x: wx, y: baseY + trunkHeight + 1, z: wz }, type: "leaves" });
      }
    }
  }
}

/**
 * 生成指定区块 (cx, cz) 内的所有方块数据
 */
export function generateChunkData(cx: number, cz: number): WorldBlock[] {
  const blocks: WorldBlock[] = [];
  const startX = cx * CHUNK_SIZE;
  const startZ = cz * CHUNK_SIZE;

  // 1. 生成地形基层（地表和深层矿脉）及随机树木
  for (let x = 0; x < CHUNK_SIZE; x++) {
    for (let z = 0; z < CHUNK_SIZE; z++) {
      const worldX = startX + x;
      const worldZ = startZ + z;

      // 顶层草方块
      blocks.push({
        position: { x: worldX, y: WORLD_FLOOR_Y, z: worldZ },
        type: "grass"
      });
      // 较浅的泥土层
      blocks.push({ position: { x: worldX, y: WORLD_FLOOR_Y - 1, z: worldZ }, type: "dirt" });
      blocks.push({ position: { x: worldX, y: WORLD_FLOOR_Y - 2, z: worldZ }, type: "dirt" });
      // 更深处的石头层
      blocks.push({ position: { x: worldX, y: WORLD_FLOOR_Y - 3, z: worldZ }, type: "stone" });
      blocks.push({ position: { x: worldX, y: WORLD_FLOOR_Y - 4, z: worldZ }, type: "stone" });
      
      // 使用基于坐标的简易伪随机数决定是否在此生成一棵树
      const n = Math.abs(Math.sin(worldX * 12.9898 + worldZ * 78.233)) * 43758.5453;
      const rand = n - Math.floor(n);
      // 生成树木（概率由阈值控制）
      if (rand > 0.997) {
        buildTree(blocks, worldX, worldZ, cx, cz, WORLD_FLOOR_Y);
      }
    }
  }

  // 2. 将大型结构裁剪并填入该区块（仅当当前区块属于结构所在范围时）

  // 泰姬陵: 中心 (-32, -32), 范围约 +- 30
  if (Math.abs(cx - (-2)) <= 3 && Math.abs(cz - (-2)) <= 3) {
    buildTajMahal(blocks, -32, -32, cx, cz, WORLD_FLOOR_Y);
  }
  
  // 比萨斜塔: 中心 (32, -32)
  if (Math.abs(cx - 2) <= 2 && Math.abs(cz - (-2)) <= 2) {
    buildLeaningTower(blocks, 32, -32, cx, cz, WORLD_FLOOR_Y);
  }

  // 玛雅金字塔: 中心 (0, 32), 半径 20
  if (Math.abs(cx - 0) <= 2 && Math.abs(cz - 2) <= 2) {
    buildMayanPyramid(blocks, 0, 32, cx, cz, WORLD_FLOOR_Y);
  }

  return blocks;
}
