/**
 * 游戏主循环类，封装了 requestAnimationFrame
 */
export class Loop {
  private frameId: number | null = null; // 当前动画帧的ID
  private lastTime = 0;                  // 上一帧的时间戳

  public constructor(
    private readonly update: (deltaTime: number) => void, // 逻辑更新回调
    private readonly render: () => void                   // 渲染回调
  ) {}

  /**
   * 启动游戏循环
   */
  public start(): void {
    if (this.frameId !== null) {
      return; // 如果已经启动，则忽略
    }

    this.lastTime = performance.now();
    this.frameId = window.requestAnimationFrame(this.tick);
  }

  /**
   * 停止游戏循环
   */
  public stop(): void {
    if (this.frameId === null) {
      return; // 如果未启动，则忽略
    }

    window.cancelAnimationFrame(this.frameId);
    this.frameId = null;
  }

  /**
   * 每一帧的回调函数
   */
  private readonly tick = (time: number): void => {
    // 将 deltaTime 限制在最大 100ms（0.1秒），
    // 以防止在浏览器卡顿或切换标签页时，时间增量过大导致物理穿模或逻辑错误。
    const deltaTime = Math.min((time - this.lastTime) / 1000, 0.1);
    this.lastTime = time;

    this.update(deltaTime); // 更新逻辑
    this.render();          // 执行渲染

    this.frameId = window.requestAnimationFrame(this.tick); // 请求下一帧
  };
}

