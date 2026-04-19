import { GRAVITY_ACCELERATION } from "../constants";
import type { PlayerState } from "../types";

// 最大下落速度（终端速度），防止无限加速导致物理数值溢出或严重穿模
const TERMINAL_VELOCITY = -50;

/**
 * 为玩家应用重力加速度
 */
export function applyGravity(player: PlayerState, deltaTime: number): void {
  // 如果玩家已经在地面上，且垂直速度为向下或静止，则将垂直速度归零
  if (player.isGrounded && player.velocity.y <= 0) {
    player.velocity.y = 0;
    return;
  }

  // 否则，根据重力加速度持续降低玩家的垂直速度
  player.velocity.y -= GRAVITY_ACCELERATION * deltaTime;

  // 限制终端速度
  if (player.velocity.y < TERMINAL_VELOCITY) {
    player.velocity.y = TERMINAL_VELOCITY;
  }
}
