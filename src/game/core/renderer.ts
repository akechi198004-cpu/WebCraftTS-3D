import { SRGBColorSpace, WebGLRenderer } from "three";
import type { Size } from "../types";

export function createRenderer(): WebGLRenderer {
  const renderer = new WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = SRGBColorSpace;
  return renderer;
}

export function resizeRenderer(renderer: WebGLRenderer, size: Size): void {
  renderer.setSize(size.width, size.height);
}

