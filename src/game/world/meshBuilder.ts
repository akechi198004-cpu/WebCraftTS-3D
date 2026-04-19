import {
  BoxGeometry,
  Group,
  InstancedMesh,
  Object3D
} from "three";
import type { WorldBlock } from "../types";
import { getBlockData } from "./Block";
import { getBlockMaterial } from "./textures";

// 全局共用的方块几何体（长宽高等于 1）
const BLOCK_GEOMETRY = new BoxGeometry(1, 1, 1);

/**
 * 将一组方块数据构建为 Three.js 渲染所需的网格 (Group 包含多个 InstancedMesh)
 */
export function buildWorldMeshes(blocks: WorldBlock[]): Group {
  const root = new Group();

  // 按方块类型对所有方块进行分组，以便为每种材质创建一个 InstancedMesh
  const blocksByType = new Map<WorldBlock["type"], WorldBlock[]>();
  for (const block of blocks) {
    let arr = blocksByType.get(block.type);
    if (!arr) {
      arr = [];
      blocksByType.set(block.type, arr);
    }
    arr.push(block);
  }

  // 用于计算每个实例变换矩阵的辅助对象
  const dummy = new Object3D();

  for (const [type, typeBlocks] of blocksByType.entries()) {
    const blockData = getBlockData(type);
    const material = getBlockMaterial(type, blockData.color);
    
    // 创建实例化网格（合并绘制，极大提升性能）
    const instancedMesh = new InstancedMesh(BLOCK_GEOMETRY, material, typeBlocks.length);
    instancedMesh.userData = { isInstanced: true } as any;

    for (let i = 0; i < typeBlocks.length; i++) {
      const block = typeBlocks[i];
      // Three.js 中 BoxGeometry 原点在中心，因此需要偏移 0.5 以对齐网格坐标系
      dummy.position.set(
        block.position.x + 0.5,
        block.position.y + 0.5,
        block.position.z + 0.5
      );
      dummy.updateMatrix();
      instancedMesh.setMatrixAt(i, dummy.matrix);
      
      // 注意：射线检测(raycaster)需要映射回真实的方块数据
      // 我们将在 instancedMesh 的 userData 中存储这个数组
    }

    // 将方块数据数组存储到 userData 中，供射线检测时通过 instanceId 获取对应的方块
    instancedMesh.userData.instances = typeBlocks;
    
    // 标记 instanceMatrix 需要更新提交到 GPU
    instancedMesh.instanceMatrix.needsUpdate = true;
    instancedMesh.updateMatrixWorld(true);
    
    root.add(instancedMesh);
  }

  return root;
}
