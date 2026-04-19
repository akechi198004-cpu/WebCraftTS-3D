import { Vector3 } from "three";
import { PLAYER_HEIGHT, PLAYER_RADIUS } from "../constants";
import type { GridPosition, PlayerState } from "../types";
import { World } from "../world/World";

// 碰撞检测时的微小容差值，用于避免浮点数精度问题导致的卡墙现象
const COLLISION_EPSILON = 0.0001;

// 边界框接口
interface Bounds {
  min: Vector3;
  max: Vector3;
}

/**
 * 根据玩家的速度和碰撞检测更新玩家位置
 */
export function movePlayerWithCollisions(
  player: PlayerState,
  world: World,
  deltaTime: number
): void {
  // 每一帧开始时重置着地状态
  player.isGrounded = false;

  // 计算目标移动量
  const dx = player.velocity.x * deltaTime;
  const dy = player.velocity.y * deltaTime;
  const dz = player.velocity.z * deltaTime;

  // 为了防止速度过快导致“穿模（Tunneling）”，将移动量按最大步长切分为多次小步移动
  // 方块厚度为 1，加上玩家半径 0.35，最大步长应小于此值以保证安全。
  const MAX_STEP = 0.25;
  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
  const steps = Math.max(1, Math.ceil(distance / MAX_STEP));

  const stepX = dx / steps;
  const stepY = dy / steps;
  const stepZ = dz / steps;

  // 循环执行小步长移动
  for (let i = 0; i < steps; i++) {
    // 只有在速度不为 0 时才尝试移动，因为碰撞可能会将某轴的速度置 0
    if (player.velocity.x !== 0) moveAlongAxis(player, world, "x", stepX);
    if (player.velocity.y !== 0) moveAlongAxis(player, world, "y", stepY);
    if (player.velocity.z !== 0) moveAlongAxis(player, world, "z", stepZ);
  }

  // 如果没有因为 y 轴碰撞检测到着地，再做一次专门的着地检测（处理站立不动的情况）
  if (!player.isGrounded && isStandingOnGround(player, world)) {
    player.isGrounded = true;

    // 如果着地时 y 轴速度向下，则归零
    if (player.velocity.y < 0) {
      player.velocity.y = 0;
    }
  }
}

/**
 * 检测玩家当前占据的包围盒（AABB）是否与指定方块重叠
 */
export function doesPlayerAabbIntersectBlock(
  player: PlayerState,
  blockPosition: GridPosition
): boolean {
  const playerBounds = getPlayerBounds(player);
  const blockMin = new Vector3(blockPosition.x, blockPosition.y, blockPosition.z);
  const blockMax = new Vector3(blockPosition.x + 1, blockPosition.y + 1, blockPosition.z + 1);

  // 简单的AABB（轴对齐包围盒）重叠检测
  return (
    playerBounds.min.x < blockMax.x - COLLISION_EPSILON &&
    playerBounds.max.x > blockMin.x + COLLISION_EPSILON &&
    playerBounds.min.y < blockMax.y - COLLISION_EPSILON &&
    playerBounds.max.y > blockMin.y + COLLISION_EPSILON &&
    playerBounds.min.z < blockMax.z - COLLISION_EPSILON &&
    playerBounds.max.z > blockMin.z + COLLISION_EPSILON
  );
}

/**
 * 沿单个坐标轴移动玩家并解析碰撞
 */
function moveAlongAxis(
  player: PlayerState,
  world: World,
  axis: "x" | "y" | "z",
  delta: number
): void {
  if (delta === 0) {
    return;
  }

  // 尝试应用移动
  player.position[axis] += delta;

  // 获取移动后的边界框，并转换为方块网格坐标进行遍历
  const bounds = getPlayerBounds(player);
  const minX = Math.floor(bounds.min.x);
  const maxX = Math.floor(bounds.max.x - COLLISION_EPSILON);
  const minY = Math.floor(bounds.min.y);
  const maxY = Math.floor(bounds.max.y - COLLISION_EPSILON);
  const minZ = Math.floor(bounds.min.z);
  const maxZ = Math.floor(bounds.max.z - COLLISION_EPSILON);

  // 遍历玩家包围盒触及的所有方块
  for (let x = minX; x <= maxX; x += 1) {
    for (let y = minY; y <= maxY; y += 1) {
      for (let z = minZ; z <= maxZ; z += 1) {
        // 如果不是固体方块，则跳过
        if (!world.isSolidBlockAt({ x, y, z })) {
          continue;
        }

        // 发生碰撞，将玩家推出该方块
        if (axis === "x") {
          player.position.x =
            delta > 0
              ? x - PLAYER_RADIUS - COLLISION_EPSILON
              : x + 1 + PLAYER_RADIUS + COLLISION_EPSILON;
          player.velocity.x = 0; // 发生碰撞后对应轴速度归零
        }

        if (axis === "y") {
          if (delta > 0) {
            // 向上跳跃碰到天花板
            player.position.y = y - PLAYER_HEIGHT - COLLISION_EPSILON;
          } else {
            // 向下掉落碰到地面
            player.position.y = y + 1 + COLLISION_EPSILON;
            player.isGrounded = true; // 标记为在地面上
          }

          player.velocity.y = 0;
        }

        if (axis === "z") {
          player.position.z =
            delta > 0
              ? z - PLAYER_RADIUS - COLLISION_EPSILON
              : z + 1 + PLAYER_RADIUS + COLLISION_EPSILON;
          player.velocity.z = 0;
        }
      }
    }
  }
}

/**
 * 获取玩家当前的碰撞包围盒 (AABB)
 */
function getPlayerBounds(player: PlayerState): Bounds {
  return {
    min: new Vector3(
      player.position.x - PLAYER_RADIUS,
      player.position.y, // 玩家位置基准点位于脚底
      player.position.z - PLAYER_RADIUS
    ),
    max: new Vector3(
      player.position.x + PLAYER_RADIUS,
      player.position.y + PLAYER_HEIGHT, // 顶部通过玩家高度计算
      player.position.z + PLAYER_RADIUS
    )
  };
}

/**
 * 探测玩家脚底紧挨着的空间，确认是否踩在固体方块上
 */
function isStandingOnGround(player: PlayerState, world: World): boolean {
  const bounds = getPlayerBounds(player);
  // 获取紧贴脚底那一层的网格 Y 坐标
  const groundY = Math.floor(bounds.min.y - COLLISION_EPSILON);
  const minX = Math.floor(bounds.min.x + COLLISION_EPSILON);
  const maxX = Math.floor(bounds.max.x - COLLISION_EPSILON);
  const minZ = Math.floor(bounds.min.z + COLLISION_EPSILON);
  const maxZ = Math.floor(bounds.max.z - COLLISION_EPSILON);

  // 只要脚底踩到了至少一个固体方块，即视为在地面上
  for (let x = minX; x <= maxX; x += 1) {
    for (let z = minZ; z <= maxZ; z += 1) {
      if (world.isSolidBlockAt({ x, y: groundY, z })) {
        return true;
      }
    }
  }

  return false;
}
