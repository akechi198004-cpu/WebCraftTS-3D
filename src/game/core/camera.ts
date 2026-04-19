import { PerspectiveCamera, Vector3 } from "three";
import {
  CAMERA_FAR,
  CAMERA_FOV,
  CAMERA_NEAR,
  PLAYER_EYE_HEIGHT,
  PLAYER_HEIGHT
} from "../constants";
import type { PlayerState, Size } from "../types";

/**
 * 创建并初始化透视相机
 */
export function createCamera(): PerspectiveCamera {
  const camera = new PerspectiveCamera(
    CAMERA_FOV,
    window.innerWidth / window.innerHeight,
    CAMERA_NEAR,
    CAMERA_FAR
  );

  // 设置旋转顺序为 YXZ，这样在实现第一人称视角时：
  // 先进行偏航（Y轴旋转），再进行俯仰（X轴旋转），最后是翻滚（Z轴）。
  camera.rotation.order = "YXZ";
  return camera;
}

/**
 * 在窗口大小改变时调整相机长宽比并更新投影矩阵
 */
export function resizeCamera(camera: PerspectiveCamera, size: Size): void {
  camera.aspect = size.width / Math.max(size.height, 1); // 避免除以 0
  camera.updateProjectionMatrix();
}

/**
 * 将相机的位置和旋转同步到玩家状态（支持第一人称和第三人称视角）
 */
export function syncCameraToPlayer(camera: PerspectiveCamera, player: PlayerState): void {
  if (player.cameraMode === "first-person") {
    camera.position.copy(player.position);
    // 相机高度偏移到玩家眼睛的高度
    camera.position.y += PLAYER_EYE_HEIGHT;
    // 同步俯仰角和偏航角
    camera.rotation.x = player.pitch;
    camera.rotation.y = player.yaw;
    camera.rotation.z = 0; // 不允许翻滚
  } else {
    // 第三人称视角
    const distance = 4; // 相机距离玩家的距离
    const heightOffset = 2; // 相机高度偏移
    const sideOffset = -1.5; // 向左侧偏移，为了实现左后方视角

    // 根据偏航角和俯仰角计算相机后方的偏移量
    const forwardOffset = new Vector3(
      Math.sin(player.yaw) * Math.cos(player.pitch),
      -Math.sin(player.pitch),
      Math.cos(player.yaw) * Math.cos(player.pitch)
    ).multiplyScalar(distance);

    // 计算玩家的右方向向量，然后取反得到左方向
    const rightVector = new Vector3(
      Math.cos(player.yaw),
      0,
      -Math.sin(player.yaw)
    ).normalize();
    const lateralOffset = rightVector.multiplyScalar(sideOffset);

    camera.position.copy(player.position).add(forwardOffset).add(lateralOffset);
    camera.position.y += heightOffset;

    // 相机始终看向玩家中心
    const lookTarget = player.position.clone();
    lookTarget.y += PLAYER_HEIGHT / 2;
    camera.lookAt(lookTarget);
  }
}
