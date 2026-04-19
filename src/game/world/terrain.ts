import { CHUNK_SIZE, WORLD_FLOOR_Y } from "../constants";
import type { WorldBlock } from "../types";

function isBlockInChunk(x: number, z: number, cx: number, cz: number): boolean {
  return Math.floor(x / CHUNK_SIZE) === cx && Math.floor(z / CHUNK_SIZE) === cz;
}

function buildTajMahal(blocks: WorldBlock[], centerWorldX: number, centerWorldZ: number, cx: number, cz: number, baseY: number) {
  const baseR = 24;
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
  const minarets = [[-minaretR, -minaretR], [-minaretR, minaretR], [minaretR, -minaretR], [minaretR, minaretR]];
  for (const [mx, mz] of minarets) {
    for (let y = 2; y <= 30; y++) {
      for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
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

  const buildR = 14;
  for (let y = 2; y <= 16; y++) {
    for (let x = -buildR; x <= buildR; x++) {
      for (let z = -buildR; z <= buildR; z++) {
        if (Math.abs(x) + Math.abs(z) > 22) continue;
        if (Math.abs(x) < 12 && Math.abs(z) < 12 && y < 16) continue;
        if (y <= 12 && (Math.abs(x) < 4 && Math.abs(z) >= 12)) continue;
        if (y <= 12 && (Math.abs(z) < 4 && Math.abs(x) >= 12)) continue;
        const wx = centerWorldX + x;
        const wz = centerWorldZ + z;
        if (isBlockInChunk(wx, wz, cx, cz)) {
          blocks.push({ position: { x: wx, y: baseY + y, z: wz }, type: "stone" });
        }
      }
    }
  }

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

function buildLeaningTower(blocks: WorldBlock[], lx: number, lz: number, cx: number, cz: number, baseY: number) {
  const radius = 6;
  const height = 42;
  for (let y = 1; y <= height; y++) {
    const leanShift = Math.floor(y / 4);
    const isFloorRing = (y % 6 === 1) || (y === height);
    for (let x = -radius; x <= radius; x++) {
      for (let z = -radius; z <= radius; z++) {
        const dist = Math.sqrt(x * x + z * z);
        if (dist >= radius - 1.5 && dist <= radius + 0.5) {
          const isPillar = (Math.abs(x) % 2 === 0) || (Math.abs(z) % 2 === 0);
          if (!isFloorRing && !isPillar) continue;
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

function buildMayanPyramid(blocks: WorldBlock[], centerWorldX: number, centerWorldZ: number, cx: number, cz: number, baseY: number) {
  const tiers = 9;
  const tierHeight = 2;
  const baseRadius = 20;

  for (let t = 0; t < tiers; t++) {
    const yStart = baseY + 1 + t * tierHeight;
    const radius = baseRadius - t * 2;
    for (let y = yStart; y < yStart + tierHeight; y++) {
      for (let x = -radius; x <= radius; x++) {
        for (let z = -radius; z <= radius; z++) {
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

  const topY = baseY + 1 + tiers * tierHeight;
  const topRadius = baseRadius - tiers * 2 + 1;
  for (let y = topY; y < topY + 4; y++) {
    for (let x = -topRadius; x <= topRadius; x++) {
      for (let z = -topRadius; z <= topRadius; z++) {
        const isOuter = x === -topRadius || x === topRadius || z === -topRadius || z === topRadius;
        if (isOuter || y === topY + 3) {
          if (y < topY + 3 && z === topRadius && Math.abs(x) <= 1) continue;
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

function buildTree(blocks: WorldBlock[], tx: number, tz: number, baseY: number) {
  const trunkHeight = 4;
  for (let y = 1; y <= trunkHeight; y++) {
    blocks.push({ position: { x: tx, y: baseY + y, z: tz }, type: "wood" });
  }
  for (let y = trunkHeight - 1; y <= trunkHeight; y++) {
    for (let x = -2; x <= 2; x++) {
      for (let z = -2; z <= 2; z++) {
        if (Math.abs(x) === 2 && Math.abs(z) === 2) continue;
        if (x === 0 && z === 0) continue;
        blocks.push({ position: { x: tx + x, y: baseY + y, z: tz + z }, type: "leaves" });
      }
    }
  }
  for (let x = -1; x <= 1; x++) {
    for (let z = -1; z <= 1; z++) {
      if (Math.abs(x) === 1 && Math.abs(z) === 1) continue;
      blocks.push({ position: { x: tx + x, y: baseY + trunkHeight + 1, z: tz + z }, type: "leaves" });
    }
  }
}

export function generateChunkData(cx: number, cz: number): WorldBlock[] {
  const blocks: WorldBlock[] = [];
  const startX = cx * CHUNK_SIZE;
  const startZ = cz * CHUNK_SIZE;

  // Base grass & depth
  for (let x = 0; x < CHUNK_SIZE; x++) {
    for (let z = 0; z < CHUNK_SIZE; z++) {
      const worldX = startX + x;
      const worldZ = startZ + z;
      blocks.push({
        position: { x: worldX, y: WORLD_FLOOR_Y, z: worldZ },
        type: "grass"
      });
      // Deeper dirt layers
      blocks.push({ position: { x: worldX, y: WORLD_FLOOR_Y - 1, z: worldZ }, type: "dirt" });
      blocks.push({ position: { x: worldX, y: WORLD_FLOOR_Y - 2, z: worldZ }, type: "dirt" });
      // Deeper stone layers
      blocks.push({ position: { x: worldX, y: WORLD_FLOOR_Y - 3, z: worldZ }, type: "stone" });
      blocks.push({ position: { x: worldX, y: WORLD_FLOOR_Y - 4, z: worldZ }, type: "stone" });
      
      const n = Math.abs(Math.sin(worldX * 12.9898 + worldZ * 78.233)) * 43758.5453;
      const rand = n - Math.floor(n);
      // Reduced tree density: increased threshold from 0.99 to 0.997
      if (rand > 0.997) {
        buildTree(blocks, worldX, worldZ, WORLD_FLOOR_Y);
      }
    }
  }

  // Taj Mahal: Center (-32, -32), Range roughly +- 30 (up to 2 chunks away)
  if (Math.abs(cx - (-2)) <= 3 && Math.abs(cz - (-2)) <= 3) {
    buildTajMahal(blocks, -32, -32, cx, cz, WORLD_FLOOR_Y);
  }
  
  // Leaning Tower: Center (32, -32), Radius small (1 chunk away enough)
  if (Math.abs(cx - 2) <= 2 && Math.abs(cz - (-2)) <= 2) {
    buildLeaningTower(blocks, 32, -32, cx, cz, WORLD_FLOOR_Y);
  }

  // Mayan Pyramid: Center (0, 32), Radius 20 (up to 2 chunks away)
  if (Math.abs(cx - 0) <= 2 && Math.abs(cz - 2) <= 2) {
    buildMayanPyramid(blocks, 0, 32, cx, cz, WORLD_FLOOR_Y);
  }

  return blocks;
}
