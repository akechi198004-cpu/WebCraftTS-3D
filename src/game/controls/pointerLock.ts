import { PLAYER_MAX_PITCH, POINTER_SENSITIVITY } from "../constants";
import type { PlayerState } from "../types";

/**
 * 指针锁定控制器（用于第一人称视角下隐藏鼠标并捕获移动）
 */
export class PointerLockController {
  private pointerLocked = false;
  private accumulatedDeltaX = 0; // 累计 X 轴鼠标移动量
  private accumulatedDeltaY = 0; // 累计 Y 轴鼠标移动量

  public constructor(private readonly target: HTMLElement) {
    this.target.addEventListener("click", this.handleCanvasClick);
    document.addEventListener("pointerlockchange", this.handlePointerLockChange);
    document.addEventListener("mousemove", this.handleMouseMove);
  }

  /**
   * 返回当前是否处于锁定状态
   */
  public isLocked(): boolean {
    return this.pointerLocked;
  }

  /**
   * 应用鼠标移动来更新玩家的视角（偏航和俯仰）
   */
  public update(player: PlayerState): void {
    if (!this.pointerLocked) {
      this.accumulatedDeltaX = 0;
      this.accumulatedDeltaY = 0;
      return;
    }

    // 根据鼠标累计移动量调整偏航角（水平旋转）
    player.yaw -= this.accumulatedDeltaX * POINTER_SENSITIVITY;
    // 根据鼠标累计移动量调整俯仰角（垂直旋转），并限制在最大角度内防止翻转
    player.pitch = clamp(
      player.pitch - this.accumulatedDeltaY * POINTER_SENSITIVITY,
      -PLAYER_MAX_PITCH,
      PLAYER_MAX_PITCH
    );

    // 更新完毕后重置累计值
    this.accumulatedDeltaX = 0;
    this.accumulatedDeltaY = 0;
  }

  /**
   * 强制解除指针锁定
   */
  public unlock(): void {
    if (document.pointerLockElement === this.target) {
      document.exitPointerLock();
    }
  }

  /**
   * 清理事件监听器并解除锁定
   */
  public dispose(): void {
    this.target.removeEventListener("click", this.handleCanvasClick);
    document.removeEventListener("pointerlockchange", this.handlePointerLockChange);
    document.removeEventListener("mousemove", this.handleMouseMove);
    this.unlock();
  }

  /**
   * 点击目标元素时请求锁定指针
   */
  private readonly handleCanvasClick = (): void => {
    if (document.pointerLockElement !== this.target) {
      this.target.requestPointerLock();
    }
  };

  /**
   * 处理浏览器原生指针锁定状态改变事件
   */
  private readonly handlePointerLockChange = (): void => {
    this.pointerLocked = document.pointerLockElement === this.target;
  };

  /**
   * 处理鼠标移动，将移动量累加起来
   */
  private readonly handleMouseMove = (event: MouseEvent): void => {
    if (!this.pointerLocked) {
      return;
    }

    this.accumulatedDeltaX += event.movementX;
    this.accumulatedDeltaY += event.movementY;
  };
}

/**
 * 限制数值在 [min, max] 范围内
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
