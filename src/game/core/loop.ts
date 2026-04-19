export class Loop {
  private frameId: number | null = null;
  private lastTime = 0;

  public constructor(
    private readonly update: (deltaTime: number) => void,
    private readonly render: () => void
  ) {}

  public start(): void {
    if (this.frameId !== null) {
      return;
    }

    this.lastTime = performance.now();
    this.frameId = window.requestAnimationFrame(this.tick);
  }

  public stop(): void {
    if (this.frameId === null) {
      return;
    }

    window.cancelAnimationFrame(this.frameId);
    this.frameId = null;
  }

  private readonly tick = (time: number): void => {
    // Cap deltaTime to 100ms to prevent tunneling/physics glitches during lag or tab focus loss
    const deltaTime = Math.min((time - this.lastTime) / 1000, 0.1);
    this.lastTime = time;

    this.update(deltaTime);
    this.render();

    this.frameId = window.requestAnimationFrame(this.tick);
  };
}

