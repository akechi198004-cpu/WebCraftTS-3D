import { PLAYER_MAX_PITCH, POINTER_SENSITIVITY } from "../constants";
import type { PlayerState } from "../types";

export class PointerLockController {
  private pointerLocked = false;
  private accumulatedDeltaX = 0;
  private accumulatedDeltaY = 0;

  public constructor(private readonly target: HTMLElement) {
    this.target.addEventListener("click", this.handleCanvasClick);
    document.addEventListener("pointerlockchange", this.handlePointerLockChange);
    document.addEventListener("mousemove", this.handleMouseMove);
  }

  public isLocked(): boolean {
    return this.pointerLocked;
  }

  public update(player: PlayerState): void {
    if (!this.pointerLocked) {
      this.accumulatedDeltaX = 0;
      this.accumulatedDeltaY = 0;
      return;
    }

    player.yaw -= this.accumulatedDeltaX * POINTER_SENSITIVITY;
    player.pitch = clamp(
      player.pitch - this.accumulatedDeltaY * POINTER_SENSITIVITY,
      -PLAYER_MAX_PITCH,
      PLAYER_MAX_PITCH
    );

    this.accumulatedDeltaX = 0;
    this.accumulatedDeltaY = 0;
  }

  public unlock(): void {
    if (document.pointerLockElement === this.target) {
      document.exitPointerLock();
    }
  }

  public dispose(): void {
    this.target.removeEventListener("click", this.handleCanvasClick);
    document.removeEventListener("pointerlockchange", this.handlePointerLockChange);
    document.removeEventListener("mousemove", this.handleMouseMove);
    this.unlock();
  }

  private readonly handleCanvasClick = (): void => {
    if (document.pointerLockElement !== this.target) {
      this.target.requestPointerLock();
    }
  };

  private readonly handlePointerLockChange = (): void => {
    this.pointerLocked = document.pointerLockElement === this.target;
  };

  private readonly handleMouseMove = (event: MouseEvent): void => {
    if (!this.pointerLocked) {
      return;
    }

    this.accumulatedDeltaX += event.movementX;
    this.accumulatedDeltaY += event.movementY;
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
