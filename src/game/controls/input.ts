import { Vector3 } from "three";

/**
 * 输入控制器，负责管理键盘按键和鼠标点击事件
 */
export class InputController {
  private readonly pressedKeys = new Set<string>(); // 当前按下的键集合
  private primaryActionQueued = false;              // 鼠标左键点击是否已排队
  private secondaryActionQueued = false;            // 鼠标右键点击是否已排队

  public constructor(
    private readonly target: Window,
    private readonly mouseTarget: HTMLElement,
    private readonly allowMouseActions: () => boolean // 用于判断是否允许鼠标交互（如：只有在指针锁定时才允许）
  ) {
    this.target.addEventListener("keydown", this.handleKeyDown);
    this.target.addEventListener("keyup", this.handleKeyUp);
    this.target.addEventListener("mousedown", this.handleMouseDown);
    this.target.addEventListener("blur", this.handleBlur);
    this.mouseTarget.addEventListener("contextmenu", this.handleContextMenu);
  }

  /**
   * 检查某个按键当前是否被按下
   */
  public isPressed(code: string): boolean {
    return this.pressedKeys.has(code);
  }

  /**
   * 消费（读取并清除）某个按键状态（用于只需要触发一次的操作，如切换方块类型）
   */
  public consumeKey(code: string): boolean {
    if (this.pressedKeys.has(code)) {
      this.pressedKeys.delete(code);
      return true;
    }
    return false;
  }

  /**
   * 根据当前按键（W/A/S/D）和玩家当前的偏航角，计算世界空间下的移动方向向量
   */
  public getMovementDirection(yaw: number): Vector3 {
    // 前进为正，后退为负
    const forwardInput = Number(this.isPressed("KeyW")) - Number(this.isPressed("KeyS"));
    // 右移为正，左移为负
    const rightInput = Number(this.isPressed("KeyD")) - Number(this.isPressed("KeyA"));

    if (forwardInput === 0 && rightInput === 0) {
      return new Vector3(); // 没有输入，返回零向量
    }

    // 在 Three.js (Y轴向上) 中，向左转动会增加 rotation.y (yaw)。
    // yaw=0 时的正前方方向是 [0, 0, -1]
    const forward = new Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
    const right = new Vector3(Math.cos(yaw), 0, -Math.sin(yaw));

    // 根据输入权重组合方向并归一化
    return forward.multiplyScalar(forwardInput).add(right.multiplyScalar(rightInput)).normalize();
  }

  /**
   * 消费左键点击事件
   */
  public consumePrimaryAction(): boolean {
    const shouldTrigger = this.primaryActionQueued;
    this.primaryActionQueued = false;
    return shouldTrigger;
  }

  /**
   * 消费右键点击事件
   */
  public consumeSecondaryAction(): boolean {
    const shouldTrigger = this.secondaryActionQueued;
    this.secondaryActionQueued = false;
    return shouldTrigger;
  }

  /**
   * 清除排队的鼠标点击动作
   */
  public clearQueuedActions(): void {
    this.primaryActionQueued = false;
    this.secondaryActionQueued = false;
  }

  /**
   * 清理事件监听器
   */
  public dispose(): void {
    this.target.removeEventListener("keydown", this.handleKeyDown);
    this.target.removeEventListener("keyup", this.handleKeyUp);
    this.target.removeEventListener("mousedown", this.handleMouseDown);
    this.target.removeEventListener("blur", this.handleBlur);
    this.mouseTarget.removeEventListener("contextmenu", this.handleContextMenu);
  }

  /**
   * 消费 Tab 键点击事件
   */
  public consumeTabAction(): boolean {
    return this.consumeKey("Tab");
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (event.code === "Tab") {
      event.preventDefault(); // 阻止 Tab 键切换焦点
    }
    this.pressedKeys.add(event.code);
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    this.pressedKeys.delete(event.code);
  };

  private readonly handleMouseDown = (event: MouseEvent): void => {
    if (!this.allowMouseActions()) {
      return;
    }

    if (event.button === 0) { // 左键
      this.primaryActionQueued = true;
      event.preventDefault();
    }

    if (event.button === 2) { // 右键
      this.secondaryActionQueued = true;
      event.preventDefault();
    }
  };

  /**
   * 阻止默认的右键菜单出现
   */
  private readonly handleContextMenu = (event: MouseEvent): void => {
    event.preventDefault();
  };

  /**
   * 当窗口失去焦点时，清空按键状态以防“卡键”
   */
  private readonly handleBlur = (): void => {
    this.pressedKeys.clear();
    this.clearQueuedActions();
  };
}
