import { PLAYER_START_POSITION } from "../constants";

export interface MinimapView {
  root: HTMLDivElement;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  coords: HTMLDivElement;
}

export function createMinimap(): MinimapView {
  const root = document.createElement("div");
  root.className = "minimap-wrapper";

  const container = document.createElement("div");
  container.className = "minimap-container";

  const canvas = document.createElement("canvas");
  canvas.className = "minimap-canvas";
  canvas.width = 160;
  canvas.height = 160;

  const ctx = canvas.getContext("2d")!;
  container.append(canvas);

  const coords = document.createElement("div");
  coords.className = "minimap-coords";

  root.append(container, coords);

  return { root, canvas, ctx, coords };
}

export function renderMinimap(view: MinimapView, playerX: number, playerZ: number, yaw: number): void {
  const { canvas, ctx, coords } = view;
  const width = canvas.width;
  const height = canvas.height;
  const cx = width / 2;
  const cz = height / 2;
  const scale = 1.5; // Zoom level

  ctx.clearRect(0, 0, width, height);

  const drawPoint = (worldX: number, worldZ: number, radius: number, color: string, border: string) => {
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

  // Draw Landmarks as grey dots
  drawPoint(-32, -32, 6, "#8a8f98", "#000"); // Taj Mahal
  drawPoint(32, -32, 6, "#8a8f98", "#000");  // Pisa Tower
  drawPoint(0, 32, 6, "#8a8f98", "#000");    // Mayan Pyramid
  
  // Draw Spawn point as a green dot
  drawPoint(PLAYER_START_POSITION[0], PLAYER_START_POSITION[2], 6, "#59a14f", "#fff");

  // Draw Directions
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "12px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("N", cx, 12);
  ctx.fillText("S", cx, height - 12);
  ctx.fillText("W", 12, cz);
  ctx.fillText("E", width - 12, cz);

  // Draw Player Marker (Arrow pointing to current yaw)
  ctx.save();
  ctx.translate(cx, cz);
  // Three.js positive yaw rotates left. In 2D canvas, positive rotates clockwise. 
  // We negate yaw to point correctly.
  ctx.rotate(-yaw);

  ctx.fillStyle = "#f6c65b";
  ctx.beginPath();
  ctx.moveTo(0, -8);   // tip
  ctx.lineTo(-6, 6);   // bottom left
  ctx.lineTo(0, 3);    // inner indent
  ctx.lineTo(6, 6);    // bottom right
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.5)";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();

  // Update Coordinates Overlay
  coords.textContent = `X: ${Math.floor(playerX)} Z: ${Math.floor(playerZ)}`;
}
