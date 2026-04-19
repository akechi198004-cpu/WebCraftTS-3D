import { CanvasTexture, NearestFilter, SRGBColorSpace, MeshLambertMaterial } from "three";
import type { BlockType } from "../types";

// 缓存每种方块的材质，避免重复生成
const materialCache = new Map<Exclude<BlockType, "air">, MeshLambertMaterial | MeshLambertMaterial[]>();
// 缓存每种方块用于 UI 显示的 DataURL 图像
const dataUrlCache = new Map<Exclude<BlockType, "air">, string>();

/**
 * 辅助函数：在 canvas 上绘制基于颜色方差的随机噪点像素
 */
function drawNoise(ctx: CanvasRenderingContext2D, w: number, h: number, r: number, g: number, b: number, variance: number) {
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) {
      const varAmt = (Math.random() - 0.5) * variance;
      const cr = Math.max(0, Math.min(255, r + varAmt));
      const cg = Math.max(0, Math.min(255, g + varAmt));
      const cb = Math.max(0, Math.min(255, b + varAmt));
      ctx.fillStyle = `rgb(${cr | 0},${cg | 0},${cb | 0})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }
}

/**
 * 辅助函数：创建一个 16x16 的像素纹理，应用提供的绘制回调
 */
function makeTex(cb: (ctx: CanvasRenderingContext2D) => void): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext("2d")!;
  cb(ctx);
  const tex = new CanvasTexture(canvas);
  // 使用最近邻过滤，以保持经典的 8-bit 像素风格
  tex.magFilter = NearestFilter;
  tex.minFilter = NearestFilter;
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

/**
 * 辅助函数：使用给定的纹理创建 MeshLambertMaterial
 */
function createMat(tex: CanvasTexture, extraOpts = {}): MeshLambertMaterial {
  return new MeshLambertMaterial({ map: tex, ...extraOpts });
}

/**
 * 获取方块对应的材质或材质数组（如果六面不同）
 */
export function getBlockMaterial(type: Exclude<BlockType, "air">, colorHex: number): MeshLambertMaterial | MeshLambertMaterial[] {
  if (materialCache.has(type)) return materialCache.get(type)!;

  let mat: MeshLambertMaterial | MeshLambertMaterial[];
  // 从 16 进制颜色提取 RGB 通道
  const r = (colorHex >> 16) & 255;
  const g = (colorHex >> 8) & 255;
  const b = colorHex & 255;

  if (type === "grass") {
    // 草地有三个不同的纹理：顶部草皮、底部泥土、侧面（泥土带上方一点草皮）
    const topTex = makeTex(ctx => drawNoise(ctx, 16, 16, r, g, b, 20));
    const dirtTex = makeTex(ctx => drawNoise(ctx, 16, 16, 121, 85, 58, 20)); // 泥土基础色
    const sideTex = makeTex(ctx => {
      drawNoise(ctx, 16, 16, 121, 85, 58, 20); // 绘制底部泥土
      for (let x = 0; x < 16; x++) {
        const depth = 3 + Math.random() * 3; // 顶部草皮向下延伸随机深度
        for (let y = 0; y < depth; y++) {
          const varAmt = (Math.random() - 0.5) * 20;
          ctx.fillStyle = `rgb(${(r + varAmt) | 0},${(g + varAmt) | 0},${(b + varAmt) | 0})`;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    });

    dataUrlCache.set(type, sideTex.image.toDataURL());
    // 材质数组顺序：右、左、上、下、前、后
    mat = [
      createMat(sideTex), createMat(sideTex),
      createMat(topTex), createMat(dirtTex),
      createMat(sideTex), createMat(sideTex)
    ];
  } else if (type === "dirt" || type === "stone" || type === "sand" || type === "leaves") {
    // 这几种方块只需带有随机噪点的基础纹理
    const variance = type === "stone" ? 25 : type === "sand" ? 15 : type === "leaves" ? 40 : 30;
    const tex = makeTex(ctx => drawNoise(ctx, 16, 16, r, g, b, variance));
    dataUrlCache.set(type, tex.image.toDataURL());
    mat = createMat(tex);
  } else if (type === "wood") {
    // 原木方块有侧面的树皮纹理和顶部的年轮纹理
    const sideTex = makeTex(ctx => {
      drawNoise(ctx, 16, 16, r, g, b, 15);
      for (let x = 0; x < 16; x += 2 + Math.random() * 2) {
        ctx.fillStyle = `rgba(0,0,0,0.2)`;
        ctx.fillRect(Math.floor(x), 0, 1, 16);
      }
    });
    const topTex = makeTex(ctx => {
      drawNoise(ctx, 16, 16, r + 40, g + 30, b + 20, 10);
      ctx.strokeStyle = `rgba(0,0,0,0.15)`;
      ctx.lineWidth = 1;
      for (let i = 2; i < 8; i += 2) {
        ctx.strokeRect(i, i, 16 - i * 2, 16 - i * 2);
      }
    });
    dataUrlCache.set(type, sideTex.image.toDataURL());
    const sideMat = createMat(sideTex);
    const topMat = createMat(topTex);
    mat = [sideMat, sideMat, topMat, topMat, sideMat, sideMat];
  } else if (type === "brick") {
    // 砖块纹理，先绘制灰色的水泥缝，然后绘制红砖块
    const tex = makeTex(ctx => {
      ctx.fillStyle = "#cfcfcf"; // 水泥色
      ctx.fillRect(0, 0, 16, 16);
      for (let y = 0; y < 4; y++) {
        const offset = (y % 2 === 0) ? 0 : -4; // 砖块交错排列
        for (let bx = offset; bx < 16; bx += 8) {
          for (let px = 0; px < 7; px++) {
            for (let py = 0; py < 3; py++) {
              if (bx + px >= 0 && bx + px < 16) {
                const varAmt = (Math.random() - 0.5) * 30;
                ctx.fillStyle = `rgb(${(r + varAmt) | 0},${(g + varAmt) | 0},${(b + varAmt) | 0})`;
                ctx.fillRect(bx + px, y * 4 + py, 1, 1);
              }
            }
          }
        }
      }
    });
    dataUrlCache.set(type, tex.image.toDataURL());
    mat = createMat(tex);
  } else if (type === "water" || type === "ice") {
    // 水和冰具有透明度和不同的噪点，冰有高光边缘
    const tex = makeTex(ctx => {
      drawNoise(ctx, 16, 16, r, g, b, 10);
      if (type === "ice") {
        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.fillRect(0,0,16,2);
        ctx.fillRect(0,0,2,16);
      }
    });
    dataUrlCache.set(type, tex.image.toDataURL());
    const opacity = type === "water" ? 0.7 : 0.85;
    mat = createMat(tex, { transparent: true, opacity, depthWrite: false }); // depthWrite: false 有助于简单的透明渲染层级问题
  } else {
    // 后备选项：纯色无纹理
    const tex = makeTex(ctx => {
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(0, 0, 16, 16);
    });
    dataUrlCache.set(type, tex.image.toDataURL());
    mat = createMat(tex);
  }

  materialCache.set(type, mat);
  return mat;
}

/**
 * 获取方块纹理对应的 DataURL（用于在 UI 或图例中显示图片）
 */
export function getBlockDataUrl(type: Exclude<BlockType, "air">, colorHex: number): string {
  if (!dataUrlCache.has(type)) {
    getBlockMaterial(type, colorHex); // 如果没有缓存，通过生成材质来填充缓存
  }
  return dataUrlCache.get(type)!;
}
