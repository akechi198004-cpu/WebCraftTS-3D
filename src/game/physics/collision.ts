import { Vector3 } from "three";
import { PLAYER_HEIGHT, PLAYER_RADIUS } from "../constants";
import type { GridPosition, PlayerState } from "../types";
import { World } from "../world/World";

const COLLISION_EPSILON = 0.0001;

interface Bounds {
  min: Vector3;
  max: Vector3;
}

export function movePlayerWithCollisions(
  player: PlayerState,
  world: World,
  deltaTime: number
): void {
  player.isGrounded = false;

  moveAlongAxis(player, world, "x", player.velocity.x * deltaTime);
  moveAlongAxis(player, world, "y", player.velocity.y * deltaTime);
  moveAlongAxis(player, world, "z", player.velocity.z * deltaTime);

  if (!player.isGrounded && isStandingOnGround(player, world)) {
    player.isGrounded = true;

    if (player.velocity.y < 0) {
      player.velocity.y = 0;
    }
  }
}

export function doesPlayerAabbIntersectBlock(
  player: PlayerState,
  blockPosition: GridPosition
): boolean {
  const playerBounds = getPlayerBounds(player);
  const blockMin = new Vector3(blockPosition.x, blockPosition.y, blockPosition.z);
  const blockMax = new Vector3(blockPosition.x + 1, blockPosition.y + 1, blockPosition.z + 1);

  return (
    playerBounds.min.x < blockMax.x - COLLISION_EPSILON &&
    playerBounds.max.x > blockMin.x + COLLISION_EPSILON &&
    playerBounds.min.y < blockMax.y - COLLISION_EPSILON &&
    playerBounds.max.y > blockMin.y + COLLISION_EPSILON &&
    playerBounds.min.z < blockMax.z - COLLISION_EPSILON &&
    playerBounds.max.z > blockMin.z + COLLISION_EPSILON
  );
}

function moveAlongAxis(
  player: PlayerState,
  world: World,
  axis: "x" | "y" | "z",
  delta: number
): void {
  if (delta === 0) {
    return;
  }

  player.position[axis] += delta;

  const bounds = getPlayerBounds(player);
  const minX = Math.floor(bounds.min.x);
  const maxX = Math.floor(bounds.max.x - COLLISION_EPSILON);
  const minY = Math.floor(bounds.min.y);
  const maxY = Math.floor(bounds.max.y - COLLISION_EPSILON);
  const minZ = Math.floor(bounds.min.z);
  const maxZ = Math.floor(bounds.max.z - COLLISION_EPSILON);

  for (let x = minX; x <= maxX; x += 1) {
    for (let y = minY; y <= maxY; y += 1) {
      for (let z = minZ; z <= maxZ; z += 1) {
        if (!world.isSolidBlockAt({ x, y, z })) {
          continue;
        }

        if (axis === "x") {
          player.position.x =
            delta > 0
              ? x - PLAYER_RADIUS - COLLISION_EPSILON
              : x + 1 + PLAYER_RADIUS + COLLISION_EPSILON;
          player.velocity.x = 0;
        }

        if (axis === "y") {
          if (delta > 0) {
            player.position.y = y - PLAYER_HEIGHT - COLLISION_EPSILON;
          } else {
            player.position.y = y + 1 + COLLISION_EPSILON;
            player.isGrounded = true;
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

function getPlayerBounds(player: PlayerState): Bounds {
  return {
    min: new Vector3(
      player.position.x - PLAYER_RADIUS,
      player.position.y,
      player.position.z - PLAYER_RADIUS
    ),
    max: new Vector3(
      player.position.x + PLAYER_RADIUS,
      player.position.y + PLAYER_HEIGHT,
      player.position.z + PLAYER_RADIUS
    )
  };
}

function isStandingOnGround(player: PlayerState, world: World): boolean {
  const bounds = getPlayerBounds(player);
  const groundY = Math.floor(bounds.min.y - COLLISION_EPSILON);
  const minX = Math.floor(bounds.min.x + COLLISION_EPSILON);
  const maxX = Math.floor(bounds.max.x - COLLISION_EPSILON);
  const minZ = Math.floor(bounds.min.z + COLLISION_EPSILON);
  const maxZ = Math.floor(bounds.max.z - COLLISION_EPSILON);

  for (let x = minX; x <= maxX; x += 1) {
    for (let z = minZ; z <= maxZ; z += 1) {
      if (world.isSolidBlockAt({ x, y: groundY, z })) {
        return true;
      }
    }
  }

  return false;
}
