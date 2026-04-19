import {
  BoxGeometry,
  Group,
  InstancedMesh,
  Object3D
} from "three";
import type { WorldBlock } from "../types";
import { getBlockData } from "./Block";
import { getBlockMaterial } from "./textures";

const BLOCK_GEOMETRY = new BoxGeometry(1, 1, 1);

export function buildWorldMeshes(blocks: WorldBlock[]): Group {
  const root = new Group();

  // Group blocks by type
  const blocksByType = new Map<WorldBlock["type"], WorldBlock[]>();
  for (const block of blocks) {
    let arr = blocksByType.get(block.type);
    if (!arr) {
      arr = [];
      blocksByType.set(block.type, arr);
    }
    arr.push(block);
  }

  const dummy = new Object3D();

  for (const [type, typeBlocks] of blocksByType.entries()) {
    const blockData = getBlockData(type);
    const material = getBlockMaterial(type, blockData.color);
    
    const instancedMesh = new InstancedMesh(BLOCK_GEOMETRY, material, typeBlocks.length);
    instancedMesh.userData = { isInstanced: true } as any;

    for (let i = 0; i < typeBlocks.length; i++) {
      const block = typeBlocks[i];
      dummy.position.set(
        block.position.x + 0.5,
        block.position.y + 0.5,
        block.position.z + 0.5
      );
      dummy.updateMatrix();
      instancedMesh.setMatrixAt(i, dummy.matrix);
      
      // Store back-reference in instanceColor or manual array? No, raycaster needs mapping.
      // We'll store a map inside userData of the instancedMesh.
    }

    instancedMesh.userData.instances = typeBlocks;
    
    // Disable frustrating auto-updates that kill performance
    instancedMesh.instanceMatrix.needsUpdate = true;
    instancedMesh.updateMatrixWorld(true);
    
    root.add(instancedMesh);
  }

  return root;
}
