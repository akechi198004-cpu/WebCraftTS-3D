import { SRGBColorSpace, WebGLRenderer } from "three";
import type { Size } from "../types";

/**
 * 创建并配置 WebGL 渲染器
 */
export function createRenderer(): WebGLRenderer {
  // 启用抗锯齿
  const renderer = new WebGLRenderer({ antialias: true });
  // 限制像素比最大为 2，以防在高分屏（如某些视网膜屏幕）下导致性能问题
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  // 设置输出颜色空间为 sRGB，以获得正确的色彩表现
  renderer.outputColorSpace = SRGBColorSpace;
  return renderer;
}

/**
 * 调整渲染器尺寸（通常在窗口大小改变时调用）
 */
export function resizeRenderer(renderer: WebGLRenderer, size: Size): void {
  renderer.setSize(size.width, size.height);
}

