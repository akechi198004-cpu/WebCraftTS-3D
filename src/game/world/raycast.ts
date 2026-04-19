import { Raycaster, Vector2, InstancedMesh, type Camera, Intersection } from "three";
import { INTERACTION_DISTANCE } from "../constants";
import type { GridPosition, WorldBlock, WorldRaycastHit } from "../types";
import { World } from "./World";

const raycaster = new Raycaster();
// 屏幕中心坐标（由于 Three.js 的归一化设备坐标中，(0,0) 就是中心）
const screenCenter = new Vector2(0, 0);

// 用于存储网格关联的方块数据接口
interface BlockMeshUserData {
  blockPosition: GridPosition;
  blockType: WorldBlock["type"];
}

/**
 * 从摄像机中心发射射线，检测所指的方块
 */
export function raycastWorld(camera: Camera, world: World): WorldRaycastHit | null {
  raycaster.far = INTERACTION_DISTANCE; // 设置射线的最大探测距离
  raycaster.setFromCamera(screenCenter, camera); // 根据相机设置射线起点和方向

  // 与世界中的所有可交互网格进行相交测试，取最近的一个 (索引 0)
  const intersection = raycaster.intersectObjects(world.getRaycastTargets(), false)[0];

  if (intersection === undefined || intersection.face == null) {
    return null; // 未击中任何物体或未获取到法线信息
  }

  // 解析被击中的具体方块数据
  const blockMeshData = readBlockMeshUserData(intersection);

  if (blockMeshData === null) {
    return null;
  }

  // 提取命中的表面法线，四舍五入为整数坐标（如 (0, 1, 0) 代表击中顶部）
  const normal = {
    x: Math.round(intersection.face.normal.x),
    y: Math.round(intersection.face.normal.y),
    z: Math.round(intersection.face.normal.z)
  };

  return {
    distance: intersection.distance,
    blockPosition: blockMeshData.blockPosition, // 被击中的方块自身位置
    placementPosition: {                        // 根据法线计算出的相邻位置（用于放置新方块）
      x: blockMeshData.blockPosition.x + normal.x,
      y: blockMeshData.blockPosition.y + normal.y,
      z: blockMeshData.blockPosition.z + normal.z
    },
    normal,
    blockType: blockMeshData.blockType
  };
}

/**
 * 从射线击中的结果中提取对应的方块逻辑数据
 */
function readBlockMeshUserData(intersection: Intersection): BlockMeshUserData | null {
  const object = intersection.object;
  // 如果击中的是 InstancedMesh (实例化网格)，则通过 instanceId 查找原始数据
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

  // 备用方案：如果是普通的 Mesh（没有实例化的单个网格）
  const userData = object.userData as Partial<BlockMeshUserData>;
  const blockPosition = userData.blockPosition;
  const blockType = userData.blockType;

  // 验证数据完整性
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
