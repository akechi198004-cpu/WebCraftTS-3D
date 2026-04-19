import { Object3D, Vector3 } from "three";
import {
  PLAYER_MOVE_SPEED,
  PLAYER_JUMP_SPEED,
  PLAYER_START_PITCH,
  PLAYER_START_POSITION,
  PLAYER_START_YAW
} from "./constants";
import { createCamera, resizeCamera, syncCameraToPlayer } from "./core/camera";
import { Loop } from "./core/loop";
import { createRenderer, resizeRenderer } from "./core/renderer";
import { createScene } from "./core/scene";
import { InputController } from "./controls/input";
import { PointerLockController } from "./controls/pointerLock";
import {
  doesPlayerAabbIntersectBlock,
  movePlayerWithCollisions
} from "./physics/collision";
import { applyGravity } from "./physics/gravity";
import {
  clearLocalSave,
  loadLocalSave,
  saveLocalState
} from "./save/localSave";
import { createCrosshair, setCrosshairActive } from "./ui/crosshair";
import { createHud, renderHud, type HudView } from "./ui/hud";
import { createLegend, updateLegendActive } from "./ui/legend";
import { createMinimap, renderMinimap } from "./ui/minimap";
import type { BlockType, LocalSaveState, PlayerState, WorldRaycastHit } from "./types";
import { World } from "./world/World";
import { raycastWorld } from "./world/raycast";

/**
 * 游戏主类：负责将各个模块组合并协调游戏生命周期
 */
export class Game {
  private readonly shell: HTMLDivElement;               // 游戏界面根容器
  private readonly renderer = createRenderer();         // Three.js 渲染器
  private readonly scene = createScene();               // Three.js 场景
  private readonly camera = createCamera();             // 第一人称透视相机
  private readonly player: PlayerState;                 // 玩家状态（位置、速度、视角等）
  private readonly world: World;                        // 世界管理器（方块和地形）
  private readonly input: InputController;              // 键盘及鼠标点击输入控制器
  private readonly pointerLock: PointerLockController;  // 鼠标锁定及移动视角控制器
  private readonly hud: HudView;                        // 顶部信息显示 UI
  private readonly legend = createLegend();             // 快捷栏/图例 UI
  private readonly minimap = createMinimap();           // 小地图 UI
  private readonly crosshair = createCrosshair();       // 屏幕中心准星 UI
  private readonly loop: Loop;                          // 游戏循环驱动器

  private selectedBlock: WorldRaycastHit | null = null; // 当前射线命中的方块
  private currentPlacementBlock: Exclude<BlockType, "air"> = "stone"; // 准备放置的方块类型，默认为石头

  public constructor(private readonly mountPoint: HTMLDivElement) {
    // 尝试加载本地存档
    const saveState = loadLocalSave();

    this.player = createPlayerState(saveState);
    this.world = new World(saveState?.blocks);

    this.shell = document.createElement("div");
    this.shell.className = "game-shell";

    this.renderer.domElement.classList.add("game-canvas");
    this.pointerLock = new PointerLockController(this.renderer.domElement);
    this.input = new InputController(
      window,
      this.renderer.domElement,
      () => this.pointerLock.isLocked() // 只有在指针锁定时才处理左/右键点击逻辑
    );
    this.hud = createHud(this.handleClearSave);

    // 初始化游戏循环，绑定更新和渲染逻辑
    this.loop = new Loop((deltaTime) => this.update(deltaTime), () => {
      this.renderer.render(this.scene, this.camera);
    });

    // 将各个 UI 和画布组装到 DOM 中
    this.mountPoint.append(this.shell);
    this.shell.append(this.renderer.domElement, this.crosshair, this.hud.root, this.legend, this.minimap.root);

    this.attachWorld(this.world.root);
    this.syncCamera();
    this.handleResize();

    // 绑定事件监听
    window.addEventListener("resize", this.handleResize);
    window.addEventListener("beforeunload", this.handleBeforeUnload);
  }

  /**
   * 启动游戏循环
   */
  public start(): void {
    this.loop.start();
  }

  /**
   * 停止游戏并清理资源
   */
  public dispose(): void {
    this.loop.stop();
    this.input.dispose();
    this.pointerLock.dispose();
    this.world.dispose();
    window.removeEventListener("resize", this.handleResize);
    window.removeEventListener("beforeunload", this.handleBeforeUnload);
    if (this.persistTimeout) {
      window.clearTimeout(this.persistTimeout);
    }
    if (this.resizeTimeout) {
      window.clearTimeout(this.resizeTimeout);
    }
    // 退出时保存最后的状态
    saveLocalState(this.captureSaveState());
  }

  private resizeTimeout = 0;

  /**
   * 处理窗口大小改变事件，包含防抖机制以减轻连续调整窗口大小带来的性能消耗
   */
  private readonly handleResize = (): void => {
    if (this.resizeTimeout) {
      window.clearTimeout(this.resizeTimeout);
    }

    this.resizeTimeout = window.setTimeout(() => {
      const width = this.mountPoint.clientWidth;
      const height = this.mountPoint.clientHeight;

      resizeRenderer(this.renderer, { width, height });
      resizeCamera(this.camera, { width, height });
    }, 100); // 延迟 100ms 执行防抖
  };

  /**
   * 每帧执行的核心逻辑更新
   */
  private update(deltaTime: number): void {
    this.pointerLock.update(this.player);        // 根据鼠标移动更新视角
    this.applyMovementInput();                   // 处理 WASD 移动和跳跃输入
    this.handleBlockSelectionInput();            // 处理数字键 1-9 切换方块类型
    applyGravity(this.player, deltaTime);        // 施加重力
    movePlayerWithCollisions(this.player, this.world, deltaTime); // 执行物理碰撞检测并更新玩家位置
    this.syncCamera();                           // 将相机位置同步到玩家眼部
    this.handleBlockInteractions();              // 射线检测以及处理挖掘/放置方块
    this.world.update(deltaTime, this.player);   // 根据玩家位置加载/卸载区块
    this.updateHud(deltaTime);                   // 更新 UI 数据
    
    // 渲染小地图
    renderMinimap(
      this.minimap,
      this.player.position.x,
      this.player.position.z,
      this.player.yaw
    );
  }

  /**
   * 读取数字键输入，切换当前要放置的方块类型
   */
  private handleBlockSelectionInput(): void {
    if (this.input.consumeKey("Digit1")) this.currentPlacementBlock = "grass";
    if (this.input.consumeKey("Digit2")) this.currentPlacementBlock = "stone";
    if (this.input.consumeKey("Digit3")) this.currentPlacementBlock = "dirt";
    if (this.input.consumeKey("Digit4")) this.currentPlacementBlock = "wood";
    if (this.input.consumeKey("Digit5")) this.currentPlacementBlock = "leaves";
    if (this.input.consumeKey("Digit6")) this.currentPlacementBlock = "brick";
    if (this.input.consumeKey("Digit7")) this.currentPlacementBlock = "sand";
    if (this.input.consumeKey("Digit8")) this.currentPlacementBlock = "water";
    if (this.input.consumeKey("Digit9")) this.currentPlacementBlock = "ice";
  }

  /**
   * 处理移动方向和跳跃的逻辑
   */
  private applyMovementInput(): void {
    const movementDirection = this.input.getMovementDirection(this.player.yaw);
    this.player.velocity.x = movementDirection.x * PLAYER_MOVE_SPEED;
    this.player.velocity.z = movementDirection.z * PLAYER_MOVE_SPEED;

    // 只有在地面上且按下了空格键时才允许跳跃
    if (this.player.isGrounded && this.input.isPressed("Space")) {
      this.player.velocity.y = PLAYER_JUMP_SPEED;
      this.player.isGrounded = false;
    }
  }

  /**
   * 处理方块的交互（挖除与放置）
   */
  private handleBlockInteractions(): void {
    const removeRequested = this.input.consumePrimaryAction(); // 左键
    const placeRequested = this.input.consumeSecondaryAction(); // 右键

    // 如果鼠标未被锁定到画布，则禁用互动功能，并取消准星激活状态
    if (!this.pointerLock.isLocked()) {
      this.selectedBlock = null;
      setCrosshairActive(this.crosshair, false);
      return;
    }

    let raycastHit = raycastWorld(this.camera, this.world);
    let worldChanged = false;

    // 左键挖除
    if (raycastHit !== null && removeRequested) {
      worldChanged = this.world.removeBlock(raycastHit.blockPosition);
    }

    // 右键放置
    if (
      raycastHit !== null &&
      placeRequested &&
      !this.world.hasBlock(raycastHit.placementPosition) && // 目标位置没有其他方块
      !doesPlayerAabbIntersectBlock(this.player, raycastHit.placementPosition) // 新方块不会与玩家身体重叠
    ) {
      worldChanged = this.world.setBlock(raycastHit.placementPosition, this.currentPlacementBlock) || worldChanged;
    }

    // 如果世界发生了变化，触发延迟存档并重新射线检测
    if (worldChanged) {
      this.persistState();
      raycastHit = raycastWorld(this.camera, this.world);
    }

    this.selectedBlock = raycastHit;
    // 如果准星对准了某个方块，高亮准星
    setCrosshairActive(this.crosshair, raycastHit !== null);
  }

  /**
   * 更新 HUD 和图例 UI
   */
  private updateHud(deltaTime: number): void {
    const fps = deltaTime > 0 ? Math.round(1 / deltaTime) : 0;
    const selectedBlockText =
      this.selectedBlock === null
        ? "none"
        : `${this.selectedBlock.blockType} @ (${this.selectedBlock.blockPosition.x}, ${this.selectedBlock.blockPosition.y}, ${this.selectedBlock.blockPosition.z})`;

    renderHud(this.hud, {
      fps,
      pointerLocked: this.pointerLock.isLocked(),
      selectedBlockText,
      placementBlockText: this.currentPlacementBlock,
      blockCount: this.world.getBlockCount()
    });
    
    updateLegendActive(this.legend, this.currentPlacementBlock);
  }

  /**
   * 将世界的根对象加入场景
   */
  private attachWorld(root: Object3D): void {
    this.scene.add(root);
  }

  /**
   * 同步相机
   */
  private syncCamera(): void {
    syncCameraToPlayer(this.camera, this.player);
  }

  /**
   * 抓取当前需要保存的状态数据
   */
  private captureSaveState(): LocalSaveState {
    return {
      player: {
        position: toVector3Tuple(this.player.position),
        velocity: toVector3Tuple(this.player.velocity),
        yaw: this.player.yaw,
        pitch: this.player.pitch
      },
      blocks: this.world.serialize()
    };
  }

  private persistTimeout = 0;

  /**
   * 触发带有防抖(debounce)机制的状态保存
   */
  private persistState(): void {
    if (this.persistTimeout) {
      window.clearTimeout(this.persistTimeout);
    }
    // 延迟 500ms 进行保存，避免在连续快速放置/移除方块时造成卡顿
    this.persistTimeout = window.setTimeout(() => {
      saveLocalState(this.captureSaveState());
    }, 500);
  }

  /**
   * 页面卸载前（刷新或关闭标签）强制保存当前状态
   */
  private readonly handleBeforeUnload = (): void => {
    if (this.persistTimeout) {
      window.clearTimeout(this.persistTimeout);
    }
    saveLocalState(this.captureSaveState());
  };

  /**
   * 清除存档按钮点击事件处理器：清空本地存储，并重置世界及玩家状态
   */
  private readonly handleClearSave = (): void => {
    clearLocalSave();
    this.pointerLock.unlock();
    this.input.clearQueuedActions();
    this.world.reset();
    resetPlayerState(this.player);
    this.selectedBlock = null;
    setCrosshairActive(this.crosshair, false);
    this.syncCamera();
  };
}

/**
 * 基于存档数据（若有）或初始常量创建玩家状态对象
 */
function createPlayerState(saveState: LocalSaveState | null): PlayerState {
  if (saveState !== null) {
    return {
      position: new Vector3(...saveState.player.position),
      velocity: new Vector3(...saveState.player.velocity),
      yaw: saveState.player.yaw,
      pitch: saveState.player.pitch,
      isGrounded: false
    };
  }

  return {
    position: new Vector3(...PLAYER_START_POSITION),
    velocity: new Vector3(),
    yaw: PLAYER_START_YAW,
    pitch: PLAYER_START_PITCH,
    isGrounded: false
  };
}

/**
 * 将玩家状态重置到出生点
 */
function resetPlayerState(player: PlayerState): void {
  player.position.set(...PLAYER_START_POSITION);
  player.velocity.set(0, 0, 0);
  player.yaw = PLAYER_START_YAW;
  player.pitch = PLAYER_START_PITCH;
  player.isGrounded = false;
}

/**
 * 将 Vector3 转换为包含 x, y, z 的元组
 */
function toVector3Tuple(vector: Vector3): [number, number, number] {
  return [vector.x, vector.y, vector.z];
}
