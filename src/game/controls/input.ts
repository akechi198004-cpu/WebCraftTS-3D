import { Vector3 } from "three";

export class InputController {
  private readonly pressedKeys = new Set<string>();
  private primaryActionQueued = false;
  private secondaryActionQueued = false;

  public constructor(
    private readonly target: Window,
    private readonly mouseTarget: HTMLElement,
    private readonly allowMouseActions: () => boolean
  ) {
    this.target.addEventListener("keydown", this.handleKeyDown);
    this.target.addEventListener("keyup", this.handleKeyUp);
    this.target.addEventListener("mousedown", this.handleMouseDown);
    this.target.addEventListener("blur", this.handleBlur);
    this.mouseTarget.addEventListener("contextmenu", this.handleContextMenu);
  }

  public isPressed(code: string): boolean {
    return this.pressedKeys.has(code);
  }

  public consumeKey(code: string): boolean {
    if (this.pressedKeys.has(code)) {
      this.pressedKeys.delete(code);
      return true;
    }
    return false;
  }

  public getMovementDirection(yaw: number): Vector3 {
    const forwardInput = Number(this.isPressed("KeyW")) - Number(this.isPressed("KeyS"));
    const rightInput = Number(this.isPressed("KeyD")) - Number(this.isPressed("KeyA"));

    if (forwardInput === 0 && rightInput === 0) {
      return new Vector3();
    }

    // In Three.js with Y-up, turning left increases rotation.y (yaw).
    // Forward direction at yaw=0 is [0, 0, -1]
    const forward = new Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
    const right = new Vector3(Math.cos(yaw), 0, -Math.sin(yaw));

    return forward.multiplyScalar(forwardInput).add(right.multiplyScalar(rightInput)).normalize();
  }

  public consumePrimaryAction(): boolean {
    const shouldTrigger = this.primaryActionQueued;
    this.primaryActionQueued = false;
    return shouldTrigger;
  }

  public consumeSecondaryAction(): boolean {
    const shouldTrigger = this.secondaryActionQueued;
    this.secondaryActionQueued = false;
    return shouldTrigger;
  }

  public clearQueuedActions(): void {
    this.primaryActionQueued = false;
    this.secondaryActionQueued = false;
  }

  public dispose(): void {
    this.target.removeEventListener("keydown", this.handleKeyDown);
    this.target.removeEventListener("keyup", this.handleKeyUp);
    this.target.removeEventListener("mousedown", this.handleMouseDown);
    this.target.removeEventListener("blur", this.handleBlur);
    this.mouseTarget.removeEventListener("contextmenu", this.handleContextMenu);
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    this.pressedKeys.add(event.code);
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    this.pressedKeys.delete(event.code);
  };

  private readonly handleMouseDown = (event: MouseEvent): void => {
    if (!this.allowMouseActions()) {
      return;
    }

    if (event.button === 0) {
      this.primaryActionQueued = true;
      event.preventDefault();
    }

    if (event.button === 2) {
      this.secondaryActionQueued = true;
      event.preventDefault();
    }
  };

  private readonly handleContextMenu = (event: MouseEvent): void => {
    event.preventDefault();
  };

  private readonly handleBlur = (): void => {
    this.pressedKeys.clear();
    this.clearQueuedActions();
  };
}
