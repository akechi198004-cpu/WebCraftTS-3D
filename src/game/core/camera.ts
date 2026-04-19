import { PerspectiveCamera } from "three";
import {
  CAMERA_FAR,
  CAMERA_FOV,
  CAMERA_NEAR,
  PLAYER_EYE_HEIGHT
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
 * 将相机的位置和旋转同步到玩家状态（用于第一人称视角）
 */
export function syncCameraToPlayer(camera: PerspectiveCamera, player: PlayerState): void {
  camera.position.copy(player.position);
  // 相机高度偏移到玩家眼睛的高度
  camera.position.y += PLAYER_EYE_HEIGHT;
  // 同步俯仰角和偏航角
  camera.rotation.x = player.pitch;
  camera.rotation.y = player.yaw;
  camera.rotation.z = 0; // 不允许翻滚
}
