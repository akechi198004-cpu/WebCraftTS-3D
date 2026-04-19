import { GRAVITY_ACCELERATION } from "../constants";
import type { PlayerState } from "../types";

export function applyGravity(player: PlayerState, deltaTime: number): void {
  if (player.isGrounded && player.velocity.y <= 0) {
    player.velocity.y = 0;
    return;
  }

  player.velocity.y -= GRAVITY_ACCELERATION * deltaTime;
}
