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

export class Game {
  private readonly shell: HTMLDivElement;
  private readonly renderer = createRenderer();
  private readonly scene = createScene();
  private readonly camera = createCamera();
  private readonly player: PlayerState;
  private readonly world: World;
  private readonly input: InputController;
  private readonly pointerLock: PointerLockController;
  private readonly hud: HudView;
  private readonly legend = createLegend();
  private readonly minimap = createMinimap();
  private readonly crosshair = createCrosshair();
  private readonly loop: Loop;
  private selectedBlock: WorldRaycastHit | null = null;
  private currentPlacementBlock: Exclude<BlockType, "air"> = "stone";

  public constructor(private readonly mountPoint: HTMLDivElement) {
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
      () => this.pointerLock.isLocked()
    );
    this.hud = createHud(this.handleClearSave);
    this.loop = new Loop((deltaTime) => this.update(deltaTime), () => {
      this.renderer.render(this.scene, this.camera);
    });

    this.mountPoint.append(this.shell);
    this.shell.append(this.renderer.domElement, this.crosshair, this.hud.root, this.legend, this.minimap.root);

    this.attachWorld(this.world.root);
    this.syncCamera();
    this.handleResize();

    window.addEventListener("resize", this.handleResize);
    window.addEventListener("beforeunload", this.handleBeforeUnload);
  }

  public start(): void {
    this.loop.start();
  }

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
    saveLocalState(this.captureSaveState());
  }

  private readonly handleResize = (): void => {
    const width = this.mountPoint.clientWidth;
    const height = this.mountPoint.clientHeight;

    resizeRenderer(this.renderer, { width, height });
    resizeCamera(this.camera, { width, height });
  };

  private update(deltaTime: number): void {
    this.pointerLock.update(this.player);
    this.applyMovementInput();
    this.handleBlockSelectionInput();
    applyGravity(this.player, deltaTime);
    movePlayerWithCollisions(this.player, this.world, deltaTime);
    this.syncCamera();
    this.handleBlockInteractions();
    this.world.update(deltaTime, this.player);
    this.updateHud(deltaTime);
    
    renderMinimap(
      this.minimap,
      this.player.position.x,
      this.player.position.z,
      this.player.yaw
    );
  }

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

  private applyMovementInput(): void {
    const movementDirection = this.input.getMovementDirection(this.player.yaw);
    this.player.velocity.x = movementDirection.x * PLAYER_MOVE_SPEED;
    this.player.velocity.z = movementDirection.z * PLAYER_MOVE_SPEED;

    if (this.player.isGrounded && this.input.isPressed("Space")) {
      this.player.velocity.y = PLAYER_JUMP_SPEED;
      this.player.isGrounded = false;
    }
  }

  private handleBlockInteractions(): void {
    const removeRequested = this.input.consumePrimaryAction();
    const placeRequested = this.input.consumeSecondaryAction();

    if (!this.pointerLock.isLocked()) {
      this.selectedBlock = null;
      setCrosshairActive(this.crosshair, false);
      return;
    }

    let raycastHit = raycastWorld(this.camera, this.world);
    let worldChanged = false;

    if (raycastHit !== null && removeRequested) {
      worldChanged = this.world.removeBlock(raycastHit.blockPosition);
    }

    if (
      raycastHit !== null &&
      placeRequested &&
      !this.world.hasBlock(raycastHit.placementPosition) &&
      !doesPlayerAabbIntersectBlock(this.player, raycastHit.placementPosition)
    ) {
      worldChanged = this.world.setBlock(raycastHit.placementPosition, this.currentPlacementBlock) || worldChanged;
    }

    if (worldChanged) {
      this.persistState();
      raycastHit = raycastWorld(this.camera, this.world);
    }

    this.selectedBlock = raycastHit;
    setCrosshairActive(this.crosshair, raycastHit !== null);
  }

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

  private attachWorld(root: Object3D): void {
    this.scene.add(root);
  }

  private syncCamera(): void {
    syncCameraToPlayer(this.camera, this.player);
  }

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

  private persistState(): void {
    if (this.persistTimeout) {
      window.clearTimeout(this.persistTimeout);
    }
    // Debounce save by 500ms to avoid freezing during rapid block placement/removal
    this.persistTimeout = window.setTimeout(() => {
      saveLocalState(this.captureSaveState());
    }, 500);
  }

  private readonly handleBeforeUnload = (): void => {
    if (this.persistTimeout) {
      window.clearTimeout(this.persistTimeout);
    }
    saveLocalState(this.captureSaveState());
  };

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

function resetPlayerState(player: PlayerState): void {
  player.position.set(...PLAYER_START_POSITION);
  player.velocity.set(0, 0, 0);
  player.yaw = PLAYER_START_YAW;
  player.pitch = PLAYER_START_PITCH;
  player.isGrounded = false;
}

function toVector3Tuple(vector: Vector3): [number, number, number] {
  return [vector.x, vector.y, vector.z];
}
