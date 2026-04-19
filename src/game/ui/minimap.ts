import { PLAYER_START_POSITION } from "../constants";

// 小地图视图接口
export interface MinimapView {
  root: HTMLDivElement;             // 根容器
  canvas: HTMLCanvasElement;        // 绘图画布
  ctx: CanvasRenderingContext2D;    // 画布 2D 上下文
  coords: HTMLDivElement;           // 显示坐标的文本元素
}

/**
 * 创建小地图 UI
 */
export function createMinimap(): MinimapView {
  const root = document.createElement("div");
  root.className = "minimap-wrapper";

  const container = document.createElement("div");
  container.className = "minimap-container";

  const canvas = document.createElement("canvas");
  canvas.className = "minimap-canvas";
  // 设置画布固定的物理像素宽高
  canvas.width = 160;
  canvas.height = 160;

  const ctx = canvas.getContext("2d")!;
  container.append(canvas);

  const coords = document.createElement("div");
  coords.className = "minimap-coords";

  root.append(container, coords);

  return { root, canvas, ctx, coords };
}

/**
 * 每帧渲染小地图
 */
export function renderMinimap(view: MinimapView, playerX: number, playerZ: number, yaw: number): void {
  const { canvas, ctx, coords } = view;
  const width = canvas.width;
  const height = canvas.height;
  const cx = width / 2;
  const cz = height / 2;
  const scale = 1.5; // 缩放级别（像素/方块）

  // 清空上一帧的画布内容
  ctx.clearRect(0, 0, width, height);

  // 辅助函数：绘制地图上的一个圆点，代表某个特定坐标的位置
  const drawPoint = (worldX: number, worldZ: number, radius: number, color: string, border: string) => {
    // 根据玩家位置和平移比例计算在画布上的位置
    const px = cx + (worldX - playerX) * scale;
    const pz = cz + (worldZ - playerZ) * scale;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(px, pz, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = border;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  };

  // 绘制地标作为灰色点
  drawPoint(-32, -32, 6, "#8a8f98", "#000"); // 泰姬陵
  drawPoint(32, -32, 6, "#8a8f98", "#000");  // 比萨斜塔
  drawPoint(0, 32, 6, "#8a8f98", "#000");    // 玛雅金字塔
  
  // 绘制出生点作为绿色点
  drawPoint(PLAYER_START_POSITION[0], PLAYER_START_POSITION[2], 6, "#59a14f", "#fff");

  // 绘制方向字母 (N, S, W, E)
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "12px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  // 注意：在3D世界中，-Z 为北(North)
  ctx.fillText("N", cx, 12);
  ctx.fillText("S", cx, height - 12);
  ctx.fillText("W", 12, cz);
  ctx.fillText("E", width - 12, cz);

  // 绘制玩家标记 (箭头，指示当前偏航角)
  ctx.save();
  ctx.translate(cx, cz);
  // 在 Three.js 中正偏航角表示向左转。在 2D canvas 中，正向旋转是顺时针。
  // 因此我们对偏航角取反，使箭头指向正确。
  ctx.rotate(-yaw);

  ctx.fillStyle = "#f6c65b";
  ctx.beginPath();
  ctx.moveTo(0, -8);   // 箭头顶部（前方）
  ctx.lineTo(-6, 6);   // 左下角
  ctx.lineTo(0, 3);    // 底部凹槽
  ctx.lineTo(6, 6);    // 右下角
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.5)";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();

  // 更新覆盖的文字坐标显示
  coords.textContent = `X: ${Math.floor(playerX)} Z: ${Math.floor(playerZ)}`;
}
