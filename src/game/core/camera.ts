import { PerspectiveCamera } from "three";
import {
  CAMERA_FAR,
  CAMERA_FOV,
  CAMERA_NEAR,
  PLAYER_EYE_HEIGHT
} from "../constants";
import type { PlayerState, Size } from "../types";

export function createCamera(): PerspectiveCamera {
  const camera = new PerspectiveCamera(
    CAMERA_FOV,
    window.innerWidth / window.innerHeight,
    CAMERA_NEAR,
    CAMERA_FAR
  );

  camera.rotation.order = "YXZ";
  return camera;
}

export function resizeCamera(camera: PerspectiveCamera, size: Size): void {
  camera.aspect = size.width / Math.max(size.height, 1);
  camera.updateProjectionMatrix();
}

export function syncCameraToPlayer(camera: PerspectiveCamera, player: PlayerState): void {
  camera.position.copy(player.position);
  camera.position.y += PLAYER_EYE_HEIGHT;
  camera.rotation.x = player.pitch;
  camera.rotation.y = player.yaw;
  camera.rotation.z = 0;
}
