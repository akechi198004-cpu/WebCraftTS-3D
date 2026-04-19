import { CanvasTexture, NearestFilter, SRGBColorSpace, MeshLambertMaterial } from "three";
import type { BlockType } from "../types";

const materialCache = new Map<Exclude<BlockType, "air">, MeshLambertMaterial | MeshLambertMaterial[]>();
const dataUrlCache = new Map<Exclude<BlockType, "air">, string>();

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

function makeTex(cb: (ctx: CanvasRenderingContext2D) => void): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext("2d")!;
  cb(ctx);
  const tex = new CanvasTexture(canvas);
  tex.magFilter = NearestFilter;
  tex.minFilter = NearestFilter;
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

function createMat(tex: CanvasTexture, extraOpts = {}): MeshLambertMaterial {
  return new MeshLambertMaterial({ map: tex, ...extraOpts });
}

export function getBlockMaterial(type: Exclude<BlockType, "air">, colorHex: number): MeshLambertMaterial | MeshLambertMaterial[] {
  if (materialCache.has(type)) return materialCache.get(type)!;

  let mat: MeshLambertMaterial | MeshLambertMaterial[];
  const r = (colorHex >> 16) & 255;
  const g = (colorHex >> 8) & 255;
  const b = colorHex & 255;

  if (type === "grass") {
    const topTex = makeTex(ctx => drawNoise(ctx, 16, 16, r, g, b, 20));
    const dirtTex = makeTex(ctx => drawNoise(ctx, 16, 16, 121, 85, 58, 20)); // dirt color
    const sideTex = makeTex(ctx => {
      drawNoise(ctx, 16, 16, 121, 85, 58, 20); // dirt base
      for (let x = 0; x < 16; x++) {
        const depth = 3 + Math.random() * 3;
        for (let y = 0; y < depth; y++) {
          const varAmt = (Math.random() - 0.5) * 20;
          ctx.fillStyle = `rgb(${(r + varAmt) | 0},${(g + varAmt) | 0},${(b + varAmt) | 0})`;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    });

    dataUrlCache.set(type, sideTex.image.toDataURL());
    mat = [
      createMat(sideTex), createMat(sideTex),
      createMat(topTex), createMat(dirtTex),
      createMat(sideTex), createMat(sideTex)
    ];
  } else if (type === "dirt" || type === "stone" || type === "sand" || type === "leaves") {
    const variance = type === "stone" ? 25 : type === "sand" ? 15 : type === "leaves" ? 40 : 30;
    const tex = makeTex(ctx => drawNoise(ctx, 16, 16, r, g, b, variance));
    dataUrlCache.set(type, tex.image.toDataURL());
    mat = createMat(tex);
  } else if (type === "wood") {
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
    const tex = makeTex(ctx => {
      ctx.fillStyle = "#cfcfcf"; // mortar
      ctx.fillRect(0, 0, 16, 16);
      for (let y = 0; y < 4; y++) {
        const offset = (y % 2 === 0) ? 0 : -4;
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
    mat = createMat(tex, { transparent: true, opacity, depthWrite: false }); // depthWrite:false helps layered sorting visually sometimes but keeps it simple
  } else {
    // Fallback
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

export function getBlockDataUrl(type: Exclude<BlockType, "air">, colorHex: number): string {
  if (!dataUrlCache.has(type)) {
    getBlockMaterial(type, colorHex); // Generate to populate cache
  }
  return dataUrlCache.get(type)!;
}
