import { Group, Object3D } from "three";
import type { GridPosition, PlayerState, WorldBlock, BlockType, ModifiedBlock } from "../types";
import { getBlockData } from "./Block";
import { buildWorldMeshes } from "./meshBuilder";
import { generateChunkData } from "./terrain";
import { CHUNK_SIZE, RENDER_DISTANCE } from "../constants";

export class World {
  public readonly root = new Group();
  private readonly chunkData = new Map<string, Map<string, WorldBlock["type"]>>();
  private readonly generatedChunks = new Set<string>();
  private readonly chunkMeshes = new Map<string, Group>();
  // Store deltas by chunk key
  private readonly modifiedChunks = new Map<string, Map<string, BlockType>>();
  
  private isInitialized = false;
  private lastChunkX = 0;
  private lastChunkZ = 0;

  public constructor(initialBlocks?: ModifiedBlock[]) {
    if (initialBlocks && initialBlocks.length > 0) {
      this.loadBlocks(initialBlocks);
    }
  }

  public update(_deltaTime: number, player?: PlayerState): void {
    if (player) {
      this.manageChunks(player.position);
    }
  }

  public reset(): void {
    this.root.clear();
    this.chunkData.clear();
    this.generatedChunks.clear();
    for (const group of this.chunkMeshes.values()) {
      this.disposeMeshGroup(group);
    }
    this.chunkMeshes.clear();
    this.modifiedChunks.clear();
    this.isInitialized = false;
  }

  public loadBlocks(blocks: ModifiedBlock[]): void {
    for (const block of blocks) {
      const chunkKey = this.getChunkKey(block.position.x, block.position.z);
      let mChunk = this.modifiedChunks.get(chunkKey);
      if (!mChunk) {
        mChunk = new Map();
        this.modifiedChunks.set(chunkKey, mChunk);
      }
      mChunk.set(toBlockKey(block.position), block.type);
      
      if (this.generatedChunks.has(chunkKey)) {
        if (block.type === "air") {
          this.removeBlockRaw(block.position);
        } else {
          this.setBlockRaw(block.position, block.type as WorldBlock["type"]);
        }
      }
    }
  }

  public getBlock(position: GridPosition) {
    const chunkKey = this.getChunkKey(position.x, position.z);
    const chunk = this.chunkData.get(chunkKey);
    if (!chunk) return null;
    const type = chunk.get(toBlockKey(position));
    return type === undefined ? null : getBlockData(type);
  }

  public hasBlock(position: GridPosition): boolean {
    const chunkKey = this.getChunkKey(position.x, position.z);
    const chunk = this.chunkData.get(chunkKey);
    return chunk ? chunk.has(toBlockKey(position)) : false;
  }

  public isSolidBlockAt(position: GridPosition): boolean {
    const block = this.getBlock(position);
    return block?.solid ?? false;
  }

  public setBlock(position: GridPosition, type: WorldBlock["type"]): boolean {
    const chunkKey = this.getChunkKey(position.x, position.z);
    let chunk = this.chunkData.get(chunkKey);
    if (!chunk) {
      chunk = new Map();
      this.chunkData.set(chunkKey, chunk);
    }

    const blockKey = toBlockKey(position);
    if (chunk.get(blockKey) === type) {
      return false;
    }

    chunk.set(blockKey, type);
    
    let mChunk = this.modifiedChunks.get(chunkKey);
    if (!mChunk) {
      mChunk = new Map();
      this.modifiedChunks.set(chunkKey, mChunk);
    }
    mChunk.set(blockKey, type);

    this.rebuildChunkMeshRaw(position.x, position.z);
    return true;
  }

  public removeBlock(position: GridPosition): boolean {
    const chunkKey = this.getChunkKey(position.x, position.z);
    const chunk = this.chunkData.get(chunkKey);
    if (!chunk) return false;

    const blockKey = toBlockKey(position);
    if (!chunk.has(blockKey)) return false;

    chunk.delete(blockKey);

    let mChunk = this.modifiedChunks.get(chunkKey);
    if (!mChunk) {
      mChunk = new Map();
      this.modifiedChunks.set(chunkKey, mChunk);
    }
    mChunk.set(blockKey, "air");

    this.rebuildChunkMeshRaw(position.x, position.z);
    return true;
  }

  public serialize(): ModifiedBlock[] {
    const blocks: ModifiedBlock[] = [];
    for (const mChunk of this.modifiedChunks.values()) {
      for (const [blockKey, type] of mChunk.entries()) {
        blocks.push({
          position: fromBlockKey(blockKey),
          type
        });
      }
    }
    return blocks;
  }

  public getRaycastTargets(): Object3D[] {
    const targets: Object3D[] = [];
    for (const meshGroup of this.chunkMeshes.values()) {
      targets.push(...meshGroup.children);
    }
    return targets;
  }

  public getBlockCount(): number {
    let count = 0;
    for (const chunk of this.chunkData.values()) {
      count += chunk.size;
    }
    return count;
  }

  public dispose(): void {
    this.reset();
  }

  private manageChunks(playerPos: { x: number; z: number }): void {
    const pX = Math.floor(playerPos.x / CHUNK_SIZE);
    const pZ = Math.floor(playerPos.z / CHUNK_SIZE);

    if (pX === this.lastChunkX && pZ === this.lastChunkZ && this.isInitialized) {
      return;
    }

    this.lastChunkX = pX;
    this.lastChunkZ = pZ;
    this.isInitialized = true;

    const visibleChunkKeys = new Set<string>();

    for (let dx = -RENDER_DISTANCE; dx <= RENDER_DISTANCE; dx++) {
      for (let dz = -RENDER_DISTANCE; dz <= RENDER_DISTANCE; dz++) {
        const cx = pX + dx;
        const cz = pZ + dz;
        const key = `${cx}:${cz}`;
        visibleChunkKeys.add(key);

        if (!this.generatedChunks.has(key)) {
          this.generateChunk(cx, cz);
        }

        if (!this.chunkMeshes.has(key)) {
          this.rebuildChunkMeshRaw(cx * CHUNK_SIZE, cz * CHUNK_SIZE);
        }
      }
    }

    for (const [key, meshGroup] of this.chunkMeshes.entries()) {
      if (!visibleChunkKeys.has(key)) {
        this.root.remove(meshGroup);
        this.disposeMeshGroup(meshGroup);
        this.chunkMeshes.delete(key);
      }
    }
  }

  private disposeMeshGroup(group: Group): void {
    group.traverse((child) => {
      if (child.type === "InstancedMesh") {
        const mesh = child as import("three").InstancedMesh;
        // We share geometry and materials via textures.ts/meshBuilder.ts, 
        // so we ONLY dispose the instance attributes which are unique per chunk mesh.
        mesh.instanceMatrix.dispose();
        if (mesh.instanceColor) mesh.instanceColor.dispose();
      }
    });
    group.clear();
  }

  private generateChunk(cx: number, cz: number): void {
    const chunkKey = `${cx}:${cz}`;
    this.generatedChunks.add(chunkKey);
    
    const blocks = generateChunkData(cx, cz);
    const mChunk = this.modifiedChunks.get(chunkKey);

    let chunk = this.chunkData.get(chunkKey);
    if (!chunk) {
      chunk = new Map();
      this.chunkData.set(chunkKey, chunk);
    }

    for (const block of blocks) {
      const blockKey = toBlockKey(block.position);
      if (mChunk && mChunk.has(blockKey)) {
        continue;
      }
      chunk.set(blockKey, block.type);
    }

    if (mChunk) {
      for (const [blockKey, type] of mChunk.entries()) {
        if (type !== "air") {
          chunk.set(blockKey, type as WorldBlock["type"]);
        }
      }
    }

    this.rebuildChunkMeshRaw(cx * CHUNK_SIZE, cz * CHUNK_SIZE);
  }

  private setBlockRaw(position: GridPosition, type: Exclude<WorldBlock["type"], "air">): void {
    const chunkKey = this.getChunkKey(position.x, position.z);
    let chunk = this.chunkData.get(chunkKey);
    if (!chunk) {
      chunk = new Map();
      this.chunkData.set(chunkKey, chunk);
    }
    chunk.set(toBlockKey(position), type);
  }

  private removeBlockRaw(position: GridPosition): void {
    const chunkKey = this.getChunkKey(position.x, position.z);
    const chunk = this.chunkData.get(chunkKey);
    if (chunk) {
        chunk.delete(toBlockKey(position));
    }
  }

  private rebuildChunkMeshRaw(worldX: number, worldZ: number): void {
    const chunkX = Math.floor(worldX / CHUNK_SIZE);
    const chunkZ = Math.floor(worldZ / CHUNK_SIZE);
    const key = `${chunkX}:${chunkZ}`;

    const chunk = this.chunkData.get(key);
    const blocksInChunk: WorldBlock[] = [];
    
    if (chunk) {
      for (const [blockKey, type] of chunk.entries()) {
        blocksInChunk.push({
          position: fromBlockKey(blockKey),
          type
        });
      }
    }

    const nextMeshGroup = buildWorldMeshes(blocksInChunk);
    
    const existingMeshGroup = this.chunkMeshes.get(key);
    if (existingMeshGroup) {
      this.root.remove(existingMeshGroup);
      this.disposeMeshGroup(existingMeshGroup);
    }

    this.chunkMeshes.set(key, nextMeshGroup);
    this.root.add(nextMeshGroup);
  }

  private getChunkKey(worldX: number, worldZ: number): string {
    return `${Math.floor(worldX / CHUNK_SIZE)}:${Math.floor(worldZ / CHUNK_SIZE)}`;
  }
}

function toBlockKey(position: GridPosition): string {
  return `${position.x}:${position.y}:${position.z}`;
}

function fromBlockKey(blockKey: string): GridPosition {
  const [x, y, z] = blockKey.split(":").map((value) => Number.parseInt(value, 10));
  return { x, y, z };
}
