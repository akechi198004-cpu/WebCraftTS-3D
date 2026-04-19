import { Group, Object3D } from "three";
import type { GridPosition, PlayerState, WorldBlock, BlockType, ModifiedBlock } from "../types";
import { getBlockData } from "./Block";
import { buildWorldMeshes } from "./meshBuilder";
import { generateChunkData } from "./terrain";
import { CHUNK_SIZE, RENDER_DISTANCE } from "../constants";

/**
 * 游戏世界管理类
 * 负责地形区块的加载、卸载、网格重建以及方块数据的存储
 */
export class World {
  public readonly root = new Group(); // 附加到场景的根对象
  // 存储世界的实体方块数据，以区块键 ("X:Z") 映射到方块字典 ("x:y:z" -> BlockType)
  private readonly chunkData = new Map<string, Map<string, WorldBlock["type"]>>();
  // 记录已经生成过的区块键，避免重复调用地形生成逻辑
  private readonly generatedChunks = new Set<string>();
  // 存储每个区块的渲染网格组，按区块键映射
  private readonly chunkMeshes = new Map<string, Group>();
  // 记录玩家对方块的修改（放置或挖除，"air" 表示被挖除），用于保存到存档
  private readonly modifiedChunks = new Map<string, Map<string, BlockType>>();
  
  private isInitialized = false; // 是否已经初始化过区块
  private lastChunkX = 0;        // 玩家上一次所在的区块 X 坐标
  private lastChunkZ = 0;        // 玩家上一次所在的区块 Z 坐标

  public constructor(initialBlocks?: ModifiedBlock[]) {
    // 如果有存档数据传入，则加载修改过的方块
    if (initialBlocks && initialBlocks.length > 0) {
      this.loadBlocks(initialBlocks);
    }
  }

  /**
   * 世界更新逻辑（每帧调用），根据玩家位置动态加载/卸载周围的区块
   */
  public update(_deltaTime: number, player?: PlayerState): void {
    if (player) {
      this.manageChunks(player.position);
    }
  }

  /**
   * 重置世界状态并释放内存，通常在清除存档或退出时调用
   */
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

  /**
   * 加载存档中记录的修改方块
   */
  public loadBlocks(blocks: ModifiedBlock[]): void {
    for (const block of blocks) {
      const chunkKey = this.getChunkKey(block.position.x, block.position.z);
      let mChunk = this.modifiedChunks.get(chunkKey);
      if (!mChunk) {
        mChunk = new Map();
        this.modifiedChunks.set(chunkKey, mChunk);
      }
      mChunk.set(toBlockKey(block.position), block.type);
      
      // 如果区块已经生成过，我们需要立刻更新当前的 chunkData
      if (this.generatedChunks.has(chunkKey)) {
        if (block.type === "air") {
          this.removeBlockRaw(block.position);
        } else {
          this.setBlockRaw(block.position, block.type as WorldBlock["type"]);
        }
      }
    }
  }

  /**
   * 获取指定网格坐标处的方块逻辑数据
   */
  public getBlock(position: GridPosition) {
    const chunkKey = this.getChunkKey(position.x, position.z);
    const chunk = this.chunkData.get(chunkKey);
    if (!chunk) return null;
    const type = chunk.get(toBlockKey(position));
    return type === undefined ? null : getBlockData(type);
  }

  /**
   * 检查指定坐标是否存在方块
   */
  public hasBlock(position: GridPosition): boolean {
    const chunkKey = this.getChunkKey(position.x, position.z);
    const chunk = this.chunkData.get(chunkKey);
    return chunk ? chunk.has(toBlockKey(position)) : false;
  }

  /**
   * 判断指定坐标的方块是否为固体（用于碰撞）
   */
  public isSolidBlockAt(position: GridPosition): boolean {
    const block = this.getBlock(position);
    return block?.solid ?? false;
  }

  /**
   * 放置方块，返回是否放置成功（如果有改变则触发重建）
   */
  public setBlock(position: GridPosition, type: WorldBlock["type"]): boolean {
    const chunkKey = this.getChunkKey(position.x, position.z);
    let chunk = this.chunkData.get(chunkKey);
    if (!chunk) {
      chunk = new Map();
      this.chunkData.set(chunkKey, chunk);
    }

    const blockKey = toBlockKey(position);
    if (chunk.get(blockKey) === type) {
      return false; // 已经有相同的方块，不做改变
    }

    // 更新当前内存数据
    chunk.set(blockKey, type);
    
    // 记录到修改存档中
    let mChunk = this.modifiedChunks.get(chunkKey);
    if (!mChunk) {
      mChunk = new Map();
      this.modifiedChunks.set(chunkKey, mChunk);
    }
    mChunk.set(blockKey, type);

    // 重建该区块的网格
    this.rebuildChunkMeshRaw(position.x, position.z);
    return true;
  }

  /**
   * 挖除方块，返回是否移除成功
   */
  public removeBlock(position: GridPosition): boolean {
    const chunkKey = this.getChunkKey(position.x, position.z);
    const chunk = this.chunkData.get(chunkKey);
    if (!chunk) return false;

    const blockKey = toBlockKey(position);
    if (!chunk.has(blockKey)) return false;

    chunk.delete(blockKey);

    // 记录到修改存档中（以 "air" 标记移除）
    let mChunk = this.modifiedChunks.get(chunkKey);
    if (!mChunk) {
      mChunk = new Map();
      this.modifiedChunks.set(chunkKey, mChunk);
    }
    mChunk.set(blockKey, "air");

    this.rebuildChunkMeshRaw(position.x, position.z);
    return true;
  }

  /**
   * 序列化玩家修改过的方块记录，以便保存
   */
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

  /**
   * 收集所有需要进行射线检测的网格对象
   */
  public getRaycastTargets(): Object3D[] {
    const targets: Object3D[] = [];
    for (const meshGroup of this.chunkMeshes.values()) {
      targets.push(...meshGroup.children);
    }
    return targets;
  }

  /**
   * 计算当前世界中方块的总数（用于 UI 显示）
   */
  public getBlockCount(): number {
    let count = 0;
    for (const chunk of this.chunkData.values()) {
      count += chunk.size;
    }
    return count;
  }

  /**
   * 释放资源
   */
  public dispose(): void {
    this.reset();
  }

  /**
   * 根据玩家的当前位置，动态生成、加载周边区块，卸载远处的区块
   */
  private manageChunks(playerPos: { x: number; z: number }): void {
    const pX = Math.floor(playerPos.x / CHUNK_SIZE);
    const pZ = Math.floor(playerPos.z / CHUNK_SIZE);

    // 如果玩家还在同一个区块内，且已经初始化过，就不需要重新计算
    if (pX === this.lastChunkX && pZ === this.lastChunkZ && this.isInitialized) {
      return;
    }

    this.lastChunkX = pX;
    this.lastChunkZ = pZ;
    this.isInitialized = true;

    const visibleChunkKeys = new Set<string>();

    // 遍历玩家视野范围内的区块
    for (let dx = -RENDER_DISTANCE; dx <= RENDER_DISTANCE; dx++) {
      for (let dz = -RENDER_DISTANCE; dz <= RENDER_DISTANCE; dz++) {
        const cx = pX + dx;
        const cz = pZ + dz;
        const key = `${cx}:${cz}`;
        visibleChunkKeys.add(key);

        // 如果区块尚未生成过地形，则生成
        if (!this.generatedChunks.has(key)) {
          this.generateChunk(cx, cz);
        }

        // 如果网格不存在，则重建
        if (!this.chunkMeshes.has(key)) {
          this.rebuildChunkMeshRaw(cx * CHUNK_SIZE, cz * CHUNK_SIZE);
        }
      }
    }

    // 卸载并清理超出渲染距离的区块网格
    for (const [key, meshGroup] of this.chunkMeshes.entries()) {
      if (!visibleChunkKeys.has(key)) {
        this.root.remove(meshGroup);
        this.disposeMeshGroup(meshGroup);
        this.chunkMeshes.delete(key);
      }
    }
  }

  /**
   * 释放网格组中的 InstancedMesh 的特定属性缓存
   */
  private disposeMeshGroup(group: Group): void {
    group.traverse((child) => {
      if (child.type === "InstancedMesh") {
        const mesh = child as import("three").InstancedMesh;
        // 几何体和材质是共享的，因此只释放每个实例特有的属性 (instanceMatrix 等)
        mesh.instanceMatrix.dispose();
        if (mesh.instanceColor) mesh.instanceColor.dispose();
      }
    });
    group.clear();
  }

  /**
   * 生成单个区块的地形数据并与存档数据合并
   */
  private generateChunk(cx: number, cz: number): void {
    const chunkKey = `${cx}:${cz}`;
    this.generatedChunks.add(chunkKey);
    
    // 调用生成器生成原生方块
    const blocks = generateChunkData(cx, cz);
    const mChunk = this.modifiedChunks.get(chunkKey);

    let chunk = this.chunkData.get(chunkKey);
    if (!chunk) {
      chunk = new Map();
      this.chunkData.set(chunkKey, chunk);
    }

    // 将生成器的数据放入字典，但跳过那些已经被玩家修改过的方块位置
    for (const block of blocks) {
      const blockKey = toBlockKey(block.position);
      if (mChunk && mChunk.has(blockKey)) {
        continue;
      }
      chunk.set(blockKey, block.type);
    }

    // 应用玩家的修改
    if (mChunk) {
      for (const [blockKey, type] of mChunk.entries()) {
        if (type !== "air") {
          chunk.set(blockKey, type as WorldBlock["type"]);
        }
      }
    }

    this.rebuildChunkMeshRaw(cx * CHUNK_SIZE, cz * CHUNK_SIZE);
  }

  /**
   * 内部方法：纯粹设置内存数据，不触发网格重建，不记录到修改日志
   */
  private setBlockRaw(position: GridPosition, type: Exclude<WorldBlock["type"], "air">): void {
    const chunkKey = this.getChunkKey(position.x, position.z);
    let chunk = this.chunkData.get(chunkKey);
    if (!chunk) {
      chunk = new Map();
      this.chunkData.set(chunkKey, chunk);
    }
    chunk.set(toBlockKey(position), type);
  }

  /**
   * 内部方法：纯粹移除内存数据，不触发网格重建，不记录到修改日志
   */
  private removeBlockRaw(position: GridPosition): void {
    const chunkKey = this.getChunkKey(position.x, position.z);
    const chunk = this.chunkData.get(chunkKey);
    if (chunk) {
        chunk.delete(toBlockKey(position));
    }
  }

  /**
   * 为指定区块重建 Three.js 渲染网格
   */
  private rebuildChunkMeshRaw(worldX: number, worldZ: number): void {
    const chunkX = Math.floor(worldX / CHUNK_SIZE);
    const chunkZ = Math.floor(worldZ / CHUNK_SIZE);
    const key = `${chunkX}:${chunkZ}`;

    const chunk = this.chunkData.get(key);
    const blocksInChunk: WorldBlock[] = [];
    
    // 将 Map 中的方块数据转换为数组，传递给网格构建器
    if (chunk) {
      for (const [blockKey, type] of chunk.entries()) {
        blocksInChunk.push({
          position: fromBlockKey(blockKey),
          type
        });
      }
    }

    const nextMeshGroup = buildWorldMeshes(blocksInChunk);
    
    // 移除并释放旧网格
    const existingMeshGroup = this.chunkMeshes.get(key);
    if (existingMeshGroup) {
      this.root.remove(existingMeshGroup);
      this.disposeMeshGroup(existingMeshGroup);
    }

    // 添加新网格
    this.chunkMeshes.set(key, nextMeshGroup);
    this.root.add(nextMeshGroup);
  }

  /**
   * 根据世界坐标计算区块的键名 "cx:cz"
   */
  private getChunkKey(worldX: number, worldZ: number): string {
    return `${Math.floor(worldX / CHUNK_SIZE)}:${Math.floor(worldZ / CHUNK_SIZE)}`;
  }
}

/**
 * 序列化三维坐标为字典键字符串
 */
function toBlockKey(position: GridPosition): string {
  return `${position.x}:${position.y}:${position.z}`;
}

/**
 * 将字典键字符串反序列化为三维坐标
 */
function fromBlockKey(blockKey: string): GridPosition {
  const [x, y, z] = blockKey.split(":").map((value) => Number.parseInt(value, 10));
  return { x, y, z };
}
