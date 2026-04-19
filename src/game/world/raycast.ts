import { Raycaster, Vector2, InstancedMesh, type Camera, Intersection } from "three";
import { INTERACTION_DISTANCE } from "../constants";
import type { GridPosition, WorldBlock, WorldRaycastHit } from "../types";
import { World } from "./World";

const raycaster = new Raycaster();
const screenCenter = new Vector2(0, 0);

interface BlockMeshUserData {
  blockPosition: GridPosition;
  blockType: WorldBlock["type"];
}

export function raycastWorld(camera: Camera, world: World): WorldRaycastHit | null {
  raycaster.far = INTERACTION_DISTANCE;
  raycaster.setFromCamera(screenCenter, camera);

  const intersection = raycaster.intersectObjects(world.getRaycastTargets(), false)[0];

  if (intersection === undefined || intersection.face == null) {
    return null;
  }

  const blockMeshData = readBlockMeshUserData(intersection);

  if (blockMeshData === null) {
    return null;
  }

  const normal = {
    x: Math.round(intersection.face.normal.x),
    y: Math.round(intersection.face.normal.y),
    z: Math.round(intersection.face.normal.z)
  };

  return {
    distance: intersection.distance,
    blockPosition: blockMeshData.blockPosition,
    placementPosition: {
      x: blockMeshData.blockPosition.x + normal.x,
      y: blockMeshData.blockPosition.y + normal.y,
      z: blockMeshData.blockPosition.z + normal.z
    },
    normal,
    blockType: blockMeshData.blockType
  };
}

function readBlockMeshUserData(intersection: Intersection): BlockMeshUserData | null {
  const object = intersection.object;
  if (object instanceof InstancedMesh && intersection.instanceId !== undefined) {
    const instances = object.userData.instances;
    if (instances && instances[intersection.instanceId]) {
      const block = instances[intersection.instanceId];
      return {
        blockPosition: { ...block.position },
        blockType: block.type
      };
    }
    return null;
  }

  // Fallback for simple meshes
  const userData = object.userData as Partial<BlockMeshUserData>;
  const blockPosition = userData.blockPosition;
  const blockType = userData.blockType;

  if (
    blockPosition === undefined ||
    blockType === undefined ||
    typeof blockPosition.x !== "number" ||
    typeof blockPosition.y !== "number" ||
    typeof blockPosition.z !== "number"
  ) {
    return null;
  }

  return {
    blockPosition: { ...blockPosition },
    blockType
  };
}
