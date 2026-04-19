import { Vector3 } from "three";
import { PLAYER_JUMP_SPEED, PLAYER_MOVE_SPEED } from "../constants";
import type { PlayerState } from "../types";
import { World } from "../world/World";

// 预设路径点 (绕泰姬陵与比萨斜塔跑一个'8'字环绕轨迹)
const WAYPOINTS = [
  new Vector3(0, 18, 32),     // Pyramid (冲上金字塔顶端)
  new Vector3(0, 0, 0),       // Ground center (跑回地面)
  new Vector3(-32, 0, -10),   // Taj Mahal top-right
  new Vector3(-54, 0, -32),   // Taj Mahal left
  new Vector3(-32, 0, -54),   // Taj Mahal bottom
  new Vector3(0, 0, -32),     // Center cross (8字交叉点)
  new Vector3(32, 0, -10),    // Tower top-left
  new Vector3(54, 0, -32),    // Tower right
  new Vector3(32, 0, -54),    // Tower bottom
  new Vector3(0, 0, -32)      // Center cross back to loop
];

let currentWaypointIndex = 0;
let timeStuck = 0;
let lastPosition = new Vector3();

/**
 * 自动化测试脚本：驱动玩家按预设路径点寻路，并处理简单的跳跃障碍
 */
export function runAutoParkour(player: PlayerState, _world: World, deltaTime: number): void {
  const target = WAYPOINTS[currentWaypointIndex];

  // 计算到目标点的距离向量
  const dx = target.x - player.position.x;
  const dy = target.y - player.position.y;
  const dz = target.z - player.position.z;
  const distanceSq = dx * dx + dz * dz;

  // 如果水平接近目标点，并且高度也差不多（或者目标是地面），切换到下一个
  if (distanceSq < 4.0 && Math.abs(dy) < 3.0) { // 距离小于 2，高度差较小
    currentWaypointIndex = (currentWaypointIndex + 1) % WAYPOINTS.length;
    return; // 停顿一帧重新计算
  }

  const distance = Math.sqrt(distanceSq);
  const dirX = dx / distance;
  const dirZ = dz / distance;

  // 设置速度朝向目标点
  player.velocity.x = dirX * PLAYER_MOVE_SPEED;
  player.velocity.z = dirZ * PLAYER_MOVE_SPEED;

  // 更新玩家偏航角 (使其面朝移动方向)
  // atan2 返回的角度基准与 Three.js 的相机系统一致，-Math.PI / 2 调整初始朝向
  player.yaw = Math.atan2(dx, dz) + Math.PI;

  // 简单的“卡顿”检测启发式跳跃
  const posDiff = player.position.clone().sub(lastPosition);
  const posDiffSq = posDiff.x * posDiff.x + posDiff.z * posDiff.z;

  // 如果预期移动但实际几乎没动，判定为被卡住
  if (posDiffSq < 0.001 * deltaTime) {
    timeStuck += deltaTime;
  } else {
    timeStuck = 0;
  }

  // 如果在地面上并且被卡住了一小段时间，或者目标点在上方较高处（如金字塔顶），尝试跳跃
  const needsToJumpHigher = dy > 1.5;
  if (player.isGrounded && (timeStuck > 0.2 || needsToJumpHigher)) {
    player.velocity.y = PLAYER_JUMP_SPEED;
    player.isGrounded = false;
    timeStuck = 0;
  }

  lastPosition.copy(player.position);
}
